// Enhanced Teacher Monitoring Service - LIVE Speech Recognition
// Real-time analysis with Gemini AI for accurate topic detection

import { geminiAnalysisService } from './GeminiAnalysisService';

class TeacherMonitoringService {
  constructor() {
    this.recognition = null;
    this.isListening = false;
    this.transcript = '';
    this.currentTopic = '';
    this.currentSubject = '';
    this.sessionData = [];
    this.onTopicScore = 0;
    this.offTopicSegments = [];
    this.onTopicSegments = [];
    this.suggestions = [];
    this.customTopics = {};
    this.sessionStartTime = null;
    this.wordCount = 0;
    this.questionCount = 0;
    this.exampleCount = 0;
    this.onTopicTime = 0;
    this.offTopicTime = 0;
    this.lastSegmentTime = null;
    this.liveStatus = 'waiting'; // 'waiting', 'on-topic', 'off-topic'
    this.mode = 'waiting'; // 'live', 'simulation', 'waiting'
    this.pendingAnalysis = null; // For async AI analysis
    this.analysisBuffer = ''; // Buffer for batching analysis
    this.lastAnalysisTime = 0;
    this.teachingMetrics = {
      clarity: 70,
      engagement: 70,
      pacing: 70,
      exampleUsage: 70,
      questionAsking: 70
    };
    
    // Callbacks
    this.onTranscriptUpdate = null;
    this.onAnalysisUpdate = null;
    this.onLiveStatus = null;
    this.onError = null;
  }

  // Comprehensive curriculum topics database
  curriculumTopics = {
    mathematics: {
      'quadratic equations': [
        'quadratic', 'equation', 'ax', 'bx', 'squared', 'square', 'polynomial', 'degree',
        'factorization', 'factor', 'roots', 'root', 'discriminant', 'formula', 'parabola',
        'coefficient', 'variable', 'solution', 'solve', 'completing', 'vertex', 'axis',
        'symmetry', 'zero', 'product', 'x squared', 'x square', 'plus', 'minus', 'equal',
        'value', 'find', 'calculate', 'graph', 'curve', 'positive', 'negative', 'real',
        'imaginary', 'complex', 'number', 'two', 'solutions', 'method', 'substitution',
        'standard', 'form', 'general', 'expression', 'term', 'power', 'quadratic formula'
      ],
      'linear equations': [
        'linear', 'straight', 'line', 'slope', 'intercept', 'mx', 'gradient', 'coordinate',
        'axis', 'graph', 'variable', 'constant', 'parallel', 'perpendicular', 'point'
      ],
      'trigonometry': [
        'sine', 'sin', 'cosine', 'cos', 'tangent', 'tan', 'angle', 'triangle', 'hypotenuse',
        'opposite', 'adjacent', 'degree', 'radian', 'pythagoras', 'ratio', 'theta'
      ],
      'algebra': [
        'variable', 'expression', 'equation', 'polynomial', 'factor', 'simplify', 'solve',
        'substitute', 'coefficient', 'term', 'exponent', 'power', 'radical', 'inequality'
      ],
      'geometry': [
        'angle', 'triangle', 'circle', 'square', 'rectangle', 'polygon', 'area', 'perimeter',
        'volume', 'congruent', 'similar', 'parallel', 'perpendicular', 'radius', 'diameter'
      ],
      'calculus': [
        'derivative', 'integral', 'limit', 'function', 'slope', 'rate', 'differentiation',
        'integration', 'continuous', 'tangent', 'curve', 'maximum', 'minimum'
      ],
      'statistics': [
        'mean', 'median', 'mode', 'average', 'deviation', 'variance', 'probability',
        'distribution', 'sample', 'population', 'hypothesis', 'correlation', 'data'
      ]
    },
    science: {
      'photosynthesis': [
        'chlorophyll', 'sunlight', 'carbon', 'dioxide', 'oxygen', 'glucose', 'plant', 'leaf',
        'chloroplast', 'energy', 'water', 'stoma', 'light', 'reaction', 'calvin', 'atp'
      ],
      'newton laws': [
        'force', 'mass', 'acceleration', 'inertia', 'motion', 'action', 'reaction', 'velocity',
        'momentum', 'friction', 'newton', 'gravity', 'equilibrium', 'net', 'kinematics'
      ],
      'atoms': [
        'electron', 'proton', 'neutron', 'nucleus', 'orbit', 'element', 'atomic', 'number',
        'mass', 'isotope', 'ion', 'charge', 'shell', 'valence', 'bond', 'molecule'
      ],
      'chemical reactions': [
        'reactant', 'product', 'catalyst', 'equation', 'balance', 'acid', 'base', 'salt',
        'oxidation', 'reduction', 'exothermic', 'endothermic', 'combustion', 'synthesis'
      ],
      'electricity': [
        'current', 'voltage', 'resistance', 'ohm', 'circuit', 'conductor', 'insulator',
        'ampere', 'watt', 'electron', 'battery', 'switch', 'series', 'parallel'
      ]
    },
    english: {
      'grammar': [
        'noun', 'verb', 'adjective', 'adverb', 'pronoun', 'preposition', 'conjunction',
        'sentence', 'clause', 'phrase', 'tense', 'subject', 'object', 'predicate'
      ],
      'literature': [
        'poem', 'poetry', 'story', 'character', 'plot', 'theme', 'metaphor', 'simile',
        'imagery', 'author', 'narrative', 'setting', 'conflict', 'resolution', 'symbolism'
      ]
    },
    history: {
      'independence': [
        'freedom', 'british', 'gandhi', 'nehru', 'partition', 'struggle', 'movement',
        'salt', 'march', 'quit', 'india', 'independence', 'colony', 'revolution'
      ],
      'world wars': [
        'war', 'battle', 'army', 'navy', 'alliance', 'treaty', 'weapon', 'soldier',
        'victory', 'defeat', 'occupation', 'liberation', 'peace'
      ]
    },
    computer_science: {
      'programming basics': [
        'variable', 'function', 'loop', 'condition', 'array', 'string', 'integer',
        'boolean', 'syntax', 'algorithm', 'debug', 'compile', 'code', 'program'
      ],
      'data structures': [
        'array', 'list', 'stack', 'queue', 'tree', 'graph', 'hash', 'linked',
        'sorting', 'searching', 'complexity', 'algorithm'
      ]
    }
  };

