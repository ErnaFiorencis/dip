import React, { useState, useEffect } from 'react';
import './Leaderboard.css';


export const Leaderboard = () => {
  const [classrooms, setClassrooms] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [topics, setTopics] = useState([]);
  const [selectedClassroom, setSelectedClassroom] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [selectedTopic, setSelectedTopic] = useState('all');
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api/v1';
  // Fetch classrooms, subjects, and topics on component mount
  useEffect(() => {
    const fetchFilters = async () => {
      try {
        const classroomsResponse = await fetch(`${BASE_URL}/students/classrooms`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        const classroomsData = await classroomsResponse.json();
        setClassrooms(classroomsData);
        setSelectedClassroom(classroomsData[0]?.classroom_id || '');

        const subjectsResponse = await fetch(`${BASE_URL}/subjects/classroom/${classroomsData[0].classroom_id}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        const subjectsData = await subjectsResponse.json();
        setSubjects([{ id: 'all', name: 'All' }, ...subjectsData]);

      } catch (err) {
        console.error('Error fetching filters:', err);
        setError('Failed to load filters. Please try again later.');
      }
    };
    fetchFilters();
  }, [BASE_URL]);

    // Fetch topics when subject changes
    useEffect(() => {
      if (!selectedSubject) return;
      if(selectedSubject === 'all') return;
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
  

  useEffect(() => {
    if (!selectedClassroom) return;

    const fetchLeaderboard = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          classroom_id: selectedClassroom,
          subject_id: selectedSubject,
          topic_id: selectedTopic,
        });

        const response = await fetch(`${BASE_URL}/game-sessions/leaderboard?${params.toString()}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });

        if (!response.ok) throw new Error('Failed to fetch leaderboard');
        const data = await response.json();
        setLeaderboardData(data.data || []);
      } catch (err) {
        console.error('Error fetching leaderboard:', err);
        setError('Failed to load leaderboard. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, [selectedClassroom, selectedSubject, selectedTopic, BASE_URL]);


  const top3 = leaderboardData.slice(0, 3);
  const rest = leaderboardData.slice(3);

  return (
    <div className="leaderboard-container">
      <div className="top-icons">
        <div className="left-icons">
          <button className="icon-button back" aria-label="Go Back" onClick={() => window.history.back()}>🔙</button>
        </div>
        <div className="right-icons">
          <button className="icon-button home" aria-label="Home" onClick={() => window.location.href = '/'}>🏠</button>
          <button className="icon-button profile" aria-label="Profile" onClick={() => window.location.href = '/profile'}>👤</button>
          <button className="icon-button leaderboard" aria-label="Leaderboard" onClick={() => window.location.href = '/leaderboard'}>🏆</button>
        </div>
      </div>

      <div className="leaderboard-filters">
      <span className="filter-label">RAZRED:</span>
        <select
          className="filter-select"
          value={selectedClassroom}
          onChange={(e) => setSelectedClassroom(e.target.value)}
          disabled={loading}
        >
          {classrooms.map((c) => (
            <option key={c.classroom_id} value={c.classroom_id}>
              {c.name}
            </option>
          ))}
        </select>
        <span className="filter-label">PREDMET:</span>
        <select
          className="filter-select"
          value={selectedSubject}
          onChange={(e) => setSelectedSubject(e.target.value)}
          disabled={loading}
        >
          {subjects.map((s) => (
            <option key={s.subject_id} value={s.subject_id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>
      <div className="leaderboard-filters">
      
        <span className="filter-label">TEMA:</span>
        <select
          className="filter-select"
          value={selectedTopic}
          onChange={(e) => setSelectedTopic(e.target.value)}
          disabled={loading}
        >
          {topics.map((t) => (
            <option key={t.topic_id} value={t.topic_id}>
              {t.name}
            </option>
          ))}
        </select>
      </div>
      {error ? (
        <div className="error-message">{error}</div>
      ) : loading ? (
        <div className="loading-spinner">Učitavanje...</div>
      ) : (
      <>
      {/* TOP 3 */}
      <div className="leaderboard-podium-row">
        <div className="leaderboard-podium-box second">
          <div className="leaderboard-name">{top3[1]?.name}</div>
          <div className="leaderboard-points">{top3[1]?.points}⭐</div>
          <div className="leaderboard-place">2.</div>
        </div>
        <div className="leaderboard-podium-box first">
          <div className="leaderboard-name">{top3[0]?.name}</div>
          <div className="leaderboard-points">{top3[0]?.points}⭐</div>
          <div className="leaderboard-place">1.</div>
        </div>
        <div className="leaderboard-podium-box third">
          <div className="leaderboard-name">{top3[2]?.name}</div>
          <div className="leaderboard-points">{top3[2]?.points}⭐</div>
          <div className="leaderboard-place">3.</div>
        </div>
      </div>

      {/* Ostali */}
      <div className="leaderboard-rest">
        {rest.map((user, idx) => (
          <div className="leaderboard-rest-row" key={user.name}>
            <span className="rest-place">{user.place}.</span>
            <span className="rest-name">{user.name}</span>
            <span className="rest-points">{user.points}⭐</span>
          </div>
        ))}
      </div>
      </>
      )}
    </div>
  );
};
