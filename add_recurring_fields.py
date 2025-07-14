#!/usr/bin/env python3
"""
Migration script to add recurring task fields to the existing tasks table.
Run this script to add the new columns for recurring task functionality.
"""
import os
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# Database connection
DATABASE_URL = os.environ.get("DATABASE_URL")
if not DATABASE_URL:
    print("ERROR: DATABASE_URL environment variable not set")
    exit(1)

engine = create_engine(DATABASE_URL)
Session = sessionmaker(bind=engine)
session = Session()

def add_recurring_fields():
    """Add recurring task fields to the tasks table"""
    print("Adding recurring task fields to tasks table...")
    
    try:
        # Add the new columns with default values
        session.execute(text("""
            ALTER TABLE tasks 
            ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT FALSE;
        """))
        
        session.execute(text("""
            ALTER TABLE tasks 
            ADD COLUMN IF NOT EXISTS recurrence_type VARCHAR(20);
        """))
        
        session.execute(text("""
            ALTER TABLE tasks 
            ADD COLUMN IF NOT EXISTS recurrence_interval INTEGER DEFAULT 1;
        """))
        
        session.execute(text("""
            ALTER TABLE tasks 
            ADD COLUMN IF NOT EXISTS parent_task_id INTEGER;
        """))
        
        session.execute(text("""
            ALTER TABLE tasks 
            ADD COLUMN IF NOT EXISTS next_due_date TIMESTAMP;
        """))
        
        # Add foreign key constraint for parent_task_id
        session.execute(text("""
            ALTER TABLE tasks 
            ADD CONSTRAINT fk_parent_task 
            FOREIGN KEY (parent_task_id) REFERENCES tasks(id);
        """))
        
        session.commit()
        print("✅ Successfully added recurring task fields!")
        
    except Exception as e:
        session.rollback()
        print(f"❌ Error adding recurring task fields: {e}")
        
    finally:
        session.close()

if __name__ == "__main__":
    add_recurring_fields()