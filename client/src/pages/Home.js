import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import './Home.css';

const Home = () => {
  return (
    <div className="home">
      <Navbar />
      <main className="home-main">
        <div className="welcome-section">
          <h1>Welcome to Vehicle Track</h1>
          <div className="action-buttons">
            <Link to="/driver" className="btn btn-primary btn-large">
              Driver Login
            </Link>
            <Link to="/track" className="btn btn-primary btn-large">
              Track Vehicle
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Home;
