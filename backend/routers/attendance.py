# routers/attendance.py — Replaces all /api/attendance routes from server.js
import time
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from fastapi import APIRouter, HTTPException
from typing import Optional
from datetime import datetime, date
import store
from models import AttendanceRecord, AttendanceSyncRequest

router = APIRouter(prefix="/api", tags=["Attendance"])


@router.post("/attendance")
def record_attendance(body: AttendanceRecord):
    """Save one attendance event (who attended, which class, when)"""
    record = {
        "id":        str(int(time.time() * 1000)),
        "timestamp": datetime.utcnow().isoformat(),
        **body.model_dump(),
    }
    store.attendance_records.append(record)
    return {"success": True, "record": record}


@router.get("/attendance")
def get_attendance(
    date: Optional[str] = None,
    classId: Optional[str] = None,
):
    """Fetch attendance records, optionally filtered by ?date= or ?classId="""
    results = store.attendance_records

    if date:
        try:
            target = datetime.fromisoformat(date).date()
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD.")
        results = [r for r in results if datetime.fromisoformat(r["timestamp"]).date() == target]

    if classId:
        results = [r for r in results if r.get("classId") == classId]

    return results


@router.post("/attendance/sync")
def sync_attendance(body: AttendanceSyncRequest):
    """Bulk-sync offline attendance records collected without internet"""
    existing_ids = {r["id"] for r in store.attendance_records}
    new_records = [r for r in body.records if r.get("id") not in existing_ids]
    store.attendance_records.extend(new_records)
    return {"success": True, "synced": len(new_records)}
