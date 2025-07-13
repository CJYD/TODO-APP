#!/usr/bin/env python3
"""
Utility script to update user 1 (admin) username and password
"""

import os
import sys
from flask import Flask
from todo import db, User

def update_admin_user():
    """Update user ID 1 to have username 'admin' and password 'admin123'"""
    
    # Setup Flask app with same config as main app
    app = Flask(__name__)
    
    # Database configuration - same as in app.py
    DATABASE_URL = os.environ.get('DATABASE_URL')
    if DATABASE_URL:
        app.config["SQLALCHEMY_DATABASE_URI"] = DATABASE_URL
    else:
        LOCAL_POSTGRES = os.environ.get('USE_LOCAL_POSTGRES', 'false').lower() == 'true'
        if LOCAL_POSTGRES:
            local_db_url = os.environ.get('LOCAL_DATABASE_URL', 
                                        'postgresql://todo_user:localpass@localhost/todo_local')
            app.config["SQLALCHEMY_DATABASE_URI"] = local_db_url
        else:
            # Local development: Use SQLite (default)
            BASEDIR = os.path.abspath(os.path.dirname(__file__))
            DATA_DIR = os.path.join(BASEDIR, "data")
            DB_PATH = os.path.join(DATA_DIR, "tasks.db")
            app.config["SQLALCHEMY_DATABASE_URI"] = f"sqlite:///{DB_PATH}"
    
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    db.init_app(app)
    
    with app.app_context():
        try:
            # Find user with ID 1
            admin_user = User.query.get(1)
            
            if not admin_user:
                print("❌ Error: User with ID 1 not found!")
                print("Make sure you have at least one registered user.")
                return False
            
            print(f"📋 Current admin user: {admin_user.username}")
            
            # Update username and password
            old_username = admin_user.username
            admin_user.username = "admin"
            admin_user.set_password("admin123")
            
            # Save changes
            db.session.commit()
            
            print(f"✅ Successfully updated user 1:")
            print(f"   Username: {old_username} → admin")
            print(f"   Password: → admin123")
            print(f"   User ID: {admin_user.id}")
            print(f"   Created: {admin_user.created_at}")
            
            return True
            
        except Exception as e:
            print(f"❌ Error updating admin user: {e}")
            db.session.rollback()
            return False

if __name__ == "__main__":
    print("🔧 Updating admin user credentials...")
    print("-" * 40)
    
    success = update_admin_user()
    
    if success:
        print("-" * 40)
        print("🎉 Admin user updated successfully!")
        print("You can now login with:")
        print("   Username: admin")
        print("   Password: admin123")
    else:
        print("-" * 40)
        print("❌ Failed to update admin user.")
        sys.exit(1)
