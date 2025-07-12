# WSGI file for Render deployment
import sys
import os

# Import your Flask app
from app import app as application

# Ensure database tables are created
with application.app_context():
    from todo.db import db
    db.create_all()

if __name__ == "__main__":
    # For Render, we need to use the PORT environment variable
    port = int(os.environ.get("PORT", 5000))
    application.run(host="0.0.0.0", port=port)
