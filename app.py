import os
from datetime import datetime, timedelta

from flask import Flask, render_template, request, redirect, url_for, make_response, jsonify, flash
from flask_mail import Mail, Message
from sqlalchemy import func, text
from flask_migrate import Migrate
from flask_login import LoginManager, login_user, logout_user, login_required, current_user

# import your package‐scoped db & model
from todo import db, Task, User, BugReport
from cleanup import cleanup_completed_tasks, get_cleanup_stats

# ─── Setup ────────────────────────────────────────────────────────────────


app = Flask(__name__)

SQLALCHEMY_DATABASE_URI = os.environ.get("DATABASE_URL")
app.config["SQLALCHEMY_DATABASE_URI"] = SQLALCHEMY_DATABASE_URI
print(f"Using PostgreSQL database: {SQLALCHEMY_DATABASE_URI}")

app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
app.config["SECRET_KEY"] = os.environ.get('SECRET_KEY') or "dev-key-change-in-production"

# Email configuration for bug report notifications
app.config['MAIL_SERVER'] = os.environ.get('MAIL_SERVER', 'smtp.gmail.com')
app.config['MAIL_PORT'] = int(os.environ.get('MAIL_PORT', '587'))
app.config['MAIL_USE_TLS'] = os.environ.get('MAIL_USE_TLS', 'true').lower() in ['true', 'on', '1']
app.config['MAIL_USERNAME'] = os.environ.get('MAIL_USERNAME')
app.config['MAIL_PASSWORD'] = os.environ.get('MAIL_PASSWORD')
app.config['DEVELOPER_EMAIL'] = os.environ.get('DEVELOPER_EMAIL', 'developer@example.com')

# Initialize extensions
app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL', 'postgresql://user:password@host:port/dbname')
mail = Mail(app)
db.init_app(app)
migrate = Migrate(app, db)

# Initialize Flask-Login
login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'login'
login_manager.login_message = 'Please log in to access your tasks.'

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

def send_bug_report_notification(bug_report):
    """Send email notification to developers when a bug report is submitted"""
    try:
        # Only send emails if email is configured
        if not app.config.get('MAIL_USERNAME') or not app.config.get('DEVELOPER_EMAIL'):
            return False
            
        msg = Message(
            subject=f'New Bug Report #{bug_report.id} - {bug_report.bug_type.title()}',
            sender=app.config['MAIL_USERNAME'],
            recipients=[app.config['DEVELOPER_EMAIL']]
        )
        
        # Create email body
        msg.html = f"""
        <h2>New Bug Report Submitted</h2>
        <p><strong>Report ID:</strong> #{bug_report.id}</p>
        <p><strong>User:</strong> {bug_report.user.username} (ID: {bug_report.user.id})</p>
        <p><strong>Type:</strong> {bug_report.bug_type.title()}</p>
        <p><strong>Priority:</strong> {bug_report.priority.title()}</p>
        <p><strong>Submitted:</strong> {bug_report.created_at.strftime('%Y-%m-%d %H:%M:%S')}</p>
        
        <h3>Description</h3>
        <p>{bug_report.description}</p>
        
        {f'<h3>Steps to Reproduce</h3><p>{bug_report.steps}</p>' if bug_report.steps else ''}
        {f'<h3>Expected Behavior</h3><p>{bug_report.expected}</p>' if bug_report.expected else ''}
        {f'<h3>Actual Behavior</h3><p>{bug_report.actual}</p>' if bug_report.actual else ''}
        
        <p><a href="{request.url_root}admin/bugs">View in Admin Panel</a></p>
        """
        
        mail.send(msg)
        return True
    except Exception as e:
        print(f"Failed to send bug report notification: {e}")
        return False

# Add cache control headers to prevent caching issues
@app.after_request
def after_request(response):
    # Prevent caching for all responses
    response.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
    response.headers['Pragma'] = 'no-cache'
    response.headers['Expires'] = '0'
    return response

# ─── ROUTES ───────────────────────────────────────────────────────────────

# Edit username API route
@app.route("/api/edit-username", methods=["POST"])
@login_required
def api_edit_username():
    data = request.get_json()
    new_username = data.get("username", "").strip()
    if not new_username:
        return jsonify({"success": False, "error": "Username cannot be empty"}), 400
    # Check if username already exists (case-insensitive)
    if User.query.filter(User.username.ilike(new_username)).first():
        return jsonify({"success": False, "error": "Username already exists"}), 400
    current_user.username = new_username.lower()
    db.session.commit()
    return jsonify({"success": True, "username": current_user.username.title()})

# Change password API route
@app.route("/api/change-password", methods=["POST"])
@login_required
def api_change_password():
    data = request.get_json()
    new_password = data.get("password", "")
    if not new_password or len(new_password) < 6:
        return jsonify({"success": False, "error": "Password must be at least 6 characters."}), 400
    # You may want to hash the password here
    current_user.set_password(new_password)
    db.session.commit()
    return jsonify({"success": True})

