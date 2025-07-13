import os
from datetime import datetime, timedelta

from flask import Flask, render_template, request, redirect, url_for, make_response, jsonify, flash
from flask_mail import Mail, Message
from sqlalchemy import func
from flask_migrate import Migrate
from flask_login import LoginManager, login_user, logout_user, login_required, current_user

# import your package‐scoped db & model
from todo import db, Task, User, BugReport
from cleanup import cleanup_completed_tasks, get_cleanup_stats

# ─── Setup ────────────────────────────────────────────────────────────────

BASEDIR  = os.path.abspath(os.path.dirname(__file__))
DATA_DIR = os.path.join(BASEDIR, "data")
os.makedirs(DATA_DIR, exist_ok=True)

app = Flask(__name__)

# Database configuration - use PostgreSQL in production, SQLite locally
DATABASE_URL = os.environ.get('DATABASE_URL')
if DATABASE_URL:
    # Production: Use PostgreSQL from environment (Render provides this)
    app.config["SQLALCHEMY_DATABASE_URI"] = DATABASE_URL
else:
    # Local development: Choose between PostgreSQL and SQLite
    LOCAL_POSTGRES = os.environ.get('USE_LOCAL_POSTGRES', 'false').lower() == 'true'
    
    if LOCAL_POSTGRES:
        # Local PostgreSQL (set USE_LOCAL_POSTGRES=true in your environment)
        local_db_url = os.environ.get('LOCAL_DATABASE_URL', 
                                    'postgresql://todo_user:localpass@localhost/todo_local')
        app.config["SQLALCHEMY_DATABASE_URI"] = local_db_url
    else:
        # Local development: Use SQLite (default)
        DB_PATH = os.path.join(DATA_DIR, "tasks.db")
        app.config["SQLALCHEMY_DATABASE_URI"] = f"sqlite:///{DB_PATH}"

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

    # Force reload - simple time calculation using local time
    now = datetime.now()
    
    for t in active:
        if t.due_date:
            # Calculate time difference
            delta = t.due_date - now
            total_seconds = delta.total_seconds()
            
            # Check if task is due today or in the future
            due_date_only = t.due_date.date()
            today = now.date()
            
            if due_date_only < today:
                # Task is overdue (due on a previous day)
                t.days = -1
                t.hours = 0
                t.mins = 0
            elif due_date_only == today:
                # Task is due today - show as due today (0 days) regardless of time
                t.days = 0
                if total_seconds > 0:
                    # Still time left today
                    total_minutes = int(total_seconds // 60)
                    t.hours = total_minutes // 60
                    t.mins = total_minutes % 60
                else:
                    # Time has passed but still today
                    t.hours = 0
                    t.mins = 0
            else:
                # Task is in the future
                total_minutes = int(total_seconds // 60)
                t.days = total_minutes // (24 * 60)
                remaining_minutes = total_minutes % (24 * 60)
                t.hours = remaining_minutes // 60
                t.mins = remaining_minutes % 60
        else:
            t.days = t.hours = t.mins = None

    response = make_response(render_template(
        "index.html",
        active_tasks=active,
        completed_tasks=completed,
        pct_done=pct_done,
        has_completed_tasks=len(completed) > 0,
    ))
    
    # Additional cache busting for this route specifically
    response.headers['Last-Modified'] = datetime.now().strftime('%a, %d %b %Y %H:%M:%S GMT')
    response.headers['ETag'] = str(hash(str(datetime.now().timestamp())))
    
    return response

@app.route("/add", methods=["GET", "POST"])
@login_required
def add():
    if request.method == "POST":
        desc     = request.form["description"].strip()
        date_str = request.form.get("due_date", "")
        time_str = request.form.get("due_time", "")

        if desc:
            # parse the new task's due datetime (or None)
            new_due = None
            if date_str:
                ts      = time_str.strip() or "00:00"
                new_due = datetime.strptime(f"{date_str} {ts}", "%Y-%m-%d %H:%M")

            # create the new task (automatic sorting by due_date/created_at)
            task = Task(
                description=desc,
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
        # Check if cleanup marker file exists
        cleanup_marker = os.path.join(DATA_DIR, 'last_cleanup.txt')
        should_cleanup = True
        
        if os.path.exists(cleanup_marker):
            with open(cleanup_marker, 'r') as f:
                last_cleanup_str = f.read().strip()
                try:
                    last_cleanup = datetime.fromisoformat(last_cleanup_str)
                    # Only cleanup if it's been more than 24 hours
                    if datetime.now() - last_cleanup < timedelta(hours=24):
                        should_cleanup = False
                except ValueError:
                    # Invalid date format, run cleanup
                    pass
        
        if should_cleanup:
            count = cleanup_completed_tasks(7)  # Clean tasks older than 7 days
            
            # Update cleanup marker
            with open(cleanup_marker, 'w') as f:
                f.write(datetime.now().isoformat())
            
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
    flash("Settings page coming soon!")
    return redirect(url_for('index'))

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

# ─── RUN ─────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    app.run(debug=True, host='0.0.0.0', port=5002)
