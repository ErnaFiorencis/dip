import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Login.css';

export const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api/v1';

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const response = await fetch(`${BASE_URL}/students/signin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_name: username,
          password: password,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('token', data.token);
        localStorage.setItem('username', username);
        localStorage.setItem('role', data.role); 
        localStorage.setItem('user_id', data.user_id);
        if (data.role === 'admin') {
          navigate('/admin'); 
        } else {
          navigate('/'); 
        }
      } else if (response.status === 401) {
        setError('Pogrešno korisničko ime ili lozinka');
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'An error occurred during login');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message || 'An error occurred during login');
    }
  };

  return (
    <div className="login-container">
      <h1 className="prijava-tekst">Prijavi se</h1>
      <form className="prijava-forma" onSubmit={handleLogin}>
        <input
          type="text"
          placeholder="Ime"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Lozinka"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button className="login-submit" type="submit">Prijava</button>
      </form>
      {error && <p className="error-message">{error}</p>}
      <p>
        Još nemaš korisnički račun? <Link to="/register">Napravi ga ovdje</Link>
      </p>
    </div>
  );
};
