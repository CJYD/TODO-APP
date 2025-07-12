# TODO App Deployment Guide for PythonAnywhere

# Render.com Deployment (Alternative)

## Quick Render Deployment

**Render is faster and easier than PythonAnywhere for deployment.**

### 1. Push to GitHub (if not done already)

```bash
git add .
git commit -m "Updated wsgi.py for Render deployment"
git push origin main
```

### 2. Deploy on Render

1. **Go to [render.com](https://render.com)** and sign up
2. **Connect GitHub** account
3. **Click "New +"** → "Web Service"
4. **Select your repository**
5. **Configure:**
   - **Name:** `todo-app` (or your preferred name)
   - **Environment:** `Python 3`
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `python wsgi.py`
   - **Instance Type:** `Free`

### 3. Environment Variables

Add these in Render dashboard:
- **Key:** `SECRET_KEY` **Value:** `your-secret-key-here`
- **Key:** `FLASK_ENV` **Value:** `production`

Generate secret key:
```python
import secrets
print(secrets.token_hex(32))
```

### 4. Deploy!

Click **"Create Web Service"** - your app will be live in 5-10 minutes at:
`https://your-app-name.onrender.com`

---

## Multi-User Authentication System

Your todo app now includes a complete user authentication system with:
- User registration and login
- Password hashing with Werkzeug
- Session management with Flask-Login
- User isolation (each user sees only their own tasks)
- Automatic cleanup of completed tasks (7-day retention)

## PythonAnywhere Deployment Steps

### 1. Upload Your Code

```bash
# On PythonAnywhere console, clone or upload your project
git clone <your-repo-url> /home/yourusername/mysite
# OR upload files via the Files tab
```

### 2. Install Dependencies

```bash
# In PythonAnywhere console
cd /home/yourusername/mysite
pip3.10 install --user -r requirements.txt
```

### 3. Configure Web App

1. Go to "Web" tab in PythonAnywhere dashboard
2. Click "Add a new web app"
3. Choose "Manual configuration"
4. Choose Python 3.10
5. Set these configurations:

**Source code:** `/home/yourusername/mysite`
**Working directory:** `/home/yourusername/mysite`

### 4. Configure WSGI File

Replace the WSGI file content with:

```python
import sys
import os

# Add your project directory to sys.path
path = '/home/yourusername/mysite'
if path not in sys.path:
    sys.path.insert(0, path)

# Set environment variables
os.environ['FLASK_ENV'] = 'production'

# Import your Flask app
from wsgi import application

# The variable name 'application' is important - PythonAnywhere looks for it
```

### 5. Set Environment Variables

In the "Files" tab, create a `.env` file in your project root:

```
FLASK_ENV=production
SECRET_KEY=your-super-secret-key-here-change-this-in-production
DATABASE_URL=sqlite:////home/yourusername/mysite/data/tasks.db
```

**Important:** Generate a strong secret key:
```python
import secrets
print(secrets.token_hex(32))
```

### 6. Update App Configuration for Production

Add to your `app.py` before creating the Flask app:

```python
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Add this to your app configuration
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY') or 'dev-key-change-in-production'
```

### 7. Database Setup

```bash
# In PythonAnywhere console
cd /home/yourusername/mysite
python3.10
>>> from app import app, db
>>> with app.app_context():
...     db.create_all()
>>> exit()
```

### 8. Static Files Configuration

In PythonAnywhere Web tab, add static files mapping:
- **URL:** `/static/`
- **Directory:** `/home/yourusername/mysite/static/`

### 9. Automatic Daily Cleanup

Create a scheduled task in the "Tasks" tab:
- **Command:** `python3.10 /home/yourusername/mysite/app.py cleanup`
- **Hour:** `2` (2 AM)
- **Minute:** `0`

Or trigger manual cleanup via URL:
`https://yourusername.pythonanywhere.com/cleanup`

## Storage Capacity Analysis

**PythonAnywhere Free Tier:** 512MB total storage

**Task Storage Calculation:**
- Each task: ~200 bytes (description, dates, user_id, etc.)
- Each user: ~100 bytes
- Database overhead: ~20%

**Capacity Estimates:**
- **10 users, 100 tasks each:** ~250KB (0.05% of storage)
- **50 users, 200 tasks each:** ~2.4MB (0.5% of storage) 
- **100 users, 500 tasks each:** ~12MB (2.4% of storage)

**With 7-day cleanup system:**
- Completed tasks automatically deleted after 7 days
- Only active tasks consume storage long-term
- System can handle **thousands of users** with normal usage

## User Management

### Creating the First User

1. Visit your deployed app: `https://yourusername.pythonanywhere.com`
2. Click "Sign up" 
3. Create your account
4. Share the URL with friends and family

### User Features

- Each user has their own private task list
- Users can register with any username
- Secure password hashing
- Automatic login after registration
- Clean logout functionality

## Security Considerations

1. **Change the secret key** in production
2. **Use HTTPS** (automatic with PythonAnywhere)
3. **Strong passwords** encouraged (6+ characters minimum)
4. **User data isolation** - users cannot see others' tasks

## Monitoring and Maintenance

### Manual Cleanup (if needed)
Visit: `https://yourusername.pythonanywhere.com/cleanup`

### Check Storage Usage
```bash
du -sh /home/yourusername/mysite/data/
```

### View User Statistics
```bash
# In PythonAnywhere console
python3.10
>>> from app import app, db, User, Task
>>> with app.app_context():
...     print(f"Total users: {User.query.count()}")
...     print(f"Total tasks: {Task.query.count()}")
...     print(f"Completed tasks: {Task.query.filter_by(done=True).count()}")
>>> exit()
```

## Sharing with Friends and Family

1. **Send them the URL:** `https://yourusername.pythonanywhere.com`
2. **They can register** their own accounts
3. **Each person gets** their own private task list
4. **Mobile optimized** - works great on phones and tablets
5. **No app installation** required - just bookmark the webpage

## Troubleshooting

### Common Issues:

1. **WSGI Error:** Check file paths in WSGI configuration
2. **Database Error:** Ensure `data/` directory exists and is writable
3. **Static Files:** Verify static files mapping in Web tab
4. **Login Issues:** Check secret key is set properly

### Error Logs:
Check error logs in PythonAnywhere Web tab for debugging.

## App Features Summary

✅ **Multi-user authentication** (registration, login, logout)  
✅ **User data isolation** (private task lists)  
✅ **Mobile-optimized UI** (iOS-style design)  
✅ **Automatic cleanup** (7-day retention)  
✅ **Progress tracking** (visual progress bars)  
✅ **Touch-friendly** (wheel pickers, swipe gestures)  
✅ **Apple-inspired design** (modern, clean interface)  
✅ **Production-ready** (secure, scalable)  

Your app is now ready for friends and family to use! 🎉
