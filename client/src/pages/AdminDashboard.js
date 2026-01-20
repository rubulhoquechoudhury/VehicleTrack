import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { adminAPI } from '../utils/api';
import Navbar from '../components/Navbar';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const { user, logout, loading } = useAuth();
  const navigate = useNavigate();
  const [drivers, setDrivers] = useState([]);
  const [trackers, setTrackers] = useState([]);
  const [showDriverForm, setShowDriverForm] = useState(false);
  const [showTrackerForm, setShowTrackerForm] = useState(false);
  const [driverForm, setDriverForm] = useState({ vehicleName: '', username: '', password: '' });
  const [trackerForm, setTrackerForm] = useState({ name: '', username: '', password: '' });

  useEffect(() => {
    if (loading) return;
    if (!user || user.role !== 'admin') {
      navigate('/login');
      return;
    }
    fetchData();
  }, [user, loading, navigate]);

  const fetchData = async () => {
    try {
      const [driversRes, trackersRes] = await Promise.all([
        adminAPI.getDrivers(),
        adminAPI.getTrackers()
      ]);
      setDrivers(driversRes.data);
      setTrackers(trackersRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const handleAddDriver = async (e) => {
    e.preventDefault();
    try {
      await adminAPI.addDriver(driverForm);
      setDriverForm({ vehicleName: '', username: '', password: '' });
      setShowDriverForm(false);
      fetchData();
    } catch (error) {
      alert(error.response?.data?.message || 'Error adding driver');
    }
  };

  const handleAddTracker = async (e) => {
    e.preventDefault();
    try {
      await adminAPI.addTracker(trackerForm);
      setTrackerForm({ name: '', username: '', password: '' });
      setShowTrackerForm(false);
      fetchData();
    } catch (error) {
      alert(error.response?.data?.message || 'Error adding tracker');
    }
  };

  const handleDeleteDriver = async (id) => {
    if (window.confirm('Are you sure you want to delete this driver?')) {
      try {
        await adminAPI.deleteDriver(id);
        fetchData();
      } catch (error) {
        alert('Error deleting driver');
      }
    }
  };

  const handleDeleteTracker = async (id) => {
    if (window.confirm('Are you sure you want to delete this tracker?')) {
      try {
        await adminAPI.deleteTracker(id);
        fetchData();
      } catch (error) {
        alert('Error deleting tracker');
      }
    }
  };

  // eslint-disable-next-line no-unused-vars
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="admin-dashboard">
      <Navbar />
      <main className="dashboard-main">
        <div className="container">
          {/* Bus Driver Management */}
          <div className="card">
            <div className="card-header">
              <h2>Bus Driver</h2>
              <button
                onClick={() => setShowDriverForm(!showDriverForm)}
                className="btn btn-success"
              >
                +
              </button>
            </div>
            {showDriverForm && (
              <form onSubmit={handleAddDriver} className="form-inline">
                <input
                  type="text"
                  placeholder="Vehicle Name"
                  value={driverForm.vehicleName}
                  onChange={(e) => setDriverForm({ ...driverForm, vehicleName: e.target.value })}
                  required
                />
                <input
                  type="text"
                  placeholder="Username"
                  value={driverForm.username}
                  onChange={(e) => setDriverForm({ ...driverForm, username: e.target.value })}
                  required
                />
                <input
                  type="password"
                  placeholder="Password"
                  value={driverForm.password}
                  onChange={(e) => setDriverForm({ ...driverForm, password: e.target.value })}
                  required
                />
                <button type="submit" className="btn btn-primary">Add</button>
                <button
                  type="button"
                  onClick={() => setShowDriverForm(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
              </form>
            )}
            <table className="table">
              <thead>
                <tr>
                  <th>Vehicle Name</th>
                  <th>Username</th>
                  <th>Password</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {drivers.map((driver, index) => (
                  <tr key={driver._id}>
                    <td>{driver.vehicleName}</td>
                    <td>{driver.username}</td>
                    <td>••••••••</td>
                    <td>
                      <button
                        onClick={() => handleDeleteDriver(driver._id)}
                        className="btn btn-danger btn-sm"
                      >
                        -
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Tracker Management */}
          <div className="card">
            <div className="card-header">
              <h2>Tracking</h2>
              <button
                onClick={() => setShowTrackerForm(!showTrackerForm)}
                className="btn btn-success"
              >
                +
              </button>
            </div>
            {showTrackerForm && (
              <form onSubmit={handleAddTracker} className="form-inline">
                <input
                  type="text"
                  placeholder="Name"
                  value={trackerForm.name}
                  onChange={(e) => setTrackerForm({ ...trackerForm, name: e.target.value })}
                  required
                />
                <input
                  type="text"
                  placeholder="Username"
                  value={trackerForm.username}
                  onChange={(e) => setTrackerForm({ ...trackerForm, username: e.target.value })}
                  required
                />
                <input
                  type="password"
                  placeholder="Password"
                  value={trackerForm.password}
                  onChange={(e) => setTrackerForm({ ...trackerForm, password: e.target.value })}
                  required
                />
                <button type="submit" className="btn btn-primary">Add</button>
                <button
                  type="button"
                  onClick={() => setShowTrackerForm(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
              </form>
            )}
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Username</th>
                  <th>Password</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {trackers.map((tracker) => (
                  <tr key={tracker._id}>
                    <td>{tracker.username}</td>
                    <td>{tracker.username}</td>
                    <td>••••••••</td>
                    <td>
                      <button
                        onClick={() => handleDeleteTracker(tracker._id)}
                        className="btn btn-danger btn-sm"
                      >
                        -
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
