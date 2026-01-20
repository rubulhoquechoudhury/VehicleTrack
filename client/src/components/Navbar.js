import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

const roleHome = (role) => {
  if (role === 'admin') return '/admin';
  if (role === 'driver') return '/driver/dashboard';
  if (role === 'tracker') return '/track/dashboard';
  return '/';
};

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
    setIsOpen(false);
  };

  const closeMenu = () => {
    setIsOpen(false);
  };

  const dashboardPath = user?.role ? roleHome(user.role) : null;

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="navbar-brand">
          Vehicle Track
        </Link>

        <button
          className="navbar-toggle"
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
        >
          <span />
          <span />
          <span />
        </button>

        <div className={`navbar-menu ${isOpen ? 'open' : ''}`}>
          <nav className="navbar-links" onClick={closeMenu}>
            <Link to="/">Home</Link>
            <Link to="/about">About</Link>
            <Link to="/contact">Contact</Link>
            {!user && <Link to="/login">Login</Link>}
            {user && dashboardPath && <Link to={dashboardPath}>Dashboard</Link>}
          </nav>

          <div className="navbar-right">
            {user ? (
              <>
                <span className="navbar-user">{user.username}</span>
                <button className="btn-link" onClick={handleLogout}>
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/driver" className="btn btn-primary" onClick={closeMenu}>
                  Driver
                </Link>
                <Link to="/track" className="btn btn-primary" onClick={closeMenu}>
                  Track
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;

