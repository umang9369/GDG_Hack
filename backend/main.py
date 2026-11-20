# main.py — FastAPI entry point (replaces server.js + roboflow-proxy.js)
#
# Run:  uvicorn main:app --reload --port 8000
# Docs: http://localhost:8000/docs   ← interactive Swagger UI (free with FastAPI!)

import os
from datetime import datetime
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()  # reads .env file into os.getenv()

# ── Import all routers ────────────────────────────────────────────────────────
from routers import students, attendance, teacher, behavior, alerts, analytics, roboflow
import store

# ── Create the FastAPI app ────────────────────────────────────────────────────
app = FastAPI(
    title="EduPulse AI",
    description="Backend API for EduPulse AI — classroom intelligence platform",
    version="2.0.0",
)

# ── CORS — allow the React/Vite frontend to call this backend ─────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",  # Vite dev server
        "http://localhost:3000",  # CRA dev server (fallback)
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Register all routers ──────────────────────────────────────────────────────
app.include_router(students.router)
app.include_router(attendance.router)
app.include_router(teacher.router)
app.include_router(behavior.router)
app.include_router(alerts.router)
app.include_router(analytics.router)
app.include_router(roboflow.router)


# ── Root test endpoint ────────────────────────────────────────────────────────
@app.get("/api/test", tags=["Health"])
def test():
    return {"message": "EduPulse AI FastAPI Backend is running!", "version": "2.0.0"}


# ── Detailed health check ─────────────────────────────────────────────────────
@app.get("/api/health", tags=["Health"])
def health():
    return {
        "status":    "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "records": {
            "attendance":      len(store.attendance_records),
            "teacherSessions": len(store.teacher_sessions),
            "studentBehavior": len(store.student_behavior),
            "alerts":          len(store.alerts),
        },
    }


# ── Dev entry point ───────────────────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    print(f"🚀 EduPulse AI FastAPI Backend starting on port {port}")
    print(f"📄 Interactive docs: http://localhost:{port}/docs")
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