  // Get all available topics
  getAllTopics() {
    const topics = {};
    for (const [subject, subjectTopics] of Object.entries(this.curriculumTopics)) {
      const formattedSubject = subject.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      topics[formattedSubject] = Object.keys(subjectTopics).map(t => 
        t.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
      );
    }
    return topics;
  }

  // Add custom topic
  addCustomTopic(subject, topicName, keywords) {
    const subjectKey = subject.toLowerCase().replace(/ /g, '_');
    const topicKey = topicName.toLowerCase();
    
    if (!this.customTopics[subjectKey]) {
      this.customTopics[subjectKey] = {};
    }
    
    this.customTopics[subjectKey][topicKey] = keywords;
    
    if (!this.curriculumTopics[subjectKey]) {
      this.curriculumTopics[subjectKey] = {};
    }
    this.curriculumTopics[subjectKey][topicKey] = keywords;
    
    localStorage.setItem('customTopics', JSON.stringify(this.customTopics));
    return { success: true, topic: topicName, subject };
  }

  // Load custom topics
  loadCustomTopics() {
    try {
      const saved = localStorage.getItem('customTopics');
      if (saved) {
        this.customTopics = JSON.parse(saved);
        for (const [subject, topics] of Object.entries(this.customTopics)) {
          if (!this.curriculumTopics[subject]) {
            this.curriculumTopics[subject] = {};
          }
          Object.assign(this.curriculumTopics[subject], topics);
        }
      }
    } catch (e) {
      console.warn('Could not load custom topics');
    }
  }

  // Initialize speech recognition - REAL microphone capture
  initSpeechRecognition() {
    this.loadCustomTopics();
    
    // Check for browser support
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      console.warn('Speech recognition not supported in this browser');
      return { success: false, reason: 'not-supported' };
    }

