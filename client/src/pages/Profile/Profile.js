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
  const [selectedClassroom, setSelectedClassroom] = useState('');
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
  // Fetch user's classrooms and subjects on component mount
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
        setClassrooms(classData);
        setSelectedClassroom(classData[0].classroom_id);

        // Fetch subjects for the first classroom
        const subjectResponse = await fetch(`${BASE_URL}/subjects/classroom/${classData[0].classroom_id}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (!subjectResponse.ok) throw new Error('Failed to fetch subjects');
        const subjectData = await subjectResponse.json();
        setSubjects(subjectData);

        setSelectedSubject(subjectData[0].subject_id);
        
      } catch (err) {
        console.error('Error fetching initial data:', err);
        setError('Failed to load user data. Please try again later.');
      }
    };
    
    fetchUserData();
  }, []);

  // Fetch topics when subject changes
  useEffect(() => {
    if (!selectedSubject) return;
    console.log('Fetching topics for subject:', selectedSubject);
    const fetchTopics = async () => {
      try {
        const response = await fetch(`${BASE_URL}/topics/subject/${selectedSubject}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (!response.ok) throw new Error('Failed to fetch topics');
        const data = await response.json();
        
        // Add "all" option at the beginning
        const allTopics = [{ id: 'all', name: 'Sve teme' }, ...data];
        setTopics(allTopics);
        console.log('Fetched topics:', allTopics);
        setSelectedTopic('all');
      } catch (err) {
        console.error('Error fetching topics:', err);
        setError('Failed to load topics. Please try again later.');
      }
    };
    
    fetchTopics();
  }, [selectedSubject]);

  // Fetch stats when selections change
  useEffect(() => {
    if (!userId || !selectedSubject) return;
  
    const fetchStats = async () => {
      setLoading(true);
      console.log(selectedTopic)
      try {
        const params = new URLSearchParams({
          classroom_id: selectedClassroom,
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
      } catch (err) {
        console.error('Error fetching stats:', err);
        setError('Failed to load statistics. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
  
    fetchStats();
  }, [userId, selectedClassroom, selectedSubject, selectedTopic, selectedTab]);
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('user_id');
    navigate('/login');
  };

  return (
    <div className="profile-container">
      <div className="top-icons">
        <div className="left-icons">
          <button 
            className="icon-button back" 
            aria-label="Go Back"
            onClick={() => window.history.back()}
          >
            🔙
          </button>
        </div>
        <div className="right-icons">
          <button className="icon-button home" aria-label="Home" onClick={() => window.location.href = '/'}>🏠</button>
          <button className="icon-button profile" aria-label="Profile" onClick={() => window.location.href='/profile'}>👤</button>
          <button 
            className="icon-button leaderboard" 
            aria-label="Leaderboard"
            onClick={() => window.location.href = '/leaderboard'}
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
            value={selectedClassroom}
            onChange={e => setSelectedClassroom(e.target.value)}
       
          >
            {classrooms.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          
          <span>PREDMET:</span>
          <select
            className="subject-select"
            value={selectedSubject}
            onChange={e => setSelectedSubject(e.target.value)}
           
          >
            {subjects.map(s => (
              <option key={s.id} value={s.subject_id}>{s.name}</option>
            ))}
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
                disabled={loading}
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
              disabled={loading || topics.length === 0}
            >
              {topics.map(topic => (
                <option key={topic.topic_id} value={topic.topic_id}>{topic.name}</option>
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
                    strokeDashoffset={2 * Math.PI * 40 * (1 - (stats.wins / stats.games))}
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
    </div>
  );
};