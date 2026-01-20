const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { authenticate, JWT_SECRET } = require('../middleware/auth');

const router = express.Router();

// Admin login
router.post('/admin/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username, role: 'admin' });
    
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user._id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({ token, user: { id: user._id, username: user.username, role: user.role } });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Admin signup
router.post('/admin/signup', async (req, res) => {
  try {
    const { username, email, phone, password } = req.body;
    
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: 'Username already exists' });
    }

    const user = new User({
      username,
      email,
      phone,
      password,
      role: 'admin'
    });

    await user.save();

    const token = jwt.sign(
      { id: user._id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({ token, user: { id: user._id, username: user.username, role: user.role } });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Driver login
router.post('/driver/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username, role: 'driver' });
    
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user._id, username: user.username, role: user.role, driverId: user.driverId },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({ 
      token, 
      user: { 
        id: user._id, 
        username: user.username, 
        role: user.role,
        vehicleName: user.vehicleName,
        driverId: user.driverId
      } 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Tracker login
router.post('/tracker/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username, role: 'tracker' });
    
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user._id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({ token, user: { id: user._id, username: user.username, role: user.role } });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get current user
router.get('/me', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