    // Reset any existing recognition
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch (e) {}
    }

    this.recognition = new SpeechRecognition();
    
    // Configure for continuous, real-time recognition
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.lang = 'en-US'; // Changed to en-US for better compatibility
    this.recognition.maxAlternatives = 1;
    
    // Track retry attempts
    this.retryCount = 0;
    this.maxRetries = 3;
    
    // Handle speech results
    this.recognition.onresult = (event) => {
      this.retryCount = 0; // Reset retry count on successful result
      let interimTranscript = '';
      let finalTranscript = '';
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcript = result[0].transcript;
        
        if (result.isFinal) {
          finalTranscript += transcript + ' ';
          // Analyze final transcript
          const analysis = this.analyzeSegment(transcript);
          
          // Update live status with reason
          if (this.onLiveStatus) {
            this.onLiveStatus({
              status: analysis.isOnTopic ? 'on-topic' : 'off-topic',
              text: transcript,
              matchedKeywords: analysis.matchedKeywords || [],
              reason: analysis.reason || (analysis.isOnTopic ? 'Topic keywords detected' : 'No topic keywords found'),
              confidence: result[0].confidence || 0.9
            });
          }
        } else {
          interimTranscript += transcript;
        }
      }
      
      if (finalTranscript) {
        this.transcript += finalTranscript;
      }
      
      // Always update transcript (both final and interim)
      if (this.onTranscriptUpdate) {
        this.onTranscriptUpdate(this.transcript, interimTranscript);
      }
    };
    
    // Handle errors - with retry logic
    this.recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      
      if (event.error === 'not-allowed') {
        if (this.onError) this.onError('Microphone access denied. Please allow microphone access and refresh.');
      } else if (event.error === 'no-speech') {
        // Restart recognition if no speech detected
        if (this.isListening) {
          setTimeout(() => {
            try { this.recognition.start(); } catch (e) {}
          }, 100);
        }
      } else if (event.error === 'aborted') {
        // Restart on abort
        if (this.isListening) {
          setTimeout(() => {
            try { this.recognition.start(); } catch (e) {}
          }, 200);
        }
      } else if (event.error === 'network') {
        // Network error - retry a few times before falling back
        this.retryCount = (this.retryCount || 0) + 1;
        console.log(`Network error, retry attempt ${this.retryCount}/${this.maxRetries}`);
        
        if (this.retryCount < this.maxRetries && this.isListening) {
          setTimeout(() => {
            try {
              this.recognition.stop();
              setTimeout(() => {
                try { this.recognition.start(); } catch (e) {}
              }, 500);
            } catch (e) {
              this.startSimulation();
            }
          }, 1000);
        } else {
          // After retries, switch to simulation
          console.log('Max retries reached, switching to simulation mode...');
          this.mode = 'simulation';
          this.startSimulation();
          if (this.onError) this.onError('Network unavailable - switched to demo mode. Type or speak to simulate.');
        }
      } else if (event.error === 'audio-capture') {
        if (this.onError) this.onError('No microphone found. Please connect a microphone and refresh.');
      } else if (event.error === 'service-not-allowed') {
        // Try again - sometimes this is temporary
        if (this.isListening && this.retryCount < 2) {
          this.retryCount++;
          setTimeout(() => {
            try { this.recognition.start(); } catch (e) {}
          }, 500);
        } else {
          this.mode = 'simulation';
          this.startSimulation();
          if (this.onError) this.onError('Speech service blocked - using demo mode.');
        }
      } else {
        if (this.onError) this.onError(`Speech error: ${event.error}`);
      }
    };
    
    // Auto-restart when recognition ends
    this.recognition.onend = () => {
      if (this.isListening && this.mode === 'live') {
        setTimeout(() => {
          try {
            this.recognition.start();
          } catch (e) {
            console.log('Could not restart recognition, switching to simulation:', e);
            this.mode = 'simulation';
            this.startSimulation();
          }
        }, 100);
      }
    };
    
    this.recognition.onstart = () => {
      console.log('🎤 Speech recognition started - listening...');
      this.mode = 'live';
    };
    
    return { success: true, reason: 'initialized' };
  }

  // Start monitoring with LIVE microphone
  startMonitoring(topic, subject, callbacks = {}) {
    // Reset all state
    this.currentTopic = topic.toLowerCase();
    this.currentSubject = subject.toLowerCase().replace(/ /g, '_');
    this.transcript = '';
    this.sessionData = [];
    this.onTopicScore = 0;
    this.offTopicSegments = [];
    this.onTopicSegments = [];
    this.suggestions = [];
    this.sessionStartTime = new Date();
    this.lastSegmentTime = new Date();
    this.wordCount = 0;
    this.questionCount = 0;
    this.exampleCount = 0;
    this.onTopicTime = 0;
    this.offTopicTime = 0;
    this.liveStatus = 'waiting';
    this.mode = 'waiting';
    this.retryCount = 0;
    this.teachingMetrics = { clarity: 70, engagement: 70, pacing: 70, exampleUsage: 70, questionAsking: 70 };
    
    // Set callbacks
    this.onTranscriptUpdate = callbacks.onTranscript;
    this.onAnalysisUpdate = callbacks.onAnalysis;
    this.onLiveStatus = callbacks.onLiveStatus;
    this.onError = callbacks.onError;
    
    // Request microphone permission first
    this.requestMicrophoneAndStart();
    
    // Start periodic analysis updates
    this.analysisInterval = setInterval(() => {
      if (this.onAnalysisUpdate && this.isListening) {
        this.onAnalysisUpdate(this.getDetailedAnalysis());
      }
    }, 1000);
    
    this.isListening = true;
    return { success: true, mode: 'starting', message: '🎤 Requesting microphone access...' };
  }

  // Request microphone permission and start recognition
  async requestMicrophoneAndStart() {
    try {
      // First request microphone permission explicitly
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log('✅ Microphone permission granted');
      
      // Stop the stream immediately - we just needed permission
      stream.getTracks().forEach(track => track.stop());
      
      // Now initialize and start speech recognition
      const initResult = this.initSpeechRecognition();
      if (!initResult.success) {
        this.mode = 'simulation';
        this.startSimulation();
        if (this.onError) this.onError('Speech recognition not supported - using demo mode');
        return;
      }
      
      // Start listening
      try {
        this.recognition.start();
        this.mode = 'live';
        console.log('🎤 Speech recognition started');
        if (this.onAnalysisUpdate) {
          this.onAnalysisUpdate(this.getDetailedAnalysis());
        }
      } catch (error) {
        console.error('Could not start speech recognition:', error);
        this.mode = 'simulation';
        this.startSimulation();
      }
    } catch (error) {
      console.error('Microphone access error:', error);
      if (error.name === 'NotAllowedError') {
        if (this.onError) this.onError('Microphone access denied. Please allow microphone and refresh.');
      } else if (error.name === 'NotFoundError') {
        if (this.onError) this.onError('No microphone found. Using demo mode.');
      } else {
        if (this.onError) this.onError('Could not access microphone. Using demo mode.');
      }
      this.mode = 'simulation';
      this.startSimulation();
    }
  }

  // Original startMonitoring continuation for backward compatibility
  startMonitoringLegacy(topic, subject, callbacks = {}) {
    // Initialize speech recognition if not done
    if (!this.recognition) {
      const initResult = this.initSpeechRecognition();
      if (!initResult.success) {
        // Fallback to simulation mode
        this.isListening = true;
        this.mode = 'simulation';
        this.startSimulation();
        return { success: true, mode: 'simulation', message: 'Using simulation mode (speech not supported)' };
      }
    }
    
    // Start listening
    try {
      this.recognition.start();
      this.isListening = true;
      this.mode = 'live';
      return { success: true, mode: 'live', message: '🎤 Live microphone active' };
    } catch (error) {
      console.error('Could not start speech recognition:', error);
      this.mode = 'simulation';
      this.startSimulation();
      return { success: true, mode: 'simulation', message: 'Using simulation mode' };
    }
  }

  // Stop monitoring
  stopMonitoring() {
    this.isListening = false;
    
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch (e) {}
    }
    
    if (this.simulationInterval) {
      clearInterval(this.simulationInterval);
    }
    
    if (this.analysisInterval) {
      clearInterval(this.analysisInterval);
    }
    
    return this.generateDetailedReport();
  }

  // Analyze a speech segment using Gemini AI - ACCURATE ANALYSIS
  analyzeSegment(text) {
    const now = new Date();
    const segmentDuration = this.lastSegmentTime ? (now - this.lastSegmentTime) / 1000 : 3;
    this.lastSegmentTime = now;
    
    // Tokenize and clean words
    const words = text.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 1);
    
    this.wordCount += words.length;
    
    // Check for teaching indicators
    const textLower = text.toLowerCase();
    const questionIndicators = ['what', 'why', 'how', 'when', 'where', 'who', 'which', 'can you', 'do you', 'understand', 'clear', 'question', 'doubt', 'tell me', 'anyone'];
    const exampleIndicators = ['for example', 'example', 'such as', 'like this', 'instance', 'consider', 'suppose', 'imagine', 'let us', 'lets', "let's", 'look at', 'say'];
    const clarityIndicators = ['therefore', 'because', 'so', 'thus', 'hence', 'means', 'meaning', 'other words', 'simply', 'basically', 'actually', 'important', 'remember', 'note'];
    
    const hasQuestion = questionIndicators.some(q => textLower.includes(q));
    const hasExample = exampleIndicators.some(e => textLower.includes(e));
    const hasClarity = clarityIndicators.some(c => textLower.includes(c));
    
    // Update teaching metrics
    if (hasQuestion) {
      this.questionCount++;
      this.teachingMetrics.questionAsking = Math.min(100, this.teachingMetrics.questionAsking + 5);
      this.teachingMetrics.engagement = Math.min(100, this.teachingMetrics.engagement + 3);
    }
    if (hasExample) {
      this.exampleCount++;
      this.teachingMetrics.exampleUsage = Math.min(100, this.teachingMetrics.exampleUsage + 6);
      this.teachingMetrics.clarity = Math.min(100, this.teachingMetrics.clarity + 3);
    }
    if (hasClarity) {
      this.teachingMetrics.clarity = Math.min(100, this.teachingMetrics.clarity + 3);
    }

    // Add to analysis buffer for batched AI analysis
    this.analysisBuffer += ' ' + text;
    
    // Use STRICT local analysis first for immediate feedback
    const strictAnalysis = this.strictLocalAnalysis(text);
    const isOnTopic = strictAnalysis.isOnTopic;
    const matchedKeywords = strictAnalysis.matchedKeywords;
    
    // Calculate segment score based on strict analysis
    let segmentScore = isOnTopic ? 70 + (strictAnalysis.confidence * 30) : 30;
    segmentScore += hasQuestion ? 5 : 0;
    segmentScore += hasExample ? 5 : 0;
    segmentScore = Math.min(100, Math.max(0, segmentScore));
    
    // Track time on/off topic
    if (isOnTopic) {
      this.onTopicTime += segmentDuration;
    } else {
      this.offTopicTime += segmentDuration;
    }
    
    // Create segment analysis
    const segmentAnalysis = {
      text,
      timestamp: now.toISOString(),
      score: segmentScore,
      isOnTopic,
      matchedKeywords,
      wordCount: words.length,
      hasQuestion,
      hasExample,
      hasClarity,
      duration: segmentDuration,
      reason: strictAnalysis.reason
    };
    
    this.sessionData.push(segmentAnalysis);
    
    // Store in appropriate list
    if (isOnTopic) {
      this.onTopicSegments.push(segmentAnalysis);
    } else {
      this.offTopicSegments.push(segmentAnalysis);
    }
    
    // Update live status
    this.liveStatus = isOnTopic ? 'on-topic' : 'off-topic';
    
    // Trigger Gemini AI analysis every 5 seconds for accuracy
    const timeSinceLastAnalysis = now.getTime() - this.lastAnalysisTime;
    if (timeSinceLastAnalysis > 5000 && this.analysisBuffer.trim().length > 30) {
      this.runAIAnalysis();
    }
    
    // Trigger analysis update
    if (this.onAnalysisUpdate) {
      this.onAnalysisUpdate(this.getDetailedAnalysis());
    }
    
    return segmentAnalysis;
  }

  // STRICT local analysis - much more accurate
  strictLocalAnalysis(text) {
    const textLower = text.toLowerCase();
    const words = textLower.split(/\s+/).map(w => w.replace(/[^\w]/g, ''));
    
    // Get strict keywords for the topic
    const strictKeywords = this.getStrictTopicKeywords();
    
    let matchCount = 0;
    const matchedKeywords = [];
    
    // Check for exact keyword matches only
    strictKeywords.forEach(keyword => {
      if (keyword.includes(' ')) {
        // Multi-word phrase
        if (textLower.includes(keyword)) {
          matchCount += 2;
          matchedKeywords.push(keyword);
        }
      } else {
        // Single word - exact match only
        if (words.includes(keyword)) {
          matchCount++;
          matchedKeywords.push(keyword);
        }
      }
    });
    
    // Check for off-topic indicators
    const offTopicPhrases = [
      'good morning', 'good afternoon', 'good evening', 'hello everyone',
      'how are you', 'did you eat', 'yesterday', 'tomorrow', 'weekend',
      'movie', 'game', 'cricket', 'football', 'holiday', 'vacation',
      'homework', 'assignment', 'marks', 'attendance', 'roll call'
    ];
    
    const isOffTopic = offTopicPhrases.some(phrase => textLower.includes(phrase));
    
    // Short greetings/transitions are neutral
    if (words.length <= 4) {
      return {
        isOnTopic: false, // Don't count short phrases
        confidence: 0,
        matchedKeywords: [],
        reason: 'Too short to determine'
      };
    }
    
    // Need at least 2 keyword matches AND no off-topic content
    const isOnTopic = matchCount >= 2 && !isOffTopic;
    const confidence = Math.min(1, matchCount / 5);
    
    let reason = '';
    if (isOnTopic) {
      reason = `On topic: ${matchedKeywords.slice(0, 3).join(', ')}`;
    } else if (isOffTopic) {
      reason = 'Off-topic conversation detected';
    } else if (matchCount === 0) {
      reason = 'No topic keywords found';
    } else {
      reason = `Weak relevance (${matchCount} keywords)`;
    }
    
    return { isOnTopic, confidence, matchedKeywords, reason };
  }

  // Get strict keywords for current topic - COMPREHENSIVE LIST
  getStrictTopicKeywords() {
    const topicKeywords = {
      // MATHEMATICS TOPICS
      'quadratic equations': [
        // Core terms
        'quadratic', 'equation', 'equations', 'squared', 'square', 'x squared', 'x square',
        'ax squared', 'ax2', 'bx', 'cx', 'polynomial', 'degree', 'second degree',
        // Methods & concepts
        'factorization', 'factorisation', 'factoring', 'factor', 'factors', 'roots', 'root',
        'discriminant', 'quadratic formula', 'formula', 'parabola', 'vertex', 'vertices',
        'coefficient', 'coefficients', 'variable', 'variables', 'constant', 'term', 'terms',
        // Solving
        'completing the square', 'standard form', 'general form', 'find x', 'solve', 'solving',
        'solve for x', 'value of x', 'solution', 'solutions', 'answer', 'calculate',
        // Roots related
        'roots of equation', 'sum of roots', 'product of roots', 'nature of roots',
        'real roots', 'imaginary roots', 'complex roots', 'equal roots', 'distinct roots',
        'two solutions', 'two roots', 'double root', 'repeated root',
        // Formula terms
        'plus or minus', 'plus minus', 'square root', 'sqrt', 'b squared', 'b square',
        'four ac', '4ac', 'minus b', 'negative b', '2a', 'divided by',
        // Graph related
        'graph', 'curve', 'u shape', 'opening', 'upward', 'downward', 'axis of symmetry',
        'maximum', 'minimum', 'turning point', 'intercept', 'x intercept', 'y intercept',
        // Common words in teaching
        'substitute', 'substitution', 'simplify', 'expand', 'rearrange', 'compare',
        'positive', 'negative', 'zero', 'equal', 'equals', 'greater', 'less'
      ],
      'linear equations': [
        'linear', 'line', 'straight', 'straight line', 'slope', 'gradient', 'steepness',
        'intercept', 'y intercept', 'x intercept', 'mx plus b', 'y equals mx', 'y equals',
        'coordinate', 'coordinates', 'point', 'points', 'origin', 'axes', 'axis',
        'parallel', 'perpendicular', 'horizontal', 'vertical', 'rise', 'run',
        'rise over run', 'rate of change', 'constant', 'variable', 'first degree',
        'graph', 'plot', 'plotting', 'table', 'ordered pair', 'x value', 'y value',
        'slope intercept', 'point slope', 'standard form', 'equation of line',
        'find the equation', 'find slope', 'simultaneous', 'system of equations'
      ],
      'trigonometry': [
        'sine', 'cosine', 'tangent', 'sin', 'cos', 'tan', 'secant', 'cosecant', 'cotangent',
        'sec', 'csc', 'cot', 'theta', 'angle', 'angles', 'degree', 'degrees', 'radian', 'radians',
        'triangle', 'right triangle', 'right angle', 'hypotenuse', 'opposite', 'adjacent',
        'soh cah toa', 'ratio', 'ratios', 'trigonometric', 'trig', 'identity', 'identities',
        'pythagoras', 'pythagorean', 'unit circle', 'reference angle', 'quadrant',
        'amplitude', 'period', 'frequency', 'phase', 'wave', 'oscillation',
        'inverse', 'arc', 'arcsin', 'arccos', 'arctan', 'elevation', 'depression'
      ],
      'algebra': [
        'variable', 'variables', 'expression', 'expressions', 'equation', 'equations',
        'polynomial', 'polynomials', 'monomial', 'binomial', 'trinomial', 'term', 'terms',
        'coefficient', 'constant', 'like terms', 'unlike terms', 'degree', 'exponent',
        'power', 'base', 'factor', 'factors', 'factoring', 'factorization', 'expand',
        'simplify', 'simplifying', 'solve', 'solving', 'substitute', 'substitution',
        'inequality', 'inequalities', 'greater than', 'less than', 'equal to',
        'algebraic', 'formula', 'identity', 'evaluate', 'value', 'unknown'
      ],
      'geometry': [
        'angle', 'angles', 'triangle', 'triangles', 'circle', 'circles', 'square', 'squares',
        'rectangle', 'rectangles', 'polygon', 'polygons', 'line', 'lines', 'point', 'points',
        'area', 'perimeter', 'volume', 'surface area', 'circumference', 'diameter', 'radius',
        'congruent', 'similar', 'parallel', 'perpendicular', 'vertex', 'vertices', 'edge',
        'face', 'side', 'sides', 'base', 'height', 'length', 'width', 'diagonal',
        'acute', 'obtuse', 'right angle', 'straight angle', 'reflex', 'complementary', 'supplementary',
        'isosceles', 'equilateral', 'scalene', 'quadrilateral', 'pentagon', 'hexagon'
      ],
      'calculus': [
        'derivative', 'derivatives', 'differentiation', 'differentiate', 'integral', 'integration',
        'integrate', 'limit', 'limits', 'function', 'functions', 'continuous', 'continuity',
        'slope', 'tangent', 'rate of change', 'instantaneous', 'average', 'curve',
        'maximum', 'minimum', 'critical point', 'inflection', 'concave', 'convex',
        'chain rule', 'product rule', 'quotient rule', 'power rule', 'antiderivative',
        'area under curve', 'definite', 'indefinite', 'bounds', 'fundamental theorem'
      ],
      'statistics': [
        'mean', 'median', 'mode', 'average', 'range', 'variance', 'standard deviation',
        'data', 'dataset', 'frequency', 'distribution', 'normal', 'bell curve',
        'probability', 'chance', 'likelihood', 'sample', 'population', 'random',
        'hypothesis', 'correlation', 'regression', 'scatter', 'outlier', 'quartile',
        'percentile', 'histogram', 'bar graph', 'pie chart', 'survey', 'bias'
      ],

      // SCIENCE TOPICS
      'photosynthesis': [
        'photosynthesis', 'chlorophyll', 'chloroplast', 'sunlight', 'light', 'sun',
        'carbon dioxide', 'co2', 'oxygen', 'o2', 'glucose', 'sugar', 'starch',
        'plant', 'plants', 'leaf', 'leaves', 'green', 'pigment', 'stomata', 'stoma',
        'water', 'h2o', 'energy', 'food', 'absorb', 'release', 'produce',
        'light reaction', 'dark reaction', 'calvin cycle', 'atp', 'nadph',
        'autotroph', 'producer', 'equation', 'process', 'convert', 'conversion'
      ],
      'newton': [
        'newton', 'force', 'forces', 'mass', 'acceleration', 'velocity', 'speed',
        'motion', 'movement', 'inertia', 'momentum', 'friction', 'gravity', 'weight',
        'action', 'reaction', 'equal', 'opposite', 'first law', 'second law', 'third law',
        'f equals ma', 'f ma', 'net force', 'unbalanced', 'balanced', 'equilibrium',
        'push', 'pull', 'newton meter', 'kilogram', 'kg', 'acceleration due to gravity',
        'free fall', 'projectile', 'rest', 'uniform', 'non uniform'
      ],
      'atoms': [
        'atom', 'atoms', 'atomic', 'electron', 'electrons', 'proton', 'protons',
        'neutron', 'neutrons', 'nucleus', 'shell', 'orbit', 'orbital', 'energy level',
        'element', 'elements', 'periodic table', 'atomic number', 'mass number',
        'isotope', 'isotopes', 'ion', 'ions', 'charge', 'positive', 'negative',
        'valence', 'valency', 'bond', 'bonding', 'molecule', 'molecules', 'compound',
        'subatomic', 'particle', 'particles', 'structure', 'model', 'bohr'
      ],
      'chemical reactions': [
        'reaction', 'reactions', 'chemical', 'chemistry', 'reactant', 'reactants',
        'product', 'products', 'equation', 'balance', 'balanced', 'catalyst',
        'acid', 'base', 'salt', 'neutral', 'ph', 'indicator', 'litmus',
        'oxidation', 'reduction', 'redox', 'exothermic', 'endothermic', 'energy',
        'combustion', 'burning', 'synthesis', 'decomposition', 'displacement',
        'precipitate', 'gas', 'fizz', 'bubble', 'color change', 'temperature'
      ],
      'electricity': [
        'electric', 'electricity', 'current', 'voltage', 'resistance', 'ohm',
        'circuit', 'circuits', 'conductor', 'insulator', 'wire', 'wires',
        'battery', 'cell', 'switch', 'bulb', 'led', 'ampere', 'amp', 'volt', 'watt',
        'series', 'parallel', 'electron', 'flow', 'charge', 'positive', 'negative',
        'ohms law', 'v equals ir', 'power', 'energy', 'joule', 'kilowatt',
        'fuse', 'ground', 'earthing', 'short circuit', 'open circuit'
      ],
      'biology': [
        'cell', 'cells', 'organism', 'living', 'life', 'biology', 'biological',
        'tissue', 'organ', 'system', 'body', 'function', 'structure',
        'dna', 'gene', 'genes', 'chromosome', 'heredity', 'genetics', 'trait',
        'species', 'evolution', 'adapt', 'adaptation', 'natural selection',
        'ecosystem', 'habitat', 'environment', 'food chain', 'predator', 'prey'
      ],

      // ENGLISH/LANGUAGE TOPICS  
      'grammar': [
        'grammar', 'noun', 'nouns', 'verb', 'verbs', 'adjective', 'adjectives',
        'adverb', 'adverbs', 'pronoun', 'pronouns', 'preposition', 'prepositions',
        'conjunction', 'conjunctions', 'article', 'articles', 'interjection',
        'sentence', 'sentences', 'clause', 'clauses', 'phrase', 'phrases',
        'subject', 'predicate', 'object', 'tense', 'tenses', 'past', 'present', 'future',
        'singular', 'plural', 'punctuation', 'comma', 'period', 'question mark',
        'active voice', 'passive voice', 'direct', 'indirect', 'speech'
      ],
      'literature': [
        'literature', 'story', 'stories', 'poem', 'poems', 'poetry', 'novel', 'novels',
        'character', 'characters', 'plot', 'setting', 'theme', 'themes', 'conflict',
        'protagonist', 'antagonist', 'narrator', 'narration', 'point of view',
        'metaphor', 'simile', 'imagery', 'symbolism', 'symbol', 'foreshadowing',
        'irony', 'personification', 'alliteration', 'rhyme', 'rhythm', 'stanza',
        'author', 'writer', 'reader', 'audience', 'tone', 'mood', 'style'
      ],

      // HISTORY TOPICS
      'independence': [
        'independence', 'freedom', 'liberty', 'struggle', 'movement', 'revolution',
        'british', 'colonial', 'colony', 'rule', 'raj', 'empire',
        'gandhi', 'nehru', 'patel', 'bose', 'azad', 'tilak', 'gokhale',
        'salt march', 'dandi', 'quit india', 'non cooperation', 'civil disobedience',
        'satyagraha', 'ahimsa', 'swadeshi', 'boycott', 'partition', '1947',
        'congress', 'league', 'constituent assembly', 'constitution'
      ],
      'world wars': [
        'war', 'wars', 'world war', 'battle', 'battles', 'military', 'army', 'navy',
        'soldier', 'soldiers', 'weapon', 'weapons', 'attack', 'defense', 'defence',
        'alliance', 'allies', 'axis', 'treaty', 'peace', 'victory', 'defeat',
        'hitler', 'nazi', 'holocaust', 'atomic', 'nuclear', 'hiroshima', 'nagasaki',
        'trench', 'warfare', 'front', 'casualties', 'surrender', 'occupation'
      ],

      // COMPUTER SCIENCE
      'programming': [
        'program', 'programming', 'code', 'coding', 'computer', 'software',
        'variable', 'variables', 'function', 'functions', 'loop', 'loops',
        'condition', 'conditional', 'if', 'else', 'while', 'for', 'array', 'arrays',
        'string', 'integer', 'boolean', 'data type', 'input', 'output', 'print',
        'algorithm', 'logic', 'debug', 'error', 'bug', 'compile', 'run', 'execute',
        'syntax', 'statement', 'expression', 'operator', 'class', 'object'
      ]
    };
    
    // Find matching keywords - check for partial matches too
    const topicLower = this.currentTopic.toLowerCase();
    for (const [topic, keywords] of Object.entries(topicKeywords)) {
      if (topicLower.includes(topic) || topic.includes(topicLower) || 
          topic.split(' ').some(word => topicLower.includes(word))) {
        return keywords;
      }
    }
    
    // Fallback - generate from topic name and add common teaching words
    const topicWords = this.currentTopic.toLowerCase().split(/\s+/).filter(w => w.length > 2);
    return [...topicWords, 'example', 'problem', 'solution', 'answer', 'find', 'calculate', 'solve'];
  }

  // Run Gemini AI analysis for better accuracy
  async runAIAnalysis() {
    if (!this.analysisBuffer.trim()) return;
    
    this.lastAnalysisTime = Date.now();
    const textToAnalyze = this.analysisBuffer;
    this.analysisBuffer = ''; // Clear buffer
    
    try {
      const result = await geminiAnalysisService.analyzeTopicRelevance(
        textToAnalyze,
        this.currentTopic,
        this.currentSubject
      );
      
      console.log('🤖 Gemini AI Analysis:', result);
      
      // Update the last few segments based on AI analysis
      if (result && !result.isOnTopic) {
        // AI says off-topic - update recent segments
        const recentSegments = this.sessionData.slice(-3);
        recentSegments.forEach(seg => {
          if (seg.isOnTopic && seg.matchedKeywords.length < 2) {
            seg.isOnTopic = false;
            seg.reason = result.reason || 'AI detected off-topic';
            // Move from on-topic to off-topic
            const idx = this.onTopicSegments.indexOf(seg);
            if (idx > -1) {
              this.onTopicSegments.splice(idx, 1);
              this.offTopicSegments.push(seg);
            }
          }
        });
      }
      
      // Trigger update with AI-refined analysis
      if (this.onAnalysisUpdate) {
        this.onAnalysisUpdate(this.getDetailedAnalysis());
      }
    } catch (error) {
      console.warn('AI analysis failed:', error);
    }
  }

  // Get keywords for current topic
  getTopicKeywords() {
    const subject = this.curriculumTopics[this.currentSubject];
    
    if (!subject) {
      // Search all subjects for matching topic
      for (const subj of Object.values(this.curriculumTopics)) {
        for (const [topic, keywords] of Object.entries(subj)) {
          if (this.currentTopic.includes(topic) || topic.includes(this.currentTopic)) {
            return keywords;
          }
        }
      }
      return [];
    }
    
    // Find exact or partial topic match
    for (const [topic, keywords] of Object.entries(subject)) {
      if (this.currentTopic.includes(topic) || topic.includes(this.currentTopic)) {
        return keywords;
      }
    }
    
    // Return all keywords from subject as fallback
    return Object.values(subject).flat();
  }

  // Get detailed analysis - LIVE data
  getDetailedAnalysis() {
    const now = new Date();
    const durationMs = now - this.sessionStartTime;
    const durationMinutes = Math.max(0, Math.floor(durationMs / 1000 / 60));
    const durationSeconds = Math.round(durationMs / 1000);
    
    // Calculate on-topic percentage from segments
    const totalSegments = this.sessionData.length;
    const onTopicSegmentCount = this.sessionData.filter(s => s.isOnTopic).length;
    const onTopicPercentage = totalSegments > 0 ? Math.round((onTopicSegmentCount / totalSegments) * 100) : 100;
    
    // Calculate time-based on-topic
    const totalTrackedTime = this.onTopicTime + this.offTopicTime;
    const onTopicTimePercent = totalTrackedTime > 0 
      ? Math.round((this.onTopicTime / totalTrackedTime) * 100) 
      : 100;
    
    // Use average of both metrics, favor higher score
    const finalOnTopicPercent = Math.round((Math.max(onTopicPercentage, onTopicTimePercent) * 0.6) + (Math.min(onTopicPercentage, onTopicTimePercent) * 0.4));
    
    // Words per minute
    const wordsPerMinute = durationMinutes > 0 ? Math.round(this.wordCount / Math.max(1, durationMinutes)) : this.wordCount;
    
    // Update pacing metric based on WPM
    if (wordsPerMinute >= 100 && wordsPerMinute <= 160) {
      this.teachingMetrics.pacing = Math.min(100, 85 + (Math.random() * 10));
    } else if (wordsPerMinute > 160) {
      this.teachingMetrics.pacing = Math.max(60, 80 - (wordsPerMinute - 160) / 3);
    } else if (wordsPerMinute < 80 && wordsPerMinute > 0) {
      this.teachingMetrics.pacing = Math.max(60, 80 - (80 - wordsPerMinute) / 3);
    }
    
    return {
      onTopicPercentage: finalOnTopicPercent,
      onTopicTimePercent,
      offTopicCount: this.offTopicSegments.length,
      onTopicCount: this.onTopicSegments.length,
      onTopicMinutes: Math.floor(this.onTopicTime / 60),
      offTopicMinutes: Math.floor(this.offTopicTime / 60),
      onTopicSeconds: Math.round(this.onTopicTime),
      offTopicSeconds: Math.round(this.offTopicTime),
      totalDuration: durationMinutes,
      totalDurationSeconds: durationSeconds,
      status: this.getStatus(finalOnTopicPercent),
      liveStatus: this.liveStatus,
      mode: this.mode,
      teachingMetrics: { ...this.teachingMetrics },
      questionsAsked: this.questionCount,
      examplesGiven: this.exampleCount,
      wordsPerMinute,
      totalWords: this.wordCount,
      segmentCount: totalSegments,
      recentKeywords: this.sessionData.slice(-5).flatMap(s => s.matchedKeywords).filter((v, i, a) => a.indexOf(v) === i)
    };
  }

  // Get status label
  getStatus(score) {
    if (score >= 80) return 'Excellent';
    if (score >= 65) return 'Good';
    if (score >= 50) return 'Satisfactory';
    if (score >= 35) return 'Needs Improvement';
    return 'Critical';
  }

  // Generate final report
  generateDetailedReport() {
    const analysis = this.getDetailedAnalysis();
    const grade = this.calculateGrade(analysis);
    const suggestions = this.generateSuggestions(analysis);
    const strengths = this.identifyStrengths(analysis);
    const improvements = this.identifyImprovements(analysis);
    
    return {
      ...analysis,
      grade,
      suggestions,
      strengths,
      improvements,
      offTopicSegments: this.offTopicSegments.slice(0, 5),
      onTopicSegments: this.onTopicSegments.slice(-5),
      overallScore: this.onTopicScore,
      sessionId: `session-${Date.now()}`,
      topic: this.currentTopic,
      subject: this.currentSubject,
      timestamp: new Date().toISOString(),
      fullTranscript: this.transcript
    };
  }

  // Calculate grade - BALANCED formula
  calculateGrade(analysis) {
    // Base score from on-topic percentage (40% weight)
    const topicScore = (analysis.onTopicPercentage / 100) * 40;
    
    // Teaching metrics average (30% weight)
    const metricsAvg = Object.values(analysis.teachingMetrics).reduce((a, b) => a + b, 0) / 5;
    const metricsScore = (metricsAvg / 100) * 30;
    
    // Engagement bonus (20% weight) - questions and examples
    const engagementRaw = Math.min(20, (analysis.questionsAsked * 3) + (analysis.examplesGiven * 4));
    const engagementScore = engagementRaw;
    
    // Duration/effort bonus (10% weight)
    const durationBonus = Math.min(10, analysis.totalDuration * 0.5);
    
    const finalScore = topicScore + metricsScore + engagementScore + durationBonus;
    
    // Grade thresholds - more lenient
    if (finalScore >= 80) return 'A+';
    if (finalScore >= 70) return 'A';
    if (finalScore >= 60) return 'B+';
    if (finalScore >= 50) return 'B';
    if (finalScore >= 40) return 'C+';
    if (finalScore >= 30) return 'C';
    if (finalScore >= 20) return 'D';
    return 'F';
  }

  // Generate improvement suggestions
  generateSuggestions(analysis) {
    const suggestions = [];
    
    if (analysis.onTopicPercentage < 60) {
      suggestions.push({
        type: 'content',
        priority: 'high',
        message: `Focus more on ${this.currentTopic}. ${analysis.onTopicPercentage}% of content was on-topic.`,
        action: 'Use more topic-specific keywords and concepts'
      });
    }
    
    if (analysis.questionsAsked < 2 && analysis.totalDuration >= 2) {
      suggestions.push({
        type: 'engagement',
        priority: 'medium',
        message: 'Ask more questions to engage students',
        action: 'Include comprehension checks every few minutes'
      });
    }
    
    if (analysis.examplesGiven < 1 && analysis.totalDuration >= 2) {
      suggestions.push({
        type: 'clarity',
        priority: 'medium',
        message: 'Use more examples to illustrate concepts',
        action: 'Prepare 2-3 real-world examples for key concepts'
      });
    }
    
    if (analysis.wordsPerMinute > 170) {
      suggestions.push({
        type: 'pacing',
        priority: 'medium',
        message: 'Speaking pace is quite fast',
        action: 'Slow down and pause after important points'
      });
    }
    
    return suggestions;
  }

  // Identify strengths
  identifyStrengths(analysis) {
    const strengths = [];
    
    if (analysis.onTopicPercentage >= 70) {
      strengths.push('Good focus on the lesson topic');
    }
    if (analysis.questionsAsked >= 2) {
      strengths.push('Good student engagement through questions');
    }
    if (analysis.examplesGiven >= 1) {
      strengths.push('Effective use of examples');
    }
    if (analysis.teachingMetrics.clarity >= 75) {
      strengths.push('Clear explanations');
    }
    if (analysis.teachingMetrics.pacing >= 75) {
      strengths.push('Appropriate teaching pace');
    }
    
    return strengths.length > 0 ? strengths : ['Keep up the good work!'];
  }

  // Identify improvements
  identifyImprovements(analysis) {
    const improvements = [];
    
    if (analysis.onTopicPercentage < 60) {
      improvements.push('Stay more focused on the lesson topic');
    }
    if (analysis.questionsAsked < 2) {
      improvements.push('Ask more questions to check understanding');
    }
    if (analysis.examplesGiven < 1) {
      improvements.push('Include more practical examples');
    }
    if (analysis.teachingMetrics.pacing < 60) {
      improvements.push('Adjust speaking pace');
    }
    
    return improvements;
  }

  // Simulation mode for browsers without speech recognition
  startSimulation() {
    const topicKeywords = this.getTopicKeywords();
    const kw = (i) => topicKeywords[Math.min(i, topicKeywords.length - 1)] || 'topic';
    
    const simulatedPhrases = [
      `Today we are learning about ${this.currentTopic}`,
      `The ${kw(0)} is very important in ${this.currentTopic}`,
      `Let me explain the concept of ${kw(1)}`,
      `For example, when we have ${kw(0)} and ${kw(2)}`,
      `Can anyone tell me what is ${kw(1)}?`,
      `This is important because ${kw(0)} relates to ${kw(3)}`,
      `Let's look at another example with ${kw(2)}`,
      `Do you understand the ${kw(0)} so far?`,
      `The key point here is ${kw(1)} and ${kw(2)}`,
      `In other words, ${kw(0)} means ${kw(3)}`,
      `Who can solve this ${kw(0)} problem?`,
      `Remember, ${kw(1)} is related to ${kw(2)}`,
      `Let me show you step by step how ${kw(0)} works`,
      `Any questions about ${kw(1)}?`,
      `The formula for ${kw(0)} is straightforward`
    ];

    this.simulationInterval = setInterval(() => {
      if (!this.isListening) {
        clearInterval(this.simulationInterval);
        return;
      }
      
      const phrase = simulatedPhrases[Math.floor(Math.random() * simulatedPhrases.length)];
      this.transcript += phrase + '. ';
      
      const analysis = this.analyzeSegment(phrase);
      
      if (this.onTranscriptUpdate) {
        this.onTranscriptUpdate(this.transcript, '');
      }
      
      if (this.onLiveStatus) {
        this.onLiveStatus({
          status: analysis.isOnTopic ? 'on-topic' : 'off-topic',
          text: phrase,
          matchedKeywords: analysis.matchedKeywords,
          confidence: 0.95
        });
      }
    }, 3500);
  }
}

export const teacherMonitoringService = new TeacherMonitoringService();
export default teacherMonitoringService;
