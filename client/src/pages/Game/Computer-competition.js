import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './ComputerCompetition.css';

export const ComputerCompetition = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [ropePosition, setRopePosition] = useState(50);
  const { subject, topic, activity, topic_id } = location.state;
  const [questions, setQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [winner, setWinner] = useState(null);
  const [timer, setTimer] = useState(120);
  const [wrongAnswerIdx, setWrongAnswerIdx] = useState(null); 
  const [robotAnswerInterval, setRobotAnswerInterval] = useState(null);
  const [studentStats, setStudentStats] = useState({
    correct_answers: 0,
    wrong_answers: 0,
    total_questions: 1,
    time_taken: 0,
  });
  const [robotFeedback, setRobotFeedback] = useState(null); // 'correct' or 'wrong'
  const [robotIsAnswering, setRobotIsAnswering] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  
  const BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api/v1';

  useEffect(() => {
    const fetchQuestions = async () => {
      const topic_id = topic.topic_id;
      try {
        const response = await fetch(`${BASE_URL}/questions/topic-active/${topic_id}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        const data = await response.json();
        const formattedQuestions = data.map((q) => ({
          question: q.question,
          answers: [q.answer1, q.answer2, q.answer3, q.answer4],
          correctAnswer: q.correct_answer,
        }));
        setQuestions(formattedQuestions);
        setCurrentQuestion(formattedQuestions[0]);
      } catch (error) {
        console.error('Error fetching questions:', error);
      }
    };
    fetchQuestions();
  }, [topic, BASE_URL]);

  useEffect(() => {
    if (timer > 0 && gameStarted) {
      const countdown = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(countdown);
    } else if (timer === 0) {
      setTimer(-1);
      setWinner(ropePosition > 50 ? 'Vrijeme je isteklo, bio si bolji!' : 'Vrijeme je istrklo, računalo je bilo bolje');
      handleGameEnd(ropePosition > 50, studentStats);
      setGameStarted(false);
    }
  }, [timer, gameStarted]);

    // Robot answers adaptively
  useEffect(() => {
      if (gameStarted && currentQuestion) {
        console.log(studentStats);
        const averageTime = studentStats.total_questions > 1 ? (studentStats.time_taken / studentStats.correct_answers) * 10000 : 7;
        console.log('Average time taken:', averageTime);
        const accuracy = studentStats.total_questions > 0 ? studentStats.correct_answers / studentStats.total_questions : 0.5;
        const robotAnswerTime = Math.max(2, Math.min(averageTime + 1, averageTime - 1)); // Robot answers between 2 and 10 seconds
        console.log('Robot answer time:', robotAnswerTime);
        const robotCorrectChance = Math.random() < Math.max(accuracy + 0.15, 0.5) ? true : false;
  
        const interval = setTimeout(() => {
          setRobotIsAnswering(true);
          const robotAnswer = robotCorrectChance
            ? currentQuestion.correctAnswer - 1
            : currentQuestion.answers.find((_, idx) => idx !== currentQuestion.correctAnswer - 1);
          setRobotFeedback(robotCorrectChance ? 'correct' : 'wrong');
          setTimeout(() => {    
            handleAnswer('Robot', robotAnswer);
            setTimeout(() => setRobotFeedback(null), 1500);
            setRobotIsAnswering(false);
            }, 800);
        }, robotAnswerTime * 1000);
  
        setRobotAnswerInterval(interval);
        return () => clearTimeout(interval);
      }
    }, [gameStarted, currentQuestion, studentStats]);
  

  const startGame = () => {
    const startGameSession = async () => {
      console.log('Starting game session...');
      const sessionData = {
        topic_id: topic.topic_id,
        game_mode: "computer",
        opponent_id: "computer"
      };
      try {
        const response = await fetch(`${BASE_URL}/game-sessions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify(sessionData),
        });
        if (!response.ok) {
          throw new Error('Failed to start game session');
        }
        const data = await response.json();
        setSessionId(data.session_id);

      } catch (error) {
        console.error('Error starting game session:', error);
      }
    }
    startGameSession();
    setGameStarted(true);
    setTimer(120); // Reset timer to 2 minutes
    setRopePosition(50); // Reset rope position
    setWinner(null); // Reset winner
    setStudentStats({
      totalAnswers: 0,
      correct_answers: 0,
      wrong_answers: 0,
      total_questions: 1,
      time_taken: 0,
    }); 
    setRobotIsAnswering(false); // Reset robot answering state
  };

  const handleAnswer = (player, index) => {
    const isCorrect = index === currentQuestion.correctAnswer - 1;
    if (player === 'Player') {
      const startTime = performance.now();
      setStudentStats((prev) => ({
        ...prev,
        correct_answers: prev.correct_answers + (isCorrect ? 1 : 0),
        wrong_answers: prev.wrong_answers + (!isCorrect ? 1 : 0),
        time_taken: prev.time_taken + (performance.now() - startTime) / 1000
      }));
    }
    if (isCorrect) {
      setWrongAnswerIdx(null);
      const movement = player === 'Player' ? 5 : -5;
      setRopePosition((prev) => Math.max(0, Math.min(100, prev + movement)));
      // Move to the next question
      const nextQuestionIndex = questions.indexOf(currentQuestion) + 1;
      if (nextQuestionIndex < questions.length) {
        setCurrentQuestion(questions[nextQuestionIndex]);
      } else {
        setCurrentQuestion(questions[0]);
      }
      setStudentStats((prev) => ({
        ...prev,
        total_questions: prev.total_questions + 1 // Increment total_questions
      }));
    }
    else{
      setWrongAnswerIdx(index); // Set the wrong answer index
      setTimeout(() => setWrongAnswerIdx(null), 1000); // Reset after 1 second
    }
  };

  const handleGameEnd = async (winner, studentStats) => {
    console.log('Ending game session...');
      try {
        const response = await fetch(`${BASE_URL}/game-sessions/${sessionId}/end`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify({
            correct_answers: studentStats.correct_answers,
            wrong_answers: studentStats.wrong_answers,
            total_questions: studentStats.total_questions,
            points: winner ? 3 + (timer > 0 ? 2 : 0) : 0, // 5 points for winning, +2 if time remains
            time_taken: Math.floor(studentStats.time_taken * 10000),
            winner: winner
          }),
        });
        if (!response.ok) {
          throw new Error('Failed to end game session');
        }
      } catch (error) {
        console.error('Error ending game session:', error);
      }
      try{
        const updateAbilityRatingsResponse = await fetch(`${BASE_URL}/game-sessions/update-ability-computer`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify({
            winner: winner,
            topic_id: topic.topic_id
          }),
        });

      } catch (error) {
        console.error('Error updating leaderboard:', error);
      }
  };



  useEffect(() => {
    if (ropePosition <= 0) {
      setWinner('Oh ne, izgubi si!');
      console.log('1')
      handleGameEnd(false, studentStats);
      setGameStarted(false);
    } else if (ropePosition >= 95) {
      setWinner('Bravo! Pobijedi si računalo!');
      console.log('2')
      handleGameEnd(true, studentStats);
      setGameStarted(false);
    }
    
  }, [ropePosition]);

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = time % 60;
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  const handleGoBack = () => {
    navigate('/', {state: location.state});
  }
  return (
    <div className='competition-computer-container'>
      <div className="top-icons">
        <div className="left-icons">
          <button className="icon-button back" aria-label="Go Back" onClick={handleGoBack}>🔙</button>
        </div>
        <div className="right-icons">
        <button className="icon-button home" aria-label="Home" onClick={() => navigate('/')}>🏠</button>
          <button className="icon-button profile" aria-label="Profile" onClick={() => navigate('/profile')}>👤</button>
          <button className="icon-button leaderboard" aria-label="Leaderboard" onClick={() => navigate('/leaderboard')}>🏆</button>
        </div>
      </div>
      <div className="main-part">
        <p className='subject-text'>{subject.name} : {topic.name}</p>
        <div className='robot-container'>
          <img src="/icons/wrong.png" alt="Wrong" className={`wrong-icon ${robotFeedback === 'wrong' ? 'visible' : ''}`}/>
          <img src="/icons/bot.webp" alt="Robot" className={`robot-icon ${robotIsAnswering ? 'robot-active' : ''}`} />
          <img src="/icons/correct.png" alt="Correct" className={`correct-icon ${robotFeedback === 'correct' ? 'visible' : ''}`} />
        </div>
        <div className="tug-of-war-c">
          <div className='left-of-rope'>{formatTime(timer)}</div>
            <div className="rope-c">
              <div className="mark-c" style={{ top: `${ropePosition}%` }}></div>
            </div>
            <div className='right-of-rope'>Pobijedi racunalo!</div>
          </div>
          {gameStarted && currentQuestion ? (
          <div className="question-block">
            <div className="question">{currentQuestion.question}</div>
            <div className="answers">
              {currentQuestion.answers.map((ans, idx) => (
                <button
                  key={idx}
                  className={`answer-btn ${wrongAnswerIdx === idx ? 'wrong' : ''} `}
                  onClick={() => handleAnswer('Player', idx)}
                  disabled={robotIsAnswering} 
                >
                  {ans}
                </button>
              ))}
            </div>
          </div>
          ) : winner ? (
          <div className="winner-message">
            <h2 className="winner-text">{winner}</h2>
            <button className="restart-button" onClick={startGame}>Ponovno Igraj</button>
          </div>
          ):(
          <div className="start-game">
            <button className="start-button" onClick={startGame}>Započni Igru</button>
          </div>
        )}
      </div>
    </div>
  );
};
