# Aegis-Quant Deployment Guide

## 1. Local Development
### Prerequisites
- Python 3.11+
- Node.js 18+

### Setup & Run
```bash
# 1. Start FastAPI Backend (Port 8000)
.venv\Scripts\activate
uvicorn backend.app.main:app --reload --port 8000

# 2. Start Next.js Frontend (Port 3000)
cd frontend
npm run dev
```

The database will initialize automatically with tables and synthetic demo records on the first startup.

---

## 2. Docker Compose Deployment
To run all three layers (PostgreSQL database, FastAPI backend, Next.js frontend) with a single command:

```bash
docker-compose up -d --build
```
- Frontend: `http://localhost:3000`
- Backend API Docs: `http://localhost:8000/docs`
- PostgreSQL: `localhost:5432`

---

## 3. Production Hardening Checklist
- [ ] Configure `DATABASE_URL` pointing to production Supabase PostgreSQL instance.
- [ ] Set `SUPABASE_SERVICE_ROLE_KEY` in backend environment (never expose to frontend).
- [ ] Configure `AI_PROVIDER` (`mock`, `openai`, `gemini`).
- [ ] Ensure HTTPS termination and CORS domain allowlisting.
