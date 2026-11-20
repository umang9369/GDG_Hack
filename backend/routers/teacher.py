# routers/teacher.py — Replaces all /api/teacher-sessions routes from server.js
import time
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from fastapi import APIRouter
from typing import Optional
from datetime import datetime
import store
from models import TeacherSession

router = APIRouter(prefix="/api", tags=["Teacher Sessions"])


@router.post("/teacher-sessions")
def create_teacher_session(body: TeacherSession):
    """
    Save a teacher session record.
    Auto-generates a warning alert if on-topic percentage < 70%.
    """
    session = {
        "id":        str(int(time.time() * 1000)),
        "timestamp": datetime.utcnow().isoformat(),
        **body.model_dump(),
    }
    store.teacher_sessions.append(session)

    # Auto-alert if teacher is off-topic too often
    if (body.onTopicPercentage or 100) < 70:
        store.alerts.append({
            "id":        str(int(time.time() * 1000)),
            "timestamp": datetime.utcnow().isoformat(),
            "type":      "warning",
            "category":  "teacher",
            "message":   (
                f"Teacher session below threshold: "
                f"{body.onTopicPercentage}% on-topic for {body.topic}"
            ),
            "sessionId": session["id"],
        })

    return {"success": True, "session": session}


@router.get("/teacher-sessions")
def get_teacher_sessions(
    teacherId: Optional[str] = None,
    date: Optional[str] = None,
):
    """Fetch teacher sessions, optionally filtered by ?teacherId= or ?date="""
    results = store.teacher_sessions

    if teacherId:
        results = [s for s in results if s.get("teacherId") == teacherId]

    if date:
        target = datetime.fromisoformat(date).date()
        results = [
            s for s in results
            if datetime.fromisoformat(s["timestamp"]).date() == target
        ]

    return results
