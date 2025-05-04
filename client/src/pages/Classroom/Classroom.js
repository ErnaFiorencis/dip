import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

export const Classroom = () => {
  const { classroom_id } = useParams();
  const [classroom, setClassroom] = useState(null);
  const BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api/v1';
  const token = localStorage.getItem('token');

  useEffect(() => {
    const fetchClassroomInfo = async () => {
      try {
        const response = await fetch(`${BASE_URL}/classroom/info/${classroom_id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        setClassroom(data);
      } catch (error) {
        console.error('Error fetching classroom info:', error);
      }
    };

    fetchClassroomInfo();
  }, [classroom_id, BASE_URL, token]);

  if (!classroom) {
    return <div>Loading...</div>;
  }

  return (
    <div className="welcome-container">
    <div className="top-icons">
        <div className="left-icons">
          <button className="icon-button back" aria-label="Go Back" onClick={() => window.history.back()}>🔙</button>
        </div>
        <div className="right-icons">
          <button className="icon-button home" aria-label="Home" onClick={() => window.location.href = '/admin'}>🏠</button>
          <button className="icon-button profile" aria-label="Profile" onClick={() => window.location.href = '/profile'}>👤</button>
          <button className="icon-button leaderboard" aria-label="Leaderboard" onClick={() => window.location.href = '/leaderboard'}>🏆</button>
        </div>
      </div>
    <div className="classroom-info">
      <h1>{classroom.name}</h1>
      <p><strong>Kod razreda:</strong> {classroom.class_code}</p>
      <p><strong>Razina škole:</strong> {classroom.school_level}</p>
      <p><strong>Razred:</strong> {classroom.grade_level}</p>
      <p><strong>Kreirano:</strong> {new Date(classroom.created_at).toLocaleDateString()}</p>
    </div>
    </div>
  );
};