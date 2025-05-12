import React, { useState, useEffect } from 'react';
import './Profile.css';
import { useNavigate, useLocation } from 'react-router-dom';

export const Profile = () => {
  // State for user data
  const location = useLocation();
  const navigate = useNavigate();
  const [userName, setUsername] = useState(localStorage.getItem('username') || 'Student');
  const [userId, setUserId] = useState(localStorage.getItem('user_id') || '12345');
  
  // State for selections
  const [classrooms, setClassrooms] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [topics, setTopics] = useState([]);
  
  // Selected values
  const [selectedClassroom, setSelectedClassroom] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [selectedTab, setSelectedTab] = useState('all');
  const [selectedTopic, setSelectedTopic] = useState('all');
  
  // Stats data
  const [stats, setStats] = useState({ games: 0, wins: 0, points: 0, percent: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Tabs definition
  const tabs = [
    { id: 'all', label: 'Ukupno' },
    { id: 'practice', label: 'Vježba' },
    { id: 'computer', label: 'Natjecanje - Robot' },
    { id: 'pvp', label: 'Natjecanje - Učenik' }
  ];

  const BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api/v1';
  
  // Fetch user's classrooms on component mount
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // Fetch classrooms
        const classResponse = await fetch(`${BASE_URL}/students/classrooms`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (!classResponse.ok) throw new Error('Failed to fetch classrooms');
        const classData = await classResponse.json();
        
        if (classData && classData.length > 0) {
          setClassrooms(classData);
          setSelectedClassroom(classData[0]); // Store the whole classroom object
        } else {
          setError('No classrooms available.');
        }
      } catch (err) {
        console.error('Error fetching initial data:', err);
        setError('Failed to load user data. Please try again later.');
      }
    };
    
    fetchUserData();
  }, []);

  // Fetch subjects when classroom changes
  useEffect(() => {
    if (!selectedClassroom) return;

    const fetchSubjects = async () => {
      setLoading(true);
      try {
        const subjectResponse = await fetch(`${BASE_URL}/subjects/classroom/${selectedClassroom.classroom_id}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (!subjectResponse.ok) throw new Error('Failed to fetch subjects');
        const subjectData = await subjectResponse.json();
        
        setSubjects(subjectData);
        
        // Set first subject as selected if available
        if (subjectData && subjectData.length > 0) {
          setSelectedSubject(subjectData[0].subject_id);
          setError(null); // Clear any previous error
        } else {
          // No subjects available for this classroom
          setSelectedSubject(null);
          setTopics([]);
          // Clear stats and show a specific message for no subjects
          setStats({ games: 0, wins: 0, points: 0, percent: 0 });
          setError(`Razred "${selectedClassroom.name}" nema dodijeljenih predmeta.`);
        }
        
      } catch (err) {
        console.error('Error fetching subjects:', err);
        setError('Failed to load subjects. Please try again later.');
        setSelectedSubject(null);
        setTopics([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchSubjects();
  }, [selectedClassroom]);

  // Fetch topics when subject changes
  useEffect(() => {
    if (!selectedSubject) return;
    
    const fetchTopics = async () => {
      setLoading(true);
      try {
        const response = await fetch(`${BASE_URL}/topics/subject/${selectedSubject}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (!response.ok) throw new Error('Failed to fetch topics');
        const data = await response.json();
        
        // Add "all" option at the beginning
        const allTopics = [{ topic_id: 'all', name: 'Sve teme' }, ...data];
        setTopics(allTopics);
        setSelectedTopic('all');
        
        // Clear topic-related errors if any
        if (error && error.includes('tema')) {
          setError(null);
        }
      } catch (err) {
        console.error('Error fetching topics:', err);
        // Only set topics error if not already showing a subject error
        if (!error || !error.includes('predmet')) {
          setError('Failed to load topics. Please try again later.');
        }
        // Set at least the "all" option
        setTopics([{ topic_id: 'all', name: 'Sve teme' }]);
        setSelectedTopic('all');
      } finally {
        setLoading(false);
      }
    };
    
    fetchTopics();
  }, [selectedSubject, error]);

  // Fetch stats when selections change
  useEffect(() => {
    if (!userId || !selectedSubject || !selectedClassroom) return;
  
    const fetchStats = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          classroom_id: selectedClassroom.classroom_id,
          subject_id: selectedSubject,
          game_mode: selectedTab === 'ukupno' ? 'all' : selectedTab,
          topic_id: selectedTopic,
        });
  
        const response = await fetch(`${BASE_URL}/game-sessions/stats?${params.toString()}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });
  
        if (!response.ok) throw new Error('Failed to fetch statistics');
        const data = await response.json();
  
        const statsData = data.data || { games: 0, wins: 0, points: 0 };
        const percent = statsData.games > 0
          ? Math.round((statsData.wins / statsData.games) * 100)
          : 0;
  
        setStats({
          games: statsData.games,
          wins: statsData.wins,
          points: statsData.points,
          percent,
        });
        
        // Clear any previous error on successful stats retrieval
        if (error && error.includes('statistics')) {
          setError(null);
        }
      } catch (err) {
        console.error('Error fetching stats:', err);
        setError('Failed to load statistics. Please try again later.');
        // Set empty stats to prevent showing stale data
        setStats({ games: 0, wins: 0, points: 0, percent: 0 });
      } finally {
        setLoading(false);
      }
    };
  
    fetchStats();
  }, [userId, selectedClassroom, selectedSubject, selectedTopic, selectedTab, error]);
  
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('user_id');
    navigate('/login');
  };

  // Handle classroom change 
  const handleClassroomChange = (e) => {
    // Find the classroom object by ID
    const selectedIndex = e.target.selectedIndex;
    const selectedClassroomObj = classrooms[selectedIndex];
    
    // Set the selected classroom with the whole object
    setSelectedClassroom(selectedClassroomObj);
    
    // Reset subject, topic and error when changing classroom
    setSelectedSubject(null);
    setSelectedTopic('all');
    setTopics([]);
    setError(null);
    
    // Reset stats to prevent showing stale data
    setStats({ games: 0, wins: 0, points: 0, percent: 0 });
  };

  return (
    <div className="profile-container">
      <div className="top-icons">
        <div className="left-icons">
          <button 
            className="icon-button back" 
            aria-label="Go Back"
            onClick={() => navigate(-1)}
          >
            🔙
          </button>
        </div>
        <div className="right-icons">
          <button className="icon-button home" aria-label="Home" onClick={() => navigate('/')}>🏠</button>
          <button className="icon-button profile" aria-label="Profile" onClick={() => navigate('/profile')}>👤</button>
          <button 
            className="icon-button leaderboard" 
            aria-label="Leaderboard"
            onClick={() => navigate('/leaderboard')}
          >
            🏆
          </button>
        </div>
      </div>

      <div className="profile-main">
        <div className="profile-name">{userName}</div>
        <button className="logout-btn" onClick={handleLogout}>Odjavi se!</button>
        
        <div className="profile-classroom">
          <span>RAZRED:</span>
          <select
            className="classroom-select"
            value={selectedClassroom ? selectedClassroom.classroom_id : ''}
            onChange={handleClassroomChange}
            disabled={classrooms.length === 0}
          >
            {classrooms.map(c => (
              <option key={c.classroom_id} value={c.classroom_id}>
                {c.name}
              </option>
            ))}
          </select>
          
          <span>PREDMET:</span>
          <select
            className="subject-select"
            value={selectedSubject || ''}
            onChange={(e) => setSelectedSubject(e.target.value)}
            disabled={subjects.length === 0 || loading}
          >
            {subjects.length > 0 ? (
              subjects.map(s => (
                <option key={s.subject_id} value={s.subject_id}>
                  {s.name}
                </option>
              ))
            ) : (
              <option value="">Nema dostupnih predmeta</option>
            )}
          </select>
        </div>

        <div className='stats'>
          {/* Tabs */}
          <div className="profile-tabs">
            {tabs.map(tab => (
              <button
                key={tab.id}
                className={`profile-tab-btn${selectedTab === tab.id ? ' active' : ''}`}
                onClick={() => setSelectedTab(tab.id)}
                disabled={loading || !selectedSubject}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Topic filter */}
          <div className="topic-filter-row">
            <span className="topic-label">TEMA:</span>
            <select
              className="topic-select"
              value={selectedTopic}
              onChange={e => setSelectedTopic(e.target.value)}
              disabled={loading || topics.length === 0 || !selectedSubject}
            >
              {topics.map(topic => (
                <option key={topic.topic_id || topic.id} value={topic.topic_id || topic.id}>
                  {topic.name}
                </option>
              ))}
            </select>
          </div>

          {/* Stats Visualization and Details */}
          {error ? (
            <div className="error-message">{error}</div>
          ) : loading ? (
            <div className="loading-spinner">Učitavanje...</div>
          ) : (
            <div className="profile-stats-row">
              <div className="profile-pie-chart">
                <svg width="90" height="90" viewBox="0 0 90 90">
                  {/* Background circle */}
                  <circle
                    cx="45"
                    cy="45"
                    r="40"
                    stroke="#e0e0e0"
                    strokeWidth="8"
                    fill="none"
                  />

                  {/* Progress circle */}
                  <circle
                    cx="45"
                    cy="45"
                    r="40"
                    stroke="#4CAF50"
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray={2 * Math.PI * 40}
                    strokeDashoffset={2 * Math.PI * 40 * (1 - (stats.games > 0 ? stats.wins / stats.games : 0))}
                    strokeLinecap="round"
                    style={{ transition: 'stroke-dashoffset 0.7s' }}
                    transform="rotate(-90 45 45)" /* Rotate so progress starts at top */
                  />

                  {/* Percentage text */}
                  <text
                    x="50%"
                    y="50%"
                    textAnchor="middle"
                    dy="0.35em"
                    fontSize="1.2rem"
                    fontFamily="inherit"
                    fill="#353262"
                    fontWeight="bold"
                  >
                    {stats.games > 0 ? `${Math.round((stats.wins / stats.games) * 100)}%` : `0%`}
                  </text>
                </svg>
              </div>

              <div className="profile-stats-details">
                <div>Ukupno igara: <span>{stats.games}</span></div>
                <div>Pobjede: <span>{stats.wins}</span></div>
                <div>Bodovi: <span>{stats.points}⭐</span></div>
              </div>
            </div>
          )}
        </div>
      </div>
      <button className="anketa-btn" onClick={() => navigate('/anketa')}>Riješi anketu</button>
    </div>
  );
};