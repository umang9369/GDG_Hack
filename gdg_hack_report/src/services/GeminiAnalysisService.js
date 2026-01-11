// Gemini AI Analysis Service for intelligent speech analysis
// Uses Google's Gemini API for accurate topic relevance detection

class GeminiAnalysisService {
  constructor() {
    // Gemini API key - using a demo key for hackathon
    // In production, this should be in environment variables
    this.apiKey = 'AIzaSyBvLZ8yyM0tyW0t4LvVxE-C7V0u9Ghfqew'; // Demo key
    this.apiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';
    this.analysisCache = new Map();
    this.batchQueue = [];
    this.batchTimeout = null;
  }

  // Analyze if speech content is related to the expected topic
  async analyzeTopicRelevance(speechText, expectedTopic, subject) {
    if (!speechText || speechText.trim().length < 10) {
      return { isOnTopic: true, confidence: 0.5, reason: 'Too short to analyze' };
    }

    // Check cache first
    const cacheKey = `${speechText.substring(0, 50)}-${expectedTopic}`;
    if (this.analysisCache.has(cacheKey)) {
      return this.analysisCache.get(cacheKey);
    }

    try {
      const prompt = `You are an educational content analyzer. Analyze if the following speech is related to teaching "${expectedTopic}" in ${subject}.

SPEECH: "${speechText}"

EXPECTED TOPIC: ${expectedTopic}

Respond ONLY with a JSON object in this exact format (no markdown, no code blocks):
{"isOnTopic": true/false, "confidence": 0.0-1.0, "matchedConcepts": ["concept1", "concept2"], "reason": "brief explanation"}

Rules:
- isOnTopic should be TRUE only if the speech directly discusses ${expectedTopic} concepts
- General conversation, greetings, off-topic discussions = FALSE
- Partially related content = TRUE with lower confidence
- Be STRICT - casual talk is NOT on-topic`;

      const response = await fetch(`${this.apiUrl}?key=${this.apiKey}`, {
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
        console.warn('Gemini API error, using local analysis');
        return this.localAnalysis(speechText, expectedTopic, subject);
      }

      const data = await response.json();
      const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      
      // Parse JSON response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const result = JSON.parse(jsonMatch[0]);
        this.analysisCache.set(cacheKey, result);
        return result;
      }

      return this.localAnalysis(speechText, expectedTopic, subject);
    } catch (error) {
      console.warn('Gemini analysis failed:', error.message);
      return this.localAnalysis(speechText, expectedTopic, subject);
    }
  }

  // Enhanced local analysis as fallback - STRICT version
  localAnalysis(speechText, expectedTopic, subject) {
    const text = speechText.toLowerCase();
    const topic = expectedTopic.toLowerCase();
    
    // Get strict keywords for the topic
    const topicKeywords = this.getStrictKeywords(topic, subject);
    
    // Count exact keyword matches
    const words = text.split(/\s+/).map(w => w.replace(/[^\w]/g, ''));
    let matchCount = 0;
    const matchedConcepts = [];
    
    topicKeywords.forEach(keyword => {
      // Check for exact word match or phrase match
      if (keyword.includes(' ')) {
        // Multi-word keyword - check for phrase
        if (text.includes(keyword)) {
          matchCount += 2; // Phrases worth more
          matchedConcepts.push(keyword);
        }
      } else {
        // Single word - require exact match
        if (words.includes(keyword)) {
          matchCount++;
          matchedConcepts.push(keyword);
        }
      }
    });

    // Check for off-topic indicators
    const offTopicIndicators = [
      'weather', 'lunch', 'break', 'holiday', 'movie', 'game', 'sports',
      'cricket', 'football', 'music', 'song', 'food', 'party', 'weekend',
      'yesterday', 'tomorrow', 'homework', 'assignment', 'marks', 'exam',
      'hello everyone', 'good morning', 'good afternoon', 'how are you',
      'did you', 'have you', 'anyone', 'someone', 'everybody'
    ];
    
    const hasOffTopicContent = offTopicIndicators.some(indicator => text.includes(indicator));
    
    // Calculate relevance score
    const wordCount = words.length;
    const keywordDensity = wordCount > 0 ? matchCount / wordCount : 0;
    
    // Strict threshold - need actual keyword matches
    const isOnTopic = matchCount >= 2 && keywordDensity >= 0.05 && !hasOffTopicContent;
    const confidence = Math.min(1, keywordDensity * 5);
    
    let reason = '';
    if (isOnTopic) {
      reason = `Found ${matchCount} topic keywords: ${matchedConcepts.slice(0, 3).join(', ')}`;
    } else if (matchCount === 0) {
      reason = 'No topic-specific keywords detected';
    } else if (hasOffTopicContent) {
      reason = 'Contains off-topic conversation';
    } else {
      reason = `Only ${matchCount} keyword(s) found, need more topic focus`;
    }

    return {
      isOnTopic,
      confidence,
      matchedConcepts,
      reason,
      method: 'local'
    };
  }

