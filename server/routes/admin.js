const express = require('express');
const User = require('../models/User');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// All routes require admin authentication
router.use(authenticate);
router.use(authorize('admin'));

// Get all drivers
router.get('/drivers', async (req, res) => {
  try {
    const drivers = await User.find({ role: 'driver', createdBy: req.user.id }).select('-password');
    res.json(drivers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all trackers
router.get('/trackers', async (req, res) => {
  try {
    const trackers = await User.find({ role: 'tracker', createdBy: req.user.id }).select('-password');
    res.json(trackers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add driver
router.post('/drivers', async (req, res) => {
  try {
    const { vehicleName, username, password } = req.body;
    
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: 'Username already exists' });
    }

    const driverId = `DRV-${Date.now()}`;
    const driver = new User({
      username,
      password,
      vehicleName,
      role: 'driver',
      driverId,
      createdBy: req.user.id
    });

    await driver.save();
    res.status(201).json({ 
      id: driver._id,
      username: driver.username,
      vehicleName: driver.vehicleName,
      driverId: driver.driverId
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add tracker
router.post('/trackers', async (req, res) => {
  try {
    const { name, username, password } = req.body;
    
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: 'Username already exists' });
    }

    const tracker = new User({
      username,
      password,
      role: 'tracker',
      createdBy: req.user.id
    });

    await tracker.save();
    res.status(201).json({ 
      id: tracker._id,
      username: tracker.username
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete driver
router.delete('/drivers/:id', async (req, res) => {
  try {
    const driver = await User.findOneAndDelete({ _id: req.params.id, createdBy: req.user.id, role: 'driver' });
    if (!driver) {
      return res.status(404).json({ message: 'Driver not found' });
    }
    res.json({ message: 'Driver deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete tracker
router.delete('/trackers/:id', async (req, res) => {
  try {
    const tracker = await User.findOneAndDelete({ _id: req.params.id, createdBy: req.user.id, role: 'tracker' });
    if (!tracker) {
      return res.status(404).json({ message: 'Tracker not found' });
    }
    res.json({ message: 'Tracker deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
