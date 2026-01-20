import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { trackerAPI } from '../utils/api';
import { GoogleMap, LoadScript, Marker } from '@react-google-maps/api';
import io from 'socket.io-client';
import Navbar from '../components/Navbar';
import './TrackerDashboard.css';

const GOOGLE_MAPS_API_KEY = 'AIzaSyDWeekoXL_FTDMMQnhgKqbqqCMuyk4_YTU';

const mapContainerStyle = {
  width: '100%',
  height: '500px'
};

const TRACKER_SELECTION_KEY = 'trackerSelectedBus';

const saveSelectedBus = (bus) => {
  try {
    if (!bus) {
      localStorage.removeItem(TRACKER_SELECTION_KEY);
    } else {
      localStorage.setItem(
        TRACKER_SELECTION_KEY,
        JSON.stringify({ driverId: bus.driverId })
      );
    }
  } catch (e) {
    console.error('Failed to save tracker selection', e);
  }
};

const loadSelectedBus = () => {
  try {
    const raw = localStorage.getItem(TRACKER_SELECTION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const TrackerDashboard = () => {
  // eslint-disable-next-line no-unused-vars
  const { user, logout, loading } = useAuth();
  const navigate = useNavigate();
  const [buses, setBuses] = useState([]);
  const [selectedBus, setSelectedBus] = useState(null);
  const [busLocation, setBusLocation] = useState(null);
  const socketRef = useRef(null);
  const locationIntervalRef = useRef(null);
  const selectedBusRef = useRef(null);

  const fetchBuses = useCallback(async () => {
    try {
      const response = await trackerAPI.getBuses();
      setBuses(response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching buses:', error);
      return [];
    }
  }, []);

  const initializeSocket = useCallback(() => {
    if (socketRef.current) {
      console.log('Socket already exists, returning');
      return;
    }
    console.log('Creating new socket connection');
    // In production, connect to same domain; in development, use localhost
    const SOCKET_URL = process.env.NODE_ENV === 'production' ? window.location.origin : 'http://localhost:5000';
    socketRef.current = io(SOCKET_URL, { 
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5
    });

    socketRef.current.on('connect', () => {
      console.log('Tracker socket connected, socket id:', socketRef.current.id);
    });

    socketRef.current.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });

    socketRef.current.on('location:update', (data) => {
      console.log('Received location:update event:', data);
      const current = selectedBusRef.current;
      console.log('Current selected bus:', current?.driverId, 'Data driver:', data.driverId);
      if (current && data.driverId === current.driverId) {
        console.log('Match! Updating bus location to:', [data.lat, data.lng]);
        setBusLocation([data.lat, data.lng]);
      } else {
        console.log('No match - current:', current?.driverId, 'data:', data.driverId);
      }
    });

    socketRef.current.on('location:stop', (data) => {
      const current = selectedBusRef.current;
      if (current && data.driverId === current.driverId) {
        setBusLocation(null);
        setSelectedBus(null);
        saveSelectedBus(null);
        if (locationIntervalRef.current) {
          clearInterval(locationIntervalRef.current);
          locationIntervalRef.current = null;
        }
      }
    });
  }, []);

  const handleTrackBus = useCallback((bus, options = {}) => {
    console.log('=== handleTrackBus called ===');
    console.log('Bus:', bus);
    
    // Ensure socket is initialized
    if (!socketRef.current) {
      console.log('Socket not initialized, initializing');
      initializeSocket();
    }

    // Set selected bus first
    console.log('Setting selected bus to:', bus.driverId);
    setSelectedBus(bus);
    
    if (!options.skipSave) {
      saveSelectedBus(bus);
    }

    // Wait for socket to be connected, then request location
    const requestLocation = (attempt = 0) => {
      const isConnected = socketRef.current && socketRef.current.connected;
      console.log(`Request location attempt ${attempt}: socket connected = ${isConnected}`);
      
      if (socketRef.current && socketRef.current.connected) {
        const payload = { driverId: bus.driverId };
        console.log('Socket is connected! Emitting tracker:request-location with:', payload);
        try {
          socketRef.current.emit('tracker:request-location', payload);
          console.log('Emit successful');
        } catch (e) {
          console.error('Emit error:', e);
        }
      } else if (attempt < 50) { // Try for up to 5 seconds (50 * 100ms)
        console.log(`Socket not ready, retrying in 100ms (attempt ${attempt}/50)`);
        setTimeout(() => requestLocation(attempt + 1), 100);
      } else {
        console.error('Failed to send location request after 5 seconds');
      }
    };

    requestLocation();

    // Request location updates every 5 seconds until explicitly stopped
    if (locationIntervalRef.current) {
      clearInterval(locationIntervalRef.current);
    }
    locationIntervalRef.current = setInterval(() => {
      const current = selectedBusRef.current;
      if (current && socketRef.current && socketRef.current.connected) {
        console.log('Polling location for driver:', current.driverId);
        socketRef.current.emit('tracker:request-location', {
          driverId: current.driverId,
        });
      }
    }, 5000);
  }, [initializeSocket]);

  // keep ref in sync so socket handlers always see latest selection
  useEffect(() => {
    selectedBusRef.current = selectedBus;
  }, [selectedBus]);

  // Initialize socket once on component mount
  useEffect(() => {
    console.log('Component mounted, initializing socket');
    initializeSocket();
  }, [initializeSocket]);

  useEffect(() => {
    if (loading) return;
    if (!user || user.role !== 'tracker') {
      navigate('/track');
      return;
    }

    console.log('TrackerDashboard setup starting');

    const setup = async () => {
      console.log('setup() called');
      
      console.log('Fetching buses...');
      const list = await fetchBuses();
      console.log('Buses fetched:', list);

      // try to restore previously tracked bus from localStorage
      const saved = loadSelectedBus();
      if (saved?.driverId) {
        console.log('Found saved bus selection:', saved.driverId);
        const existing = list.find((b) => b.driverId === saved.driverId);
        if (existing) {
          console.log('Found existing bus match, auto-tracking:', existing);
          handleTrackBus(existing, { skipSave: true });
        }
      } else {
        console.log('No saved bus selection in localStorage');
      }
    };

    setup();

    return () => {
      console.log('Cleaning up TrackerDashboard');
      if (locationIntervalRef.current) {
        clearInterval(locationIntervalRef.current);
      }
    };
  }, [user, loading, navigate, fetchBuses, handleTrackBus]);

  const stopTracking = () => {
    if (locationIntervalRef.current) {
      clearInterval(locationIntervalRef.current);
      locationIntervalRef.current = null;
    }
    saveSelectedBus(null);
    setSelectedBus(null);
    setBusLocation(null);
  };

  return (
    <div className="tracker-dashboard">
      <Navbar />
      <main className="dashboard-main">
        <div className="dashboard-content">
          <div className="bus-list-section">
            <h2>List of Bus</h2>
            <table className="table">
              <thead>
                <tr>
                  <th>Bus</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {buses.map((bus) => (
                  <tr key={bus._id}>
                    <td>{bus.vehicleName || `Bus ${bus.driverId}`}</td>
                    <td>
                      {selectedBus && selectedBus.driverId === bus.driverId ? (
                        <button
                          onClick={stopTracking}
                          className="btn btn-danger"
                        >
                          Stop
                        </button>
                      ) : (
                        <button
                          onClick={() => handleTrackBus(bus)}
                          className="btn btn-primary"
                        >
                          Track
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="map-section">
            <h2>
              {selectedBus
                ? `${selectedBus.vehicleName || `Bus ${selectedBus.driverId}`} Location`
                : 'Tracker Dashboard'}
            </h2>
            {busLocation ? (
              <LoadScript googleMapsApiKey={GOOGLE_MAPS_API_KEY}>
                <GoogleMap
                  mapContainerStyle={mapContainerStyle}
                  center={{ lat: busLocation[0], lng: busLocation[1] }}
                  zoom={15}
                  key={busLocation[0] + busLocation[1]}
                >
                  <Marker 
                    position={{ lat: busLocation[0], lng: busLocation[1] }}
                    title={selectedBus?.vehicleName || `Bus ${selectedBus?.driverId}`}
                  />
                </GoogleMap>
              </LoadScript>
            ) : (
              <div className="map-placeholder">
                {selectedBus
                  ? 'Waiting for location update...'
                  : 'Select a bus to track its location'}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default TrackerDashboard;
