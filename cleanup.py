# Database cleanup utilities
from datetime import datetime, timedelta
from todo.db import db
from todo.models import Task
from flask import current_app

def cleanup_completed_tasks(days_old=7):
    """
    Delete completed tasks older than specified days.
    Default: 7 days
    """
    cutoff_date = datetime.utcnow() - timedelta(days=days_old)
    
    # Find completed tasks older than cutoff date
    old_completed_tasks = Task.query.filter(
        Task.done == True,
        Task.created_at < cutoff_date
    ).all()
    
    count = len(old_completed_tasks)
    
    if count > 0:
        # Delete old completed tasks
        for task in old_completed_tasks:
            db.session.delete(task)
        
        db.session.commit()
        print(f"Cleaned up {count} completed tasks older than {days_old} days")
    else:
        print(f"No completed tasks older than {days_old} days found")
    
    return count

def cleanup_all_completed_tasks():
    """
    Delete ALL completed tasks regardless of age.
    Use with caution!
    """
    completed_tasks = Task.query.filter(Task.done == True).all()
    count = len(completed_tasks)
    
    if count > 0:
        for task in completed_tasks:
            db.session.delete(task)
        
        db.session.commit()
        print(f"Cleaned up {count} completed tasks")
    else:
        print("No completed tasks found")
    
    return count

def get_cleanup_stats():
    """
    Get statistics about tasks that would be cleaned up.
    """
    from sqlalchemy import func
    
    # Tasks completed more than 7 days ago
    seven_days_ago = datetime.utcnow() - timedelta(days=7)
    old_completed = Task.query.filter(
        Task.done == True,
        Task.created_at < seven_days_ago
    ).count()
    
    # All completed tasks
    all_completed = Task.query.filter(Task.done == True).count()
    
    # Total tasks
    total_tasks = Task.query.count()
    
    return {
        'old_completed_7_days': old_completed,
        'total_completed': all_completed,
        'total_tasks': total_tasks,
        'active_tasks': total_tasks - all_completed
    }

if __name__ == "__main__":
    # For testing - run this file directly to see cleanup stats
    from app import app
    
    with app.app_context():
        stats = get_cleanup_stats()
        print("Cleanup Statistics:")
        print(f"  Total tasks: {stats['total_tasks']}")
        print(f"  Active tasks: {stats['active_tasks']}")
        print(f"  Completed tasks: {stats['total_completed']}")
        print(f"  Completed tasks older than 7 days: {stats['old_completed_7_days']}")
        
        if stats['old_completed_7_days'] > 0:
            print(f"\nWould clean up {stats['old_completed_7_days']} old completed tasks")
            # Uncomment the next line to actually perform cleanup
            # cleanup_completed_tasks(7)
