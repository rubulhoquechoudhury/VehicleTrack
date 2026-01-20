import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import DriverLogin from './pages/DriverLogin';
import DriverDashboard from './pages/DriverDashboard';
import AdminLogin from './pages/AdminLogin';
import AdminSignup from './pages/AdminSignup';
import AdminDashboard from './pages/AdminDashboard';
import TrackerLogin from './pages/TrackerLogin';
import TrackerDashboard from './pages/TrackerDashboard';
import About from './pages/About';
import Contact from './pages/Contact';
import { AuthProvider } from './context/AuthContext';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/login" element={<AdminLogin />} />
          <Route path="/signup" element={<AdminSignup />} />
          <Route path="/driver" element={<DriverLogin />} />
          <Route path="/driver/dashboard" element={<DriverDashboard />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/track" element={<TrackerLogin />} />
          <Route path="/track/dashboard" element={<TrackerDashboard />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
