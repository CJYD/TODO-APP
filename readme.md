# 📋 Todo App - Modern Task Management

A beautifully designed, full-featured task management application built with Flask. Features multi-user authentication, iOS-style interface, and real-time progress tracking.

![Platform](https://img.shields.io/badge/platform-web-blue)
![Python](https://img.shields.io/badge/python-3.8+-green)
![Flask](https://img.shields.io/badge/flask-3.1+-red)
![License](https://img.shields.io/badge/license-MIT-yellow)

## ✨ Features

### 🔐 **Multi-User Authentication**
- Secure user registration and login
- Password hashing with Werkzeug
- Session management with Flask-Login
- User data isolation (private task lists)

### 📱 **Modern iOS-Style Interface**
- Touch-friendly wheel pickers for dates/times
- Responsive design optimized for mobile
- Dark/light theme support
- Apple-inspired visual design
- Smooth animations and transitions

### ✅ **Task Management**
- Create, edit, and delete tasks
- Due date and time scheduling
- Progress tracking with visual indicators
- Smart filtering (All, Active, Due Today, Completed)
- Color-coded priority system (overdue in red, due soon in orange)

### 🐛 **Bug Reporting System**
- User-friendly bug report interface
- Admin panel for managing reports
- Detailed bug categorization and priority levels
- Database storage with user accountability

### 🔧 **Administrative Features**
- First user automatically becomes admin
- Admin dashboard for bug reports
- Task cleanup automation (7-day retention)
- Database migration endpoints

### 🚀 **Production Ready**
- Environment-aware database configuration
- SQLite for development, PostgreSQL for production
- Gunicorn WSGI server support
- Render.com deployment ready

## 🛠 Tech Stack

- **Backend**: Flask 3.1+, SQLAlchemy, Flask-Login, Flask-Migrate
- **Database**: SQLite (development) / PostgreSQL (production)
- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Deployment**: Gunicorn, Render.com

## 🏗 Architecture

```
todo_project/
├── app.py                 # Main Flask application
├── wsgi.py               # Production WSGI entry point
├── cleanup.py            # Database cleanup utilities
├── requirements.txt      # Python dependencies
├── todo/                 # Database models package
│   ├── __init__.py
│   ├── db.py            # Database configuration
│   └── models.py        # User, Task, BugReport models
├── static/              # Static assets
│   ├── style.css        # Responsive CSS with dark/light themes
│   ├── js/app.js        # Interactive JavaScript features
│   └── favicon.ico      # App icon
├── templates/           # Jinja2 HTML templates
│   ├── layout.html      # Base template
│   ├── index.html       # Main task interface
│   ├── add.html         # Add task form
│   ├── login.html       # Authentication forms
│   ├── register.html
│   ├── report.html      # Bug reporting
│   └── admin_bugs.html  # Admin panel
└── data/               # Local database storage
    └── tasks.db        # SQLite database (development)
```

## 🚀 Quick Start

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/CJYD/TODO-APP.git
   cd TODO-APP
   ```

2. **Set up virtual environment**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Run the application**
   ```bash
   python app.py
   ```

5. **Access the app**
   - Open http://localhost:5002
   - Register your account (first user becomes admin)
   - Start managing your tasks!

### Production Deployment

See [RENDER_DEPLOYMENT.md](RENDER_DEPLOYMENT.md) for complete deployment instructions.

#### Quick Deploy to Render
1. Push to GitHub
2. Connect repository to Render
3. Set environment variables:
   - `SECRET_KEY`: Your secure secret key
   - `DEVELOPER_EMAIL`: Email address to receive bug report notifications
   - `MAIL_USERNAME`: Email account for sending notifications (optional)
   - `MAIL_PASSWORD`: Email account password (optional)
   - `MAIL_SERVER`: SMTP server (default: smtp.gmail.com)
4. Deploy with PostgreSQL database
5. Visit `/migrate_db` to initialize database

**Note**: Email notifications are optional. If not configured, bug reports will still be saved to the database for admin review.

## 💡 Usage

### Creating Tasks
- Click "Add Task" from the main interface
- Enter task description
- Set due date and time using iOS-style pickers
- Tasks automatically sort by due date

### Managing Tasks
- **Complete**: Click the checkmark button
- **Edit**: Click on task description to edit in-place
- **Delete**: Click the remove (×) button
- **Filter**: Use filter buttons (All, Active, Due Today, Completed)

### Bug Reporting
- Access via page footer "Report a problem" link
- Fill out detailed bug report form with priority levels
- Developers automatically receive email notifications (if configured)
- Reports are only visible to admin users for privacy

### Admin Features
- First registered user automatically becomes admin
- Access admin panel via profile dropdown
- View and manage all bug reports
- Mark reports as resolved

## 🔧 Configuration

### Environment Variables
- `SECRET_KEY`: Flask secret key for sessions
- `DATABASE_URL`: PostgreSQL connection string (production)

### Database Configuration
The app automatically detects the environment:
- **Development**: Uses SQLite (`data/tasks.db`)
- **Production**: Uses PostgreSQL (from `DATABASE_URL`)

### Automatic Cleanup
- Completed tasks older than 7 days are automatically cleaned up
- Runs on app startup if 24+ hours since last cleanup
- Manual cleanup available via `/cleanup/run` endpoint

## 🎨 Theming

The app supports both light and dark themes:
- Automatically detects user's system preference
- Toggle between themes using the theme button in profile dropdown
- Preference saved in localStorage

## 🔒 Security Features

- Password hashing with Werkzeug
- CSRF protection
- Secure session management
- User data isolation
- Input validation and sanitization

## 📊 Database Schema

### Users Table
- `id`: Primary key
- `username`: Unique username (case-insensitive)
- `password_hash`: Hashed password
- `created_at`: Registration timestamp

### Tasks Table
- `id`: Primary key
- `description`: Task description
- `due_date`: Optional due date/time
- `done`: Completion status
- `created_at`: Creation timestamp
- `user_id`: Foreign key to users

### Bug Reports Table
- `id`: Primary key
- `bug_type`: Category (UI/Performance/Feature/Other)
- `priority`: Priority level (low/medium/high/critical)
- `description`: Bug description
- `steps`: Reproduction steps
- `expected`: Expected behavior
- `actual`: Actual behavior
- `resolved`: Resolution status
- `created_at`: Report timestamp
- `user_id`: Foreign key to users

## 🔄 API Endpoints

### Task Management
- `GET /` - Main task interface
- `POST /add` - Create new task
- `GET /done/<id>` - Mark task complete
- `GET /remove/<id>` - Delete task
- `POST /edit/<id>` - Edit task description

### Authentication
- `GET|POST /login` - User login
- `GET|POST /register` - User registration
- `GET /logout` - User logout

### Bug Reporting
- `GET|POST /report` - Submit bug report
- `GET /admin/bugs` - Admin: View all reports
- `POST /admin/bugs/<id>/resolve` - Admin: Resolve report

### Utility
- `GET /migrate_db` - Initialize database tables
- `GET /cleanup/stats` - Get cleanup statistics
- `GET /cleanup/run` - Manual cleanup

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes
4. Run tests and ensure code quality
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support

- **Issues**: Report bugs via the in-app bug reporting system
- **Documentation**: See [RENDER_DEPLOYMENT.md](RENDER_DEPLOYMENT.md) for deployment help
- **Repository**: [GitHub Issues](https://github.com/CJYD/TODO-APP/issues)

## 🚧 Future Enhancements

- [ ] Task categories and tags
- [ ] Email notifications for due tasks
- [ ] Task sharing and collaboration
- [ ] Export functionality (CSV, PDF)
- [ ] Mobile app (React Native/Flutter)
- [ ] API endpoints for third-party integrations

---

**Built with ❤️ using Flask and modern web technologies**