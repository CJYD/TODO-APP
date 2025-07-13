# Render Deployment Guide

## Quick Setup

1. **Connect GitHub Repository**
   - Go to [Render Dashboard](https://dashboard.render.com/)
   - Click "New +" → "Web Service"
   - Connect your GitHub repository: `todo_project`

2. **Configure Web Service**
   - **Name**: `todo-app` (or your preferred name)
   - **Environment**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `gunicorn wsgi:app`
   - **Instance Type**: `Free` (or `Starter` for better performance)

3. **Add Environment Variables**
   Go to Environment tab and add:
   ```
   SECRET_KEY=your-super-secret-production-key-here
   ```
   Note: Render automatically provides `DATABASE_URL` for PostgreSQL

4. **Create PostgreSQL Database**
   - Click "New +" → "PostgreSQL"
   - **Name**: `todo-database`
   - **Database Name**: `todo_db`
   - **User**: `todo_user`
   - **Region**: Same as your web service
   - **Plan**: `Free`

5. **Connect Database to Web Service**
   - In your web service Environment tab
   - The `DATABASE_URL` should automatically be available
   - If not, copy it from your PostgreSQL dashboard

## Database Migration

After deployment, initialize the database:
1. Go to your deployed app URL
2. Visit: `https://your-app-name.onrender.com/migrate_db`
3. This will create all necessary tables

## Environment-Aware Configuration

The app automatically detects the environment:
- **Local Development**: Uses SQLite (`data/tasks.db`)
- **Production (Render)**: Uses PostgreSQL (`DATABASE_URL` from environment)

## Troubleshooting

### Database Issues
- If tables don't exist, visit `/migrate_db` endpoint
- Check that `DATABASE_URL` environment variable is set
- Verify PostgreSQL service is running

### App Won't Start
- Check build logs for dependency issues
- Ensure `wsgi.py` is present and correct
- Verify `gunicorn` is installed (included in requirements.txt)

### Performance
- Free tier has limitations (sleeps after 15 min inactivity)
- Consider upgrading to Starter plan for production use
- Database connections may timeout on free tier

## Security Notes
- Never commit real secret keys to GitHub
- Use environment variables for all sensitive data
- The app generates secure sessions automatically in production
