// LiveFaceCamera.jsx - ENHANCED Real-time face detection with name overlay
import React, { useRef, useState, useEffect, useCallback } from 'react';
import { 
  Camera, Users, UserCheck, UserX, AlertCircle, 
  Loader, Video, VideoOff, RefreshCw, Upload,
  CheckCircle, XCircle, Clock, Scan, Eye
} from 'lucide-react';
import { faceRecognitionService } from '../services/FaceRecognitionService';
import { faceDatabase } from '../services/FaceDatabase';

const LiveFaceCamera = ({ onAttendanceUpdate }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isModelLoading, setIsModelLoading] = useState(true);
  const [modelError, setModelError] = useState(null);
  const [detectedFaces, setDetectedFaces] = useState([]);
  const [presentStudents, setPresentStudents] = useState([]);
  const [absentStudents, setAbsentStudents] = useState([]);
  const [stats, setStats] = useState({ total: 0, present: 0, absent: 0, percentage: 0 });
  const [isDetecting, setIsDetecting] = useState(false);
  const detectionInterval = useRef(null);
  
  // ENHANCED: Detection status
  const [detectionStatus, setDetectionStatus] = useState(null);
  const [recognitionMode, setRecognitionMode] = useState('loading'); // 'loading', 'real', 'simulation'

  // Initialize face recognition
  useEffect(() => {
    initializeFaceRecognition();
    
    // Listen for attendance changes
    const handleAttendanceChange = (event) => {
      updateAttendanceDisplay();
      if (onAttendanceUpdate) {
        onAttendanceUpdate(event.detail);
      }
    };
    
    window.addEventListener('attendanceChange', handleAttendanceChange);
    
    return () => {
      window.removeEventListener('attendanceChange', handleAttendanceChange);
      stopCamera();
      if (detectionInterval.current) {
        clearInterval(detectionInterval.current);
      }
    };
  }, []);

  const initializeFaceRecognition = async () => {
    setIsModelLoading(true);
    setModelError(null);
    setRecognitionMode('loading');
    
    try {
      // Initialize database first
      await faceDatabase.initialize();
      
      // Load face-api models
      const success = await faceRecognitionService.loadModels();
      
      if (success) {
        setIsModelLoading(false);
        updateAttendanceDisplay();
        
        // ENHANCED: Check detection status
        const status = faceRecognitionService.getDetectionStatus();
        setDetectionStatus(status);
        setRecognitionMode(status.useSimulation ? 'simulation' : 'real');
        
        console.log('Face recognition status:', status);
      } else {
        throw new Error('Failed to load face recognition models');
      }
    } catch (error) {
      console.error('Initialization error:', error);
      setModelError(error.message);
      setIsModelLoading(false);
      setRecognitionMode('simulation');
    }
  };

  const updateAttendanceDisplay = () => {
    const attendanceData = faceRecognitionService.getAttendanceData();
    setPresentStudents(attendanceData.present);
    setAbsentStudents(attendanceData.absent);
    setStats(attendanceData.stats);
  };

  // Start camera
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        }
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setIsStreaming(true);
        
        // Start face detection loop
        startDetection();
      }
    } catch (error) {
      console.error('Camera error:', error);
      setModelError('Camera access denied. Please allow camera access.');
    }
  };

  // Stop camera
  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsStreaming(false);
    setIsDetecting(false);
    
    if (detectionInterval.current) {
      clearInterval(detectionInterval.current);
      detectionInterval.current = null;
    }
  };

  // Start face detection loop
  const startDetection = () => {
    if (detectionInterval.current) return;
    
    setIsDetecting(true);
    
    detectionInterval.current = setInterval(async () => {
      if (videoRef.current && canvasRef.current && isStreaming) {
        const faces = await faceRecognitionService.detectFaces(
          videoRef.current, 
          canvasRef.current
        );
        setDetectedFaces(faces);
        updateAttendanceDisplay();
      }
    }, 200); // Detect every 200ms
  };

  // Toggle camera
  const toggleCamera = () => {
    if (isStreaming) {
      stopCamera();
    } else {
      startCamera();
    }
  };

  // Render loading state
  if (isModelLoading) {
    return (
      <div className="bg-gray-900 rounded-2xl p-8 flex flex-col items-center justify-center min-h-[500px]">
        <Loader className="w-16 h-16 text-blue-500 animate-spin mb-4" />
        <h3 className="text-xl text-white font-semibold mb-2">Loading Face Recognition</h3>
        <p className="text-gray-400 text-center">
          Initializing AI models and loading registered faces...
        </p>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 rounded-2xl overflow-hidden">
      {/* Header - ENHANCED with detection mode indicator */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Camera className="w-6 h-6 text-white" />
            <h2 className="text-xl font-bold text-white">Live Face Recognition</h2>
          </div>
          <div className="flex items-center gap-3">
            {/* ENHANCED: Detection mode indicator */}
            <span className={`flex items-center gap-2 text-sm px-3 py-1 rounded-full ${
              recognitionMode === 'real' 
                ? 'bg-green-500/30 text-green-300' 
                : recognitionMode === 'simulation'
                ? 'bg-yellow-500/30 text-yellow-300'
                : 'bg-gray-500/30 text-gray-300'
            }`}>
              {recognitionMode === 'real' ? (
                <>
                  <Eye className="w-4 h-4" />
                  Live AI Detection
                </>
              ) : recognitionMode === 'simulation' ? (
                <>
                  <Scan className="w-4 h-4" />
                  Demo Mode
                </>
              ) : (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  Loading...
                </>
              )}
            </span>
            
            {isDetecting && (
              <span className="flex items-center gap-2 text-green-300 text-sm">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                AI Active
              </span>
            )}
            <button
              onClick={toggleCamera}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                isStreaming
                  ? 'bg-red-500 hover:bg-red-600 text-white'
                  : 'bg-green-500 hover:bg-green-600 text-white'
              }`}
            >
              {isStreaming ? (
                <>
                  <VideoOff className="w-5 h-5" />
                  Stop Camera
                </>
              ) : (
                <>
                  <Video className="w-5 h-5" />
                  Start Camera
                </>
              )}
            </button>
          </div>
        </div>
        
        {/* ENHANCED: Detection status info */}
        {detectionStatus && (
          <div className="mt-3 flex items-center gap-4 text-sm text-white/70">
            <span>📊 {detectionStatus.registeredStudents} students registered</span>
            <span>🔍 {detectionStatus.faceDescriptorsLoaded} faces loaded</span>
            {!detectionStatus.useSimulation && <span className="text-green-300">✓ Real-time detection active</span>}
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="p-6">
        {modelError && (
          <div className="mb-4 p-4 bg-red-500/20 border border-red-500 rounded-lg flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <span className="text-red-400">{modelError}</span>
            <button
              onClick={initializeFaceRecognition}
              className="ml-auto flex items-center gap-2 text-red-400 hover:text-red-300"
            >
              <RefreshCw className="w-4 h-4" />
              Retry
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          {/* Camera Feed - ENLARGED for better visibility */}
          <div className="xl:col-span-3">
            <div className="relative bg-black rounded-2xl overflow-hidden" style={{ minHeight: '500px', aspectRatio: '16/9' }}>
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                style={{ minHeight: '500px' }}
                playsInline
                muted
              />
              <canvas
                ref={canvasRef}
                className="absolute inset-0 w-full h-full"
                style={{ minHeight: '500px' }}
              />
              
              {!isStreaming && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900" style={{ minHeight: '500px' }}>
                  <div className="text-center">
                    <div className="w-32 h-32 mx-auto mb-6 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center border-2 border-dashed border-gray-600">
                      <Camera className="w-16 h-16 text-gray-500" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2">AI Face Recognition</h3>
                    <p className="text-gray-400 text-lg mb-6 max-w-md">
                      Start the camera to automatically detect and identify registered students
                    </p>
                    <button
                      onClick={startCamera}
                      className="flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl font-semibold text-lg shadow-lg transform hover:scale-105 transition-all mx-auto"
                    >
                      <Video className="w-6 h-6" />
                      Start Camera
                    </button>
                  </div>
                </div>
              )}

              {/* Live Stats Overlay - ENHANCED */}
              {isStreaming && (
                <div className="absolute top-6 left-6 flex gap-4">
                  <div className="bg-black/80 backdrop-blur-md px-4 py-3 rounded-xl flex items-center gap-3 shadow-lg">
                    <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                    <span className="text-white font-medium">LIVE</span>
                  </div>
                  <div className="bg-black/80 backdrop-blur-md px-4 py-3 rounded-xl flex items-center gap-3 shadow-lg">
                    <Users className="w-5 h-5 text-blue-400" />
                    <span className="text-white text-lg font-bold">
                      {detectedFaces.length}
                    </span>
                    <span className="text-gray-300">faces</span>
                  </div>
                  <div className="bg-black/80 backdrop-blur-md px-4 py-3 rounded-xl flex items-center gap-3 shadow-lg">
                    <UserCheck className="w-5 h-5 text-green-400" />
                    <span className="text-white text-lg font-bold">
                      {stats.present}
                    </span>
                    <span className="text-gray-300">present</span>
                  </div>
                </div>
              )}
            </div>

            {/* Detected Faces List - ENHANCED */}
            {detectedFaces.length > 0 && (
              <div className="mt-4 p-5 bg-gray-800/80 backdrop-blur rounded-xl border border-gray-700">
                <h4 className="text-white font-semibold text-lg mb-4 flex items-center gap-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  <Users className="w-5 h-5 text-blue-400" />
                  Currently Detected ({detectedFaces.length})
                </h4>
                <div className="flex flex-wrap gap-3">
                  {detectedFaces.map((face, idx) => (
                    <span
                      key={idx}
                      className={`px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 ${
                        face.isRecognized
                          ? 'bg-gradient-to-r from-green-500/30 to-emerald-500/30 text-green-300 border border-green-500/50'
                          : 'bg-gradient-to-r from-red-500/30 to-orange-500/30 text-red-300 border border-red-500/50'
                      }`}
                    >
                      {face.isRecognized ? (
                        <>
                          <CheckCircle className="w-5 h-5" />
                          {face.name}
                          <span className="text-green-400/70 text-xs ml-1">
                            {Math.round((face.confidence || 0) * 100)}%
                          </span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-5 h-5" />
                          Unknown Person
                        </>
                      )}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Attendance Panel - Compact for sidebar */}
          <div className="space-y-4">
            {/* Stats Cards - Compact */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-4 rounded-xl">
                <Users className="w-8 h-8 text-blue-200 mb-2" />
                <div className="text-3xl font-bold text-white">{stats.total}</div>
                <div className="text-blue-200 text-sm">Total Students</div>
              </div>
              <div className="bg-gradient-to-br from-green-600 to-green-700 p-4 rounded-xl">
                <UserCheck className="w-8 h-8 text-green-200 mb-2" />
                <div className="text-3xl font-bold text-white">{stats.present}</div>
                <div className="text-green-200 text-sm">Present</div>
              </div>
              <div className="bg-gradient-to-br from-red-600 to-red-700 p-4 rounded-xl">
                <UserX className="w-8 h-8 text-red-200 mb-2" />
                <div className="text-3xl font-bold text-white">{stats.absent}</div>
                <div className="text-red-200 text-sm">Absent</div>
              </div>
              <div className="bg-gradient-to-br from-purple-600 to-purple-700 p-4 rounded-xl">
                <CheckCircle className="w-8 h-8 text-purple-200 mb-2" />
                <div className="text-3xl font-bold text-white">{stats.percentage}%</div>
                <div className="text-purple-200 text-sm">Attendance</div>
              </div>
            </div>

            {/* Present Students */}
            <div className="bg-gray-800 rounded-xl p-4">
              <h4 className="text-white font-medium mb-3 flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-green-400" />
                Present Students ({presentStudents.length})
              </h4>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {presentStudents.length === 0 ? (
                  <p className="text-gray-500 text-sm py-4 text-center">
                    No students marked present yet
                  </p>
                ) : (
                  presentStudents.map((student) => (
                    <div
                      key={student.id}
                      className="flex items-center justify-between p-2 bg-green-500/10 rounded-lg border border-green-500/30"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                          {student.name.charAt(0)}
                        </div>
                        <div>
                          <div className="text-white text-sm font-medium">{student.name}</div>
                          <div className="text-gray-400 text-xs">{student.grade}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-green-400 text-xs">
                        <Clock className="w-3 h-3" />
                        {student.attendanceData?.firstSeen 
                          ? new Date(student.attendanceData.firstSeen).toLocaleTimeString()
                          : 'Now'
                        }
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Absent Students */}
            <div className="bg-gray-800 rounded-xl p-4">
              <h4 className="text-white font-medium mb-3 flex items-center gap-2">
                <UserX className="w-5 h-5 text-red-400" />
                Absent Students ({absentStudents.length})
              </h4>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {absentStudents.length === 0 ? (
                  <p className="text-gray-500 text-sm py-4 text-center">
                    All students are present! 🎉
                  </p>
                ) : (
                  absentStudents.map((student) => (
                    <div
                      key={student.id}
                      className="flex items-center justify-between p-2 bg-red-500/10 rounded-lg border border-red-500/30"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                          {student.name.charAt(0)}
                        </div>
                        <div>
                          <div className="text-white text-sm font-medium">{student.name}</div>
                          <div className="text-gray-400 text-xs">{student.grade}</div>
                        </div>
                      </div>
                      <span className="text-red-400 text-xs">Not detected</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveFaceCamera;
