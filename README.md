# Callio — Real-Time Calling & Video Calling PWA

Callio is a production-grade Progressive Web App (PWA) built with Vanilla JS, Vite, FastAPI, PostgreSQL (Neon), WebSockets, and WebRTC.

## Features
- 🔐 JWT Authentication & Password Hashing
- 👤 Customizable User Profiles & Identity Cards with QR Codes
- 🔍 Debounced Username Discovery & Friend Request Pipeline
- 🟢 Real-Time Presence & Online/Offline Status via WebSockets
- 📞 Low-latency WebRTC Audio & Video Calling
- 🖥️ Screen Sharing & PIP Local Preview
- 📜 Call Logs & Persistent History
- 📲 PWA Support with Offline Fallback & Service Worker

## Local Development Setup

### Backend (FastAPI)
```bash
cd backend
python -m venv venv
# On Windows:
.\venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload --port 8000
```

### Frontend (Vite)
```bash
cd frontend
npm install
npm run dev
```

## Production Deployment

### Backend → Render
- **Build Command**: `pip install -r requirements.txt && alembic upgrade head`
- **Start Command**: `gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:$PORT`
- **Environment Variables**:
  - `DATABASE_URL`: `postgresql://neondb_owner:npg_6JNlX8IZfGHz@ep-jolly-dust-b5x4aw3u-pooler.c-7.us-east-2.aws.neon.tech/neondb?sslmode=require`
  - `JWT_SECRET`: `<secure_jwt_secret_key>`
  - `CORS_ORIGINS`: `https://callio-opal.vercel.app`
  - `STUN_SERVER`: `stun:stun.l.google.com:19302`

### Frontend → Vercel
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Environment Variables**:
  - `VITE_API_URL`: `https://your-backend-app.onrender.com`
