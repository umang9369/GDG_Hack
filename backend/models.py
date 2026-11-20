# models.py — Pydantic data models for request validation
# Think of these like TypeScript interfaces, but they also auto-validate incoming data

from pydantic import BaseModel
from typing import Optional, List, Any


# ── Attendance ────────────────────────────────────────────────────────────────
class AttendanceRecord(BaseModel):
    classId: Optional[str] = None
    presentStudents: Optional[List[Any]] = []


class AttendanceSyncRequest(BaseModel):
    records: List[dict]


# ── Teacher Sessions ──────────────────────────────────────────────────────────
class TeacherSession(BaseModel):
    teacherId: Optional[str] = None
    topic: Optional[str] = None
    onTopicPercentage: Optional[float] = 100.0


# ── Student Behavior ──────────────────────────────────────────────────────────
class StudentBehaviorRecord(BaseModel):
    classId: Optional[str] = None
    averageEngagement: Optional[float] = 100.0
    distractedCount: Optional[int] = 0
    students: Optional[List[Any]] = []


# ── Alerts ────────────────────────────────────────────────────────────────────
class AlertCreate(BaseModel):
    type: str
    category: str
    message: str


# ── Students ──────────────────────────────────────────────────────────────────
class FaceEncodingRequest(BaseModel):
    faceEncoding: Any


# ── Roboflow ──────────────────────────────────────────────────────────────────
class RoboflowRequest(BaseModel):
    inputs: Optional[dict] = None
    model_class_agnostic_nms: Optional[bool] = None
    model_confidence: Optional[float] = None
    model_iou_threshold: Optional[float] = None
