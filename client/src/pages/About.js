import React from 'react';
import Navbar from '../components/Navbar';
import './Page.css';

const About = () => {
  return (
    <div className="page">
      <Navbar />
      <main className="page-main">
        <div className="container">
          <div className="card">
            <h1>About Vehicle Track</h1>
            <p>Vehicle Track is a real-time vehicle tracking system that allows you to monitor the location of vehicles in real-time.</p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default About;
