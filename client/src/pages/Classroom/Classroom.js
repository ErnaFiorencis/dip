import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './Classroom.css';

export const Classroom = () => {
  const { classroom_id } = useParams();
  const [classroom, setClassroom] = useState(null);
  const [students, setStudents] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [topics, setTopics] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [statistics, setStatistics] = useState([]);
  const BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api/v1';
  const token = localStorage.getItem('token');
  const navigate = useNavigate();
  const [error, setError] = useState(null);
   const [deletingClass, setDeletingClass] = useState(null); 


  useEffect(() => {
    const fetchClassroomInfo = async () => {
      try {
        const response = await fetch(`${BASE_URL}/classroom/info/${classroom_id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        setClassroom(data.classroom);
        setStudents(data.students);
      } catch (error) {
        console.error('Error fetching classroom info:', error);
      }
    };

    fetchClassroomInfo();
  }, [classroom_id, BASE_URL, token]);

  useEffect(() => {
    if (!classroom) return;

    const fetchSubjects = async () => {
      try {
        const response = await fetch(`${BASE_URL}/subjects/classroom/${classroom.classroom_id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        setSubjects(data);
        if (data && data.length > 0) {
          setSelectedSubject(data[0].subject_id);
          setError(null);
        } else {
          setSelectedSubject(null);
          setTopics([]);
          setError(`Razred "${classroom.name}" nema dodijeljenih predmeta.`);
        }
      } catch (error) {
        console.error('Error fetching subjects:', error);
        setError('Failed to load subjects. Please try again later.');
        setSelectedSubject(null);
        setTopics([]);
      }
    };

    fetchSubjects();
  }, [classroom, BASE_URL, token]);

  useEffect(() => {
    if (!selectedSubject) return;

    const fetchTopics = async () => {
      try {
        const response = await fetch(`${BASE_URL}/topics/subject/${selectedSubject}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        setTopics(data);
      } catch (error) {
        console.error('Error fetching topics:', error);
      }
    };

    fetchTopics();
  }, [selectedSubject, BASE_URL, token]);

  useEffect(() => {
    if (!selectedSubject || !selectedTopic) return;

    const fetchStatistics = async () => {
      try {
        const response = await fetch(
          `${BASE_URL}/classroom/statistics?classroom_id=${classroom_id}&subject_id=${selectedSubject}&topic_id=${selectedTopic}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        const data = await response.json();
        setStatistics(data);
      } catch (error) {
        console.error('Error fetching statistics:', error);
      }
    };

    fetchStatistics();
  }, [selectedSubject, selectedTopic, classroom_id, BASE_URL, token]);

  const handleRemoveStudent = async (student_id) => {
    try {
      await fetch(`${BASE_URL}/classroom/${classroom_id}/students/${student_id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      setStudents((prev) => prev.filter((student) => student.user_id !== student_id));
    } catch (error) {
      console.error('Error removing student:', error);
    }
  };

  const handleDeleteClassroom = async () => {
    if(!deletingClass) return;
    try {
      await fetch(`${BASE_URL}/classroom/${classroom_id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      navigate(-1);
      setDeletingClass(null);
    } catch (error) {
      console.error('Error deleting classroom:', error);
    }
  }

  if (!classroom) {
    return <div>Loading...</div>;
  }

  return (
    <div className="welcome-container">
      <div className="top-icons">
        <div className="left-icons">
          <button className="icon-button back" aria-label="Go Back" onClick={() => navigate(-1)}>🔙</button>
        </div>
        <div className="right-icons">
          <button className="icon-button home" aria-label="Home" onClick={() => navigate('/')}>🏠</button>
          <button className="icon-button profile" aria-label="Profile" onClick={() => navigate('/profile')}>👤</button>
          <button className="icon-button leaderboard" aria-label="Leaderboard" onClick={() => navigate('/leaderboard')}>🏆</button>
        </div>
      </div>
      {deletingClass && (
        <div className="confirmation-popup">
          <p>Jeste li sigurni da želite obrisati ovaj predmet?</p>
          <button className="confirm-button" onClick={handleDeleteClassroom}>
            Da
          </button>
          <button className="cancel-button" onClick={() => setDeletingClass(null)}>
            Ne
          </button>
        </div>
      )}
      <h1>{classroom.name}</h1>
      <button
          className="cancel"
          onClick={(e) => {
            e.stopPropagation(); // Prevent classroom click event
            setDeletingClass(classroom_id); // Set the subject to delete
          }}
        >
          Obriši predmet
      </button>
      <p><strong>Kod razreda:</strong> {classroom.class_code}</p>
      <p><strong>Razina škole:</strong> {classroom.school_level}</p>
      <p><strong>Razred:</strong> {classroom.grade_level}</p>

      <h2 >Popis učenika</h2>
      <ul className='student-list'>
        {students.map((student) => (
          <div key={student.user_id}>
            {student.user_name} 
            <button className='remove' onClick={() => handleRemoveStudent(student.user_id)}>Ukloni</button>
          </div>
        ))}
      </ul>

      <h2>Predmet
      <select 
      className='subject-select'
        onChange={(e) => {
          setStatistics([]);
          setSelectedTopic(null);
          setSelectedSubject(e.target.value);
        }}
      >
        <option value="">Odaberi predmet</option>
        {subjects.map((subject) => (
          <option key={subject.subject_id} value={subject.subject_id}>
            {subject.name}
          </option>
        ))}
      </select>
      </h2>


      <h2>Tema
      <select className="subject-select"onChange={(e) => setSelectedTopic(e.target.value)}>
        <option value="">Odaberi temu</option>
        {topics.map((topic) => (
          <option key={topic.topic_id} value={topic.topic_id}>
            {topic.name}
          </option>
        ))}
      </select>
      </h2>


      <h2>Statistika - rankovi</h2>
      <ul>
        {statistics.map((stat) => (
          <div key={stat.user_id}>
            {stat.user_name}: {stat.ability_rating}
          </div>
        ))}
      </ul>
    </div>
  );
};