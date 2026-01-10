import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Video, Camera, Mic, MicOff, Users, 
  AlertTriangle, TrendingUp, BookOpen, Eye, Hand, Brain, Activity,
  Plus, X, CheckCircle, Star, MessageCircle, Clock, Target
} from 'lucide-react';
import { teacherMonitoringService } from '../services/TeacherMonitoringService';
import { studentAttentivenessService } from '../services/StudentAttentivenessService';
import { attendanceService } from '../services/AttendanceService';
import LiveFaceCamera from '../components/LiveFaceCamera';
import { faceDatabase } from '../services/FaceDatabase';

// Mock student data for demo
const mockStudents = [
  { id: 's1', name: 'Arjun Singh', grade: '10A' },
  { id: 's2', name: 'Neha Gupta', grade: '10A' },
  { id: 's3', name: 'Vikram Reddy', grade: '10A' },
  { id: 's4', name: 'Priya Desai', grade: '10A' },
  { id: 's5', name: 'Ravi Mehta', grade: '10A' },
];

// AI-Powered Attendance Panel Component with Live Face Recognition
const AttendancePanel = ({ onAttendanceUpdate }) => {
  const [showLiveCamera, setShowLiveCamera] = useState(false);

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Camera className="w-6 h-6 text-white" />
            <h3 className="text-lg font-bold text-white">AI Face Attendance</h3>
          </div>
          <button
            onClick={() => setShowLiveCamera(!showLiveCamera)}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              showLiveCamera 
                ? 'bg-red-500 hover:bg-red-600 text-white' 
                : 'bg-white hover:bg-gray-100 text-blue-600'
            }`}
          >
            {showLiveCamera ? 'Close Camera' : 'Open Camera'}
          </button>
        </div>
      </div>
      
      <div className="p-4">
        {showLiveCamera ? (
          <LiveFaceCamera onAttendanceUpdate={onAttendanceUpdate} />
        ) : (
          <div className="text-center py-8">
            <Camera className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-700 mb-2">Face Recognition Attendance</h4>
            <p className="text-gray-500 mb-4">
              Click "Open Camera" to start AI-powered attendance with face detection
            </p>
            <p className="text-sm text-gray-400">
              Registered: Umang, Mayank, Arnab
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

// Legacy Attendance Panel for backup
const LegacyAttendancePanel = ({ onAttendanceUpdate }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [attendance, setAttendance] = useState([]);
  const [scanProgress, setScanProgress] = useState(0);
  const videoRef = useRef(null);
  const [cameraActive, setCameraActive] = useState(false);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user', width: 640, height: 480 } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setCameraActive(true);
      }
    } catch (error) {
      console.log('Camera not available, using simulation mode');
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
    }
    setCameraActive(false);
  };

  const startAttendanceScan = async () => {
    setIsScanning(true);
    setScanProgress(0);
    setAttendance([]);
    
    await startCamera();
    
    const interval = setInterval(() => {
      setScanProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 20;
      });
    }, 500);

    setTimeout(async () => {
      const detected = attendanceService.simulateDetection();
      setAttendance(detected);
      await attendanceService.markAttendance(detected, 'class-10a');
      if (onAttendanceUpdate) onAttendanceUpdate(detected);
      setIsScanning(false);
      stopCamera();
    }, 3000);
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-gray-800 flex items-center">
          <Users className="w-6 h-6 mr-2 text-blue-600" />
          Facial Attendance System
        </h3>
        <span className="text-sm text-gray-500">Offline Capable</span>
      </div>
      
      <div className="relative bg-gray-900 rounded-lg overflow-hidden mb-4" style={{ minHeight: '200px' }}>
        {cameraActive ? (
          <video ref={videoRef} autoPlay playsInline muted className="w-full h-48 object-cover" />
        ) : (
          <div className="w-full h-48 flex items-center justify-center">
            <Camera className="w-16 h-16 text-gray-600" />
          </div>
        )}
        {isScanning && (
          <div className="absolute inset-0 bg-blue-500/20 flex items-center justify-center">
            <div className="text-center text-white">
              <div className="animate-pulse text-lg font-semibold">Scanning Faces...</div>
              <div className="mt-2 bg-white/20 rounded-full h-2 w-32 mx-auto">
                <div className="bg-green-400 h-2 rounded-full transition-all duration-300" style={{ width: `${scanProgress}%` }} />
              </div>
            </div>
          </div>
        )}
      </div>
      
      <button onClick={startAttendanceScan} disabled={isScanning}
        className={`w-full py-3 px-4 rounded-lg font-semibold transition-all duration-300 flex items-center justify-center space-x-2
          ${isScanning ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}>
        <Camera className="w-5 h-5" />
        <span>{isScanning ? 'Scanning...' : 'Start Attendance Scan'}</span>
      </button>
      
      {attendance.length > 0 && (
        <div className="mt-4">
          <h4 className="font-semibold mb-2 text-green-600">✓ {attendance.length} Students Detected</h4>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {attendance.map((student, idx) => (
              <div key={idx} className="flex items-center justify-between bg-green-50 p-2 rounded">
                <span className="font-medium">{student.name}</span>
                <span className="text-sm text-green-600">{(student.confidence * 100).toFixed(0)}% match</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Teacher Monitoring Panel Component with Enhanced Analysis
const TeacherMonitoringPanel = ({ topic, subject, onReportUpdate }) => {
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [report, setReport] = useState(null);

  const startMonitoring = () => {
    teacherMonitoringService.initSpeechRecognition();
    teacherMonitoringService.startMonitoring(topic, subject, {
      onTranscript: (fullTranscript) => setTranscript(fullTranscript),
      onAnalysis: (analysisData) => setAnalysis(analysisData),
      onError: (error) => console.error('Speech error:', error)
    });
    setIsMonitoring(true);
  };

  const stopMonitoring = () => {
    const finalReport = teacherMonitoringService.stopMonitoring();
    setReport(finalReport);
    setIsMonitoring(false);
    if (onReportUpdate) onReportUpdate(finalReport);
  };

  const getStatusColor = (status) => {
    if (status === 'Excellent' || status === 'Exemplary') return 'text-green-600 bg-green-100';
    if (status === 'Good') return 'text-blue-600 bg-blue-100';
    if (status === 'Needs Improvement') return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-gray-800 flex items-center">
          <Mic className="w-6 h-6 mr-2 text-purple-600" />
          Teacher Topic Monitoring
        </h3>
        <span className="text-sm text-gray-500">Works Offline</span>
      </div>
      
      <div className="bg-purple-50 p-3 rounded-lg mb-4">
        <p className="text-sm text-purple-600 font-medium">Expected Topic:</p>
        <p className="text-purple-900">{topic}</p>
      </div>
      
      <button onClick={isMonitoring ? stopMonitoring : startMonitoring}
        className={`w-full py-3 px-4 rounded-lg font-semibold transition-all duration-300 flex items-center justify-center space-x-2
          ${isMonitoring ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-purple-600 hover:bg-purple-700 text-white'}`}>
        {isMonitoring ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        <span>{isMonitoring ? 'Stop Monitoring' : 'Start Voice Monitoring'}</span>
      </button>
      
      {analysis && isMonitoring && (
        <div className="mt-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-medium">On-Topic Score:</span>
            <span className={`px-3 py-1 rounded-full font-bold ${getStatusColor(analysis.status)}`}>{analysis.onTopicPercentage}%</span>
          </div>
          <div className="bg-gray-100 rounded-full h-4 overflow-hidden">
            <div className="h-full bg-gradient-to-r from-green-500 to-green-600 transition-all duration-500" style={{ width: `${analysis.onTopicPercentage}%` }} />
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="bg-green-50 p-2 rounded"><span className="text-green-600">On-Topic:</span> {analysis.onTopicMinutes} min</div>
            <div className="bg-red-50 p-2 rounded"><span className="text-red-600">Off-Topic:</span> {analysis.offTopicMinutes} min</div>
          </div>
          
          {/* Enhanced Teaching Metrics */}
          {analysis.teachingMetrics && (
            <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-3 rounded-lg mt-3">
              <h5 className="font-semibold text-purple-800 mb-2 flex items-center">
                <Star className="w-4 h-4 mr-1" />Teaching Quality Metrics
              </h5>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex justify-between items-center">
                  <span>Clarity</span>
                  <div className="w-20 bg-gray-200 rounded-full h-2">
                    <div className="h-2 bg-purple-500 rounded-full" style={{ width: `${analysis.teachingMetrics.clarity}%` }} />
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span>Engagement</span>
                  <div className="w-20 bg-gray-200 rounded-full h-2">
                    <div className="h-2 bg-blue-500 rounded-full" style={{ width: `${analysis.teachingMetrics.engagement}%` }} />
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span>Pacing</span>
                  <div className="w-20 bg-gray-200 rounded-full h-2">
                    <div className="h-2 bg-green-500 rounded-full" style={{ width: `${analysis.teachingMetrics.pacing}%` }} />
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span>Examples</span>
                  <div className="w-20 bg-gray-200 rounded-full h-2">
                    <div className="h-2 bg-orange-500 rounded-full" style={{ width: `${analysis.teachingMetrics.exampleUsage}%` }} />
                  </div>
                </div>
              </div>
              <div className="flex gap-4 mt-2 text-xs text-gray-600">
                <span className="flex items-center"><MessageCircle className="w-3 h-3 mr-1" />Questions: {analysis.questionsAsked || 0}</span>
                <span className="flex items-center"><Target className="w-3 h-3 mr-1" />Examples: {analysis.examplesGiven || 0}</span>
                <span className="flex items-center"><Clock className="w-3 h-3 mr-1" />{analysis.wordsPerMinute || 0} WPM</span>
              </div>
            </div>
          )}
        </div>
      )}
      
      {transcript && (
        <div className="mt-4">
          <h4 className="font-semibold mb-2">Live Transcript:</h4>
          <div className="bg-gray-50 p-3 rounded-lg max-h-32 overflow-y-auto text-sm text-gray-700">{transcript}</div>
        </div>
      )}
      
      {report && !isMonitoring && (
        <div className="mt-4 bg-gradient-to-r from-purple-50 to-blue-50 p-4 rounded-lg">
          <h4 className="font-bold text-lg mb-2">Session Report</h4>
          <p><strong>Grade:</strong> <span className="text-2xl font-bold text-purple-600">{report.grade}</span></p>
          <p><strong>Status:</strong> {report.status}</p>
          <p><strong>Duration:</strong> {report.totalDuration} minutes</p>
          
          {/* Strengths */}
          {report.strengths?.length > 0 && (
            <div className="mt-3 bg-green-50 p-3 rounded-lg">
              <h5 className="font-semibold text-green-700 flex items-center"><CheckCircle className="w-4 h-4 mr-1" />Strengths</h5>
              <ul className="list-disc list-inside text-sm text-green-600">
                {report.strengths.map((s, i) => <li key={i}>{s}</li>)}
              </ul>
            </div>
          )}
          
          {/* Improvements */}
          {report.improvements?.length > 0 && (
            <div className="mt-2 bg-yellow-50 p-3 rounded-lg">
              <h5 className="font-semibold text-yellow-700">Areas for Improvement</h5>
              <ul className="list-disc list-inside text-sm text-yellow-600">
                {report.improvements.map((s, i) => <li key={i}>{s}</li>)}
              </ul>
            </div>
          )}
          
          {report.suggestions?.length > 0 && (
            <div className="mt-3">
              <h5 className="font-semibold">Actionable Suggestions:</h5>
              <ul className="list-disc list-inside text-sm text-gray-600">
                {report.suggestions.map((s, i) => (
                  <li key={i} className={`${s.priority === 'high' ? 'text-red-600' : ''}`}>
                    <strong>[{s.type}]</strong> {s.message}
                    {s.action && <span className="block text-xs text-gray-500 ml-5">→ {s.action}</span>}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Student Attentiveness Panel Component with Live Camera
const StudentAttentivenessPanel = ({ students, onStatusUpdate }) => {
  const [isTracking, setIsTracking] = useState(false);
  const [classStatus, setClassStatus] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [cameraReady, setCameraReady] = useState(false);
  const [behaviorEvents, setBehaviorEvents] = useState([]);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const startTracking = async () => {
    // Initialize camera for live detection
    if (videoRef.current && canvasRef.current) {
      const cameraResult = await studentAttentivenessService.initializeCamera(videoRef.current, canvasRef.current);
      if (cameraResult.success) {
        setCameraReady(true);
      }
    }
    
    await studentAttentivenessService.startMonitoring('class-10a', 'mathematics', {
      onUpdate: (status) => { setClassStatus(status); if (onStatusUpdate) onStatusUpdate(status); },
      onAlert: (alert) => setAlerts(prev => [alert, ...prev].slice(0, 5)),
      onFaceDetected: (data) => {
        // Face detection callback
      },
      onBehaviorDetected: (event) => {
        setBehaviorEvents(prev => [event, ...prev].slice(0, 10));
      }
    });
    setIsTracking(true);
  };

  const stopTracking = () => {
    studentAttentivenessService.stopMonitoring();
    setIsTracking(false);
    setCameraReady(false);
  };

  const getEngagementColor = (score) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-blue-500';
    if (score >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getStateIcon = (state) => {
    if (state === 'attentive') return <Eye className="w-4 h-4 text-green-500" />;
    if (state === 'engaged') return <Hand className="w-4 h-4 text-blue-500" />;
    if (state === 'distracted') return <AlertTriangle className="w-4 h-4 text-red-500" />;
    return <Activity className="w-4 h-4 text-gray-500" />;
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-gray-800 flex items-center">
          <Brain className="w-6 h-6 mr-2 text-green-600" />
          Student Attentiveness Tracking
        </h3>
        <span className="text-sm text-gray-500">{isTracking ? 'Live Camera' : 'ML Powered'}</span>
      </div>
      
      {/* Live Camera Feed */}
      <div className="relative bg-gray-900 rounded-lg overflow-hidden mb-4" style={{ minHeight: isTracking ? '240px' : '100px' }}>
        <video ref={videoRef} autoPlay playsInline muted className={`w-full object-cover ${isTracking ? 'h-60' : 'h-24 opacity-30'}`} />
        <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full" style={{ display: isTracking ? 'block' : 'none' }} />
        {!isTracking && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-gray-400">
              <Eye className="w-10 h-10 mx-auto mb-2" />
              <p className="text-sm">Camera will detect students & track attention</p>
            </div>
          </div>
        )}
        {isTracking && cameraReady && (
          <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded-full text-xs flex items-center">
            <span className="w-2 h-2 bg-white rounded-full mr-1 animate-pulse"></span>LIVE
          </div>
        )}
      </div>
      
      <button onClick={isTracking ? stopTracking : startTracking}
        className={`w-full py-3 px-4 rounded-lg font-semibold transition-all duration-300 flex items-center justify-center space-x-2
          ${isTracking ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-green-600 hover:bg-green-700 text-white'}`}>
        <Eye className="w-5 h-5" />
        <span>{isTracking ? 'Stop Tracking' : 'Start Live Behavior Tracking'}</span>
      </button>
      
      {/* Behavior Events Feed */}
      {behaviorEvents.length > 0 && (
        <div className="mt-3 max-h-20 overflow-y-auto">
          {behaviorEvents.slice(0, 3).map((event, idx) => (
            <div key={idx} className="text-xs bg-blue-50 text-blue-700 p-1 rounded mb-1 flex items-center">
              <Hand className="w-3 h-3 mr-1" />{event.message}
            </div>
          ))}
        </div>
      )}
      
      {classStatus && (
        <div className="mt-4 space-y-4">
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-green-50 p-3 rounded-lg text-center">
              <p className="text-2xl font-bold text-green-600">{classStatus.stateDistribution?.attentive || classStatus.attentiveCount || 0}</p>
              <p className="text-xs text-green-700">Attentive</p>
            </div>
            <div className="bg-yellow-50 p-3 rounded-lg text-center">
              <p className="text-2xl font-bold text-yellow-600">{classStatus.stateDistribution?.neutral || classStatus.neutralCount || 0}</p>
              <p className="text-xs text-yellow-700">Neutral</p>
            </div>
            <div className="bg-red-50 p-3 rounded-lg text-center">
              <p className="text-2xl font-bold text-red-600">{classStatus.stateDistribution?.distracted || classStatus.distractedCount || 0}</p>
              <p className="text-xs text-red-700">Distracted</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="bg-blue-50 p-2 rounded text-center">
              <Hand className="w-4 h-4 mx-auto text-blue-500" />
              <p className="font-bold text-blue-600">{classStatus.totalHandRaises || 0}</p>
              <p className="text-xs text-blue-700">Hand Raises</p>
            </div>
            <div className="bg-purple-50 p-2 rounded text-center">
              <BookOpen className="w-4 h-4 mx-auto text-purple-500" />
              <p className="font-bold text-purple-600">{classStatus.totalNoteTaking || 0}</p>
              <p className="text-xs text-purple-700">Taking Notes</p>
            </div>
          </div>
          
          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <span className="font-medium text-blue-800">Class Engagement</span>
              <span className="font-bold text-blue-600">{classStatus.avgEngagement || classStatus.averageEngagement?.toFixed(0) || 0}%</span>
            </div>
            <div className="bg-blue-200 rounded-full h-3 overflow-hidden">
              <div className="h-full bg-blue-600 transition-all duration-500" style={{ width: `${classStatus.avgEngagement || classStatus.averageEngagement || 0}%` }} />
            </div>
            <p className="text-xs text-blue-700 mt-1">Level: {classStatus.engagementLevel || 'N/A'}</p>
          </div>
          
          <div className="max-h-48 overflow-y-auto space-y-2">
            {(classStatus.students || []).map((student) => (
              <div key={student.id} className="flex items-center justify-between bg-gray-50 p-2 rounded-lg">
                <div className="flex items-center space-x-2">
                  {getStateIcon(student.currentState || student.state)}
                  <div>
                    <span className="font-medium text-sm">{student.name}</span>
                    {student.isPresent && <span className="ml-1 text-xs text-green-500">●</span>}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {student.handRaises > 0 && (
                    <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded">🖐 {student.handRaises}</span>
                  )}
                  <div className="w-16 bg-gray-200 rounded-full h-2">
                    <div className={`h-2 rounded-full ${getEngagementColor(student.engagementScore || student.engagement)}`} style={{ width: `${student.engagementScore || student.engagement}%` }} />
                  </div>
                  <span className="text-xs font-medium w-8">{(student.engagementScore || student.engagement)?.toFixed(0)}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {alerts.length > 0 && (
        <div className="mt-4">
          <h4 className="font-semibold text-red-600 mb-2">⚠️ Alerts</h4>
          <div className="space-y-1 max-h-24 overflow-y-auto">
            {alerts.map((alert, idx) => (
              <div key={idx} className="text-sm bg-red-50 text-red-700 p-2 rounded">{alert.message}</div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Main Classroom Monitor Component
export const ClassroomMonitor = () => {
  const navigate = useNavigate();
  const [selectedTopic, setSelectedTopic] = useState('Quadratic Equations');
  const [selectedSubject, setSelectedSubject] = useState('Mathematics');
  const [attendanceData, setAttendanceData] = useState([]);
  const [teacherReport, setTeacherReport] = useState(null);
  const [studentStatus, setStudentStatus] = useState(null);
  const [showCustomTopicModal, setShowCustomTopicModal] = useState(false);
  const [customTopicName, setCustomTopicName] = useState('');
  const [customKeywords, setCustomKeywords] = useState('');
  const [allTopics, setAllTopics] = useState({});

  // Comprehensive topics database - expanded from TeacherMonitoringService
  const defaultTopics = {
    Mathematics: ['Quadratic Equations', 'Linear Equations', 'Trigonometry', 'Algebra', 'Geometry', 'Calculus', 'Statistics', 'Matrices'],
    Science: ['Photosynthesis', 'Newton Laws', 'Atoms', 'Chemical Reactions', 'Electricity', 'Magnetism', 'Biology', 'Human Body'],
    English: ['Grammar', 'Literature', 'Writing Skills', 'Comprehension', 'Poetry'],
    History: ['Independence Movement', 'Ancient India', 'World Wars', 'Medieval India'],
    Geography: ['Climate', 'Landforms', 'Maps'],
    'Computer Science': ['Programming Basics', 'Data Structures', 'Web Development', 'Artificial Intelligence'],
    Economics: ['Microeconomics', 'Macroeconomics']
  };

  // Load topics including custom ones
  useEffect(() => {
    teacherMonitoringService.loadCustomTopics?.();
    const serviceTopics = teacherMonitoringService.getAllTopics?.() || {};
    setAllTopics({ ...defaultTopics, ...serviceTopics });
  }, []);

  const topics = Object.keys(allTopics).length > 0 ? allTopics : defaultTopics;

  // Add custom topic
  const handleAddCustomTopic = () => {
    if (!customTopicName.trim()) return;
    
    const keywords = customKeywords.split(',').map(k => k.trim().toLowerCase()).filter(k => k);
    if (keywords.length === 0) {
      keywords.push(...customTopicName.toLowerCase().split(' '));
    }
    
    const result = teacherMonitoringService.addCustomTopic?.(selectedSubject, customTopicName, keywords);
    
    if (result?.success) {
      // Update local state
      const updatedTopics = { ...topics };
      if (!updatedTopics[selectedSubject]) updatedTopics[selectedSubject] = [];
      if (!updatedTopics[selectedSubject].includes(customTopicName)) {
        updatedTopics[selectedSubject].push(customTopicName);
      }
      setAllTopics(updatedTopics);
      setSelectedTopic(customTopicName);
      setShowCustomTopicModal(false);
      setCustomTopicName('');
      setCustomKeywords('');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <header className="bg-white shadow-md sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <button onClick={() => navigate('/')} className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 font-semibold">
              <ArrowLeft className="w-5 h-5" /><span>Back to Main Menu</span>
            </button>
            <h1 className="text-2xl font-bold text-gray-900">Live Classroom Monitor</h1>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-700">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>Live
            </span>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-xl shadow-lg p-4 mb-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-48">
              <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
              <select value={selectedSubject} onChange={(e) => { setSelectedSubject(e.target.value); setSelectedTopic(topics[e.target.value]?.[0] || ''); }}
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
                {Object.keys(topics).map(subject => <option key={subject} value={subject}>{subject}</option>)}
              </select>
            </div>
            <div className="flex-1 min-w-48">
              <label className="block text-sm font-medium text-gray-700 mb-1">Today's Topic</label>
              <select value={selectedTopic} onChange={(e) => setSelectedTopic(e.target.value)}
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
                {(topics[selectedSubject] || []).map(topic => <option key={topic} value={topic}>{topic}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">&nbsp;</label>
              <button onClick={() => setShowCustomTopicModal(true)} className="flex items-center gap-1 px-3 py-2 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition">
                <Plus className="w-4 h-4" />Add Topic
              </button>
            </div>
            <div className="bg-blue-100 px-4 py-2 rounded-lg">
              <span className="text-sm text-blue-600">Class: </span><span className="font-bold text-blue-800">10A</span>
            </div>
          </div>
        </div>

        {/* Custom Topic Modal */}
        {showCustomTopicModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-gray-800">Add Custom Topic</h3>
                <button onClick={() => setShowCustomTopicModal(false)} className="text-gray-500 hover:text-gray-700">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                  <input type="text" value={selectedSubject} readOnly className="w-full p-2 border rounded-lg bg-gray-50" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Topic Name</label>
                  <input type="text" value={customTopicName} onChange={(e) => setCustomTopicName(e.target.value)}
                    placeholder="e.g., Machine Learning Basics" className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Keywords (comma-separated)</label>
                  <input type="text" value={customKeywords} onChange={(e) => setCustomKeywords(e.target.value)}
                    placeholder="e.g., neural network, algorithm, model, training" className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500" />
                  <p className="text-xs text-gray-500 mt-1">Keywords help detect if teacher is on-topic</p>
                </div>
                <button onClick={handleAddCustomTopic} className="w-full py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium">
                  Add Topic
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          <AttendancePanel onAttendanceUpdate={setAttendanceData} />
          <TeacherMonitoringPanel topic={selectedTopic} subject={selectedSubject} onReportUpdate={setTeacherReport} />
          <StudentAttentivenessPanel students={mockStudents} onStatusUpdate={setStudentStatus} />
        </div>

        <div className="mt-6 bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
            <TrendingUp className="w-6 h-6 mr-2 text-indigo-600" />Session Summary
          </h3>
          <div className="grid md:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-4 rounded-xl text-white">
              <Users className="w-8 h-8 mb-2 opacity-80" />
              <p className="text-3xl font-bold">{attendanceData.length || 0}</p>
              <p className="text-sm opacity-80">Students Present</p>
            </div>
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-4 rounded-xl text-white">
              <BookOpen className="w-8 h-8 mb-2 opacity-80" />
              <p className="text-3xl font-bold">{teacherReport?.onTopicPercentage || '--'}%</p>
              <p className="text-sm opacity-80">On-Topic Teaching</p>
            </div>
            <div className="bg-gradient-to-br from-green-500 to-green-600 p-4 rounded-xl text-white">
              <Eye className="w-8 h-8 mb-2 opacity-80" />
              <p className="text-3xl font-bold">{studentStatus?.averageEngagement?.toFixed(0) || '--'}%</p>
              <p className="text-sm opacity-80">Avg Engagement</p>
            </div>
            <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-4 rounded-xl text-white">
              <Hand className="w-8 h-8 mb-2 opacity-80" />
              <p className="text-3xl font-bold">{studentStatus?.students?.reduce((sum, s) => sum + s.handRaises, 0) || 0}</p>
              <p className="text-sm opacity-80">Hand Raises</p>
            </div>
          </div>
        </div>

        <div className="mt-6 bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">How This System Works</h3>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="border-l-4 border-blue-500 pl-4">
              <h4 className="font-semibold text-blue-600 mb-2">📷 Facial Attendance</h4>
              <p className="text-gray-600 text-sm">Uses the classroom camera to detect and recognize student faces. Automatically marks attendance. <strong className="text-blue-600">Works completely offline.</strong></p>
            </div>
            <div className="border-l-4 border-purple-500 pl-4">
              <h4 className="font-semibold text-purple-600 mb-2">🎤 Teacher Monitoring</h4>
              <p className="text-gray-600 text-sm">Captures teacher's speech and analyzes it against the expected curriculum topic. <strong className="text-purple-600">Works offline using Web Speech API.</strong></p>
            </div>
            <div className="border-l-4 border-green-500 pl-4">
              <h4 className="font-semibold text-green-600 mb-2">🧠 Student Tracking</h4>
              <p className="text-gray-600 text-sm">ML-powered behavior detection tracks attention levels and participation. <strong className="text-green-600">Predicts career paths based on interests.</strong></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
