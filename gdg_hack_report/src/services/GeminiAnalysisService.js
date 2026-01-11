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

  // Get strict keywords for specific topics - COMPREHENSIVE LIST
  getStrictKeywords(topic, subject) {
    const keywordDatabase = {
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

    // Find matching topic - check for partial matches too
    for (const [key, keywords] of Object.entries(keywordDatabase)) {
      if (topic.includes(key) || key.includes(topic) ||
          key.split(' ').some(word => topic.includes(word))) {
        return keywords;
      }
    }

    // Generate keywords from topic name and add common teaching words
    const topicWords = topic.split(/\s+/).filter(w => w.length > 2);
    return [...topicWords, 'example', 'problem', 'solution', 'answer', 'find', 'calculate', 'solve'];
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