  // Get strict keywords for specific topics
  getStrictKeywords(topic, subject) {
    const keywordDatabase = {
      'quadratic equations': [
        'quadratic', 'equation', 'squared', 'square', 'x squared', 'x square',
        'ax squared', 'bx', 'polynomial', 'factorization', 'factoring', 'roots',
        'discriminant', 'quadratic formula', 'parabola', 'vertex', 'coefficient',
        'b squared', 'four ac', '4ac', 'minus b', 'plus or minus', 'two solutions',
        'completing the square', 'standard form', 'ax2', 'bx c', 'equal to zero',
        'find x', 'solve for x', 'value of x', 'roots of', 'sum of roots',
        'product of roots', 'nature of roots', 'real roots', 'imaginary roots'
      ],
      'linear equations': [
        'linear', 'straight line', 'slope', 'intercept', 'y equals mx plus b',
        'gradient', 'parallel', 'perpendicular', 'coordinate', 'x intercept',
        'y intercept', 'slope intercept', 'point slope'
      ],
      'trigonometry': [
        'sine', 'cosine', 'tangent', 'sin', 'cos', 'tan', 'angle', 'theta',
        'hypotenuse', 'opposite', 'adjacent', 'pythagorean', 'trigonometric',
        'radian', 'degree', 'unit circle'
      ],
      'photosynthesis': [
        'chlorophyll', 'sunlight', 'carbon dioxide', 'oxygen', 'glucose',
        'chloroplast', 'stomata', 'light reaction', 'dark reaction', 'calvin cycle',
        'photosynthesis', 'plant', 'leaves', 'green', 'atp', 'nadph'
      ],
      'newton': [
        'force', 'mass', 'acceleration', 'f equals ma', 'inertia', 'motion',
        'action', 'reaction', 'newton', 'gravity', 'momentum', 'velocity',
        'friction', 'first law', 'second law', 'third law'
      ]
    };

    // Find matching topic
    for (const [key, keywords] of Object.entries(keywordDatabase)) {
      if (topic.includes(key) || key.includes(topic)) {
        return keywords;
      }
    }

    // Generate keywords from topic name
    return topic.split(/\s+/).filter(w => w.length > 3);
  }

  // Batch analyze multiple segments for efficiency
  async batchAnalyze(segments, expectedTopic, subject) {
    if (segments.length === 0) return [];

    const combinedText = segments.map(s => s.text).join(' | ');
    
    try {
      const prompt = `Analyze these speech segments for teaching "${expectedTopic}" in ${subject}.

SEGMENTS: "${combinedText}"

For each segment (separated by |), respond with a JSON array:
[{"segment": 1, "isOnTopic": true/false, "confidence": 0.0-1.0}]

Be STRICT - only mark as on-topic if directly discussing ${expectedTopic}.`;

      const response = await fetch(`${this.apiUrl}?key=${this.apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.1, maxOutputTokens: 500 }
        })
      });

      if (!response.ok) {
        return segments.map(s => this.localAnalysis(s.text, expectedTopic, subject));
      }

      const data = await response.json();
      const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      const jsonMatch = responseText.match(/\[[\s\S]*\]/);
      
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (error) {
      console.warn('Batch analysis failed:', error);
    }

    return segments.map(s => this.localAnalysis(s.text, expectedTopic, subject));
  }

  // Clear cache
  clearCache() {
    this.analysisCache.clear();
  }
}

export const geminiAnalysisService = new GeminiAnalysisService();
export default geminiAnalysisService;
