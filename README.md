# COSC335-TicTacToe

# Deployment Instructions
These steps will help you clone and run the project locally using Docker and Firebase.

# Structure
COSC335-TicTacToe/
├── app/  React frontend (Vite)
├── server/  Backend (if used separately)
├── compose.yaml  Docker Compose setup
├── Dockerfile  Frontend container build
└── README.md

# Installs
- Fork Project from GitHub
- Docker Desktop App
- Git
- New Project in FireBase (Enable Authentication: Email/Password, Google, etc.)

# How to Run

1. Go to Firebase -> Project Overview (in Newly Created Project) -> Project Settings -> Copy the firebaseConfig keys -> Paste into firebaseConfig.json

2. Open Docker and create a container for project file from root directory (COSC335-TicTacToe)

3. Open up web browser and enter in local host (http://localhost:5173)

4. Register and Login to play game