import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { GoogleMap, LoadScript, Marker } from '@react-google-maps/api';
import Navbar from '../components/Navbar';
import { driverTracking } from '../services/driverTracking';
import './DriverDashboard.css';

const GOOGLE_MAPS_API_KEY = 'AIzaSyDWeekoXL_FTDMMQnhgKqbqqCMuyk4_YTU';

const mapContainerStyle = {
  width: '100%',
  height: '500px'
};

const DriverDashboard = () => {
  const { user, logout, loading } = useAuth();
  const navigate = useNavigate();
  const [isTracking, setIsTracking] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const unsubscribeRef = useRef(null);

  useEffect(() => {
    if (loading) return;
    if (!user || user.role !== 'driver') {
      navigate('/driver');
      return;
    }

    // auto-resume tracking after refresh (only stops when driver clicks Stop)
    driverTracking.hydrateFromStorage();

    unsubscribeRef.current = driverTracking.subscribe((snap) => {
      setIsTracking(snap.isTracking);
      setCurrentLocation(snap.currentLocation);
    });

    return () => {
      unsubscribeRef.current?.();
      unsubscribeRef.current = null;
      // IMPORTANT: do not stop tracking here; it must persist across refresh/logout/navigation
    };
  }, [user, loading, navigate]);

  const startTracking = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }

    driverTracking.start(user.driverId);
  };

  const stopTracking = () => {
    driverTracking.stop();
  };

  // eslint-disable-next-line no-unused-vars
  const handleLogout = () => {
    logout();
    navigate('/driver');
  };

  return (
    <div className="driver-dashboard">
      <Navbar />
      <main className="dashboard-main">
        <div className="control-buttons">
          <button
            onClick={startTracking}
            disabled={isTracking}
            className={`btn ${isTracking ? 'btn-secondary' : 'btn-success'}`}
          >
            Start Track
          </button>
          <button
            onClick={stopTracking}
            disabled={!isTracking}
            className={`btn ${!isTracking ? 'btn-secondary' : 'btn-danger'}`}
          >
            Stop
          </button>
        </div>
        <div className="map-container">
          <h2>Map</h2>
          {currentLocation ? (
            <LoadScript googleMapsApiKey={GOOGLE_MAPS_API_KEY}>
              <GoogleMap
                mapContainerStyle={mapContainerStyle}
                center={{ lat: currentLocation[0], lng: currentLocation[1] }}
                zoom={15}
              >
                <Marker 
                  position={{ lat: currentLocation[0], lng: currentLocation[1] }}
                  title="Your Location"
                />
              </GoogleMap>
            </LoadScript>
          ) : (
            <div className="map-placeholder">
              {isTracking ? 'Getting your location...' : 'Click "Start Track" to begin tracking'}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default DriverDashboard;