@app.route("/")
@login_required
def index():
    # Only get tasks for the current user
    all_tasks = Task.query.filter_by(user_id=current_user.id).order_by(
        Task.done,
        db.case((Task.due_date != None, Task.due_date), else_=Task.created_at)
    ).all()

    active    = [t for t in all_tasks if not t.done]
    active.sort(key=lambda t: t.due_date or t.created_at)

    completed = [t for t in all_tasks if t.done]
    completed.sort(key=lambda t: t.due_date or t.created_at)

    total    = len(all_tasks)
    pct_done = int(len(completed) / total * 100) if total else 0

    # Use UTC for backend calculations, pass UTC to frontend for local conversion
    now = datetime.utcnow()
    
    # Remove backend countdown calculations. Frontend will handle countdowns using UTC datetimes.

    response = make_response(render_template(
        "index.html",
        active_tasks=active,
        completed_tasks=completed,
        pct_done=pct_done,
        has_completed_tasks=len(completed) > 0,
        now_utc=now.isoformat()  # Pass UTC time to frontend
    ))
    # Additional cache busting for this route specifically
    response.headers['Last-Modified'] = now.strftime('%a, %d %b %Y %H:%M:%S GMT')
    response.headers['ETag'] = str(hash(str(now.timestamp())))
    return response

@app.route("/add", methods=["GET", "POST"])
@login_required
def add():
    if request.method == "POST":
        desc     = request.form["description"].strip()
        priority = request.form.get("priority", "medium")
        date_str = request.form.get("due_date", "")
        time_str = request.form.get("due_time", "")
        tz_offset_str = request.form.get("tz_offset", None)

        if desc:
            # parse the new task's due datetime (or None)
            new_due = None
            if date_str:
                ts = time_str.strip() or "00:00"
                naive_dt = datetime.strptime(f"{date_str} {ts}", "%Y-%m-%d %H:%M")
                try:
                    # Use tz_offset from frontend for robust conversion
                    if tz_offset_str is not None:
                        tz_offset = int(tz_offset_str)
                        # tz_offset is in minutes, JS returns positive for UTC-, negative for UTC+
                        # To get UTC, add offset to local time
                        new_due = naive_dt + timedelta(minutes=tz_offset)
                    else:
                        # Fallback: treat as UTC if offset missing
                        new_due = naive_dt
                except Exception:
                    # Fallback: treat as UTC if conversion fails
                    new_due = naive_dt

            # create the new task (automatic sorting by due_date/created_at)
            task = Task(
                description=desc,
                priority=priority,
                due_date=new_due,
                user_id=current_user.id
            )
            db.session.add(task)
            db.session.commit()

        return redirect(url_for("index"))

    return render_template("add.html")

@app.route("/done/<int:task_id>")
@login_required
def done(task_id):
    t = Task.query.filter_by(id=task_id, user_id=current_user.id).first_or_404()
    t.done = True
    db.session.commit()
    return redirect(url_for("index"))

@app.route("/remove/<int:task_id>")
@login_required
def remove(task_id):
    t = Task.query.filter_by(id=task_id, user_id=current_user.id).first_or_404()
    db.session.delete(t)
    db.session.commit()
    return redirect(url_for("index"))

@app.route("/edit/<int:task_id>", methods=["POST"])
@login_required
def edit(task_id):
    t    = Task.query.filter_by(id=task_id, user_id=current_user.id).first_or_404()
    data = request.get_json()
    desc = data.get("description", "").strip()
    if desc:
        t.description = desc
        db.session.commit()
    return ("", 204)

# ─── CLEANUP ROUTES ──────────────────────────────────────────────────────

@app.route("/cleanup/stats")
def cleanup_stats():
    """Get cleanup statistics as JSON"""
    stats = get_cleanup_stats()
    return jsonify(stats)

@app.route("/cleanup/run")
def run_cleanup():
    """Run cleanup manually - removes completed tasks older than 7 days"""
    count = cleanup_completed_tasks(7)
    return jsonify({
        'success': True, 
        'cleaned_up': count,
        'message': f'Cleaned up {count} completed tasks older than 7 days'
    })

@app.route("/cleanup/run/<int:days>")
def run_cleanup_days(days):
    """Run cleanup with custom number of days"""
    if days < 1 or days > 365:
        return jsonify({'error': 'Days must be between 1 and 365'}), 400
    
    count = cleanup_completed_tasks(days)
    return jsonify({
        'success': True, 
        'cleaned_up': count,
        'message': f'Cleaned up {count} completed tasks older than {days} days'
    })

