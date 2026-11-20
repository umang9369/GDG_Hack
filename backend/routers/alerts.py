# routers/alerts.py — Replaces all /api/alerts routes from server.js
import time
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from fastapi import APIRouter, HTTPException
from typing import Optional
from datetime import datetime
import store
from models import AlertCreate

router = APIRouter(prefix="/api", tags=["Alerts"])


@router.get("/alerts")
def get_alerts(
    limit: int = 50,
    type: Optional[str] = None,
):
    """
    Return alerts newest-first.
    Supports ?limit= (default 50) and ?type=warning|critical filters.
    """
    results = store.alerts

    if type:
        results = [a for a in results if a.get("type") == type]

    # Return last N alerts, reversed so newest is first
    return list(reversed(results[-limit:]))


@router.post("/alerts")
def create_alert(body: AlertCreate):
    """Manually create an alert (e.g. from admin or external trigger)"""
    alert = {
        "id":        str(int(time.time() * 1000)),
        "timestamp": datetime.utcnow().isoformat(),
        **body.model_dump(),
    }
    store.alerts.append(alert)
    return {"success": True, "alert": alert}


@router.delete("/alerts/{alert_id}")
def delete_alert(alert_id: str):
    """Dismiss / delete an alert by its ID"""
    before = len(store.alerts)
    store.alerts[:] = [a for a in store.alerts if a["id"] != alert_id]
    if len(store.alerts) == before:
        raise HTTPException(status_code=404, detail="Alert not found")
    return {"success": True}
