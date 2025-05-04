import React, { useState, useEffect } from 'react';
import '../../fonts/pixelFont-sproutLands.ttf';
import './Welcome.css';
import { useNavigate, useLocation } from 'react-router-dom';

export const Welcome = () => {
  const location = useLocation();
  const [name, setName] = useState('');
  const [frame, setFrame] = useState(0);
  const [classrooms, setClassrooms] = useState([]);
  const [selectedClassroom, setSelectedClassroom] = useState(location.state ? location.state.classroom : null);
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState(location.state ? location.state.subject : null);
  const [topics, setTopics] = useState([]);
  const [selectedTopic, setSelectedTopic] = useState(location.state ? location.state.topic : null);
  const [joiningClassroom, setJoiningClassroom] = useState(false);
  const [classCode, setClassCode] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api/v1';
  const token = localStorage.getItem('token');

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const classroomResponse = await fetch(`${BASE_URL}/students/classrooms`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!classroomResponse.ok) {
          const errorData = await classroomResponse.json();
          throw new Error(errorData.message);
        }
        const classroomsData = await classroomResponse.json();
        setClassrooms(classroomsData);
      } catch (error) {
        console.error('Error fetching user data:', error);
        //navigate('/login');
      }
    };

    if (!token) navigate('/login');
    setName(localStorage.getItem('username'));
    fetchUserData();

    const intervalId = setInterval(() => {
      setFrame((prevFrame) => (prevFrame + 1) % 4);
    }, 400);

    return () => clearInterval(intervalId);
  }, [navigate, token, BASE_URL]);

  useEffect(() => {
    if (selectedClassroom) {
      fetchSubjects(selectedClassroom);
    }
  }, [selectedClassroom]);

  useEffect(() => {
    if (selectedSubject) {
      fetchTopics(selectedSubject);
    }
  }, [selectedSubject]);

  const fetchUserData = async () => {
    try {
      const classroomResponse = await fetch(`${BASE_URL}/students/classrooms`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const classroomsData = await classroomResponse.json();
      setClassrooms(classroomsData);
    } catch (error) {
      console.error('Error fetching user data:', error);
      navigate('/login');
    }
  };

  const fetchSubjects = async (classroom) => {
    try {
      const response = await fetch(`${BASE_URL}/subjects/classroom/${classroom.classroom_id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const subjectsData = await response.json();
      setSubjects(subjectsData);
    } catch (error) {
      console.error('Error fetching subjects:', error);
    }
  };

  const fetchTopics = async (subject) => {
    try {
      const response = await fetch(`${BASE_URL}/topics/subject/${subject.subject_id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const topicsData = await response.json();
      setTopics(topicsData);
    } catch (error) {
      console.error('Error fetching topics:', error);
    }
  };

  const handleJoinClassroom = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${BASE_URL}/classroom/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ class_code: classCode }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message);
      }

      const newClassroom = await response.json();
      setClassrooms([...classrooms, newClassroom]);
      setJoiningClassroom(false);
      setClassCode('');
      fetchUserData();
    } catch (error) {
      setError(error.message);
    }
  };

  const handleActivityClick = (activity) => {
    navigate(`/${activity}`, {
      state: {
        classroom: selectedClassroom,
        subject: selectedSubject,
        topic: selectedTopic,
      },
    });
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

      <div className="welcome-text">Pozdrav {name}!</div>
      <div className="rabbit-container">
        <div className="rabbit" style={{ backgroundPosition: `${-32 * frame}px 0` }}></div>
      </div>

      <div className="selection-container">
        {/* Classroom Selection */}
        <div className="classroom-section">
          <div className="section-title">Razredi:</div>
          <div className="classroom-buttons">
            {classrooms.map((classroom) => (
              <button
                key={classroom.classroom_id}
                className={`subject-button-w ${selectedClassroom?.classroom_id === classroom.classroom_id ? 'selected' : ''}`}
                onClick={() => {
                  if(classroom.classroom_id === selectedClassroom?.classroom_id) {
                    setSelectedClassroom(null);
                    setSelectedSubject(null);
                    setSelectedTopic(null);
                  }
                  else{
                    setSelectedSubject(null);
                    setSelectedTopic(null);
                    setSelectedClassroom(classroom)
                  }
                }}
              >
                {classroom.name}
              </button>
            ))}
          </div>
          {joiningClassroom && (
            <form className="join-classroom-form" onSubmit={handleJoinClassroom}>
              <input
                type="text"
                className="class-code-input"
                placeholder="Unesi kod razreda"
                value={classCode}
                onChange={(e) => setClassCode(e.target.value)}
                required
              />
              <button type="submit" className="save">Pridruži se</button>
              {error && <p className="error-message">{error}</p>}
            </form>
          )}
          <button
            className={`join-classroom-button ${joiningClassroom ? 'cancel' : 'save'}`}
            onClick={() => setJoiningClassroom(!joiningClassroom)}
          >
            {joiningClassroom ? 'Odustani' : '+'}
          </button>
        </div>

        {/* Subject Selection */}
        {selectedClassroom && (
          <div className="subject-section">
            <div className="section-title">Predmeti:</div>
            <div className="subject-buttons">
              {subjects.map((subject) => (
                <button
                  key={subject.subject_id}
                  className={`subject-button-w ${selectedSubject?.subject_id === subject.subject_id ? 'selected' : ''}`}
                  onClick={() => {if(subject.subject_id === selectedSubject?.subject_id) {
                    setSelectedSubject(null);
                    setSelectedTopic(null);
                  }
                  else{
                    setSelectedTopic(null); 
                    setSelectedSubject(subject)}
                  }
                  }
                >
                  {subject.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Topic Selection */}
        {selectedSubject && (
          <div className="topic-section">
            <div className="section-title">Teme:</div>
            <div className="topic-buttons">
              {topics.map((topic) => (
                <button
                  key={topic.topic_id}
                  className={`subject-button-w ${selectedTopic?.topic_id === topic.topic_id ? 'selected' : ''}`}
                  onClick={() => {if(topic.topic_id === selectedTopic?.topic_id) {
                    setSelectedTopic(null); 
                  }
                  else{
                    setSelectedTopic(topic)
                  }
                  }
                  }
                >
                  {topic.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Activity Selection */}
        {selectedTopic && (
          <div className="activity-section">
            <div className="section-title">ZAIGRAJ:</div>
            <div className="activity-buttons">
              <button className='activity-button' onClick={() => handleActivityClick('practice')}>Vježba</button>
              <button className='activity-button' onClick={() => handleActivityClick('computer-competition')}>Natjecanje protiv računala</button>
              <button className='activity-button' onClick={() => handleActivityClick('student-competition')}>Natjecanje protiv drugog učenika</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};