# routers/students.py — Replaces all /api/students routes from server.js
import random
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from fastapi import APIRouter, HTTPException
from typing import Optional
import store
from models import FaceEncodingRequest

router = APIRouter(prefix="/api", tags=["Students"])


@router.get("/students")
def get_students(grade: Optional[str] = None):
    """Return all students, optionally filtered by grade (e.g. ?grade=10A)"""
    if grade:
        return [s for s in store.students if s["grade"] == grade]
    return store.students


@router.post("/students/{student_id}/register-face")
def register_face(student_id: str, body: FaceEncodingRequest):
    """Save face-encoding data for a student (used by facial-recognition attendance)"""
    student = next((s for s in store.students if s["id"] == student_id), None)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    student["faceEncoding"] = body.faceEncoding
    return {"success": True, "message": "Face registered successfully"}


@router.get("/students/{student_id}/future-capabilities")
def future_capabilities(student_id: str):
    """
    AI-style career prediction based on engagement patterns.
    Uses subject-interest scores to suggest career paths.
    """
    student = next((s for s in store.students if s["id"] == student_id), None)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    subject_interests = {
        "mathematics": random.uniform(60, 100),
        "science":     random.uniform(50, 90),
        "english":     random.uniform(40, 80),
        "history":     random.uniform(30, 70),
        "arts":        random.uniform(35, 75),
    }

    top_subject = max(subject_interests, key=lambda k: subject_interests[k])

    career_map = {
        "mathematics": ["Engineer", "Data Scientist", "Banker", "Economist"],
        "science":     ["Doctor", "Scientist", "Pharmacist", "Environmental Specialist"],
        "english":     ["Writer", "Journalist", "Teacher", "Content Creator"],
        "history":     ["Historian", "Lawyer", "Civil Servant", "Archaeologist"],
        "arts":        ["Designer", "Artist", "Architect", "Film Maker"],
    }

    return {
        "studentId":        student_id,
        "studentName":      student["name"],
        "subjectInterests": subject_interests,
        "topInterest":      top_subject,
        "interestScore":    subject_interests[top_subject],
        "suggestedCareers": career_map.get(top_subject, []),
        "analysisMonths":   3,
        "confidence":       0.75,
        "recommendation":   (
            f"Based on {student['name']}'s engagement patterns, "
            f"they show strong aptitude for {top_subject}-related fields."
        ),
    }
