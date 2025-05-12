import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './AnketaForm.css';

export const AnketaForm = ({ sessionId, onSubmitted }) => {
  // Data structure for each game mode
  const initialRatings = {
    mode1: { zabava: null, motivacija: null, ponovioBi: null },
    mode2: { zabava: null, motivacija: null, ponovioBi: null },
    mode3: { zabava: null, motivacija: null, ponovioBi: null }
  };

  const [ratings, setRatings] = useState(initialRatings);
  const [najdraziMode, setNajdraziMode] = useState(null);
  const [komentar, setKomentar] = useState('');
  const [submitted, setSubmitted] = useState(false);
  
  const navigate = useNavigate();

  const updateRating = (mode, field, value) => {
    setRatings(prev => ({
      ...prev,
      [mode]: {
        ...prev[mode],
        [field]: value
      }
    }));
  };

  const isAllRequired = () => {
    // Check if all required fields are filled
    for (const mode of Object.keys(ratings)) {
      const modeData = ratings[mode];
      if (modeData.zabava === null || 
          modeData.motivacija === null || 
          modeData.ponovioBi === null) {
        return false;
      }
    }
    return najdraziMode !== null; // Also require the favorite mode selection
  };

  const BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');

    for (const mode of Object.keys(ratings)) {
      const modeData = ratings[mode];
      if (modeData.zabava === null || 
          modeData.motivacija === null || 
          modeData.ponovioBi === null) {
        alert('Molimo vas da ispunite sve obavezne stavke.');
        return;
      }
      await fetch(`${BASE_URL}/anketa`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          game_mode: mode,
          zabava: modeData.zabava,
          motivacija: modeData.motivacija,
          ponovio_bi: modeData.ponovioBi,
          najvise_svidjelo: najdraziMode === mode,
        }),
      });
    }
    
    await fetch(`${BASE_URL}/anketa`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        session_id: sessionId,
        mode1: ratings.mode1,
        mode2: ratings.mode2,
        mode3: ratings.mode3,
        najdrazi_mode: najdraziMode,
        komentar: komentar
      }),
    });
    
    setSubmitted(true);
    if (onSubmitted) onSubmitted();
  };

  if (submitted) {
    navigate('/profile');
  }

  // Mode-specific questions
  const modeQuestions = {
    mode1: {
      title: 'Igra: vježba',
      zabava: {
        question: 'Koliko ti je bio zabavan igrati igru vježbe?',
        options: [
          { value: 1, label: '😐' },
          { value: 2, label: '🙂' },
          { value: 3, label: '😃' }
        ]
      },
      motivacija: {
        question: 'Koliko te motivirala igra vježbe?',
        min: 1,
        max: 10,
        minLabel: 'Malo',
        maxLabel: 'Puno'
      },
      ponovioBi: {
        question: 'Bi li volio/la igrati igru vježbe opet?',
        options: [
          { value: true, label: '👍' },
          { value: false, label: '👎' }
        ]
      }
    },
    mode2: {
      title: 'Natjecanje protiv računala/robota',
      zabava: {
        question: 'Koliko zabavno ti je bilo natjecati se s računalom?',
        options: [
          { value: 1, label: '😐' },
          { value: 2, label: '🙂' },
          { value: 3, label: '😃' }
        ]
      },
      motivacija: {
        question: 'Koliko ti je bilo bitno pobijediti računalo?',
        min: 1,
        max: 10,
        minLabel: 'Malo',
        maxLabel: 'Puno'
      },
      ponovioBi: {
        question: 'Bi li se volio/la ponovno natjecati s računalom?',
        options: [
          { value: true, label: '👍' },
          { value: false, label: '👎' }
        ]
      }
    },
    mode3: {
      title: 'Natjecanje protiv drugog učenika',
      zabava: {
        question: 'Koliko ti je bilo zabavno natjecati se protiv drugog učenika?',
        options: [
          { value: 1, label: '😐' },
          { value: 2, label: '🙂' },
          { value: 3, label: '😃' }
        ]
      },
      motivacija: {
        question: 'Koliko ti je bilo bitno pobijediti drugog učenika?',
        min: 1,
        max: 10,
        minLabel: 'Malo',
        maxLabel: 'Puno'
      },
      ponovioBi: {
        question: 'Bi li volio/la ponovno igrati protiv drugog učenika?',
        options: [
          { value: true, label: '👍' },
          { value: false, label: '👎' }
        ]
      }
    }
  };

  const renderModeSection = (mode) => {
    const modeData = ratings[mode];
    const questions = modeQuestions[mode];
    
    return (
      <div className="mode-section">
        <h3>{questions.title}</h3>
        
        <div className="question-group">
          <label>{questions.zabava.question}</label>
          <div className="button-group">
            {questions.zabava.options.map(option => (
              <button 
                key={`zabava-${option.value}`}
                type="button" 
                onClick={() => updateRating(mode, 'zabava', option.value)} 
                className={`icon-button-a ${modeData.zabava === option.value ? 'selected' : ''}`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
        
        <div className="question-group">
          <label>{questions.motivacija.question}</label>
          <div className="slider-container">
            <span className="slider-label">{questions.motivacija.minLabel}</span>
            <input 
              type="range" 
              min={questions.motivacija.min} 
              max={questions.motivacija.max} 
              value={modeData.motivacija || questions.motivacija.min} 
              onChange={(e) => updateRating(mode, 'motivacija', parseInt(e.target.value))}
              className="slider"
            />
            <span className="slider-label">{questions.motivacija.maxLabel}</span>
          </div>
           {modeData.motivacija && <span className="slider-value">{modeData.motivacija}</span>}
        </div>
        
        <div className="question-group">
          <label>{questions.ponovioBi.question}</label>
          <div className="button-group">
            {questions.ponovioBi.options.map(option => (
              <button 
                key={`ponovioBi-${option.value}`}
                type="button" 
                onClick={() => updateRating(mode, 'ponovioBi', option.value)} 
                className={`icon-button-a ${modeData.ponovioBi === option.value ? 'selected' : ''}`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="welcome-container">
      <div className="top-icons">
        <div className="left-icons">
          <button className="icon-button back" aria-label="Go Back" onClick={() => navigate(-1)}>
            🔙
          </button>
        </div>
        <div className="right-icons">
          <button className="icon-button home" aria-label="Home" onClick={() => navigate('/')}>
            🏠
          </button>
          <button className="icon-button profile" aria-label="Profile" onClick={() => navigate('/profile')}>
            👤
          </button>
          <button className="icon-button leaderboard" aria-label="Leaderboard" onClick={() => navigate('/leaderboard')}>
            🏆
          </button>
        </div>
      </div>

      <h2>Anketa o igri</h2>
      <p>Puno hvala na sudjelovanju! Za kraj molim te ispuni anketu o igri</p>

      <form onSubmit={handleSubmit} className="anketa-form">
        {renderModeSection('mode1')}
        {renderModeSection('mode2')}
        {renderModeSection('mode3')}
        
        <div className="favorite-mode-section">
          <h3>Koji način igre ti se najviše svidio?</h3>
          <div className="button-group">
            <button 
              type="button" 
              onClick={() => setNajdraziMode('mode1')} 
              className={najdraziMode === 'mode1' ? 'selected' : ''}
            >
              Igra vježbe
            </button>
            <button 
              type="button" 
              onClick={() => setNajdraziMode('mode2')} 
              className={najdraziMode === 'mode2' ? 'selected' : ''}
            >
              Natjecanje protiv računala
            </button>
            <button 
              type="button" 
              onClick={() => setNajdraziMode('mode3')} 
              className={najdraziMode === 'mode3' ? 'selected' : ''}
            >
              Natjecanje protiv drugog učenika
            </button>
          </div>
        </div>
        
        <button 
          type="submit" 
          className="submit-button"
          disabled={!isAllRequired()}
        >
          Pošalji
        </button>
      </form>
    </div>
  );
};