const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

// Load environment variables from project root .env
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const driverRoutes = require('./routes/driver');
const trackerRoutes = require('./routes/tracker');

const app = express();
const server = http.createServer(app);

// CORS configuration - allow both dev and production
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5000',
  process.env.FRONTEND_URL
].filter(Boolean);

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (same-origin requests, mobile apps, etc.)
    // In production, when client is served from same server, origin may be undefined
    if (!origin) {
      return callback(null, true);
    }
    
    // Allow if origin is in allowed list
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    // In production, be more permissive if FRONTEND_URL is not set
    if (process.env.NODE_ENV === 'production' && !process.env.FRONTEND_URL) {
      return callback(null, true);
    }
    
    callback(new Error('Not allowed by CORS'));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};

const io = socketIo(server, {
  cors: corsOptions
});

// Middleware
app.use(cors(corsOptions));
app.use(express.json());

// Database connection
if (!process.env.MONGODB_URI) {
  console.error('MONGODB_URI is not defined in .env file');
  process.exit(1);
}

let dbConnected = false;

mongoose
  .connect(process.env.MONGODB_URI, {
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  })
  .then(() => {
    console.log('MongoDB connected');
    dbConnected = true;
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  });

// Middleware to check database connection
app.use((req, res, next) => {
  if (!dbConnected) {
    return res.status(503).json({ message: 'Database is connecting. Please try again.' });
  }
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/driver', driverRoutes);
app.use('/api/tracker', trackerRoutes);

// Serve static files from client build in production
if (process.env.NODE_ENV === 'production') {
  const clientBuildPath = path.join(__dirname, '..', 'client', 'build');
  app.use(express.static(clientBuildPath));
  
  // SPA fallback - serve index.html for all non-API routes
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(clientBuildPath, 'index.html'));
    }
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  res.status(err.status || 500).json({
    message: process.env.NODE_ENV === 'production' 
      ? 'An error occurred' 
      : err.message
  });
});

// WebSocket connection handling
const activeDrivers = new Map(); // driverId -> socketId
const locationUpdates = new Map(); // driverId -> { lat, lng, timestamp }

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  // Driver connects and starts tracking
  socket.on('driver:start-tracking', (data) => {
    const { driverId } = data;
    activeDrivers.set(driverId, socket.id);
    console.log(`Driver ${driverId} started tracking`);
  });

  // Driver sends location update
  socket.on('driver:location-update', (data) => {
    const { driverId, lat, lng } = data;
    console.log('Received location update from driver:', driverId, { lat, lng });
    const location = {
      lat,
      lng,
      timestamp: new Date()
    };
    locationUpdates.set(driverId, location);
    console.log('Stored location for driver:', driverId, 'Total drivers:', locationUpdates.size);
    
    // Broadcast to all trackers
    io.emit('location:update', {
      driverId,
      ...location
    });
  });

  // Driver stops tracking
  socket.on('driver:stop-tracking', (data) => {
    const { driverId } = data;
    activeDrivers.delete(driverId);
    locationUpdates.delete(driverId);
    console.log(`Driver ${driverId} stopped tracking`);
    io.emit('location:stop', { driverId });
  });

  // Tracker requests location for a specific bus
  socket.on('tracker:request-location', (data) => {
    const { driverId } = data;
    console.log('Tracker requesting location for driver:', driverId);
    const location = locationUpdates.get(driverId);
    if (location) {
      console.log('Found location, sending to tracker:', { driverId, ...location });
      socket.emit('location:update', {
        driverId,
        ...location
      });
    } else {
      console.log('No location found for driver:', driverId, 'Available drivers:', Array.from(locationUpdates.keys()));
    }
  });

  // Tracker requests all active buses
  socket.on('tracker:request-all-buses', () => {
    const activeBuses = Array.from(locationUpdates.entries()).map(([driverId, location]) => ({
      driverId,
      ...location
    }));
    socket.emit('location:all-buses', activeBuses);
  });

  socket.on('disconnect', () => {
    // Clean up on disconnect
    for (const [driverId, socketId] of activeDrivers.entries()) {
      if (socketId === socket.id) {
        activeDrivers.delete(driverId);
        locationUpdates.delete(driverId);
        io.emit('location:stop', { driverId });
        break;
      }
    }
    console.log('Client disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
