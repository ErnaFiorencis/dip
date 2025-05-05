import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './StudentCompetition.css';

export const StudentCompetition = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [student1LoggedIn, setStudent1LoggedIn] = useState(false);
  const [student1Credentials, setStudent1Credentials] = useState({ user_name: '', password: '' });
  const [gameStarted, setGameStarted] = useState(false);
  const [countdown, setCountdown] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [ropePosition, setRopePosition] = useState(50); // 50 means middle
  const { subject, topic, activity, topic_id } = location.state;
  const [winner, setWinner] = useState(null);
  const [timer, setTimer] = useState(120); // 2-minute countdown
  const [errorMessage, setErrorMessage] = useState('');
  const [wrongAnswerIdx, setWrongAnswerIdx] = useState(null);

  const [player1Ready, setPlayer1Ready] = useState(false);
  const [player2Ready, setPlayer2Ready] = useState(false);

  const [player1Stats, setPlayer1Stats] = useState({
    correct_answers: 0,
    wrong_answers: 0,
    total_questions: 0,
    time_taken: 0,
  });
  
  const [player2Stats, setPlayer2Stats] = useState({
    correct_answers: 0,
    wrong_answers: 0,
    total_questions: 0,
    time_taken: 0,
  });

  const [player1, setPlayer1] = useState(null); // Store Player 2's token
  const [player1SessionId, setPlayer1SessionId] = useState(null); // Player 1's session ID
  const [player2SessionId, setPlayer2SessionId] = useState(null); // Player 2's session ID

  const BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api/v1';

  // Handle user login
  const handleStudent1Login = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${BASE_URL}/students/signin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(student1Credentials),
      });
      if (!response.ok) {
        const errorData = await response.json();
        setErrorMessage(errorData.message || 'Login failed. Please try again.');
        return;
      }
      const data = await response.json();
      //localStorage.setItem('token', data.token);
      setPlayer1(data); // Store Player 2's token
      setStudent1LoggedIn(true);
      setErrorMessage('');
    } catch (error) {
      setErrorMessage('An error occurred during login. Please try again.');
    }
  };

  // Fetch questions from the backend
  useEffect(() => {
    const fetchQuestions = async () => {
      console.log(topic.topic_id);
      const topic_id = topic.topic_id;
      try {
        const response = await fetch(`${BASE_URL}/questions/topic-active/${topic_id}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        if (!response.ok) {
          setErrorMessage('Failed to fetch questions. Please try again.');
          return;
        }
        const data = await response.json();
        const formattedQuestions = data.map((q) => ({
          question: q.question,
          answers: [q.answer1, q.answer2, q.answer3, q.answer4],
          correctAnswer: q.correct_answer,
        }));
        setQuestions(formattedQuestions);
        setCurrentQuestion(data[0]);
      } catch (error) {
        setErrorMessage('An error occurred while fetching questions.');
      }
    };

    if (student1LoggedIn) {
      fetchQuestions();
    }
  }, [student1LoggedIn]);

  // Countdown timer
  useEffect(() => {
    if (countdown === 0) {
      setGameStarted(true);
      setCurrentQuestion(questions[0]);
    }
    if (!countdown) return;
    const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  // Game timer
  useEffect(() => {
    if (timer > 0 && gameStarted) {
      const countdown = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(countdown);
    } else if (timer === 0) {
      setWinner(ropePosition < 50 ? 'Player 2' : 'Player 1');
      handleGameEnd();
    }
  }, [timer, gameStarted]);

  // Handle answers
  const handleAnswer = (player, index) => {
    console.log('Player:', player, 'Index:', index, 'Correct Answer:', currentQuestion.correctAnswer);
    const isCorrect = index === currentQuestion.correctAnswer - 1 ;
    const startTime = performance.now();
  
    if (player === 1) {
      setPlayer1Stats((prev) => ({
        ...prev,
        correct_answers: prev.correct_answers + (isCorrect ? 1 : 0),
        wrong_answers: prev.wrong_answers + (!isCorrect ? 1 : 0),
        time_taken: prev.time_taken + (performance.now() - startTime) / 1000,
      }));
    } else if (player === 2) {
      setPlayer2Stats((prev) => ({
        ...prev,
        correct_answers: prev.correct_answers + (isCorrect ? 1 : 0),
        wrong_answers: prev.wrong_answers + (!isCorrect ? 1 : 0),
        time_taken: prev.time_taken + (performance.now() - startTime) / 1000,
      }));
    }
  
    if (isCorrect) {
      setWrongAnswerIdx(null);
      const movement = player === 1 ? -5 : 5;
      setRopePosition((prev) => Math.max(0, Math.min(100, prev + movement)));
      const nextQuestionIndex = questions.indexOf(currentQuestion) + 1;
      if (nextQuestionIndex < questions.length) {
        setCurrentQuestion(questions[nextQuestionIndex]);
      } else {
        setCurrentQuestion(questions[0]);
      }
      setPlayer1Stats((prev) => ({
        ...prev,
        total_questions: prev.total_questions + 1
      }));
      setPlayer2Stats((prev) => ({
        ...prev,
        total_questions: prev.total_questions + 1
      }));
    } else {
      setWrongAnswerIdx({ player, index });
      setTimeout(() => setWrongAnswerIdx(null), 1000);
    }
  };


  const handleGoBack = () => {
    navigate('/', {state: location.state});
  }
  const handleCancel = () => {
    setTimer(0); // Stop the timer
    setGameStarted(false);
    setStudent1LoggedIn(false);
    setStudent1Credentials({ user_name: '', password: '' });
    setCountdown(null);
    setCurrentQuestion(null);
    setQuestions([]);
    setRopePosition(50); // Reset rope position
    setWinner(null); // Reset winner
    setPlayer1(null); // Reset Player 2's token
  }

  useEffect(() => {
    if (ropePosition <= 5) {
      setWinner("Player 1");
      setTimer(0); // Stop the timer
      handleGameEnd();

    } else if (ropePosition >= 95) {
      setWinner("Player 2");
      setTimer(0); // Stop the timer
      handleGameEnd();
    }
    
  }, [ropePosition]);


  const startGame = async () => {
    try {
      // Start Player 2's session (host)
      const player2Response = await fetch(`${BASE_URL}/game-sessions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          topic_id: topic.topic_id,
          game_mode: 'pvp',
          opponent_id: player1.user_id,
        }),
      });
  
      if (!player2Response.ok) {
        throw new Error('Failed to start Player 2 session');
      }
  
      const player2Data = await player2Response.json();
      setPlayer2SessionId(player2Data.session_id);
  
      // Start Player 1's session (guest)
      const player1Response = await fetch(`${BASE_URL}/game-sessions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${player1.token}`,
        },
        body: JSON.stringify({
          topic_id: topic.topic_id,
          game_mode: 'pvp',
          opponent_id: localStorage.getItem('user_id'),
        }),
      });
  
      if (!player1Response.ok) {
        throw new Error('Failed to start Player 1 session');
      }
  
      const player1Data = await player1Response.json();
      setPlayer1SessionId(player1Data.session_id);
      
  
      setCountdown(3);
      if(timer <= 0){
        setTimer(120);
      }
      setRopePosition(50); // Reset rope position
      setWinner(null); // Reset winner
      setPlayer1Ready(false);
      setPlayer2Ready(false);
      //setGameStarted(true);
      setPlayer1Stats({
        correct_answers: 0,
        wrong_answers: 0,
        total_questions: 1,
        time_taken: 0,
      });
      setPlayer2Stats({
        correct_answers: 0,
        wrong_answers: 0,
        total_questions: 1,
        time_taken: 0,
      });
    } catch (error) {
      console.error('Error starting game sessions:', error);
    }
  };

  const handleGameEnd = async () => {
    console.log('Game ended');
    console.log(winner);
    try {
      // Calculate points for Player 1
      let player1Points = 0;
      if (winner === 'Player 1') {
        player1Points += 5; // 5 points for winning
        if (timer > 0) {
          player1Points += 2; // Additional 2 points for winning before time runs out
        }
      }
  
      // Calculate points for Player 2
      let player2Points = 0;
      if (winner === 'Player 2') {
        player2Points += 5; // 5 points for winning
        if (timer > 0) {
          player2Points += 2; // Additional 2 points for winning before time runs out
        }
      }
      // End Player 2's session
      const player2Response = await fetch(`${BASE_URL}/game-sessions/${player2SessionId}/end`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          correct_answers: player2Stats.correct_answers,
          wrong_answers: player2Stats.wrong_answers,
          total_questions: player2Stats.total_questions,
          time_taken: Math.floor(player2Stats.time_taken * 1000),
          points: player2Points,
          winner: winner === 'Player 2',
        }),
      });
  
      if (!player2Response.ok) {
        throw new Error('Failed to end Player 2 session');
      }
  
      // End Player 1's session
      const playe1Response = await fetch(`${BASE_URL}/game-sessions/${player1SessionId}/end`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${player1.token}`,
        },
        body: JSON.stringify({
          correct_answers: player1Stats.correct_answers,
          wrong_answers: player1Stats.wrong_answers,
          total_questions: player1Stats.total_questions,
          time_taken: Math.floor(player1Stats.time_taken * 1000),
          points: player1Points,
          winner: winner === 'Player 1',
        }),
      });
  
      if (!playe1Response.ok) {
        throw new Error('Failed to end Player 1 session');
      }
    } catch (error) {
      console.error('Error ending game sessions:', error);
    }
  };

  const handlePlayer1Ready = () => {
    setPlayer1Ready(true);
    if (player2Ready) {
      setTimer(123);
      startGame();
    }
  };
  
  const handlePlayer2Ready = () => {
    setPlayer2Ready(true);
    if (player1Ready) {
      setTimer(123);
      startGame();
    }
  };

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = time % 60;
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  const renderGameInterface = (player) => (
    <>
      <div className='question-container'>
        <div className='question'>{currentQuestion.question}</div>
        <div className="answer-buttons">
          {currentQuestion.answers.map((answer, index) => (
            <button
              key={index}
              className={`answer-btn ${wrongAnswerIdx?.player === player && wrongAnswerIdx?.index === index ? 'wrong' : ''}`}
              onClick={() => handleAnswer(player, index)}
            >
              {answer}
            </button>
          ))}
        </div>
      </div>
      <button className='cancel' onClick={handleCancel}>
        Odustani
      </button>
    </>
  );

  return (
    <div className="competition-container">
      {/* Player 1 Interface */}
      <div className={`student-interface student1 ${!gameStarted ? 'game-started' : ''}`}>
        <div className="rotated-content">
          {!student1LoggedIn ? (
            <>
              <h2 className="header">Upiši svoje podatke:</h2>
              <form onSubmit={handleStudent1Login} className="login-form">
                <label>
                  Nadimak:
                  <input
                    type="text"
                    value={student1Credentials.user_name}
                    onChange={(e) => setStudent1Credentials(prev => ({ ...prev, user_name: e.target.value }))}
                    required
                  />
                </label>
                <label>
                  Lozinka:
                  <input
                    type="password"
                    value={student1Credentials.password}
                    onChange={(e) => setStudent1Credentials(prev => ({ ...prev, password: e.target.value }))}
                    required
                  />
                </label>
                <button type="submit" className="login-button">Login</button>
              </form>
              {errorMessage && <p className="error-message">{errorMessage}</p>}
            </>
          ) : countdown ? (
            <div className="waiting-state">
              <h2 className="countdown">Igra počinje za: {countdown}</h2>
              <img src="/icons/standard.png" alt="Standard Sticker" className="sticker" />
            </div>
          ) : !gameStarted ? (
            <div className="waiting-state">
              <h2>Bok, {student1Credentials.user_name}!</h2>
              <p>Pričekaj protivnika da započne igru...</p>
              <img src="/icons/cool.png" alt="Cool Sticker" className="sticker-cool" />
              <button className='cancel' onClick={handleCancel}>
                Odustani
              </button>
            </div>
          ) : winner ? (
            <>
            <h2>{winner === "Player 1" ? "Bravo! Pobijedio si!" : "Izgubio si!"}</h2>
            <button className="st-comp-buttons" onClick={handlePlayer1Ready} disabled={player1Ready}>Ponovno Igraj</button>
            <button className="st-comp-buttons cancel" onClick={handleCancel}>Odustani </button>
            </>
          ) : (
            renderGameInterface(1)
          )}
        </div>
      </div>

      {/* Tug of War Rope */}
      {gameStarted && (
        <div className="tug-of-war">
          <div className='left-of-rope'>{formatTime(timer)}</div>
          <div className="rope">
            <div className="mark" style={{ top: `${ropePosition}%` }}></div>
          </div>
          <div className='right-of-rope rotated-content'>{formatTime(timer)}</div>
        </div>
      )}

      {/* Player 2 Interface */}
      <div className={`student-interface student2 ${!gameStarted ? 'game-started' : ''}`}>
        {countdown ? (
          <div className="waiting-state">
            <h2 className="countdown">Igra počinje za: {countdown}</h2>
            <img src="/icons/standard.png" alt="Standard Sticker" className="sticker" />
          </div>
        ) : !gameStarted ? (
          <div className="waiting-state">
            <h1>Pričekaj protivnika da se prijavi...</h1>
            {student1LoggedIn && (
              <button className="start-button" onClick={startGame}>Započni igru</button>
            )}
            <img src="/icons/sleepy.png" alt="Sleepy Sticker" className="sticker" />
            <button className="cancel" onClick={handleGoBack}>
              Odustani
            </button>
          </div>
        ) : winner ? (
          <>
          <h2>{winner === "Player 2" ? "Pobijedio si!" : "Izgubio si!"}</h2>
          <button className="st-comp-buttons" onClick={handlePlayer2Ready} disabled={player2Ready}>Ponovno - isti igrač</button>
          <button className="st-comp-buttons" onClick={handleCancel}>Ponovno - drugi igrač</button>
          <button className="st-comp-buttons cancel" onClick={handleGoBack}>Odustani </button>
          </>
        ) : (
          renderGameInterface(2)
        )}
      </div>
    </div>
  );
};
