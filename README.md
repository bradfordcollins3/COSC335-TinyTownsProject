# 🏩 TinyTowns

A strategy-based town-building game built using **React**, **Docker**, and **Firebase**. Inspired by the real Tiny Towns board game, this version brings it to life as a web app with modern tech.

---

## 📦 Tech Stack

- ⚛️ React (Vite) — Frontend
- 🔥 Firebase — Auth + Deployment
- 🐳 Docker — Containerized environment
- 🧪 Vitest — Unit Testing

---

## 🚀 Features

- Place buildings and resources on a 4x4 grid
- Automatically score patterns and enforce placement rules
- Multiplayer-ready (coming soon)
- Firebase Email/Password authentication
- Dockerized setup for easy development and deployment

---

## 📸 Screenshots

_Add images here later using:_
```md
![Game Board Screenshot](./screenshots/board.png)
```

---

## 🔧 Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/bradfordcollins3/COSC335-TinyTownsProject.git
cd COSC335-TinyTownsProject
```

### 2. Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a project → Enable **Email/Password** sign-in
3. Get your `firebaseConfig` from Project Settings
4. Paste it into `/app/src/firebaseConfig.json`

### 3. Run Locally with Docker

```bash
docker-compose up --build
```

Then visit: [http://localhost:5173](http://localhost:5173)

---

## 🧪 Running Tests

```bash
npm run test
```

You can also run with coverage (via Docker):

```bash
docker exec -it tictactoe-vite sh
npm run coverage
```

---