# PythonAnywhere WSGI file
import sys
import os

# Add your project directory to the sys.path
project_home = '/home/yourusername/todo_project'  # Update with your actual username
if project_home not in sys.path:
    sys.path = [project_home] + sys.path

from app import app as application

# Ensure database tables are created
with application.app_context():
    from todo.db import db
    db.create_all()

if __name__ == "__main__":
    application.run()
