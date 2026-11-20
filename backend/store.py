# store.py — Shared in-memory data store (replaces the JS arrays in server.js)
from typing import List, Dict, Any

attendance_records: List[Dict[str, Any]] = []
teacher_sessions: List[Dict[str, Any]] = []
student_behavior: List[Dict[str, Any]] = []
alerts: List[Dict[str, Any]] = []

students: List[Dict[str, Any]] = [
    {"id": "s1", "name": "Arjun Singh",   "grade": "10A", "faceEncoding": None},
    {"id": "s2", "name": "Neha Gupta",    "grade": "10A", "faceEncoding": None},
    {"id": "s3", "name": "Vikram Reddy",  "grade": "10A", "faceEncoding": None},
    {"id": "s4", "name": "Priya Desai",   "grade": "10A", "faceEncoding": None},
    {"id": "s5", "name": "Ravi Mehta",    "grade": "10A", "faceEncoding": None},
    {"id": "s6", "name": "Anjali Sharma", "grade": "10B", "faceEncoding": None},
    {"id": "s7", "name": "Karan Patel",   "grade": "10B", "faceEncoding": None},
]
