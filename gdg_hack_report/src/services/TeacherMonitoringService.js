// Enhanced Teacher Monitoring Service - Full Topic Support with Custom Topics
// Provides detailed analysis, teaching style metrics, and improvement suggestions

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
    this.suggestions = [];
    this.dbName = 'EduPulseTeacherDB';
    this.customTopics = {};
    this.teachingMetrics = {
      clarity: 0,
      engagement: 0,
      pacing: 0,
      exampleUsage: 0,
      questionAsking: 0
    };
  }

  // Comprehensive curriculum topics database
  curriculumTopics = {
    mathematics: {
      'quadratic equations': [
        'quadratic', 'equation', 'ax squared', 'bx', 'polynomial', 'degree 2',
        'factorization', 'roots', 'discriminant', 'formula', 'parabola',
        'coefficient', 'variable', 'solution', 'factor', 'completing the square',
        'vertex', 'axis of symmetry', 'zero product', 'quadratic formula'
      ],
      'linear equations': [
        'linear', 'straight line', 'slope', 'intercept', 'y equals mx plus b',
        'gradient', 'coordinate', 'axis', 'graph', 'variable', 'constant',
        'parallel', 'perpendicular', 'point slope', 'standard form'
      ],
      'trigonometry': [
        'sine', 'cosine', 'tangent', 'angle', 'triangle', 'hypotenuse',
        'opposite', 'adjacent', 'degree', 'radian', 'pythagoras', 'ratio',
        'secant', 'cosecant', 'cotangent', 'identity', 'unit circle'
      ],
      'algebra': [
        'variable', 'expression', 'equation', 'polynomial', 'factor',
        'simplify', 'solve', 'substitute', 'coefficient', 'term',
        'exponent', 'radical', 'inequality', 'function', 'domain', 'range'
      ],
      'geometry': [
        'angle', 'triangle', 'circle', 'square', 'rectangle', 'polygon',
        'area', 'perimeter', 'volume', 'congruent', 'similar', 'parallel',
        'perpendicular', 'radius', 'diameter', 'circumference', 'theorem'
      ],
      'calculus': [
        'derivative', 'integral', 'limit', 'function', 'slope', 'rate',
        'differentiation', 'integration', 'continuous', 'tangent', 'curve',
        'maximum', 'minimum', 'optimization', 'chain rule', 'product rule'
      ],
      'statistics': [
        'mean', 'median', 'mode', 'average', 'standard deviation', 'variance',
        'probability', 'distribution', 'sample', 'population', 'hypothesis',
        'correlation', 'regression', 'data', 'frequency', 'histogram'
      ],
      'matrices': [
        'matrix', 'determinant', 'inverse', 'multiplication', 'addition',
        'transpose', 'row', 'column', 'identity', 'vector', 'eigenvalue'
      ]
    },
    science: {
      'photosynthesis': [
        'chlorophyll', 'sunlight', 'carbon dioxide', 'oxygen', 'glucose',
        'plant', 'leaf', 'chloroplast', 'energy', 'water', 'stoma',
        'light reaction', 'dark reaction', 'calvin cycle', 'atp'
      ],
      'newton laws': [
        'force', 'mass', 'acceleration', 'inertia', 'motion', 'action',
        'reaction', 'velocity', 'momentum', 'friction', 'newton', 'gravity',
        'equilibrium', 'net force', 'kinematics', 'dynamics'
      ],
      'atoms': [
        'electron', 'proton', 'neutron', 'nucleus', 'orbit', 'element',
        'atomic number', 'mass number', 'isotope', 'ion', 'charge',
        'shell', 'valence', 'bond', 'molecule', 'compound'
      ],
      'chemical reactions': [
        'reactant', 'product', 'catalyst', 'equation', 'balance', 'acid',
        'base', 'salt', 'oxidation', 'reduction', 'exothermic', 'endothermic',
        'combustion', 'synthesis', 'decomposition', 'displacement'
      ],
      'electricity': [
        'current', 'voltage', 'resistance', 'ohm', 'circuit', 'conductor',
        'insulator', 'ampere', 'watt', 'electron flow', 'battery', 'switch',
        'series', 'parallel', 'capacitor', 'electromagnetic'
      ],
      'magnetism': [
        'magnet', 'pole', 'field', 'attract', 'repel', 'compass', 'iron',
        'electromagnetic', 'induction', 'flux', 'coil', 'motor', 'generator'
      ],
      'biology': [
        'cell', 'organism', 'tissue', 'organ', 'system', 'dna', 'gene',
        'chromosome', 'protein', 'mitosis', 'meiosis', 'evolution', 'ecology'
      ],
      'human body': [
        'heart', 'brain', 'lung', 'liver', 'kidney', 'blood', 'bone',
        'muscle', 'nerve', 'digestion', 'respiration', 'circulation', 'immune'
      ]
    },
    english: {
      'grammar': [
        'noun', 'verb', 'adjective', 'adverb', 'pronoun', 'preposition',
        'conjunction', 'sentence', 'clause', 'phrase', 'tense', 'subject',
        'object', 'predicate', 'modifier', 'article', 'voice', 'mood'
      ],
      'literature': [
        'poem', 'story', 'character', 'plot', 'theme', 'metaphor',
        'simile', 'imagery', 'author', 'narrative', 'setting', 'conflict',
        'resolution', 'symbolism', 'irony', 'foreshadowing', 'protagonist'
      ],
      'writing skills': [
        'essay', 'paragraph', 'introduction', 'conclusion', 'thesis',
        'argument', 'evidence', 'citation', 'draft', 'revision', 'edit',
        'coherence', 'clarity', 'tone', 'style', 'audience'
      ],
      'comprehension': [
        'reading', 'understanding', 'inference', 'summary', 'main idea',
        'detail', 'context', 'vocabulary', 'interpretation', 'analysis'
      ],
      'poetry': [
        'rhyme', 'meter', 'stanza', 'verse', 'rhythm', 'alliteration',
        'assonance', 'sonnet', 'haiku', 'free verse', 'imagery', 'tone'
      ]
    },
    history: {
      'independence': [
        'freedom', 'british', 'gandhi', 'nehru', 'partition', 'struggle',
        'movement', 'salt march', 'quit india', 'independence', 'colony',
        'revolution', 'nationalism', 'swadeshi', 'civil disobedience'
      ],
      'ancient india': [
        'indus valley', 'harappa', 'mohenjo daro', 'vedic', 'maurya',
        'gupta', 'ashoka', 'civilization', 'empire', 'dynasty', 'sanskrit',
        'buddha', 'jainism', 'hinduism', 'trade route'
      ],
      'world wars': [
        'war', 'battle', 'army', 'navy', 'alliance', 'treaty', 'weapon',
        'soldier', 'victory', 'defeat', 'occupation', 'liberation', 'peace'
      ],
      'medieval india': [
        'mughal', 'sultan', 'kingdom', 'empire', 'invasion', 'akbar',
        'architecture', 'trade', 'culture', 'religion', 'conquest'
      ]
    },
    geography: {
      'climate': [
        'weather', 'temperature', 'rainfall', 'humidity', 'season', 'monsoon',
        'tropical', 'temperate', 'polar', 'atmosphere', 'precipitation'
      ],
      'landforms': [
        'mountain', 'plateau', 'plain', 'valley', 'river', 'ocean', 'lake',
        'desert', 'forest', 'island', 'peninsula', 'continent'
      ],
      'maps': [
        'scale', 'direction', 'symbol', 'legend', 'latitude', 'longitude',
        'grid', 'compass', 'projection', 'contour', 'elevation'
      ]
    },
    computer_science: {
      'programming basics': [
        'variable', 'function', 'loop', 'condition', 'array', 'string',
        'integer', 'boolean', 'syntax', 'algorithm', 'debug', 'compile'
      ],
      'data structures': [
        'array', 'list', 'stack', 'queue', 'tree', 'graph', 'hash',
        'linked list', 'sorting', 'searching', 'complexity', 'algorithm'
      ],
      'web development': [
        'html', 'css', 'javascript', 'website', 'browser', 'server',
        'database', 'api', 'frontend', 'backend', 'responsive', 'framework'
      ],
      'artificial intelligence': [
        'machine learning', 'neural network', 'deep learning', 'algorithm',
        'model', 'training', 'prediction', 'classification', 'regression'
      ]
    },
    economics: {
      'microeconomics': [
        'demand', 'supply', 'price', 'market', 'consumer', 'producer',
        'equilibrium', 'elasticity', 'cost', 'revenue', 'profit', 'utility'
      ],
      'macroeconomics': [
        'gdp', 'inflation', 'unemployment', 'fiscal', 'monetary', 'policy',
        'trade', 'export', 'import', 'budget', 'deficit', 'growth'
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
    // Add custom topics
    for (const [subject, customSubjectTopics] of Object.entries(this.customTopics)) {
      const formattedSubject = subject.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      if (!topics[formattedSubject]) topics[formattedSubject] = [];
      topics[formattedSubject].push(...Object.keys(customSubjectTopics).map(t =>
        t.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
      ));
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
    
    // Also add to curriculum
    if (!this.curriculumTopics[subjectKey]) {
      this.curriculumTopics[subjectKey] = {};
    }
    this.curriculumTopics[subjectKey][topicKey] = keywords;
    
    // Save to localStorage
    localStorage.setItem('customTopics', JSON.stringify(this.customTopics));
    
    return { success: true, topic: topicName, subject };
  }

  // Load custom topics from storage
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

  // Initialize speech recognition
  initSpeechRecognition() {
    this.loadCustomTopics();
    
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      console.warn('Speech recognition not supported, using simulation mode');
      return false;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    this.recognition = new SpeechRecognition();
    
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.lang = 'en-IN';
    
    this.recognition.onresult = (event) => {
      let interimTranscript = '';
      let finalTranscript = '';
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' ';
        } else {
          interimTranscript += transcript;
        }
      }
      
      if (finalTranscript) {
        this.transcript += finalTranscript;
        this.analyzeSegment(finalTranscript);
      }
      
      if (this.onTranscriptUpdate) {
        this.onTranscriptUpdate(this.transcript, interimTranscript);
      }
    };
    
    this.recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      if (this.onError) this.onError(event.error);
    };
    
    this.recognition.onend = () => {
      if (this.isListening) {
        try { this.recognition.start(); } catch (e) {}
      }
    };
    
    return true;
  }

  // Start monitoring with any topic
  startMonitoring(topic, subject, callbacks = {}) {
    this.currentTopic = topic.toLowerCase();
    this.currentSubject = subject.toLowerCase().replace(/ /g, '_');
    this.transcript = '';
    this.sessionData = [];
    this.onTopicScore = 0;
    this.offTopicSegments = [];
    this.suggestions = [];
    this.sessionStartTime = new Date();
    this.wordCount = 0;
    this.questionCount = 0;
    this.exampleCount = 0;
    this.teachingMetrics = { clarity: 70, engagement: 70, pacing: 70, exampleUsage: 70, questionAsking: 70 };
    
    this.onTranscriptUpdate = callbacks.onTranscript;
    this.onAnalysisUpdate = callbacks.onAnalysis;
    this.onError = callbacks.onError;
    
    if (this.recognition) {
      try {
        this.recognition.start();
        this.isListening = true;
        return { success: true, mode: 'live' };
      } catch (error) {
        this.isListening = true;
        this.startSimulation();
        return { success: true, mode: 'simulation' };
      }
    } else {
      this.isListening = true;
      this.startSimulation();
      return { success: true, mode: 'simulation' };
    }
  }

  // Stop monitoring
  stopMonitoring() {
    this.isListening = false;
    if (this.recognition) { try { this.recognition.stop(); } catch(e) {} }
    if (this.simulationInterval) { clearInterval(this.simulationInterval); }
    return this.generateDetailedReport();
  }

  // Analyze a speech segment
  analyzeSegment(text) {
    const words = text.toLowerCase().split(/\s+/).filter(w => w.length > 2);
    const topicKeywords = this.getTopicKeywords();
    
    let matchCount = 0;
    const matchedKeywords = [];
    
    words.forEach(word => {
      if (topicKeywords.some(kw => word.includes(kw) || kw.includes(word))) {
        matchCount++;
        matchedKeywords.push(word);
      }
    });
    
    this.wordCount += words.length;
    
    const questionIndicators = ['what', 'why', 'how', 'when', 'where', 'who', 'which', 'can anyone', 'does anyone', 'understand'];
    const exampleIndicators = ['for example', 'example', 'such as', 'like', 'instance', 'consider', 'suppose', 'imagine'];
    const clarityIndicators = ['therefore', 'because', 'so', 'thus', 'hence', 'in other words', 'simply put'];
    
    const hasQuestion = questionIndicators.some(q => text.toLowerCase().includes(q));
    const hasExample = exampleIndicators.some(e => text.toLowerCase().includes(e));
    const hasClarity = clarityIndicators.some(c => text.toLowerCase().includes(c));
    
    if (hasQuestion) { this.questionCount++; this.teachingMetrics.questionAsking = Math.min(100, this.teachingMetrics.questionAsking + 3); this.teachingMetrics.engagement = Math.min(100, this.teachingMetrics.engagement + 2); }
    if (hasExample) { this.exampleCount++; this.teachingMetrics.exampleUsage = Math.min(100, this.teachingMetrics.exampleUsage + 4); this.teachingMetrics.clarity = Math.min(100, this.teachingMetrics.clarity + 2); }
    if (hasClarity) { this.teachingMetrics.clarity = Math.min(100, this.teachingMetrics.clarity + 2); }
    
    // More lenient scoring - even 1 keyword match in a short segment is considered on-topic
    const segmentScore = words.length > 0 ? Math.min(100, (matchCount / Math.max(words.length * 0.15, 1)) * 100) : 0;
    const isOnTopic = segmentScore >= 15 || matchCount >= 1 || words.length <= 3;
    
    const segmentAnalysis = { text, timestamp: new Date().toISOString(), score: Math.min(segmentScore, 100), isOnTopic, matchedKeywords, wordCount: words.length, hasQuestion, hasExample, hasClarity };
    
    this.sessionData.push(segmentAnalysis);
    if (!isOnTopic && words.length > 3) { this.offTopicSegments.push({ text: text.substring(0, 150), timestamp: segmentAnalysis.timestamp }); }
    
    this.calculateOverallScore();
    if (this.onAnalysisUpdate) { this.onAnalysisUpdate(this.getDetailedAnalysis()); }
    
    return segmentAnalysis;
  }

  // Get keywords for current topic
  getTopicKeywords() {
    const subject = this.curriculumTopics[this.currentSubject];
    if (!subject) {
      for (const subj of Object.values(this.curriculumTopics)) {
        for (const [topic, keywords] of Object.entries(subj)) {
          if (this.currentTopic.includes(topic) || topic.includes(this.currentTopic)) { return keywords; }
        }
      }
      return [];
    }
    for (const [topic, keywords] of Object.entries(subject)) {
      if (this.currentTopic.includes(topic) || topic.includes(this.currentTopic)) { return keywords; }
    }
    return Object.values(subject).flat();
  }

  calculateOverallScore() {
    if (this.sessionData.length === 0) { this.onTopicScore = 0; return; }
    this.onTopicScore = this.sessionData.reduce((sum, seg) => sum + seg.score, 0) / this.sessionData.length;
  }

  getDetailedAnalysis() {
    const duration = Math.round((new Date() - this.sessionStartTime) / 1000 / 60);
    const onTopicCount = this.sessionData.filter(s => s.isOnTopic).length;
    const onTopicPercentage = this.sessionData.length > 0 ? Math.round((onTopicCount / this.sessionData.length) * 100) : 0;
    const wordsPerMinute = duration > 0 ? Math.round(this.wordCount / duration) : 0;
    
    if (wordsPerMinute > 100 && wordsPerMinute < 160) { this.teachingMetrics.pacing = Math.min(100, 85 + Math.random() * 10); }
    else if (wordsPerMinute > 160) { this.teachingMetrics.pacing = Math.max(50, 70 - (wordsPerMinute - 160) / 2); }
    else if (wordsPerMinute < 80 && wordsPerMinute > 0) { this.teachingMetrics.pacing = Math.max(50, 70 - (80 - wordsPerMinute) / 2); }
    
    return {
      onTopicPercentage, offTopicCount: this.offTopicSegments.length,
      onTopicMinutes: Math.round(duration * onTopicPercentage / 100),
      offTopicMinutes: Math.round(duration * (100 - onTopicPercentage) / 100),
      totalDuration: duration, status: this.getStatus(onTopicPercentage),
      teachingMetrics: { ...this.teachingMetrics }, questionsAsked: this.questionCount,
      examplesGiven: this.exampleCount, wordsPerMinute, totalWords: this.wordCount,
      segmentCount: this.sessionData.length, recentKeywords: this.sessionData.slice(-3).flatMap(s => s.matchedKeywords)
    };
  }

  getStatus(score) {
    if (score >= 85) return 'Excellent';
    if (score >= 70) return 'Good';
    if (score >= 55) return 'Satisfactory';
    if (score >= 40) return 'Needs Improvement';
    return 'Critical';
  }

  generateDetailedReport() {
    const analysis = this.getDetailedAnalysis();
    const grade = this.calculateGrade(analysis);
    const suggestions = this.generateSuggestions(analysis);
    const strengths = this.identifyStrengths(analysis);
    const improvements = this.identifyImprovements(analysis);
    
    return { ...analysis, grade, suggestions, strengths, improvements, offTopicSegments: this.offTopicSegments.slice(0, 5), overallScore: this.onTopicScore, sessionId: `session-${Date.now()}`, topic: this.currentTopic, subject: this.currentSubject, timestamp: new Date().toISOString() };
  }

  calculateGrade(analysis) {
    // More balanced grading formula
    // Topic relevance: 35% weight
    const topicScore = (analysis.onTopicPercentage / 100) * 35;
    
    // Teaching metrics average: 35% weight  
    const metricsAvg = (Object.values(analysis.teachingMetrics).reduce((a, b) => a + b, 0) / 5 / 100) * 35;
    
    // Engagement factors: 20% weight (questions and examples)
    const questionScore = Math.min(10, analysis.questionsAsked * 2);
    const exampleScore = Math.min(10, analysis.examplesGiven * 3);
    const engagementScore = questionScore + exampleScore;
    
    // Duration bonus: 10% weight (reward for longer sessions)
    const durationBonus = Math.min(10, (analysis.totalDuration || 1) * 0.5);
    
    const finalScore = topicScore + metricsAvg + engagementScore + durationBonus;
    
    // Adjusted grade thresholds for fairer grading
    if (finalScore >= 80) return 'A+';
    if (finalScore >= 70) return 'A';
    if (finalScore >= 60) return 'B+';
    if (finalScore >= 50) return 'B';
    if (finalScore >= 40) return 'C+';
    if (finalScore >= 30) return 'C';
    if (finalScore >= 20) return 'D';
    return 'F';
  }

  generateSuggestions(analysis) {
    const suggestions = [];
    if (analysis.onTopicPercentage < 70) { suggestions.push({ type: 'content', priority: 'high', message: `Focus more on ${this.currentTopic}. Only ${analysis.onTopicPercentage}% of content was on-topic.`, action: 'Review lesson plan and stick to key concepts' }); }
    if (analysis.questionsAsked < 3) { suggestions.push({ type: 'engagement', priority: 'medium', message: 'Ask more questions to engage students', action: 'Include 1-2 questions every 5 minutes' }); }
    if (analysis.examplesGiven < 2) { suggestions.push({ type: 'clarity', priority: 'medium', message: 'Use more examples to illustrate concepts', action: 'Prepare 2-3 real-world examples for each concept' }); }
    if (analysis.wordsPerMinute > 160) { suggestions.push({ type: 'pacing', priority: 'high', message: 'Speaking pace is too fast', action: 'Slow down and pause after important points' }); }
    if (analysis.teachingMetrics.clarity < 65) { suggestions.push({ type: 'clarity', priority: 'high', message: 'Use connecting words to improve clarity', action: 'Use words like "therefore", "because", "in other words"' }); }
    return suggestions;
  }

  identifyStrengths(analysis) {
    const strengths = [];
    if (analysis.onTopicPercentage >= 80) strengths.push('Excellent focus on the topic');
    if (analysis.questionsAsked >= 5) strengths.push('Great student engagement through questions');
    if (analysis.examplesGiven >= 3) strengths.push('Good use of examples');
    if (analysis.teachingMetrics.pacing >= 80) strengths.push('Appropriate teaching pace');
    if (analysis.teachingMetrics.clarity >= 80) strengths.push('Clear explanations');
    return strengths.length > 0 ? strengths : ['Keep up the good work!'];
  }

  identifyImprovements(analysis) {
    const improvements = [];
    if (analysis.onTopicPercentage < 70) improvements.push('Stay more focused on the lesson topic');
    if (analysis.questionsAsked < 3) improvements.push('Ask more questions to check understanding');
    if (analysis.examplesGiven < 2) improvements.push('Include more practical examples');
    if (analysis.teachingMetrics.pacing < 65) improvements.push('Adjust speaking pace');
    return improvements;
  }

  startSimulation() {
    const topicKeywords = this.getTopicKeywords();
    const kw = (i) => topicKeywords[i] || topicKeywords[0] || 'concept';
    const simulatedPhrases = [
      `Today we'll learn about ${this.currentTopic} and understand the ${kw(0)}`,
      `Let me explain the concept of ${kw(0)} and ${kw(1)} in detail`,
      `For example, when we have a ${kw(1)} we can solve it using ${kw(2)}`,
      `Can anyone tell me what happens when we apply ${kw(0)}?`,
      `This ${kw(0)} is very important because it relates to ${kw(3)}`,
      `Let's look at another example of ${kw(1)} and ${kw(2)}`,
      `Does everyone understand the ${kw(0)} so far?`,
      `The key point here is the ${kw(2)} which connects to ${kw(0)}`,
      `In other words, we can say that ${kw(0)} equals ${kw(1)}`,
      `Who can solve this ${kw(0)} problem using ${kw(2)}?`,
      `Remember, ${kw(0)} is related to ${kw(3)} and ${kw(1)}`,
      `Let me show you ${kw(0)} step by step with ${kw(2)}`,
      `Any questions about ${kw(1)} before we move on to ${kw(3)}?`,
      `The ${kw(0)} formula helps us calculate ${kw(1)} efficiently`,
      `Therefore, by understanding ${kw(0)} we master ${kw(2)}`
    ];

    this.simulationInterval = setInterval(() => {
      if (!this.isListening) { clearInterval(this.simulationInterval); return; }
      const phrase = simulatedPhrases[Math.floor(Math.random() * simulatedPhrases.length)];
      this.transcript += phrase + ' ';
      this.analyzeSegment(phrase);
      if (this.onTranscriptUpdate) { this.onTranscriptUpdate(this.transcript, ''); }
    }, 3000);
  }
}

export const teacherMonitoringService = new TeacherMonitoringService();
export default teacherMonitoringService;
