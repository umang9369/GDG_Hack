// Enhanced Teacher Monitoring Service - LIVE Speech Recognition
// Real-time phrase-by-phrase analysis with Gemini AI for accurate topic detection

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
    
    // ENHANCED: Real-time phrase analysis
    this.phraseBuffer = '';
    this.phraseHistory = []; // Store all analyzed phrases
    this.streamingAnalysis = true; // Enable continuous streaming analysis
    this.analysisQueue = []; // Queue for parallel analysis
    this.isAnalyzing = false;
    this.lastPhraseTime = Date.now();
    this.continuousScores = []; // Track scores over time for graphing
    
    // ENHANCED: Teaching quality metrics with real-time updates
    this.teachingMetrics = {
      clarity: 70,
      engagement: 70,
      pacing: 70,
      exampleUsage: 70,
      questionAsking: 70,
      contentAccuracy: 70,
      studentInteraction: 70,
      conceptExplanation: 70
    };
    
    // Real-time teaching effectiveness
    this.teachingEffectiveness = {
      overallScore: 70,
      trend: 'stable', // 'improving', 'declining', 'stable'
      recentScores: [],
      suggestions: [],
      strengths: [],
      improvements: []
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

  // Initialize speech recognition - REAL microphone capture with ENHANCED phrase-by-phrase analysis
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
    
    // Configure for continuous, real-time recognition - ENHANCED for phrase analysis
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.lang = 'en-US';
    this.recognition.maxAlternatives = 1;
    
    // Track retry attempts
    this.retryCount = 0;
    this.maxRetries = 3;
    
    // ENHANCED: Handle speech results with immediate phrase analysis
    this.recognition.onresult = (event) => {
      this.retryCount = 0;
      let interimTranscript = '';
      let finalTranscript = '';
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcript = result[0].transcript;
        const confidence = result[0].confidence || 0.9;
        
        if (result.isFinal) {
          finalTranscript += transcript + ' ';
          
          // ENHANCED: Immediate phrase-by-phrase analysis with detailed feedback
          this.analyzePhraseImmediately(transcript, confidence).then(analysis => {
            if (analysis) {
              // Store phrase in history for tracking
              this.phraseHistory.push({
                text: transcript,
                timestamp: new Date().toISOString(),
                analysis: analysis,
                confidence: confidence
              });
              
              // ENHANCED: Update live status with comprehensive feedback
              if (this.onLiveStatus) {
                this.onLiveStatus({
                  status: analysis.isOnTopic ? 'on-topic' : 'off-topic',
                  text: transcript,
                  matchedKeywords: analysis.matchedKeywords || analysis.matchedConcepts || [],
                  reason: analysis.reason || '',
                  confidence: analysis.confidence || confidence,
                  teachingQuality: analysis.teachingQuality || null,
                  suggestion: analysis.suggestion || null,
                  phraseScore: analysis.phraseScore || 0,
                  cumulativeScore: this.calculateCumulativeScore()
                });
              }
              
              // ENHANCED: Update teaching effectiveness in real-time
              this.updateTeachingEffectiveness(analysis);
            }
          }).catch(err => console.warn('Phrase analysis error:', err));
        } else {
          interimTranscript += transcript;
          
          // ENHANCED: Analyze interim results for faster feedback (debounced)
          if (this.streamingAnalysis && transcript.length > 15) {
            this.analyzeInterimDebounced(transcript);
          }
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

  // Analyze a speech segment using Gemini AI - CONTEXT-AWARE ANALYSIS
  async analyzeSegment(text) {
    const now = new Date();
    const segmentDuration = this.lastSegmentTime ? (now - this.lastSegmentTime) / 1000 : 3;
    this.lastSegmentTime = now;
    
    // Handle pauses/silence - this is NORMAL teaching behavior
    const trimmedText = text.trim();
    if (!trimmedText || trimmedText.length < 3) {
      // Silence or very short - teacher is pausing (thinking, writing on board, etc.)
      // Don't mark as off-topic, just skip analysis
      console.log('⏸️ Teacher pause detected - normal teaching behavior');
      return null;
    }
    
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

    // Add to analysis buffer for context
    this.analysisBuffer += ' ' + text;
    
    // Use Gemini AI as PRIMARY analyzer for full context understanding
    let isOnTopic = true;
    let matchedKeywords = [];
    let reason = '';
    let confidence = 0.7;
    
    // Analyze with Gemini AI for accurate context understanding
    const aiResult = await this.analyzeWithGeminiAI(text);
    
    if (aiResult) {
      isOnTopic = aiResult.isOnTopic;
      matchedKeywords = aiResult.matchedConcepts || aiResult.matchedKeywords || [];
      reason = aiResult.reason || '';
      confidence = aiResult.confidence || 0.7;
    } else {
      // Fallback to local analysis only if AI fails
      const localAnalysis = this.quickLocalAnalysis(text);
      isOnTopic = localAnalysis.isOnTopic;
      matchedKeywords = localAnalysis.matchedKeywords;
      reason = localAnalysis.reason;
      confidence = localAnalysis.confidence;
    }
    
    // Calculate segment score
    let segmentScore = isOnTopic ? 70 + (confidence * 30) : 30;
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
      reason: reason,
      analyzedByAI: !!aiResult
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
    
    // Trigger analysis update
    if (this.onAnalysisUpdate) {
      this.onAnalysisUpdate(this.getDetailedAnalysis());
    }
    
    return segmentAnalysis;
  }

  // Analyze with Gemini AI - PRIMARY method for context understanding
  async analyzeWithGeminiAI(text) {
    if (!text || text.trim().length < 5) {
      return null;
    }
    
    try {
      // Use Gemini API directly for real-time analysis
      const apiKey = 'AIzaSyBvLZ8yyM0tyW0t4LvVxE-C7V0u9Ghfqew';
      const apiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';
      
      const prompt = `You are a classroom teaching assistant. Analyze if this speech is related to teaching "${this.currentTopic}" in ${this.currentSubject}.

SPEECH: "${text}"
EXPECTED TOPIC: ${this.currentTopic}
SUBJECT: ${this.currentSubject}

IMPORTANT RULES:
1. Understand the CONTEXT and MEANING, not just keywords
2. A teacher explaining concepts in simple words is ON-TOPIC even without technical terms
3. Examples, analogies, real-world connections to the topic = ON-TOPIC
4. Questions to students about the topic = ON-TOPIC  
5. Transition phrases like "now let's look at", "moving on" = ON-TOPIC
6. General greetings, personal stories, unrelated topics = OFF-TOPIC

Respond with JSON only (no markdown):
{"isOnTopic": true/false, "confidence": 0.0-1.0, "matchedConcepts": ["concept1"], "reason": "brief explanation"}`;

      const response = await fetch(`${apiUrl}?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 150
          }
        })
      });

      if (!response.ok) {
        console.warn('Gemini API error:', response.status);
        return null;
      }

      const data = await response.json();
      const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      
      // Parse JSON response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const result = JSON.parse(jsonMatch[0]);
        console.log('🤖 AI Analysis:', result.isOnTopic ? '✅ ON-TOPIC' : '❌ OFF-TOPIC', '-', result.reason);
        return result;
      }
      
      return null;
    } catch (error) {
      console.warn('AI analysis error:', error.message);
      return null;
    }
  }

  // Quick local analysis - ROBUST FALLBACK when AI fails
  quickLocalAnalysis(text) {
    const textLower = text.toLowerCase();
    const words = textLower.split(/\s+/).map(w => w.replace(/[^\w]/g, ''));
    
    // Get comprehensive keywords for the topic
    const topicKeywords = this.getTopicKeywordsComprehensive();
    
    let matchCount = 0;
    const matchedKeywords = [];
    
    // Check all topic keywords
    topicKeywords.forEach(keyword => {
      if (keyword.includes(' ')) {
        // Multi-word phrase
        if (textLower.includes(keyword)) {
          matchCount += 2;
          matchedKeywords.push(keyword);
        }
      } else {
        // Single word - check if it appears
        if (textLower.includes(keyword) || words.includes(keyword)) {
          matchCount++;
          matchedKeywords.push(keyword);
        }
      }
    });
    
    // Check for common teaching patterns
    const teachingPatterns = ['let me', 'we can', 'you see', 'this means', 'for example', 
      'remember', 'notice', 'look at', 'think about', 'consider', 'when we', 'if we',
      'so basically', 'let us', "let's", 'okay so', 'now we', 'what is', 'what are'];
    const hasTeachingPattern = teachingPatterns.some(p => textLower.includes(p));
    
    // Only these are truly off-topic
    const offTopicIndicators = ['weather today', 'what did you eat', 'movie last night', 
      'cricket match', 'football game', 'party yesterday', 'weekend plans'];
    const hasOffTopic = offTopicIndicators.some(w => textLower.includes(w));
    
    // ON-TOPIC if: has keyword matches OR teaching pattern OR short segment (transitional)
    const isOnTopic = !hasOffTopic && (matchCount >= 1 || hasTeachingPattern);
    
    let reason = '';
    if (matchCount >= 1) {
      reason = `Topic keywords: ${matchedKeywords.slice(0, 4).join(', ')}`;
    } else if (hasTeachingPattern) {
      reason = 'Teaching pattern detected';
    } else if (hasOffTopic) {
      reason = 'Off-topic conversation';
    } else {
      reason = 'Analyzing context...';
    }
    
    return {
      isOnTopic,
      confidence: Math.min(1, matchCount * 0.2 + 0.3),
      matchedKeywords,
      reason
    };
  }
  
  // Get comprehensive keywords for the current topic
  getTopicKeywordsComprehensive() {
    const topicLower = this.currentTopic.toLowerCase();
    
    // Comprehensive keyword database
    const keywordDB = {
      // Programming / Arrays / Data Structures
      'programming': ['array', 'arrays', 'variable', 'variables', 'function', 'functions', 
        'code', 'coding', 'program', 'loop', 'loops', 'data', 'data structure', 'data structures',
        'integer', 'int', 'string', 'character', 'characters', 'store', 'storing', 'stored',
        'index', 'element', 'elements', 'value', 'values', 'type', 'types', 'data type',
        'if', 'else', 'while', 'for', 'condition', 'conditional', 'input', 'output', 'print',
        'algorithm', 'logic', 'execute', 'run', 'compile', 'syntax', 'statement', 'declare',
        'initialize', 'assign', 'operator', 'module', 'class', 'object', 'method', 'return',
        'parameter', 'argument', 'boolean', 'true', 'false', 'null', 'undefined', 'length',
        'size', 'memory', 'stack', 'queue', 'list', 'linked list', 'pointer', 'reference'],
      'array': ['array', 'arrays', 'element', 'elements', 'index', 'indices', 'store', 'storing',
        'data structure', 'integer', 'character', 'string', 'length', 'size', 'access',
        'traverse', 'loop', 'for loop', 'while loop', 'first element', 'last element',
        'insert', 'delete', 'search', 'sort', 'initialize', 'declare', 'memory', 'contiguous'],
      
      // Mathematics
      'quadratic': ['quadratic', 'equation', 'squared', 'square', 'parabola', 'vertex', 
        'roots', 'discriminant', 'formula', 'coefficient', 'factorization', 'solve',
        'ax squared', 'bx', 'plus or minus', 'graph', 'curve', 'solution', 'solutions'],
      'linear': ['linear', 'slope', 'intercept', 'gradient', 'line', 'straight', 'graph',
        'coordinate', 'equation', 'y equals', 'mx plus b', 'x intercept', 'y intercept'],
      'trigonometry': ['sine', 'cosine', 'tangent', 'sin', 'cos', 'tan', 'angle', 'theta',
        'hypotenuse', 'opposite', 'adjacent', 'triangle', 'degree', 'radian', 'ratio'],
      'algebra': ['variable', 'expression', 'equation', 'polynomial', 'factor', 'simplify',
        'solve', 'coefficient', 'term', 'exponent', 'power', 'algebraic'],
      'geometry': ['angle', 'triangle', 'circle', 'area', 'perimeter', 'volume', 'radius',
        'diameter', 'vertex', 'edge', 'face', 'parallel', 'perpendicular', 'congruent'],
      'calculus': ['derivative', 'integral', 'limit', 'differentiate', 'integrate', 'slope',
        'rate of change', 'function', 'continuous', 'maximum', 'minimum'],
      'statistics': ['mean', 'median', 'mode', 'average', 'variance', 'probability', 
        'data', 'frequency', 'distribution', 'sample', 'population'],
      
      // Science
      'photosynthesis': ['photosynthesis', 'chlorophyll', 'sunlight', 'carbon dioxide', 'oxygen',
        'glucose', 'plant', 'leaf', 'leaves', 'chloroplast', 'energy', 'light'],
      'physics': ['force', 'mass', 'acceleration', 'velocity', 'speed', 'motion', 'energy',
        'newton', 'gravity', 'momentum', 'friction', 'wave', 'frequency'],
      'chemistry': ['atom', 'molecule', 'element', 'compound', 'reaction', 'chemical',
        'electron', 'proton', 'neutron', 'bond', 'acid', 'base', 'ph'],
      'biology': ['cell', 'organism', 'dna', 'gene', 'tissue', 'organ', 'system',
        'evolution', 'species', 'ecosystem', 'protein', 'chromosome']
    };
    
    // Find matching keyword set
    let keywords = [];
    for (const [topic, words] of Object.entries(keywordDB)) {
      if (topicLower.includes(topic) || topic.includes(topicLower.split(' ')[0])) {
        keywords = [...keywords, ...words];
      }
    }
    
    // Always add topic words themselves
    const topicWords = topicLower.split(/\s+/).filter(w => w.length > 2);
    keywords = [...keywords, ...topicWords];
    
    // If no specific match, add common teaching/academic words
    if (keywords.length < 5) {
      keywords = [...keywords, 'example', 'understand', 'concept', 'explain', 'learn',
        'study', 'practice', 'problem', 'solution', 'answer', 'question'];
    }
    
    return [...new Set(keywords)]; // Remove duplicates
  }

  // STRICT local analysis - uses comprehensive keywords
  strictLocalAnalysis(text) {
    return this.quickLocalAnalysis(text);
  }

  // ENHANCED: Immediate phrase-by-phrase analysis for real-time feedback
  async analyzePhraseImmediately(phrase, confidence = 0.9) {
    const now = Date.now();
    const timeSinceLastPhrase = (now - this.lastPhraseTime) / 1000;
    this.lastPhraseTime = now;
    
    // Skip very short phrases
    if (!phrase || phrase.trim().length < 5) {
      return null;
    }
    
    // First do quick local analysis for immediate feedback
    const quickResult = this.quickLocalAnalysis(phrase);
    
    // Then get detailed AI analysis
    const aiResult = await this.analyzeWithGeminiAIEnhanced(phrase);
    
    // Combine results - AI takes precedence if available
    const finalResult = aiResult || quickResult;
    
    // ENHANCED: Calculate phrase-specific teaching quality score
    const phraseScore = this.calculatePhraseTeachingScore(phrase, finalResult, timeSinceLastPhrase);
    
    // Track continuous scores for trending
    this.continuousScores.push({
      timestamp: now,
      score: phraseScore,
      isOnTopic: finalResult.isOnTopic
    });
    
    // Keep only last 50 scores
    if (this.continuousScores.length > 50) {
      this.continuousScores.shift();
    }
    
    return {
      ...finalResult,
      phraseScore,
      teachingQuality: this.assessTeachingQuality(phrase),
      suggestion: this.getImmediateSuggestion(phrase, finalResult),
      speechConfidence: confidence
    };
  }

  // ENHANCED: Debounced interim analysis for faster feedback
  analyzeInterimDebounced(text) {
    if (this.interimDebounceTimer) {
      clearTimeout(this.interimDebounceTimer);
    }
    
    this.interimDebounceTimer = setTimeout(() => {
      const quickResult = this.quickLocalAnalysis(text);
      if (this.onLiveStatus) {
        this.onLiveStatus({
          status: quickResult.isOnTopic ? 'on-topic' : 'off-topic',
          text: text,
          matchedKeywords: quickResult.matchedKeywords || [],
          reason: quickResult.reason + ' (analyzing...)',
          confidence: quickResult.confidence,
          isInterim: true
        });
      }
    }, 300); // 300ms debounce
  }

  // ENHANCED: AI analysis with detailed teaching quality assessment
  async analyzeWithGeminiAIEnhanced(text) {
    if (!text || text.trim().length < 5) {
      return null;
    }
    
    try {
      const apiKey = 'AIzaSyBvLZ8yyM0tyW0t4LvVxE-C7V0u9Ghfqew';
      const apiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';
      
      const prompt = `You are an expert classroom teaching evaluator. Analyze this spoken phrase for teaching "${this.currentTopic}" in ${this.currentSubject}.

PHRASE: "${text}"
EXPECTED TOPIC: ${this.currentTopic}
SUBJECT: ${this.currentSubject}

Evaluate these aspects:
1. Is this phrase on-topic (discussing the expected subject matter)?
2. Teaching quality indicators (clarity, examples, questions, explanations)
3. Any issues or suggestions for improvement

CONTEXT RULES:
- Teaching explanations in simple words = ON-TOPIC
- Examples, analogies, real-world applications = ON-TOPIC with bonus
- Asking students questions about topic = ON-TOPIC with bonus
- Transitional phrases = ON-TOPIC (neutral)
- Personal anecdotes unrelated to topic = OFF-TOPIC
- Classroom management ("please be quiet") = OFF-TOPIC

Respond with ONLY valid JSON (no markdown, no code blocks):
{
  "isOnTopic": true/false,
  "confidence": 0.0-1.0,
  "matchedConcepts": ["concept1", "concept2"],
  "reason": "brief explanation",
  "teachingIndicators": {
    "usesExamples": true/false,
    "asksQuestions": true/false,
    "explainsWell": true/false,
    "engagingDelivery": true/false
  },
  "suggestion": "optional brief improvement tip or null"
}`;

      const response = await fetch(`${apiUrl}?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 200
          }
        })
      });

      if (!response.ok) {
        console.warn('Gemini API error:', response.status);
        return null;
      }

      const data = await response.json();
      const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      
      // Parse JSON response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const result = JSON.parse(jsonMatch[0]);
        console.log('🤖 Enhanced AI:', result.isOnTopic ? '✅ ON-TOPIC' : '❌ OFF-TOPIC', '-', result.reason);
        
        // Update teaching metrics based on AI indicators
        if (result.teachingIndicators) {
          this.updateTeachingMetricsFromAI(result.teachingIndicators);
        }
        
        return result;
      }
      
      return null;
    } catch (error) {
      console.warn('Enhanced AI analysis error:', error.message);
      return null;
    }
  }

  // ENHANCED: Calculate phrase-specific teaching score
  calculatePhraseTeachingScore(phrase, analysis, timeSinceLastPhrase) {
    let score = 50; // Base score
    
    // On-topic bonus
    if (analysis.isOnTopic) {
      score += 20 + (analysis.confidence || 0.5) * 20;
    } else {
      score -= 20;
    }
    
    const phraseLower = phrase.toLowerCase();
    
    // Teaching technique bonuses
    const exampleWords = ['for example', 'example', 'such as', 'like this', 'consider', 'instance'];
    if (exampleWords.some(w => phraseLower.includes(w))) {
      score += 10;
      this.exampleCount++;
    }
    
    const questionIndicators = ['what', 'why', 'how', 'can you', 'do you', 'tell me', 'anyone'];
    if (questionIndicators.some(q => phraseLower.includes(q)) && phraseLower.includes('?')) {
      score += 8;
      this.questionCount++;
    }
    
    const clarityWords = ['because', 'therefore', 'so', 'this means', 'in other words', 'simply'];
    if (clarityWords.some(c => phraseLower.includes(c))) {
      score += 5;
    }
    
    // Pacing penalty for very long pauses
    if (timeSinceLastPhrase > 10) {
      score -= 5;
    }
    
    // Word count - penalize very short or very long phrases
    const wordCount = phrase.split(/\s+/).length;
    if (wordCount < 3) {
      score -= 5;
    } else if (wordCount > 50) {
      score -= 3;
    }
    
    return Math.max(0, Math.min(100, score));
  }

  // ENHANCED: Assess teaching quality from phrase content
  assessTeachingQuality(phrase) {
    const phraseLower = phrase.toLowerCase();
    
    return {
      hasExample: ['example', 'for instance', 'such as', 'like this'].some(e => phraseLower.includes(e)),
      hasQuestion: phraseLower.includes('?') || ['what', 'why', 'how'].some(q => phraseLower.startsWith(q)),
      hasExplanation: ['because', 'therefore', 'means', 'so basically'].some(e => phraseLower.includes(e)),
      hasEngagement: ['you', 'we', 'let us', "let's", 'together'].some(e => phraseLower.includes(e)),
      hasClarity: ['simply', 'basically', 'in other words', 'remember'].some(c => phraseLower.includes(c))
    };
  }

  // ENHANCED: Get immediate suggestion based on analysis
  getImmediateSuggestion(phrase, analysis) {
    if (!analysis.isOnTopic && analysis.confidence > 0.7) {
      return "Try to connect this back to " + this.currentTopic;
    }
    
    const quality = this.assessTeachingQuality(phrase);
    
    // Check recent history for patterns
    const recentPhrases = this.phraseHistory.slice(-10);
    const recentExamples = recentPhrases.filter(p => p.analysis?.teachingQuality?.hasExample).length;
    const recentQuestions = recentPhrases.filter(p => p.analysis?.teachingQuality?.hasQuestion).length;
    
    if (recentExamples < 2 && !quality.hasExample) {
      return "Consider adding an example to illustrate the concept";
    }
    
    if (recentQuestions < 1 && !quality.hasQuestion) {
      return "Engage students with a question";
    }
    
    return null; // No suggestion needed
  }

  // ENHANCED: Update teaching metrics from AI analysis
  updateTeachingMetricsFromAI(indicators) {
    if (indicators.usesExamples) {
      this.teachingMetrics.exampleUsage = Math.min(100, this.teachingMetrics.exampleUsage + 3);
    }
    if (indicators.asksQuestions) {
      this.teachingMetrics.questionAsking = Math.min(100, this.teachingMetrics.questionAsking + 3);
      this.teachingMetrics.engagement = Math.min(100, this.teachingMetrics.engagement + 2);
    }
    if (indicators.explainsWell) {
      this.teachingMetrics.clarity = Math.min(100, this.teachingMetrics.clarity + 2);
    }
    if (indicators.engagingDelivery) {
      this.teachingMetrics.engagement = Math.min(100, this.teachingMetrics.engagement + 3);
    }
  }

  // ENHANCED: Update teaching effectiveness in real-time
  updateTeachingEffectiveness(analysis) {
    // Add to recent scores
    this.teachingEffectiveness.recentScores.push(analysis.phraseScore || 50);
    
    // Keep only last 20 scores
    if (this.teachingEffectiveness.recentScores.length > 20) {
      this.teachingEffectiveness.recentScores.shift();
    }
    
    // Calculate overall score
    const scores = this.teachingEffectiveness.recentScores;
    this.teachingEffectiveness.overallScore = Math.round(
      scores.reduce((a, b) => a + b, 0) / scores.length
    );
    
    // Determine trend
    if (scores.length >= 5) {
      const recent5 = scores.slice(-5);
      const previous5 = scores.slice(-10, -5);
      
      if (previous5.length >= 3) {
        const recentAvg = recent5.reduce((a, b) => a + b, 0) / recent5.length;
        const previousAvg = previous5.reduce((a, b) => a + b, 0) / previous5.length;
        
        if (recentAvg > previousAvg + 5) {
          this.teachingEffectiveness.trend = 'improving';
        } else if (recentAvg < previousAvg - 5) {
          this.teachingEffectiveness.trend = 'declining';
        } else {
          this.teachingEffectiveness.trend = 'stable';
        }
      }
    }
    
    // Generate dynamic suggestions
    this.teachingEffectiveness.suggestions = this.generateTeachingSuggestions();
    this.teachingEffectiveness.strengths = this.identifyStrengths();
    this.teachingEffectiveness.improvements = this.identifyImprovements();
  }

  // ENHANCED: Generate real-time teaching suggestions
  generateTeachingSuggestions() {
    const suggestions = [];
    
    if (this.teachingMetrics.exampleUsage < 60) {
      suggestions.push("Add more real-world examples to illustrate concepts");
    }
    if (this.teachingMetrics.questionAsking < 50) {
      suggestions.push("Ask more questions to engage students");
    }
    if (this.teachingMetrics.clarity < 60) {
      suggestions.push("Use simpler language and explain terms");
    }
    if (this.offTopicTime > this.onTopicTime * 0.3) {
      suggestions.push("Try to stay more focused on the topic");
    }
    
    return suggestions.slice(0, 3);
  }

  // ENHANCED: Identify teaching strengths
  identifyStrengths() {
    const strengths = [];
    
    if (this.teachingMetrics.exampleUsage > 70) {
      strengths.push("Excellent use of examples");
    }
    if (this.teachingMetrics.questionAsking > 70) {
      strengths.push("Good student engagement through questions");
    }
    if (this.teachingMetrics.clarity > 70) {
      strengths.push("Clear explanations");
    }
    if (this.onTopicTime > this.offTopicTime * 4) {
      strengths.push("Strong topic focus");
    }
    
    return strengths;
  }

  // ENHANCED: Identify areas for improvement
  identifyImprovements() {
    const improvements = [];
    
    if (this.teachingMetrics.exampleUsage < 50) {
      improvements.push("Example usage");
    }
    if (this.teachingMetrics.questionAsking < 50) {
      improvements.push("Student interaction");
    }
    if (this.teachingMetrics.engagement < 50) {
      improvements.push("Engagement level");
    }
    
    return improvements;
  }

  // ENHANCED: Calculate cumulative teaching score
  calculateCumulativeScore() {
    const metrics = this.teachingMetrics;
    const weights = {
      clarity: 0.2,
      engagement: 0.2,
      pacing: 0.1,
      exampleUsage: 0.15,
      questionAsking: 0.15,
      contentAccuracy: 0.2
    };
    
    let totalScore = 0;
    let totalWeight = 0;
    
    for (const [key, weight] of Object.entries(weights)) {
      if (metrics[key] !== undefined) {
        totalScore += metrics[key] * weight;
        totalWeight += weight;
      }
    }
    
    // Factor in on-topic percentage
    const totalTime = this.onTopicTime + this.offTopicTime;
    if (totalTime > 0) {
      const onTopicPercent = (this.onTopicTime / totalTime) * 100;
      totalScore = totalScore * 0.7 + onTopicPercent * 0.3;
    }
    
    return Math.round(totalScore);
  }

  // ENHANCED: Get phrase history for display
  getPhraseHistory() {
    return this.phraseHistory.slice(-20).map(p => ({
      text: p.text,
      timestamp: p.timestamp,
      isOnTopic: p.analysis?.isOnTopic,
      score: p.analysis?.phraseScore,
      reason: p.analysis?.reason
    }));
  }

  // ENHANCED: Get real-time teaching effectiveness data
  getTeachingEffectiveness() {
    return {
      ...this.teachingEffectiveness,
      metrics: this.teachingMetrics,
      cumulativeScore: this.calculateCumulativeScore(),
      phraseCount: this.phraseHistory.length,
      recentTrend: this.continuousScores.slice(-10)
    };
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
      recentKeywords: this.sessionData.slice(-5).flatMap(s => s.matchedKeywords).filter((v, i, a) => a.indexOf(v) === i),
      // LIVE strengths and improvements
      strengths: this.identifyStrengthsLive(finalOnTopicPercent),
      improvements: this.identifyImprovementsLive(finalOnTopicPercent),
      // ENHANCED: Real-time teaching effectiveness data
      cumulativeScore: this.calculateCumulativeScore(),
      trend: this.teachingEffectiveness?.trend || 'stable',
      recentTrend: this.continuousScores?.slice(-15) || [],
      phraseCount: this.phraseHistory?.length || 0,
      teachingEffectiveness: this.teachingEffectiveness
    };
  }
  
  // LIVE strengths - updates in real-time
  identifyStrengthsLive(onTopicPercent) {
    const strengths = [];
    
    if (onTopicPercent >= 60) {
      strengths.push('Good focus on the lesson topic');
    }
    if (this.questionCount >= 1) {
      strengths.push('Engaging students through questions');
    }
    if (this.exampleCount >= 1) {
      strengths.push('Effective use of examples');
    }
    if (this.teachingMetrics.clarity >= 70) {
      strengths.push('Clear explanations');
    }
    if (this.teachingMetrics.pacing >= 70) {
      strengths.push('Good teaching pace');
    }
    if (this.wordCount > 50) {
      strengths.push('Active engagement');
    }
    
    return strengths.length > 0 ? strengths : ['Session in progress...'];
  }
  
  // LIVE improvements - updates in real-time
  identifyImprovementsLive(onTopicPercent) {
    const improvements = [];
    
    if (onTopicPercent < 50) {
      improvements.push('Stay more focused on the lesson topic');
    }
    if (this.questionCount < 1 && this.wordCount > 30) {
      improvements.push('Ask more questions to check understanding');
    }
    if (this.exampleCount < 1 && this.wordCount > 50) {
      improvements.push('Include more practical examples');
    }
    if (this.teachingMetrics.pacing < 60) {
      improvements.push('Consider adjusting speaking pace');
    }
    
    return improvements;
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

    this.simulationInterval = setInterval(async () => {
      if (!this.isListening) {
        clearInterval(this.simulationInterval);
        return;
      }
      
      const phrase = simulatedPhrases[Math.floor(Math.random() * simulatedPhrases.length)];
      this.transcript += phrase + '. ';
      
      const analysis = await this.analyzeSegment(phrase);
      
      if (this.onTranscriptUpdate) {
        this.onTranscriptUpdate(this.transcript, '');
      }
      
      if (this.onLiveStatus && analysis) {
        this.onLiveStatus({
          status: analysis.isOnTopic ? 'on-topic' : 'off-topic',
          text: phrase,
          matchedKeywords: analysis.matchedKeywords || [],
          reason: analysis.reason || '',
          confidence: 0.95
        });
      }
    }, 3500);
  }
}

export const teacherMonitoringService = new TeacherMonitoringService();
export default teacherMonitoringService;
