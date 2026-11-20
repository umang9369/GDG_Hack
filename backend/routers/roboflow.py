# routers/roboflow.py — Replaces roboflow-proxy.js (was on port 4000, now same server)
#
# WHY a proxy?  The Roboflow API key must stay secret.
# If the frontend called Roboflow directly, the key would be visible in browser DevTools.
# This endpoint adds the key server-side before forwarding, keeping it safe.

import os
import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from fastapi import APIRouter, Request, HTTPException
from datetime import datetime
import httpx
from dotenv import load_dotenv

load_dotenv()

router = APIRouter(tags=["Roboflow AI Proxy"])

ROBOFLOW_URL = (
    "https://serverless.roboflow.com/new-workspace-hygt2/workflows/custom-workflow"
)

# Cache the last prediction so the GET endpoint can show it
_last_prediction: dict | None = None
_last_prediction_time: str | None = None


@router.get("/roboflow")
def roboflow_health():
    """
    Health check for the Roboflow proxy.
    Also shows the most recent prediction result if one exists.
    """
    if _last_prediction:
        return {
            "status":             "running",
            "message":            "Roboflow proxy is running. Latest prediction results:",
            "lastPredictionTime": _last_prediction_time,
            "prediction":         _last_prediction,
        }
    return {
        "status":  "running",
        "message": "Roboflow proxy is running. No predictions yet. POST /roboflow to send an image.",
        "requiredBody": {
            "inputs": {
                "image": {"type": "base64", "value": "base64_encoded_image_string"}
            }
        },
        "lastPredictionTime": None,
        "prediction":         None,
    }


@router.post("/roboflow")
async def roboflow_proxy(request: Request):
    """
    Forward a base64 image to Roboflow's cloud AI and return detection results.
    Injects the ROBOFLOW_API_KEY server-side so it's never exposed to the browser.
    """
    global _last_prediction, _last_prediction_time

    api_key = os.getenv("ROBOFLOW_API_KEY")
    if not api_key:
        raise HTTPException(
            status_code=500,
            detail="Server misconfigured: missing ROBOFLOW_API_KEY in .env",
        )

    body = await request.json()
    body["api_key"] = api_key  # inject key safely on the server side

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                ROBOFLOW_URL,
                json=body,
                headers={"Content-Type": "application/json"},
            )
            result = response.json()
    except httpx.RequestError as exc:
        raise HTTPException(status_code=502, detail=f"Roboflow unreachable: {exc}")

    _last_prediction = result
    _last_prediction_time = datetime.utcnow().isoformat()

    if isinstance(result, dict) and "predictions" in result:
        print(f"[Roboflow] Prediction at {_last_prediction_time} — {len(result['predictions'])} objects")

    return result
