import React, { useState, useEffect, useRef } from 'react';

function TeacherValidator({ topicText, onValidationResult }) {
  const [transcript, setTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [status, setStatus] = useState('Ready (Chrome/Edge recommended)');
  const [aggregatedTranscript, setAggregatedTranscript] = useState('');

  const recognitionRef = useRef(null);
  const isRestartingRef = useRef(false);  // Prevent error loops

  useEffect(() => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      setStatus('Browser does not support Speech Recognition (use Chrome/Edge)');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript + ' ';
        }
      }
      if (finalTranscript) {
        setTranscript(prev => prev + finalTranscript);
        setAggregatedTranscript(prev => prev + finalTranscript);
      }
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      setStatus('Error: ' + event.error);
      if (isListening) {
        // Auto-restart on error (except abort)
        if (event.error !== 'aborted') {
          setTimeout(() => startRecognition(), 1000);
        }
      }
    };

    recognition.onend = () => {
      setStatus('Stopped listening');
      setIsListening(false);
      // Auto-restart if we were supposed to be listening
      if (isListening && !isRestartingRef.current) {
        isRestartingRef.current = true;
        setTimeout(() => {
          startRecognition();
          isRestartingRef.current = false;
        }, 500);
      }
    };

    recognitionRef.current = recognition;

    const startRecognition = () => {
      try {
        recognition.start();
        setStatus('Listening... Speak now!');
        setIsListening(true);
      } catch (err) {
        // Ignore "already started" errors
        if (err.message.includes('already started')) {
          setStatus('Listening...');
          setIsListening(true);
        } else {
          setStatus('Start error: ' + err.message);
        }
      }
    };

    // Expose start function globally for button
    window.startListening = startRecognition;

    return () => {
      recognition.stop();
    };
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) return;

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      window.startListening();
    }
  };

  // Improved similarity: percentage of key topic words covered
  useEffect(() => {
    if (aggregatedTranscript.length > 50 && topicText) {
      const score = calculateSimilarity(aggregatedTranscript, topicText);
      const isCorrect = score >= 0.5;
      onValidationResult?.(isCorrect, score);
    }
  }, [aggregatedTranscript, topicText]);

  const calculateSimilarity = (transcribed, topic) => {
    const topicWords = topic
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 3 && !['the', 'is', 'by', 'which', 'and', 'to', 'in', 'of', 'a', 'an', 'for', 'with', 'from'].includes(word));

    const transcriptWords = transcribed
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 3);

    if (topicWords.length === 0) return 0;

    let matches = 0;
    topicWords.forEach(word => {
      if (transcriptWords.includes(word)) matches++;
    });

    return matches / topicWords.length;
  };

  return (
    <div style={{ padding: '30px', border: '2px solid #007bff', borderRadius: '10px', background: '#f8f9fa', marginTop: '20px' }}>
      <h3>Teacher Voice Validation (Browser Built-in Recognition)</h3>
      <p><strong>Status:</strong> {status}</p>
      <button onClick={toggleListening} style={{ padding: '10px 20px', fontSize: '16px' }}>
        {isListening ? 'Stop Listening' : 'Start Listening (Continuous)'}
      </button>
      <p><strong>Current Transcript:</strong> {transcript || 'No speech yet'}</p>
      <p><strong>Full Session:</strong> {aggregatedTranscript || 'Waiting...'}</p>
      {aggregatedTranscript && topicText && (
        <p><strong>Topic Match Score:</strong> {calculateSimilarity(aggregatedTranscript, topicText).toFixed(2)}</p>
      )}
    </div>
  );
}

export default TeacherValidator;