# Auto-cleanup on app startup (for scheduled maintenance)
def auto_cleanup():
    """Automatically run cleanup if it's been more than 24 hours since last cleanup"""
    try:
        # Use a database marker instead of a file for last cleanup
        marker_key = 'last_cleanup'
        from sqlalchemy import text
        # Create a simple settings table if not exists
        db.session.execute(text("""
            CREATE TABLE IF NOT EXISTS app_settings (
                key TEXT PRIMARY KEY,
                value TEXT
            )
        """))
        db.session.commit()

        result = db.session.execute(text("SELECT value FROM app_settings WHERE key = :key"), {"key": marker_key}).fetchone()
        should_cleanup = True
        if result and result[0]:
            try:
                last_cleanup = datetime.fromisoformat(result[0])
                if datetime.now() - last_cleanup < timedelta(hours=24):
                    should_cleanup = False
            except ValueError:
                pass
        if should_cleanup:
            count = cleanup_completed_tasks(7)
            db.session.execute(text("""
                INSERT INTO app_settings (key, value)
                VALUES (:key, :value)
                ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value
            """), {"key": marker_key, "value": datetime.now().isoformat()})
            db.session.commit()
            if count > 0:
                print(f"Auto-cleanup: Removed {count} old completed tasks")
    except Exception as e:
        print(f"Auto-cleanup error: {e}")

# Initialize database and run auto-cleanup when app starts
with app.app_context():
    db.create_all()
    auto_cleanup()

# ─── AUTHENTICATION ROUTES ─────────────────────────────────────────────

@app.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        username = request.form.get("username")
        password = request.form.get("password")
        
        if not username or not password:
            flash("Please enter both username and password")
            return render_template("login.html")
        
        # Make username case-insensitive
        user = User.query.filter(User.username.ilike(username)).first()
        
        if user and user.check_password(password):
            login_user(user)
            next_page = request.args.get('next')
            return redirect(next_page) if next_page else redirect(url_for('index'))
        else:
            flash("Invalid username or password")
    
    return render_template("login.html")

@app.route("/register", methods=["GET", "POST"])
def register():
    if request.method == "POST":
        username = request.form.get("username")
        password = request.form.get("password")
        confirm_password = request.form.get("confirm_password")
        
        if not username or not password or not confirm_password:
            flash("Please fill in all fields")
            return render_template("register.html")
        
        if password != confirm_password:
            flash("Passwords do not match")
            return render_template("register.html")
        
        if len(password) < 6:
            flash("Password must be at least 6 characters long")
            return render_template("register.html")
        
        if User.query.filter(User.username.ilike(username)).first():
            flash("Username already exists")
            return render_template("register.html")
        
        # Store username in lowercase for consistency
        user = User(username=username.lower())
        user.set_password(password)
        db.session.add(user)
        db.session.commit()
        
        login_user(user)
        flash("Registration successful!")
        return redirect(url_for('index'))
    
    return render_template("register.html")

@app.route("/logout")
def logout():
    logout_user()
    flash("You have been logged out")
    return redirect(url_for('login'))

@app.route("/settings")
@login_required
def settings():
    # Get task statistics for the current user
    total_tasks = db.session.execute(
        text("SELECT COUNT(*) FROM tasks WHERE user_id = :user_id"),
        {"user_id": current_user.id}
    ).scalar()
    
    completed_tasks = db.session.execute(
        text("SELECT COUNT(*) FROM tasks WHERE user_id = :user_id AND done = TRUE"),
        {"user_id": current_user.id}
    ).scalar()
    
    task_stats = {
        'total': total_tasks or 0,
        'completed': completed_tasks or 0
    }
    
    return render_template("settings.html", task_stats=task_stats)

@app.route("/report", methods=["GET", "POST"])
@login_required
def report():
    if request.method == "POST":
        bug_type = request.form.get("bug_type")
        priority = request.form.get("priority")
        description = request.form.get("description")
        steps = request.form.get("steps")
        expected = request.form.get("expected")
        actual = request.form.get("actual")
        
        if not description or not bug_type:
            flash("Bug type and description are required!", "error")
            return render_template("report.html")
        
        # Save bug report to database
        try:
            bug_report = BugReport(
                bug_type=bug_type,
                priority=priority or 'medium',
                description=description,
                steps=steps,
                expected=expected,
                actual=actual,
                user_id=current_user.id
            )
            db.session.add(bug_report)
            db.session.commit()
            
            # Send notification to developers
            email_sent = send_bug_report_notification(bug_report)
            
            if email_sent:
                flash(f"Bug report submitted successfully! Our development team has been notified. (Report #{bug_report.id})", "success")
            else:
                flash(f"Bug report submitted successfully! We'll look into it. (Report #{bug_report.id})", "success")
                
        except Exception as e:
            db.session.rollback()
            flash("Error submitting bug report. Please try again.", "error")
            
        return redirect(url_for('index'))
    
    return render_template("report.html")

