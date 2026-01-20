import io from 'socket.io-client';

const STORAGE_KEY = 'driverTracking';

function readState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function clearState() {
  localStorage.removeItem(STORAGE_KEY);
}

class DriverTrackingService {
  socket = null;
  intervalId = null;
  listeners = new Set();
  currentLocation = null;
  isTracking = false;
  driverId = null;

  notify() {
    for (const cb of this.listeners) {
      cb({
        isTracking: this.isTracking,
        driverId: this.driverId,
        currentLocation: this.currentLocation,
      });
    }
  }

  ensureSocket() {
    if (this.socket) return;
    // In production, connect to same domain; in development, use localhost
    const SOCKET_URL = process.env.NODE_ENV === 'production' ? window.location.origin : 'http://localhost:5000';
    this.socket = io(SOCKET_URL, { transports: ['websocket'] });
    this.socket.on('connect', () => {
      console.log('Driver socket connected');
      if (this.isTracking && this.driverId) {
        console.log('Emitting driver:start-tracking for driverId:', this.driverId);
        this.socket.emit('driver:start-tracking', { driverId: this.driverId });
      }
    });
  }

  updateLocationOnce() {
    if (!navigator.geolocation || !this.driverId) return;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        this.currentLocation = [latitude, longitude];
        this.ensureSocket();
        
        const emitLocation = () => {
          if (this.socket && this.socket.connected) {
            console.log('Emitting location update:', { driverId: this.driverId, lat: latitude, lng: longitude });
            this.socket.emit('driver:location-update', {
              driverId: this.driverId,
              lat: latitude,
              lng: longitude,
            });
          } else if (this.socket) {
            // Wait for socket to connect
            setTimeout(emitLocation, 100);
          }
        };
        
        emitLocation();
        this.notify();
      },
      () => {
        // ignore single failures; next tick will retry
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 }
    );
  }

  start(driverId) {
    if (!driverId) return;

    // prevent duplicate intervals
    if (this.isTracking && this.driverId === driverId) return;

    this.driverId = driverId;
    this.isTracking = true;

    writeState({ isTracking: true, driverId, startedAt: Date.now() });

    this.ensureSocket();
    this.socket.emit('driver:start-tracking', { driverId });

    this.updateLocationOnce();
    this.intervalId = setInterval(() => this.updateLocationOnce(), 5000);

    this.notify();
  }

  stop() {
    if (!this.isTracking) return;

    const driverId = this.driverId;
    this.isTracking = false;
    this.driverId = null;
    this.currentLocation = null;

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    this.ensureSocket();
    if (driverId) {
      this.socket.emit('driver:stop-tracking', { driverId });
    }

    clearState();
    this.notify();
  }

  getSnapshot() {
    return {
      isTracking: this.isTracking,
      driverId: this.driverId,
      currentLocation: this.currentLocation,
    };
  }

  subscribe(cb) {
    this.listeners.add(cb);
    cb(this.getSnapshot());
    return () => this.listeners.delete(cb);
  }

  // Call on app load / dashboard mount to auto-resume after refresh
  hydrateFromStorage() {
    const state = readState();
    if (state?.isTracking && state?.driverId) {
      this.start(state.driverId);
    }
  }
}

export const driverTracking = new DriverTrackingService();

