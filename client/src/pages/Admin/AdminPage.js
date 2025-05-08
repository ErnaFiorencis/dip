import React, { useState, useEffect } from 'react';
import '../../fonts/pixelFont-sproutLands.ttf';
import './AdminPage.css';
import { useNavigate } from 'react-router-dom';

export const AdminPage = () => {
  const [name, setName] = useState('');
  const [frame, setFrame] = useState(0);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const navigate = useNavigate();

  const [editingQuestion, setEditingQuestion] = useState(null);
  const [addingClassroom, setAddingClassroom] = useState(false);
  const [addingSubject, setAddingSubject] = useState(false);
  const [addingTopic, setAddingTopic] = useState(false);
  const [topicDescription, setTopicDescription] = useState("");
  const [addingNewQuestion, setAddingNewQuestion] = useState(false);

  const [generatedQuestions, setGeneratedQuestions] = useState([]);
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState(null);
  
  const [newQuestion, setNewQuestion] = useState({
    question: "",
    answers: ["", "", "", ""],
    correctAnswer: 0,
    active: true,
    difficulty: 1
  });

  const [classrooms, setClassrooms] = useState([]);
  const [subjectsByClassroom, setSubjectsByClassroom] = useState({});
  const [topics, setTopics] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [selectedClassroom, setSelectedClassroom] = useState(null);
  const [schoolLevel, setSchoolLevel] = useState('osnovna'); // Default value
  const [gradeLevel, setGradeLevel] = useState(1); // Default value

  const [deletingSubject, setDeletingSubject] = useState(null); // Subject to delete
  const [deletingTopic, setDeletingTopic] = useState(null); // Topic to delete

  const BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api/v1';
  const token = localStorage.getItem('token');

  const fetchClassroomsAndSubjects = async () => {
    try {
      const classroomResponse = await fetch(`${BASE_URL}/classroom/my`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const classroomsData = await classroomResponse.json();
      setClassrooms(classroomsData);

      const subjectsData = {};
      for (const classroom of classroomsData) {
        const subjectResponse = await fetch(`${BASE_URL}/subjects/classroom/${classroom.classroom_id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const subjects = await subjectResponse.json();
        subjectsData[classroom.classroom_id] = subjects;
      }
      setSubjectsByClassroom(subjectsData);
    } catch (error) {
      console.error('Error fetching classrooms or subjects:', error);
    }
  };

  useEffect(() => {
    const checkAdminRole = async () => {
      try {
        const response = await fetch(`${BASE_URL}/admin/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch user data');
        }

        const userData = await response.json();

        if (userData.role !== 'admin') {
          navigate('/'); // Redirect to home if the user is not an admin
          localStorage.removeItem('token'); // Clear token if not admin
          localStorage.removeItem('role'); // Clear user_id if not admin
        } else {
          setName(userData.user_name);
          fetchClassroomsAndSubjects();
        }
      } catch (error) {
        console.error('Error checking admin role:', error);
        navigate('/'); // Redirect to home on error
      }
    };

    if (!token) {
      navigate('/'); // Redirect to home if no token is found
    } else {
      checkAdminRole();
    }

    const intervalId = setInterval(() => {
      setFrame((prevFrame) => (prevFrame + 1) % 4);
    }, 400);

    return () => clearInterval(intervalId);
  }, [navigate, token, BASE_URL]);

  const handleSubjectClick = (subject) => {
    console.log('Selected subject:', subject);
    setSelectedSubject(subject);
    setSelectedTopic(null);
    fetchTopics(subject);
  };

  const handleClassroomClick = (classroomId) => {
    if(selectedClassroom === classroomId) {
      setSelectedClassroom(null);
    }
    else {
      setSelectedClassroom(classroomId);
    }
  };

  const fetchTopics = async (subjectId) => {
    try {
      const response = await fetch(`${BASE_URL}/topics/subject/${subjectId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const topicsData = await response.json();
      setTopics(topicsData);
      setSelectedSubject(subjectId);
    } catch (error) {
      console.error('Error fetching topics:', error);
    }
  };

  const fetchQuestions = async (topicId) => {
    try {
      const response = await fetch(`${BASE_URL}/questions/topic/${topicId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const questionsData = await response.json();
      console.log(questionsData);
      
      // Transform the data structure to match frontend expectations
      const formattedQuestions = questionsData.map(q => ({
        question_id: q.question_id,
        question: q.question,
        answers: [q.answer1, q.answer2, q.answer3, q.answer4],
        correctAnswer: q.correct_answer - 1,
        active: q.active,
        difficulty: q.difficulty
      }));
      
      setQuestions(formattedQuestions);
      
      // Fetch the topic details to get the description
      const topicResponse = await fetch(`${BASE_URL}/topics/${topicId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const topicData = await topicResponse.json();
      setTopicDescription(topicData.description || "");
      
      setSelectedTopic(topicId);
    } catch (error) {
      console.error('Error fetching questions or topic details:', error);
    }
  };

  const handleGoBack = () => {
    if (selectedTopic) {
      setSelectedTopic(null);
      setTopicDescription("");
    } else if (selectedSubject) {
      setSelectedSubject(null);
      setSelectedClassroom(null);
    }
  };
  
  const handleToggleActive = async (questionId, isActive) => {
    try {
      await fetch(`${BASE_URL}/questions/${questionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ active: !isActive })
      });
      setQuestions(questions.map(q => 
        q.question_id === questionId ? {...q, active: !isActive} : q
      ));
    } catch (error) {
      console.error('Error updating question:', error);
    }
  };
  
  const handleEditQuestion = (id) => {
    setEditingQuestion(id);
  };

  const handleAddClassroom = async () => {
    const name = document.getElementById('classroom-name').value;
    const classCode = document.getElementById('class-code').value;
    
    if (!name || !classCode) {
      alert("Molimo unesite naziv razreda i kod razreda.");
      return;
    }
    
    try {
      const response = await fetch(`${BASE_URL}/classroom/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ name, class_code: classCode,
          school_level: schoolLevel,
          grade_level: gradeLevel, })
      });
      
      const newClassroom = await response.json();
      
      // Update classrooms state directly
      const updatedClassrooms = [...classrooms, newClassroom];
      setClassrooms(updatedClassrooms);
      
      // Initialize empty subjects array for the new classroom
      setSubjectsByClassroom({
        ...subjectsByClassroom,
        [newClassroom.classroom_id]: []
      });
      
      setAddingClassroom(false);
      fetchClassroomsAndSubjects(); // Refresh classrooms and subjects list
      
      // Clear input fields
      document.getElementById('classroom-name').value = '';
      document.getElementById('class-code').value = '';
      
    } catch (error) {
      console.error('Error creating classroom:', error);
    }
  };

  const handleAddSubject = async () => {
    const name = document.getElementById('subject-name').value;
    
    if (!name) {
      alert("Molimo unesite naziv predmeta.");
      return;
    }
    
    try {
      const response = await fetch(`${BASE_URL}/subjects`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ 
          name,
          classroom_id: selectedClassroom
        })
      });
      
      const newSubject = await response.json();
      
      // Ensure we have an array for this classroom before updating
      const currentSubjects = subjectsByClassroom[selectedClassroom] || [];
      const updatedSubjects = [...currentSubjects, newSubject];
      
      // Create a new object to ensure React detects the state change
      const newSubjectsByClassroom = {
        ...subjectsByClassroom,
        [selectedClassroom]: updatedSubjects
      };
      
      setSubjectsByClassroom(newSubjectsByClassroom);
      setAddingSubject(false);
      fetchClassroomsAndSubjects();
      // Clear input field
      document.getElementById('subject-name').value = '';
      
    } catch (error) {
      console.error('Error creating subject:', error);
    }
  };

  const handleAddTopic = async () => {
    const name = document.getElementById('topic-name').value;
    const description = document.getElementById('topic-description').value;
    
    if (!name) {
      alert("Molimo unesite naziv teme.");
      return;
    }
    
    try {
      const response = await fetch(`${BASE_URL}/topics`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ 
          name,
          description,
          subject_id: selectedSubject
        })
      });
      
      const newTopic = await response.json();
      
      // Update topics state directly
      setTopics(prevTopics => [...prevTopics, newTopic]);
      setAddingTopic(false);
      fetchTopics(selectedSubject); // Refresh topics list
      
      // Clear input fields
      document.getElementById('topic-name').value = '';
      document.getElementById('topic-description').value = '';
      
    } catch (error) {
      console.error('Error creating topic:', error);
    }
  };
  
  const handleSaveTopicPrompt = async () => {
    try {
      await fetch(`${BASE_URL}/topics/${selectedTopic}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ description: topicDescription })
      });
      
      // Update the topic in the local state
      setTopics(topics.map(topic => 
        topic.topic_id === selectedTopic ? { ...topic, description: topicDescription } : topic
      ));
      
      console.log('Topic description updated successfully');
      
    } catch (error) {
      console.error('Error updating topic description:', error);
    }
  };

  const handleDeleteQuestion = async (questionId) => {
    try {
      await fetch(`${BASE_URL}/questions/${questionId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      setQuestions(questions.filter(q => q.question_id !== questionId));
    } catch (error) {
      console.error('Error deleting question:', error);
    }
  };

  const handleAddNewQuestion = () => {
    setAddingNewQuestion(true);
  };

  const handleSaveNewQuestion = async () => {
    if (!newQuestion.question || newQuestion.answers.some(a => !a)) {
      alert("Molimo unesite pitanje i sve odgovore.");
      return;
    }
    
    try {
      // Convert frontend structure to backend structure
      const questionData = {
        question: newQuestion.question,
        answers: newQuestion.answers,
        correct_answer: newQuestion.correctAnswer + 1,
        active: true,
        difficulty: newQuestion.difficulty
      };
      
      const response = await fetch(`${BASE_URL}/questions/${selectedTopic}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(questionData)
      });
      
      const savedQuestion = await response.json();
      
      // Format saved question to match frontend structure
      const formattedQuestion = {
        question_id: savedQuestion.question_id,
        question: savedQuestion.question,
        answers: [savedQuestion.answer1, savedQuestion.answer2, savedQuestion.answer3, savedQuestion.answer4],
        correctAnswer: savedQuestion.correct_answer - 1,
        active: savedQuestion.active,
        difficulty: savedQuestion.difficulty
      };
      
      // Add the new question to the questions array
      setQuestions(prevQuestions => [formattedQuestion, ...prevQuestions]);
      fetchQuestions(selectedTopic); // Refresh questions list
      // Reset the form
      console.log('New question saved successfully');
      setAddingNewQuestion(false);
      setNewQuestion({
        question: "",
        answers: ["", "", "", ""],
        correctAnswer: 0,
        active: true,
        difficulty: 1
      });
      
    } catch (error) {
      console.error('Error creating question:', error);
    }
  };

  const handleUpdateQuestion = async (questionId, updatedQuestion) => {
    try {
      // Convert frontend structure to backend structure
      const questionData = {
        question: updatedQuestion.question,
        answer1: updatedQuestion.answers[0],
        answer2: updatedQuestion.answers[1],
        answer3: updatedQuestion.answers[2],
        answer4: updatedQuestion.answers[3],
        correct_answer: updatedQuestion.correctAnswer + 1,
        active: updatedQuestion.active,
        difficulty: updatedQuestion.difficulty || 1
      };
      console.log(questionData);
      
      const response = await fetch(`${BASE_URL}/questions/${questionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(questionData)
      });
      
      // Close the editing form
      setEditingQuestion(null);
      fetchQuestions(selectedTopic); // Refresh questions list
      
    } catch (error) {
      console.error('Error updating question:', error);
    }
  };

  // Handler for updating the newQuestion state
  const handleUpdateNewQuestion = (field, value) => {
    setNewQuestion({
      ...newQuestion,
      [field]: value
    });
  };

  // Handler for updating answers in the newQuestion state
  const handleUpdateNewQuestionAnswer = (index, value) => {
    const updatedAnswers = [...newQuestion.answers];
    updatedAnswers[index] = value;
    setNewQuestion({
      ...newQuestion,
      answers: updatedAnswers
    });
  };

  // Handler for setting the correct answer in the newQuestion state
  const handleSetNewQuestionCorrectAnswer = (index) => {
    setNewQuestion({
      ...newQuestion,
      correctAnswer: index
    });
  };

  const handleUpdateAnswer = (questionId, answerIndex, newValue) => {
    setQuestions(questions.map(q => {
      if (q.question_id === questionId) {
        const updatedAnswers = [...q.answers];
        updatedAnswers[answerIndex] = newValue;
        return {...q, answers: updatedAnswers};
      }
      return q;
    }));
  };

  const handleSetCorrectAnswer = (questionId, answerIndex) => {
    setQuestions(questions.map(q => 
      q.question_id === questionId ? {...q, correctAnswer: answerIndex} : q
    ));
  };

  const handleGenerateQuestions = async () => {
    setGenerating(true);
    setGenerateError(null);
    try {
          // Find the selected classroom's school_level and grade_level
      const currentClassroom = classrooms.find((classroom) => classroom.classroom_id === selectedClassroom);

      if (!currentClassroom) {
        setGenerateError('Odabrani razred nije pronađen.');
        setGenerating(false);
        return;
      }
      console.log(currentClassroom);
      const response = await fetch(`${BASE_URL}/questions/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          topic_id: selectedTopic,
          school_level: currentClassroom.school_level,
          grade_level: currentClassroom.grade_level,
          count: 5 
        })
      });
      if (!response.ok) {
        const err = await response.json();
        setGenerateError(err.error || 'Greška pri generiranju pitanja.');
        setGenerating(false);
        return;
      }
      const aiQuestions = await response.json();
      setGeneratedQuestions(aiQuestions);
    } catch (e) {
      setGenerateError('Greška pri spajanju na AI servis.');
    }
    setGenerating(false);
  }
  const handleDeleteSubject = async () => {
    if (!deletingSubject) return;
  
    try {
      await fetch(`${BASE_URL}/subjects/${deletingSubject}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
  
      // Remove the deleted subject from the state
      setSubjectsByClassroom((prev) => ({
        ...prev,
        [selectedClassroom]: prev[selectedClassroom].filter(
          (subject) => subject.subject_id !== deletingSubject
        ),
      }));
  
      setDeletingSubject(null); // Close the confirmation popup
      handleGoBack(); 
    } catch (error) {
      console.error('Error deleting subject:', error);
    }
  };
  
  const handleDeleteTopic = async () => {
    if (!deletingTopic) return;
  
    try {
      await fetch(`${BASE_URL}/topics/${deletingTopic}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
  
      // Remove the deleted topic from the state
      setTopics((prev) => prev.filter((topic) => topic.topic_id !== deletingTopic));
  
      setDeletingTopic(null); // Close the confirmation popup
      handleGoBack(); // Go back to the subject view

    } catch (error) {
      console.error('Error deleting topic:', error);
    }
  };

  const handleSaveNewQuestionAi = async (q) => {
    try {
      const saveResp = await fetch(`${BASE_URL}/questions/${selectedTopic}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          question: q.question,
          answers: q.answers,
          correct_answer: q.correctAnswer,
          active: true,
          difficulty: 1
        })
      });
      if (saveResp.ok) {
        // Optionally add to your questions list
        setQuestions(prev => [q, ...prev]);
        // Remove from generated list
        
      }
    } catch (e) {
      alert('Greška pri spremanju pitanja.');
    }
  }

  return (
    <div className="welcome-container">

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

      {deletingSubject && (
        <div className="confirmation-popup">
          <p>Jeste li sigurni da želite obrisati ovaj predmet?</p>
          <button className="confirm-button" onClick={handleDeleteSubject}>
            Da
          </button>
          <button className="cancel-button" onClick={() => setDeletingSubject(null)}>
            Ne
          </button>
        </div>
      )}

      {deletingTopic && (
        <div className="confirmation-popup">
          <p>Jeste li sigurni da želite obrisati ovu temu?</p>
          <button className="confirm-button" onClick={handleDeleteTopic}>
            Da
          </button>
          <button className="cancel-button" onClick={() => setDeletingTopic(null)}>
            Ne
          </button>
        </div>
      )}
      
      {!selectedSubject ? (
        <>
          <div className="welcome-text">Pozdrav {name || 'ime'}!</div>
          <div className="rabbit-container">
            <div className="rabbit" style={{ backgroundPosition: `${-32 * frame}px 0` }}></div>
          </div>
          <button className='add-classroom' onClick={() => setAddingClassroom(true)}>Dodaj razred</button>
          {addingClassroom && (
            <div className="classroom-form">
              <input type="text" placeholder="Naziv razreda" className="classroom-input" id="classroom-name"/>
              <input type="text" placeholder="Kod razreda" className="classroom-input" id="class-code" />
              <div className="form-group">
                <label htmlFor="schoolLevel">Razina škole:</label>
                <select
                  id="schoolLevel"
                  value={schoolLevel}
                  onChange={(e) => setSchoolLevel(e.target.value)}
                  required
                >
                  <option value="osnovna">Osnovna</option>
                  <option value="srednja">Srednja</option>
                  <option value="fakultet">Fakultet</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="gradeLevel">Razred:</label>
                <select
                  id="gradeLevel"
                  value={gradeLevel}
                  onChange={(e) => setGradeLevel(parseInt(e.target.value, 10))}
                  required
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((level) => (
                    <option key={level} value={level}>
                      {level}
                    </option>
                  ))}
                </select>
              </div>
              <button className="save" onClick={handleAddClassroom}>Spremi</button>
              <button className="cancel" onClick={() => setAddingClassroom(false)}>Odustani</button>
            </div>
          )}
          {classrooms.map((classroom) => (
            <div key={classroom.classroom_id} className="classroom-container" onClick={() => handleClassroomClick(classroom.classroom_id)}>
              <div className="classroom-header">
                <div className="classroom-text">Razred: {classroom.name}</div>
                <div className="classroom-code">Kod: {classroom.class_code}</div>
                <button
                  className="icon-button"
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent triggering the classroom click event
                    navigate(`/classroom/${classroom.classroom_id}`);
                  }}
                >
                  ℹ️
                </button>
              </div>
             
              {selectedClassroom === classroom.classroom_id && (
                <>
                  <div className="subject-buttons">
                    {(subjectsByClassroom[classroom.classroom_id] || []).map((subject) => (
                      <div key={subject.subject_id} className="subject-item">
                      <button
                        className="subject-button"
                        key={subject.subject_id}
                        onClick={(e) => {
                          e.stopPropagation(); // Prevent classroom click event
                          handleSubjectClick(subject.subject_id);
                        }}
                      >
                        {subject.name ? subject.name.toUpperCase() : ''}
                      </button>
                      </div>
                    ))}
                  </div>
                  <button
                    className="add-subject"
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent classroom click event
                      setAddingSubject(true);
                    }}
                  >
                    Dodaj predmet
                  </button>
                  {addingSubject && (
                    <div
                      className="subject-form"
                      onClick={(e) => e.stopPropagation()} // Prevent classroom click event
                    >
                      <input type="text" placeholder="Naziv predmeta" className="subject-input" id="subject-name"/>
                      <button className="save" onClick={handleAddSubject}>
                        Spremi
                      </button>
                      <button className="cancel" onClick={() => setAddingSubject(false)}>
                        Odustani
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          ))}
        </>
      ) : !selectedTopic ? (
        <>
          <h1 className="subject-header">Predmet: {subjectsByClassroom[selectedClassroom].find(s => s.subject_id === selectedSubject)?.name}</h1>
          <button
          className="cancel"
          onClick={(e) => {
            e.stopPropagation(); // Prevent classroom click event
            setDeletingSubject(selectedSubject); // Set the subject to delete
          }}
        >
          Obriši predmet
          </button>
          <h2>Odaberi Temu:</h2>
          <div className="subject-buttons">
          {topics.map((topic) => (
            <button className='subject-button' key={topic.topic_id} onClick={() => fetchQuestions(topic.topic_id)}>
              {topic.name}
            </button>
          ))}
          </div>
          <button className='add-topic' onClick={() => setAddingTopic(true)}>Dodaj temu</button>
          {addingTopic && (
            <div className="topic-form">
              <input type="text" placeholder="Naziv teme" className="topic-input" id="topic-name"/>
              <textarea placeholder="Opis teme" className="topic-textarea" id="topic-description"></textarea>
              <button className="save" onClick={handleAddTopic}>Spremi</button>
              <button className="cancel" onClick={() => setAddingTopic(false)}>Odustani</button>
            </div>
          )}
        </>
      ) : (
        <>
          <div className="topic-header">Tema: {topics.find(t => t.topic_id === selectedTopic)?.name}</div>
          <button
          className="cancel"
          onClick={(e) => {
            e.stopPropagation(); // Prevent classroom click event
            setDeletingTopic(selectedTopic); // Set the subject to delete
          }}
        >
          Obriši temu
          </button>
          <div className='topic-container'>
            <textarea 
              className='topic-prompt'
              value={topicDescription}
              onChange={(e) => setTopicDescription(e.target.value)}
            />
            <button className='save' onClick={handleSaveTopicPrompt}>Spremi</button>
          </div>

          <div className="questions-header">Pitanja:</div>

          <div className='buttons-container'>
            <button className='add-question' onClick={handleAddNewQuestion}>
              Dodaj pitanje
            </button>
            <button className='add-question' onClick={handleGenerateQuestions}>
              {generating ? 'Generiram...' : 'Generiraj pitanja'}
            </button>
          </div>
          {generatedQuestions.length > 0 && (
            <div className="generated-questions-review">
              <h3>AI Generirana Pitanja (pregled):</h3>
              {generatedQuestions.map((q, idx) => (
                <div key={idx} className="question-review">
                  <div><b>Pitanje:</b> <input
                    type="text"
                    value={q.question}
                    onChange={e => {
                      const updated = [...generatedQuestions];
                      updated[idx].question = e.target.value;
                      setGeneratedQuestions(updated);
                    }}
                  /></div>
                  <div><b>Odgovori:</b>
                    {q.answers.map((a, aIdx) => (
                      <div key={aIdx}>
                        <input
                          type="radio"
                          name={`correct-${idx}`}
                          checked={q.correctAnswer === aIdx + 1}
                          onChange={() => {
                            const updated = [...generatedQuestions];
                            updated[idx].correctAnswer = aIdx + 1;
                            setGeneratedQuestions(updated);
                          }}
                        />
                        <input
                          type="text"
                          value={a}
                          onChange={e => {
                            const updated = [...generatedQuestions];
                            updated[idx].answers[aIdx] = e.target.value;
                            setGeneratedQuestions(updated);
                          }}
                        />
                      </div>
                    ))}
                  </div>
                  <button
                    className="save"
                    onClick={async () => {handleSaveNewQuestionAi(q); setGeneratedQuestions(generatedQuestions.filter((_, i) => i !== idx));}}
                  >Spremi</button>
                  <button
                    className="discard"
                    onClick={() => setGeneratedQuestions(generatedQuestions.filter((_, i) => i !== idx))}
                  >Odbaci</button>
                </div>
              ))}
            </div>
          )}

          
          {addingNewQuestion && (
            <div className="question editing">
              <div className="question-edit-form">
                <div className="question-edit-header">
                  <label>Pitanje:</label>
                  <input
                    type="text"
                    value={newQuestion.question}
                    onChange={(e) => handleUpdateNewQuestion('question', e.target.value)}
                    className="edit-question-input"
                    autoFocus
                  />
                </div>
                
                <div className="answers-container">
                  <label>Odgovori:</label>
                  {newQuestion.answers.map((answer, index) => (
                    <div key={index} className="answer-item">
                      <input
                        type="radio"
                        name="correct-new-question"
                        checked={newQuestion.correctAnswer === index}
                        onChange={() => handleSetNewQuestionCorrectAnswer(index)}
                      />
                      <input
                        type="text"
                        value={answer}
                        onChange={(e) => handleUpdateNewQuestionAnswer(index, e.target.value)}
                        className="edit-answer-input"
                      />
                    </div>
                  ))}
                </div>
                
                <div className="edit-actions">
                  <button 
                    className="save-button"
                    onClick={handleSaveNewQuestion}
                  >
                    💾 Spremi
                  </button>
                  <button 
                    className="cancel-button"
                    onClick={() => setAddingNewQuestion(false)}
                  >
                    ❌ Odustani
                  </button>
                </div>
              </div>
            </div>
          )}
          
          <div className="questions-container">
            {questions.map((question) => (
              <div key={question.question_id} className={`question ${editingQuestion === question.question_id ? 'editing' : ''}`}>
                {editingQuestion === question.question_id ? (
                  <div className="question-edit-form">
                    <div className="question-edit-header">
                      <label>Pitanje:</label>
                      <input
                        type="text"
                        value={question.question}
                        onChange={(e) => setQuestions(questions.map(q => 
                          q.question_id === question.question_id ? {...q, question: e.target.value} : q
                        ))}
                        className="edit-question-input"
                        autoFocus
                      />
                    </div>
                    
                    <div className="answers-container">
                      <label>Odgovori:</label>
                      {question.answers.map((answer, index) => (
                        <div key={index} className="answer-item">
                          <input
                            type="radio"
                            name={`correct-${question.question_id}`}
                            checked={question.correctAnswer === index}
                            onChange={() => handleSetCorrectAnswer(question.question_id, index)}
                          />
                          <input
                            type="text"
                            value={answer}
                            onChange={(e) => handleUpdateAnswer(question.question_id, index, e.target.value)}
                            className="edit-answer-input"
                          />
                        </div>
                      ))}
                    </div>
                    
                    <div className="edit-actions">
                      <button 
                        className="save-button"
                        onClick={() => handleUpdateQuestion(question.question_id, question)}
                      >
                        💾 Spremi
                      </button>
                      <button 
                        className="cancel-button"
                        onClick={() => setEditingQuestion(null)}
                      >
                        ❌ Odustani
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="question-content">
                      <div className="question-text">{question.question}</div>
                      <div className="answers-preview">
                        {question.answers.map((answer, index) => (
                          <div key={index} className={`answer-preview ${index === question.correctAnswer ? 'correct' : ''}`}>
                            {answer} {index === question.correctAnswer && '✓'}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="question-actions">
                      <button
                        className={`toggle-button ${question.active ? 'active' : 'inactive'}`}
                        onClick={() => handleToggleActive(question.question_id, question.active)}
                      >
                        {question.active ? 'Deaktiviraj' : 'Aktiviraj'}
                      </button>
                      <button 
                        className="edit-button" 
                        onClick={() => handleEditQuestion(question.question_id)}
                      >
                        ✏️ Uredi
                      </button>
                      <button 
                        className="delete-button" 
                        onClick={() => handleDeleteQuestion(question.question_id)}
                      >
                        🗑️ Obriši
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};