# ─── ADMIN ROUTES ────────────────────────────────────────────────────────

@app.route("/admin/bugs")
@login_required
def admin_bugs():
    # Simple admin check - you can make this more sophisticated
    # For now, user with ID 1 (first user) is admin
    if current_user.id != 1:
        flash("Access denied. Admin only.", "error")
        return redirect(url_for('index'))
    
    # Get all bug reports, ordered by newest first
    bug_reports = BugReport.query.order_by(BugReport.created_at.desc()).all()
    
    return render_template("admin_bugs.html", bug_reports=bug_reports)

@app.route("/admin/bugs/<int:bug_id>/resolve", methods=["POST"])
@login_required
def resolve_bug(bug_id):
    if current_user.id != 1:
        flash("Access denied. Admin only.", "error")
        return redirect(url_for('index'))
    
    bug_report = BugReport.query.get_or_404(bug_id)
    bug_report.resolved = True
    db.session.commit()
    flash(f"Bug report #{bug_id} marked as resolved!", "success")
    return redirect(url_for('admin_bugs'))

@app.route("/migrate_db")
def migrate_db():
    """Simple database migration to add new tables"""
    try:
        db.create_all()
        return "Database migrated successfully! BugReport table created."
    except Exception as e:
        return f"Error migrating database: {str(e)}"

@app.route("/migrate_priority")
def migrate_priority():
    """Add priority field to existing tasks"""
    try:
        # Check if priority column exists
        # PostgreSQL: check for column existence and add if missing
        result = db.session.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name='tasks' AND column_name='priority'"))
        columns = [row[0] for row in result]
        if 'priority' not in columns:
            db.session.execute(text("ALTER TABLE tasks ADD COLUMN priority TEXT DEFAULT 'medium'"))
            db.session.commit()
            return "Priority column added successfully!"
        else:
            return "Priority column already exists!"
    except Exception as e:
        db.session.rollback()
        return f"Migration error: {str(e)}"

@app.route("/db_info")
def db_info():
    """Debug route to check database configuration"""
    database_url = app.config.get("SQLALCHEMY_DATABASE_URI", "Not set")
    info = f"""
    <h2>Database Configuration Info</h2>
    <p><strong>Database Type:</strong> PostgreSQL (Supabase)</p>
    <p><strong>Database URL:</strong> {database_url}</p>
    <p><strong>Environment:</strong> Production (Render/Supabase)</p>
    <p><strong>Note:</strong> Data is persistent and cloud-hosted.</p>
    """
    return info

# ─── API Endpoints for Settings ─────────────────────────────────────────

@app.route("/api/export-tasks")
@login_required
def api_export_tasks():
    """Export all tasks for the current user as JSON"""
    try:
        tasks = db.session.execute(
            text("""SELECT description, due_date, due_time, done, created_at 
                    FROM tasks WHERE user_id = :user_id ORDER BY created_at DESC"""),
            {"user_id": current_user.id}
        ).fetchall()
        
        task_list = []
        for task in tasks:
            task_list.append({
                "description": task[0],
                "due_date": task[1],
                "due_time": task[2],
                "completed": bool(task[3]),
                "created_at": task[4]
            })
        
        return jsonify({
            "user": current_user.username,
            "export_date": datetime.now().isoformat(),
            "total_tasks": len(task_list),
            "tasks": task_list
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/clear-completed", methods=["POST"])
@login_required
def api_clear_completed():
    """Clear all completed tasks for the current user"""
    try:
        result = db.session.execute(
            text("DELETE FROM tasks WHERE user_id = :user_id AND done = TRUE"),
            {"user_id": current_user.id}
        )
        db.session.commit()
        
        return jsonify({
            "success": True,
            "message": f"Cleared {result.rowcount} completed tasks"
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "error": str(e)}), 500

@app.route("/api/feedback", methods=["POST"])
@login_required
def api_feedback():
    """Submit user feedback"""
    try:
        data = request.get_json()
        feedback_text = data.get('feedback', '').strip()
        
        if not feedback_text:
            return jsonify({"success": False, "error": "Feedback cannot be empty"}), 400
        
        # Store feedback as a bug report with type 'feedback'
        feedback_report = BugReport(
            user_id=current_user.id,
            bug_type='feedback',
            priority='low',
            description=feedback_text,
            steps='',
            expected='',
            actual='',
            status='new',
            created_at=datetime.now()
        )
        
        db.session.add(feedback_report)
        db.session.commit()
        
        return jsonify({"success": True, "message": "Feedback submitted successfully"})
    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "error": str(e)}), 500

# ─── RUN ─────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    app.run(debug=True, host='0.0.0.0', port=5003)
