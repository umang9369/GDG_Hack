# routers/behavior.py — Replaces all /api/student-behavior routes from server.js
import time
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from fastapi import APIRouter
from typing import Optional
from datetime import datetime
import store
from models import StudentBehaviorRecord

router = APIRouter(prefix="/api", tags=["Student Behavior"])


@router.post("/student-behavior")
def record_behavior(body: StudentBehaviorRecord):
    """
    Save a student behavior snapshot.
    Auto-generates alerts for:
    - Low average engagement (< 50%)
    - High distraction (> 40% of students distracted)
    """
    record = {
        "id":        str(int(time.time() * 1000)),
        "timestamp": datetime.utcnow().isoformat(),
        **body.model_dump(),
    }
    store.student_behavior.append(record)

    # Alert: low class engagement
    engagement = body.averageEngagement or 100
    if engagement < 50:
        store.alerts.append({
            "id":        str(int(time.time() * 1000)),
            "timestamp": datetime.utcnow().isoformat(),
            "type":      "critical",
            "category":  "engagement",
            "message":   f"Low class engagement detected: {engagement:.0f}% average",
            "recordId":  record["id"],
        })

    # Alert: too many distracted students
    students_list = body.students or []
    distracted = body.distractedCount or 0
    if students_list and distracted > len(students_list) * 0.4:
        store.alerts.append({
            "id":        str(int(time.time() * 1000)),
            "timestamp": datetime.utcnow().isoformat(),
            "type":      "warning",
            "category":  "attention",
            "message":   f"High distraction level: {distracted} students distracted",
            "recordId":  record["id"],
        })

    return {"success": True, "record": record}


@router.get("/student-behavior")
def get_behavior(
    classId: Optional[str] = None,
    date: Optional[str] = None,
):
    """Fetch behavior records, optionally filtered by ?classId= or ?date="""
    results = store.student_behavior

    if classId:
        results = [r for r in results if r.get("classId") == classId]

    if date:
        target = datetime.fromisoformat(date).date()
        results = [
            r for r in results
            if datetime.fromisoformat(r["timestamp"]).date() == target
        ]

    return results
