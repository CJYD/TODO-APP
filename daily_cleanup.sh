#!/bin/bash
# Daily cleanup script for PythonAnywhere scheduled tasks

# Navigate to project directory
cd /home/yourusername/todo_project

# Activate virtual environment
source venv/bin/activate

# Run cleanup (removes completed tasks older than 7 days)
python3 -c "
from app import app
from cleanup import cleanup_completed_tasks

with app.app_context():
    count = cleanup_completed_tasks(7)
    if count > 0:
        print(f'Daily cleanup: Removed {count} completed tasks older than 7 days')
    else:
        print('Daily cleanup: No old completed tasks to remove')
"

echo "Daily cleanup completed at $(date)"
