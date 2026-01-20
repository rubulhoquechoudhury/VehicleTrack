import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../utils/api';
import Navbar from '../components/Navbar';
import { driverTracking } from '../services/driverTracking';
import './Auth.css';

const DriverLogin = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login, user, loading } = useAuth();
  const navigate = useNavigate();

  // If already logged in as driver, go straight to dashboard
  useEffect(() => {
    if (loading) return;
    if (user && user.role === 'driver') {
      navigate('/driver/dashboard');
    }
  }, [user, loading, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const response = await authAPI.driverLogin({ username, password });
      login(response.data.token, response.data.user);
      // If tracking was previously started, it will auto-resume on dashboard.
      driverTracking.hydrateFromStorage();
      navigate('/driver/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    }
  };

  return (
    <div>
      <Navbar />
      <div className="auth-page">
      <div className="auth-container">
        <h1>Driver Login</h1>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error && <div className="error-message">{error}</div>}
          <button type="submit" className="btn btn-primary btn-block">
            Login
          </button>
        </form>
      </div>
      </div>
    </div>
  );
};

export default DriverLogin;
