import React, { useState } from 'react';
import TeacherValidator from './components/TeacherValidator';
import './App.css';

function App() {
  const [validation, setValidation] = useState(null);

  const topicText = "Photosynthesis is the process by which plants convert sunlight, carbon dioxide, and water into glucose and oxygen.";

  const handleResult = (isCorrect, score) => {
    setValidation({ isCorrect, score });
  };

  return (
    <div className="App" style={{ padding: '40px', fontFamily: 'Arial' }}>
      <h1>GDG Hackathon - Offline Student App</h1>
      <h2>Teacher Validation Module</h2>
      <p><strong>Today's Topic:</strong> {topicText}</p>

      <TeacherValidator topicText={topicText} onValidationResult={handleResult} />

      {validation && (
        <div style={{ fontSize: '24px', marginTop: '30px', color: validation.isCorrect ? 'green' : 'red' }}>
          <strong>Result: Teacher is {validation.isCorrect ? 'Teaching Correctly' : 'Off-Topic'}</strong>
          <br />
          Similarity Score: {(validation.score * 100).toFixed(0)}%
        </div>
      )}
    </div>
  );
}

export default App;
