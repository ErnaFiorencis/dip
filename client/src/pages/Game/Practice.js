import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './Practice.css';

export const Practice = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { subject, topic} = location.state;
  const [progress, setProgress] = useState(0);
  const [finished, setFinished] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [questions, setQuestions] = useState([{
    question_id: 0,
    question: '',
    answers: ['','','',''],
    correctAnswer: 1
  }]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [numberOfQuestions, setNumberOfQuestions] = useState(10);
  const [timer, setTimer] = useState(0); // Timer state
  const [wrongAnswerIdx, setWrongAnswerIdx] = useState(null); // Track the wrong answer index
  const [sessionId, setSessionId] = useState(null); // Store session ID
  const [stats, setStats] = useState({
    correct_answers: 0,
    wrong_answers: 0,
    total_questions: 0,
    time_taken: 0,
  });
  const [points, setPoints] = useState(1);
  const [readyToSend, setReadyToSend] = useState(false); // Flag to trigger backend request
  const [attempts, setAttempts] = useState(0);

  const BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api/v1';

  const fetchQuestions = async () => {
    const topic_id = topic.topic_id;
    try {
      const response = await fetch(`${BASE_URL}/questions/adaptive/${topic_id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      let data = await response.json();
      data = data.map(q => ({
        question_id: q.question_id,
        question: q.question,
        answers: [q.answer1, q.answer2, q.answer3, q.answer4],
        correctAnswer: q.correct_answer - 1, // Adjusting to 0-based index
      }));
      setQuestions(data);
      if (data.length < numberOfQuestions) {
        setNumberOfQuestions(data.length);
      }
    } catch (error) {
      console.error('Error fetching questions:', error);
    }
  };
  useEffect(() => {
    fetchQuestions();
  }, [topic, BASE_URL]);

    // Start game session
  useEffect(() => {
    const startGameSession = async () => {
      try {
        const response = await fetch(`${BASE_URL}/game-sessions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify({
            topic_id: topic.topic_id,
            game_mode: 'practice',
            opponent_id: null,
          }),
        });
        const data = await response.json();
        setSessionId(data.session_id); // Store the session ID
      } catch (error) {
        console.error('Error starting game session:', error);
      }
    };
    startGameSession();
  }, [topic, BASE_URL]);

  useEffect(() => {
    let interval;
    if(finished) {
      endGameSession();
    }
    if (!finished) {
      interval = setInterval(() => {
        setTimer(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [finished]);

  const recordQuestionAttempt = async (question_id, selected_answer, is_correct, response_time) => {
    console.log(question_id)
    console.log(attempts)
    try {
      const response = await fetch(`${BASE_URL}/game-sessions/${sessionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          question_id,
          selected_answer,
          is_correct,
          response_time,
          attempts,
          topic_id: topic.topic_id,
        }),
      });
      if (!response.ok) {
        throw new Error('Failed to record question attempt');
      }
    }
    catch (error) {
      console.error('Error recording question attempt:', error);
    }
  }

  const handleAnswer = (index) => {
    const isCorrect = (index) === questions[currentIdx].correctAnswer;
    setAttempts((prevAttempts) => prevAttempts + 1);
    setStats((prev) => ({
      ...prev,
      correct_answers: prev.correct_answers + (isCorrect ? 1 : 0),
      wrong_answers: prev.wrong_answers + (!isCorrect ? 1 : 0)
    }));
    recordQuestionAttempt(questions[currentIdx].question_id, index + 1, isCorrect, timer);
    if (isCorrect) {
      setIsRunning(true);
      setWrongAnswerIdx(null); // Reset wrong answer index
      const newProgress = ((currentIdx + 1) / numberOfQuestions) * 100;
      setProgress(newProgress);

      setTimeout(() => {
        setIsRunning(false);
        if (currentIdx + 1 === numberOfQuestions) {
          setFinished(true);
        } else {
          setCurrentIdx(currentIdx + 1);
          setAttempts(0); 
        }
      }, 800);
    } else {
      setWrongAnswerIdx(index); // Set the wrong answer index
      setTimeout(() => setWrongAnswerIdx(null), 1000); // Reset after 1 second
    }
  };

    // End game session
  const endGameSession = async () => {
    let updatedPoints = points;

    if (stats.wrong_answers <= 0) {
      updatedPoints += 1;
    }
    if (stats.time_taken < 60) {
      updatedPoints += 1;
    }

    setPoints(updatedPoints); // Update points
    setReadyToSend(true); // Set flag to true to trigger backend request
  };

  const handleGoBack = () => {
    console.log(location.state);
    navigate('/', {state: location.state});
  }

  useEffect(() => {
  const sendToBackend = async () => {
    if (readyToSend) {
      try {
        const response = await fetch(`${BASE_URL}/game-sessions/${sessionId}/end`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify({
            correct_answers: stats.correct_answers,
            wrong_answers: stats.wrong_answers,
            total_questions: numberOfQuestions,
            winner: 1,
            points: points, // Use updated points
            time_taken: timer,
          }),
        });
        if (!response.ok) {
          throw new Error('Failed to end game session');
        }
      } catch (error) {
        console.error('Error ending game session:', error);
      } finally {
        setReadyToSend(false); // Reset the flag
      }
    }
  };

  sendToBackend();
}, [readyToSend, points, stats, timer, numberOfQuestions, sessionId, BASE_URL]);

  return (
    <div className="practice-container">
      <div className="top-icons">
        <div className="left-icons">
          <button className="icon-button back" aria-label="Go Back" onClick={handleGoBack}>🔙</button>
        </div>
        <div className="right-icons">
        <button className="icon-button home" aria-label="Home" onClick={() => window.location.href = '/'}>🏠</button>
          <button className="icon-button profile" aria-label="Profile" onClick={() => window.location.href = '/profile'}>👤</button>
          <button className="icon-button leaderboard" aria-label="Leaderboard" onClick={() => window.location.href = '/leaderboard'}>🏆</button>
        </div>
      </div>
      <div className="main-part">
        <p className='subject-text'>{subject.name} : {topic.name}</p>
        <div className="race-container">
          <div className="timer">⏱️ {timer}s</div> {/* Timer display */}
          <div className="finish-line">KRAJ</div>
          <div className="race-track">
            <div
              className={`race-character ${isRunning ? 'running' : ''}`}
              style={{ bottom: `calc(${progress}% - 10px)` }}
            ></div>
          </div>
        </div>
        {!finished ? (
          <div className="question-block">
            <div className="question">{questions[currentIdx].question}</div>
            <div className="answers">
              {questions[currentIdx].answers.map((ans, idx) => (
                <button
                  key={idx}
                  className={`answer-btn ${wrongAnswerIdx === idx ? 'wrong' : ''}`}
                  onClick={() => handleAnswer(idx)}
                >
                  {ans}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="finished-message">
            <div className='finish-msg'>🎉 Bravo! 🎉 Osvojio si {points}</div>
            <button className="restart-button" onClick={() => window.location.reload()}>Igraj ponovno</button>
          </div>
        )}
      </div>
    </div>
  );
};
