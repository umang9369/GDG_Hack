# routers/analytics.py — Replaces /api/analytics/* routes from server.js
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from fastapi import APIRouter
from datetime import datetime, timedelta
import store

router = APIRouter(prefix="/api/analytics", tags=["Analytics"])


@router.get("/summary")
def get_summary():
    """
    Today's dashboard summary:
    - Total students, attendance count, avg on-topic %, avg engagement, alert count
    """
    today = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)

    today_attendance = [
        r for r in store.attendance_records
        if datetime.fromisoformat(r["timestamp"]) >= today
    ]
    today_sessions = [
        s for s in store.teacher_sessions
        if datetime.fromisoformat(s["timestamp"]) >= today
    ]
    today_behavior = [
        b for b in store.student_behavior
        if datetime.fromisoformat(b["timestamp"]) >= today
    ]
    today_alerts = [
        a for a in store.alerts
        if datetime.fromisoformat(a["timestamp"]) >= today
    ]

    students_present = sum(len(r.get("presentStudents") or []) for r in today_attendance)

    avg_on_topic = (
        sum(s.get("onTopicPercentage", 0) for s in today_sessions) / len(today_sessions)
        if today_sessions else 0
    )
    avg_engagement = (
        sum(b.get("averageEngagement", 0) for b in today_behavior) / len(today_behavior)
        if today_behavior else 0
    )

    return {
        "totalStudents":      len(store.students),
        "attendanceSessions": len(today_attendance),
        "studentsPresent":    students_present,
        "teacherSessions":    len(today_sessions),
        "averageOnTopic":     round(avg_on_topic, 2),
        "behaviorSessions":   len(today_behavior),
        "averageEngagement":  round(avg_engagement, 2),
        "alertsToday":        len(today_alerts),
        "recentAlerts":       list(reversed(store.alerts[-5:])),
    }


@router.get("/trends")
def get_trends(days: int = 7):
    """
    Day-by-day trend data for the last N days.
    Used for line/bar charts on the dashboard.
    """
    trends = []

    for i in range(days - 1, -1, -1):
        day_start = datetime.utcnow().replace(
            hour=0, minute=0, second=0, microsecond=0
        ) - timedelta(days=i)
        day_end = day_start + timedelta(days=1)

        def in_day(ts: str) -> bool:
            dt = datetime.fromisoformat(ts)
            return day_start <= dt < day_end

        day_attendance = [r for r in store.attendance_records if in_day(r["timestamp"])]
        day_sessions   = [s for s in store.teacher_sessions   if in_day(s["timestamp"])]
        day_behavior   = [b for b in store.student_behavior   if in_day(b["timestamp"])]

        attendance_count = sum(len(r.get("presentStudents") or []) for r in day_attendance)

        on_topic_avg = (
            sum(s.get("onTopicPercentage", 0) for s in day_sessions) / len(day_sessions)
            if day_sessions else 0
        )
        engagement_avg = (
            sum(b.get("averageEngagement", 0) for b in day_behavior) / len(day_behavior)
            if day_behavior else 0
        )

        trends.append({
            "date":          day_start.strftime("%Y-%m-%d"),
            "attendance":    attendance_count,
            "onTopicAvg":    round(on_topic_avg, 2),
            "engagementAvg": round(engagement_avg, 2),
        })

    return trends
