import React from 'react';
import Navbar from '../components/Navbar';
import './Page.css';

const Contact = () => {
  return (
    <div className="page">
      <Navbar />
      <main className="page-main">
        <div className="container">
          <div className="card">
            <h1>Contact Us</h1>
            <p>For support and inquiries, please contact us.</p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Contact;
