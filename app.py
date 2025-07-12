import os
from datetime import datetime, timezone, timedelta

from flask import Flask, render_template, request, redirect, url_for, make_response, jsonify, flash, session
from sqlalchemy import func
from flask_migrate import Migrate
from flask_login import LoginManager, login_user, logout_user, login_required, current_user

# import your package‐scoped db & model
from todo import db, Task, User
from cleanup import cleanup_completed_tasks, get_cleanup_stats

# ─── Setup ────────────────────────────────────────────────────────────────

BASEDIR  = os.path.abspath(os.path.dirname(__file__))
DATA_DIR = os.path.join(BASEDIR, "data")
os.makedirs(DATA_DIR, exist_ok=True)

DB_PATH    = os.path.join(DATA_DIR, "tasks.db")
SQLITE_URI = f"sqlite:///{DB_PATH}"

app = Flask(__name__)
app.config["SQLALCHEMY_DATABASE_URI"]        = SQLITE_URI
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
app.config["SECRET_KEY"] = "your-secret-key-change-this-in-production"

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
        
        # Here you could save to database or send email
        # For now, just show a success message
        flash(f"Bug report submitted successfully! Type: {bug_type}, Priority: {priority}")
        return redirect(url_for('index'))
    
    return render_template("report.html")

# ─── RUN ─────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    app.run(debug=True, host='0.0.0.0', port=5002)
