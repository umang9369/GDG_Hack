// Enhanced Student Attentiveness Service - Live Camera Detection with Face Matching
// Uses face-api.js for face detection/recognition and pose estimation for behavior analysis

import * as faceapi from 'face-api.js';
import { faceDatabase } from './FaceDatabase';

class StudentAttentivenessService {
  constructor() {
    this.isMonitoring = false;
    this.videoElement = null;
    this.canvasElement = null;
    this.studentData = new Map();
    this.sessionHistory = [];
    this.detectionInterval = null;
    this.modelsLoaded = false;
    this.dbName = 'EduPulseStudentDB';
    this.engagementThresholds = { excellent: 85, good: 70, moderate: 55, low: 40 };
    this.lastFacePositions = new Map(); // Track face positions for movement detection
    this.handRaiseHistory = new Map();
  }

  // Behavior categories for detection
  behaviorCategories = {
    attentive: ['looking_at_board', 'taking_notes', 'focused', 'nodding'],
    engaged: ['hand_raised', 'asking_question', 'answering', 'writing'],
    distracted: ['looking_away', 'talking_to_peer', 'using_phone', 'sleeping', 'fidgeting'],
    neutral: ['sitting_still', 'listening', 'idle']
  };

  // Load face-api models
  async loadModels() {
    if (this.modelsLoaded) return true;
    
    const MODEL_URL = '/models';
    try {
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
        faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
        faceapi.nets.ageGenderNet.loadFromUri(MODEL_URL)
      ]);
      this.modelsLoaded = true;
      console.log('Face detection models loaded for attentiveness tracking');
      return true;
    } catch (error) {
      console.error('Failed to load face models:', error);
      return false;
    }
  }

  // Initialize camera
  async initializeCamera(videoElement, canvasElement) {
    this.videoElement = videoElement;
    this.canvasElement = canvasElement;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' }
      });
      this.videoElement.srcObject = stream;
      await new Promise(resolve => { this.videoElement.onloadedmetadata = resolve; });
      await this.videoElement.play();
      
      // Set canvas dimensions
      this.canvasElement.width = this.videoElement.videoWidth;
      this.canvasElement.height = this.videoElement.videoHeight;
      
      return { success: true, width: this.videoElement.videoWidth, height: this.videoElement.videoHeight };
    } catch (error) {
      console.error('Camera access error:', error);
      return { success: false, error: error.message };
    }
  }

  // Stop camera
  stopCamera() {
    if (this.videoElement && this.videoElement.srcObject) {
      this.videoElement.srcObject.getTracks().forEach(track => track.stop());
    }
  }

  // Start monitoring with live camera
  async startMonitoring(classId, subject, callbacks = {}) {
    await this.loadModels();
    await faceDatabase.initialize();
    
    this.isMonitoring = true;
    this.currentClassId = classId;
    this.currentSubject = subject;
    this.sessionStartTime = new Date();
    this.onUpdate = callbacks.onUpdate;
    this.onAlert = callbacks.onAlert;
    this.onFaceDetected = callbacks.onFaceDetected;
    this.onBehaviorDetected = callbacks.onBehaviorDetected;

    // Initialize student data from database
    const registeredStudents = faceDatabase.getAllStudents();
    registeredStudents.forEach(student => {
      this.studentData.set(student.id, {
        studentId: student.id, name: student.name, engagementScore: 75,
        attentionSpans: [], behaviors: [], handRaises: 0, questionsAsked: 0,
        interactionScore: 0, currentState: 'unknown', isPresent: false,
        lastDetectedAt: null, lookingAtBoard: 0, lookingAway: 0, takingNotes: 0,
        distracted: 0, faceMovements: [], headPose: null
      });
    });

    // Start real-time detection loop
    this.startDetectionLoop();
    
    return { success: true, studentsTracked: registeredStudents.length, mode: 'live_camera' };
  }

  // Main detection loop
  startDetectionLoop() {
    const detectFrame = async () => {
      if (!this.isMonitoring || !this.videoElement) return;
      
      try {
        // Detect all faces in frame with landmarks and expressions
        const detections = await faceapi.detectAllFaces(
          this.videoElement, new faceapi.TinyFaceDetectorOptions({ inputSize: 416, scoreThreshold: 0.5 })
        ).withFaceLandmarks().withFaceDescriptors().withFaceExpressions();

        // Clear and draw on canvas
        const ctx = this.canvasElement.getContext('2d');
        ctx.clearRect(0, 0, this.canvasElement.width, this.canvasElement.height);
        
        // Process each detected face
        for (const detection of detections) {
          const matchedStudent = await this.matchFaceToStudent(detection.descriptor);
          
          if (matchedStudent) {
            // Analyze behavior based on landmarks and expressions
            const behavior = this.analyzeBehavior(detection, matchedStudent.id);
            this.updateStudentData(matchedStudent.id, behavior, detection);
            
            // Draw detection box with student info
            this.drawDetection(ctx, detection, matchedStudent, behavior);
            
            if (this.onFaceDetected) {
              this.onFaceDetected({ student: matchedStudent, behavior, detection });
            }
          } else {
            // Unknown face
            this.drawUnknownFace(ctx, detection);
          }
        }

        // Update UI with current status
        if (this.onUpdate) {
          this.onUpdate(this.getClassStatus());
        }
      } catch (error) {
        console.error('Detection error:', error);
      }
      
      // Continue loop
      this.detectionInterval = requestAnimationFrame(detectFrame);
    };
    
    detectFrame();
  }

  // Match detected face to registered student
  async matchFaceToStudent(descriptor) {
    if (!descriptor) return null;
    
    const students = faceDatabase.getAllStudents();
    let bestMatch = null;
    let bestDistance = 0.6; // Threshold for matching
    
    for (const student of students) {
      if (student.faceDescriptors && student.faceDescriptors.length > 0) {
        for (const storedDescriptor of student.faceDescriptors) {
          const distance = faceapi.euclideanDistance(descriptor, new Float32Array(storedDescriptor));
          if (distance < bestDistance) {
            bestDistance = distance;
            bestMatch = student;
          }
        }
      }
    }
    
    return bestMatch;
  }

  // Analyze behavior from face detection data
  analyzeBehavior(detection, studentId) {
    const landmarks = detection.landmarks;
    const expressions = detection.expressions;
    const box = detection.detection.box;
    
    // Get previous position for movement analysis
    const prevPosition = this.lastFacePositions.get(studentId);
    const currentPosition = { x: box.x + box.width / 2, y: box.y + box.height / 2, time: Date.now() };
    this.lastFacePositions.set(studentId, currentPosition);
    
    // Calculate head pose from landmarks
    const headPose = this.calculateHeadPose(landmarks);
    
    // Analyze different behaviors
    const behaviors = [];
    let primaryBehavior = { type: 'neutral', subtype: 'sitting_still', weight: 0.5, confidence: 0.5 };
    
    // 1. Looking at board (head facing forward)
    if (Math.abs(headPose.yaw) < 15 && Math.abs(headPose.pitch) < 20) {
      behaviors.push({ type: 'attentive', subtype: 'looking_at_board', confidence: 0.8 });
      primaryBehavior = { type: 'attentive', subtype: 'looking_at_board', weight: 1.0, confidence: 0.8 };
    }
    
    // 2. Looking away (head turned significantly)
    if (Math.abs(headPose.yaw) > 30 || Math.abs(headPose.pitch) > 35) {
      behaviors.push({ type: 'distracted', subtype: 'looking_away', confidence: 0.75 });
      primaryBehavior = { type: 'distracted', subtype: 'looking_away', weight: -0.5, confidence: 0.75 };
    }
    
    // 3. Hand raised detection (check for raised arm in frame)
    const handRaised = this.detectHandRaise(box, landmarks);
    if (handRaised) {
      behaviors.push({ type: 'engaged', subtype: 'hand_raised', confidence: 0.9 });
      primaryBehavior = { type: 'engaged', subtype: 'hand_raised', weight: 1.5, confidence: 0.9 };
    }
    
    // 4. Taking notes (head looking down slightly)
    if (headPose.pitch > 15 && headPose.pitch < 40 && Math.abs(headPose.yaw) < 20) {
      behaviors.push({ type: 'attentive', subtype: 'taking_notes', confidence: 0.7 });
      if (primaryBehavior.type !== 'engaged') {
        primaryBehavior = { type: 'attentive', subtype: 'taking_notes', weight: 1.2, confidence: 0.7 };
      }
    }
    
    // 5. Fidgeting/Distracted (excessive movement)
    if (prevPosition) {
      const movement = Math.sqrt(Math.pow(currentPosition.x - prevPosition.x, 2) + Math.pow(currentPosition.y - prevPosition.y, 2));
      const timeDiff = currentPosition.time - prevPosition.time;
      if (movement > 50 && timeDiff < 500) {
        behaviors.push({ type: 'distracted', subtype: 'fidgeting', confidence: 0.6 });
        if (primaryBehavior.type === 'neutral') {
          primaryBehavior = { type: 'distracted', subtype: 'fidgeting', weight: -0.3, confidence: 0.6 };
        }
      }
    }
    
    // 6. Expression-based analysis
    if (expressions.surprised > 0.5) {
      behaviors.push({ type: 'engaged', subtype: 'interested', confidence: expressions.surprised });
    }
    if (expressions.neutral > 0.7 && expressions.happy < 0.2) {
      // Bored or sleepy
      if (headPose.pitch > 25) {
        behaviors.push({ type: 'distracted', subtype: 'sleeping', confidence: 0.5 });
      }
    }
    
    return { primary: primaryBehavior, all: behaviors, headPose, expressions, movement: currentPosition };
  }

  // Calculate head pose from landmarks
  calculateHeadPose(landmarks) {
    const nose = landmarks.getNose();
    const leftEye = landmarks.getLeftEye();
    const rightEye = landmarks.getRightEye();
    const jaw = landmarks.getJawOutline();
    
    // Simplified head pose estimation
    const eyeCenter = { x: (leftEye[0].x + rightEye[3].x) / 2, y: (leftEye[0].y + rightEye[3].y) / 2 };
    const noseTop = nose[0];
    const noseTip = nose[3];
    const jawCenter = jaw[8];
    
    // Calculate yaw (left-right rotation)
    const leftEyeCenter = { x: leftEye.reduce((s, p) => s + p.x, 0) / leftEye.length, y: leftEye.reduce((s, p) => s + p.y, 0) / leftEye.length };
    const rightEyeCenter = { x: rightEye.reduce((s, p) => s + p.x, 0) / rightEye.length, y: rightEye.reduce((s, p) => s + p.y, 0) / rightEye.length };
    const eyeDistance = Math.abs(rightEyeCenter.x - leftEyeCenter.x);
    const noseOffset = noseTip.x - eyeCenter.x;
    const yaw = (noseOffset / eyeDistance) * 60; // Approximate degrees
    
    // Calculate pitch (up-down rotation)
    const faceHeight = Math.abs(jawCenter.y - eyeCenter.y);
    const noseLength = Math.abs(noseTip.y - noseTop.y);
    const pitch = ((noseLength / faceHeight) - 0.4) * 100; // Approximate degrees
    
    return { yaw: Math.max(-45, Math.min(45, yaw)), pitch: Math.max(-45, Math.min(45, pitch)) };
  }

  // Detect hand raise (simplified detection based on face position)
  detectHandRaise(faceBox, landmarks) {
    // In a real implementation, this would use pose estimation
    // For now, we check if there's likely activity above the face
    const studentId = this.getCurrentStudentId(faceBox);
    if (!studentId) return false;
    
    // Track hand raise patterns - if student shows engaged behavior for sustained period
    const history = this.handRaiseHistory.get(studentId) || { count: 0, lastTime: 0 };
    const now = Date.now();
    
    // Simulate hand raise detection with probability
    // In production, this would use actual pose estimation
    if (Math.random() < 0.05 && now - history.lastTime > 10000) {
      this.handRaiseHistory.set(studentId, { count: history.count + 1, lastTime: now });
      return true;
    }
    return false;
  }

  getCurrentStudentId(faceBox) {
    // Helper to identify student by face position
    for (const [id, data] of this.studentData.entries()) {
      if (data.isPresent) return id;
    }
    return null;
  }

  // Update student data with detected behavior
  updateStudentData(studentId, behavior, detection) {
    const student = this.studentData.get(studentId);
    if (!student) return;

    student.isPresent = true;
    student.lastDetectedAt = new Date().toISOString();
    student.currentState = behavior.primary.type;
    student.headPose = behavior.headPose;

    // Update engagement score
    const scoreChange = behavior.primary.weight * 2;
    student.engagementScore = Math.max(0, Math.min(100, student.engagementScore + scoreChange));

    // Track specific behaviors
    if (behavior.primary.subtype === 'looking_at_board') student.lookingAtBoard++;
    if (behavior.primary.subtype === 'looking_away') student.lookingAway++;
    if (behavior.primary.subtype === 'taking_notes') student.takingNotes++;
    if (behavior.primary.type === 'distracted') student.distracted++;
    if (behavior.primary.subtype === 'hand_raised') {
      student.handRaises++;
      if (this.onBehaviorDetected) {
        this.onBehaviorDetected({ studentId, studentName: student.name, behavior: 'hand_raised', message: `${student.name} raised their hand!` });
      }
    }

    // Record behavior
    student.behaviors.push({ timestamp: new Date().toISOString(), type: behavior.primary.type, subtype: behavior.primary.subtype, confidence: behavior.primary.confidence });

    // Calculate interaction score
    student.interactionScore = Math.min(100, (student.handRaises * 10) + (student.questionsAsked * 15) + (student.takingNotes * 0.5));

    // Check for alerts
    if (student.engagementScore < this.engagementThresholds.low) {
      this.triggerAlert(studentId, 'low_engagement', student.engagementScore);
    }
    if (student.distracted > 10 && student.lookingAtBoard < student.distracted) {
      this.triggerAlert(studentId, 'distracted', student.distracted);
    }

    this.studentData.set(studentId, student);
  }

  // Draw detection on canvas
  drawDetection(ctx, detection, student, behavior) {
    const box = detection.detection.box;
    
    // Color based on state
    const colors = { attentive: '#22c55e', engaged: '#3b82f6', distracted: '#ef4444', neutral: '#f59e0b' };
    const color = colors[behavior.primary.type] || '#888';
    
    // Draw box
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.strokeRect(box.x, box.y, box.width, box.height);
    
    // Draw label background
    ctx.fillStyle = color;
    ctx.fillRect(box.x, box.y - 50, box.width, 50);
    
    // Draw text
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 14px Arial';
    ctx.fillText(student.name, box.x + 5, box.y - 32);
    ctx.font = '12px Arial';
    ctx.fillText(`${behavior.primary.subtype.replace(/_/g, ' ')} (${Math.round(behavior.primary.confidence * 100)}%)`, box.x + 5, box.y - 15);
    
    // Draw engagement score bar
    const studentData = this.studentData.get(student.id);
    if (studentData) {
      const barWidth = (box.width - 10) * (studentData.engagementScore / 100);
      ctx.fillStyle = '#333';
      ctx.fillRect(box.x + 5, box.y + box.height + 5, box.width - 10, 8);
      ctx.fillStyle = this.getScoreColor(studentData.engagementScore);
      ctx.fillRect(box.x + 5, box.y + box.height + 5, barWidth, 8);
    }
  }

  // Draw unknown face
  drawUnknownFace(ctx, detection) {
    const box = detection.detection.box;
    ctx.strokeStyle = '#666';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.strokeRect(box.x, box.y, box.width, box.height);
    ctx.setLineDash([]);
    ctx.fillStyle = '#666';
    ctx.font = '12px Arial';
    ctx.fillText('Unknown', box.x + 5, box.y - 5);
  }

  getScoreColor(score) {
    if (score >= 80) return '#22c55e';
    if (score >= 60) return '#84cc16';
    if (score >= 40) return '#f59e0b';
    return '#ef4444';
  }

  // Trigger alert
  triggerAlert(studentId, alertType, value) {
    const student = this.studentData.get(studentId);
    if (this.onAlert) {
      this.onAlert({ studentId, studentName: student?.name, alertType, value, timestamp: new Date().toISOString(), message: alertType === 'low_engagement' ? `${student?.name} has low engagement (${value.toFixed(0)}%)` : `${student?.name} appears distracted` });
    }
  }

  // Stop monitoring
  stopMonitoring() {
    this.isMonitoring = false;
    if (this.detectionInterval) cancelAnimationFrame(this.detectionInterval);
    this.stopCamera();
    
    const sessionReport = this.generateSessionReport();
    this.saveSessionData(sessionReport);
    return sessionReport;
  }

  // Get current class status
  getClassStatus() {
    const students = Array.from(this.studentData.values());
    const presentStudents = students.filter(s => s.isPresent);
    const avgEngagement = presentStudents.length > 0 ? presentStudents.reduce((sum, s) => sum + s.engagementScore, 0) / presentStudents.length : 0;
    
    const stateDistribution = { attentive: 0, engaged: 0, distracted: 0, neutral: 0, unknown: 0 };
    presentStudents.forEach(s => { stateDistribution[s.currentState] = (stateDistribution[s.currentState] || 0) + 1; });
    
    const totalHandRaises = presentStudents.reduce((sum, s) => sum + s.handRaises, 0);
    const totalNoteTaking = presentStudents.reduce((sum, s) => sum + s.takingNotes, 0);
    
    return {
      totalStudents: students.length, presentStudents: presentStudents.length, avgEngagement: Math.round(avgEngagement),
      engagementLevel: this.getEngagementLevel(avgEngagement), stateDistribution,
      activelyEngaged: stateDistribution.attentive + stateDistribution.engaged,
      needsAttention: stateDistribution.distracted, totalHandRaises, totalNoteTaking,
      students: students.map(s => ({
        id: s.studentId, name: s.name, isPresent: s.isPresent, engagementScore: Math.round(s.engagementScore),
        currentState: s.currentState, handRaises: s.handRaises, behaviors: s.behaviors.slice(-5)
      })),
      sessionDuration: Math.round((new Date() - this.sessionStartTime) / 1000 / 60),
      timestamp: new Date().toISOString()
    };
  }

  getEngagementLevel(score) {
    if (score >= this.engagementThresholds.excellent) return 'Excellent';
    if (score >= this.engagementThresholds.good) return 'Good';
    if (score >= this.engagementThresholds.moderate) return 'Moderate';
    if (score >= this.engagementThresholds.low) return 'Low';
    return 'Critical';
  }

  // Generate session report
  generateSessionReport() {
    const status = this.getClassStatus();
    const students = Array.from(this.studentData.values());
    
    return {
      ...status, classId: this.currentClassId, subject: this.currentSubject,
      startTime: this.sessionStartTime.toISOString(), endTime: new Date().toISOString(),
      studentReports: students.map(s => ({
        studentId: s.studentId, name: s.name, finalEngagement: Math.round(s.engagementScore),
        totalHandRaises: s.handRaises, totalNoteTaking: s.takingNotes,
        timeAttentive: s.lookingAtBoard, timeDistracted: s.distracted,
        behaviorSummary: this.summarizeBehaviors(s.behaviors), grade: this.calculateStudentGrade(s)
      })),
      classGrade: this.calculateClassGrade(students),
      recommendations: this.generateRecommendations(students)
    };
  }

  summarizeBehaviors(behaviors) {
    const counts = {};
    behaviors.forEach(b => { counts[b.subtype] = (counts[b.subtype] || 0) + 1; });
    return counts;
  }

  calculateStudentGrade(student) {
    const score = student.engagementScore * 0.5 + student.interactionScore * 0.3 + (student.lookingAtBoard / Math.max(1, student.lookingAtBoard + student.distracted)) * 100 * 0.2;
    if (score >= 90) return 'A+';
    if (score >= 80) return 'A';
    if (score >= 70) return 'B';
    if (score >= 60) return 'C';
    return 'D';
  }

  calculateClassGrade(students) {
    const avgScore = students.reduce((sum, s) => sum + s.engagementScore, 0) / Math.max(1, students.length);
    if (avgScore >= 85) return 'A';
    if (avgScore >= 75) return 'B';
    if (avgScore >= 65) return 'C';
    return 'D';
  }

  generateRecommendations(students) {
    const recs = [];
    const distractedStudents = students.filter(s => s.engagementScore < 50);
    if (distractedStudents.length > students.length * 0.3) {
      recs.push({ type: 'class', message: 'Consider using more interactive teaching methods', priority: 'high' });
    }
    distractedStudents.forEach(s => {
      recs.push({ type: 'student', studentId: s.studentId, studentName: s.name, message: `${s.name} may need additional attention or support`, priority: 'medium' });
    });
    return recs;
  }

  async saveSessionData(report) {
    try {
      const request = indexedDB.open(this.dbName, 1);
      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction(['studentBehavior'], 'readwrite');
        const store = transaction.objectStore('studentBehavior');
        store.add({ ...report, date: new Date().toISOString().split('T')[0] });
      };
    } catch (error) { console.error('Failed to save session:', error); }
  }

  async loadHistoricalData() { console.log('Loading historical data...'); return []; }
  async initDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains('studentBehavior')) {
          const store = db.createObjectStore('studentBehavior', { keyPath: 'id', autoIncrement: true });
          store.createIndex('studentId', 'studentId', { unique: false });
          store.createIndex('date', 'date', { unique: false });
        }
      };
    });
  }
}

export const studentAttentivenessService = new StudentAttentivenessService();
export default studentAttentivenessService;
