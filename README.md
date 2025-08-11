# MOB - A Web Application to Study Students Ability to detect Conversational AI

<img src="icon.png" alt="App Icon" width="300" height="300" />

MOB stands for the German phrase "Mensch oder Bot" (Human or Bot). The application challenges students to detect whether they're chatting with a real person or an AI – testing their intuition and critical thinking in the age of conversational AI.

**Note**: The application interface and parts of the code documentation are in German, as this project was developed for German-speaking educational environments.

## ✨ Features

- **Room Creation**: Teachers can create virtual rooms and share unique 4-digit codes for students to join.
- **Chat Rounds**: Teachers initiate chat rounds where students participate in real-time conversations.
- **AI Impersonation Detection**: In each round, students chat with either another student or an AI chatbot impersonating a student.
- **Decision Making**: After each chat, students must decide whether they interacted with a real student or an AI.
- **Voting Feedback**: Both students and teachers receive comprehensive feedback on voting results after each chat round.

---

- **Frontend**: React.js with Bootstrap for responsive UI
- **Backend**: Django with Django REST Framework
- **Real-time Communication**: Django Channels with WebSocket support + Redis
- **Database**: SQLite

## 📋 Prerequisites

Before running this application, make sure you have the following installed:

- **Node.js** (v16 or higher)
- **Python** (v3.8 or higher)
- **Redis** server
- **npm**

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/simon-fritz/MOB.git
cd MOB
```

### 2. Backend Setup

```bash
cd backend

# Create and activate virtual environment
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Setup environment variables
cp .env_template .env
# Edit .env file and add your configuration:
# - TEACHER_SECRET: A secret key for teacher authentication
# - OPENAI_API_KEY: Your OpenAI API key for the LLM

# Run database migrations
python manage.py migrate

# Create a superuser (optional, for admin access)
python manage.py createsuperuser

# Collect static files
python manage.py collectstatic
```

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install
```

### 4. Start the Services

You'll need to run these commands in separate terminal windows/tabs:

**Terminal 1 - Redis Server:**

- **macOS/Linux:**
    ```bash
    redis-server
    ```
- **Windows:**  
    Consider using [WSL (Windows Subsystem for Linux)](https://learn.microsoft.com/windows/wsl/) to run Redis:
    ```bash
    # In WSL terminal
    redis-server
    ```
    Or use a Windows-native Redis distribution (see [Redis downloads](https://redis.io/download/)).

**Terminal 2 - Django Backend:**
```bash
cd backend
source .venv/bin/activate
daphne -b 0.0.0.0 -p 8000 mob_backend.asgi:application
```

**Terminal 3 - React Frontend:**
```bash
cd frontend
npm start
```

### 5. Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **Admin Panel**: http://localhost:8000/admin

## 🎮 How to Use

### For Teachers:
1. Register/Login at http://localhost:3000/login
2. Create a new room with a custom name
3. Share the generated 4-digit room code with students
4. Start a chat-round

### For Students:
1. Visit http://localhost:3000
2. Enter the room code provided by your teacher
3. Enter your name to join the room
4. Wait for your teacher to start the chat-round

## 🔧 Development

### Backend API Endpoints

The backend provides RESTful APIs for:
- Room management (`/api/rooms/`)
- User authentication (`/api/accounts/`)
- Chat functionality (WebSocket endpoints)

### Frontend Components

Key React components include:
- `RoleSelection`: Main landing page for choosing teacher/student role
- `Room`: Main room interface with chat
- `TeacherPanel`/`StudentPanel`: Role-specific interfaces
- `Chat`: Real-time messaging component

## 📁 Project Structure

```
MOB/
├── backend/                 # Django backend
│   ├── accounts/           # User authentication app
│   ├── rooms/              # Room and chat functionality
│   ├── mob_backend/        # Main Django settings
│   └── requirements.txt    # Python dependencies
├── frontend/               # React frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   └── App.js         # Main App component
│   └── package.json       # Node.js dependencies
└── README.md              # This file
```

## 🐛 Troubleshooting

### Common Issues:

1. **Redis Connection Error**: Make sure Redis server is running
2. **Database Issues**: Run `python manage.py migrate` to apply migrations
3. **CORS Errors**: Check `django-cors-headers` configuration in Django settings (if you want to deploy)

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.
