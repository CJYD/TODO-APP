from datetime import datetime
from .db import db
from werkzeug.security import generate_password_hash, check_password_hash
from flask_login import UserMixin

class User(UserMixin, db.Model):
    __tablename__ = "users"
    
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password_hash = db.Column(db.String(120), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationship to tasks
    tasks = db.relationship('Task', backref='user', lazy=True, cascade='all, delete-orphan')
    
    def set_password(self, password):
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

class Task(db.Model):
    __tablename__ = "tasks"

    id          = db.Column(db.Integer,   primary_key=True)
    description = db.Column(db.String(200), nullable=False)
    due_date    = db.Column(db.DateTime,    nullable=True)
    created_at  = db.Column(db.DateTime,    default=datetime.utcnow)
    done        = db.Column(db.Boolean,     default=False)
    user_id     = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
