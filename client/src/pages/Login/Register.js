import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Login.css';

export const Register = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isRegistered, setIsRegistered] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (password !== confirmPassword) {
      setError("Lozinke se ne podudaraju!");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`${BASE_URL}/students`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_name: username,
          password: password
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setIsRegistered(true);
      } else {
        setError(data.message || 'Registracija nije uspjela. Pokušajte ponovno.');
      }
    } catch (err) {
      console.error('Registration error:', err);
      setError('Došlo je do pogreške prilikom povezivanja s poslužiteljem.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStart = () => {
    navigate('/login'); // Redirect to welcome page
  };

  return (
    <div className="login-container">
      {!isRegistered ? (
        <>
          <h1 className="prijava-tekst">Napravi profil</h1>
          <form className="prijava-forma" onSubmit={handleRegister}>
            {error && <p className="error-message">{error}</p>}
            
            <input
              type="text"
              placeholder="Ime/nadimak"
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
            <input
              type="password"
              placeholder="Ponovi lozinku"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
            <button className="login-submit" type="submit">{isLoading ? 'Učitavanje...' : 'Napravi!'}</button>
          </form>
          <p>
            Već imaš profil? <a href="/login">Prijavi se ovdje</a>
          </p>
        </>
      ) : (
        <>
          <h1 className="success-message">Uspješno ste se registrirali! Prijavi se sa novostvorenim računom i započni s igrom i učenjem!</h1>
          <button className="start-button" onClick={handleStart}>
            Krenimo!
          </button>
        </>
      )}
    </div>
  );
};