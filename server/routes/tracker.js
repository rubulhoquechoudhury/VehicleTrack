const express = require('express');
const User = require('../models/User');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// All routes require tracker authentication
router.use(authenticate);
router.use(authorize('tracker'));

// Get all buses (drivers) that belong to this tracker's organisation (admin)
router.get('/buses', async (req, res) => {
  try {
    // Tracker itself is a user with role 'tracker' and createdBy = adminId
    const tracker = await User.findById(req.user.id).select('createdBy');

    if (!tracker || !tracker.createdBy) {
      // No organisation assigned → no buses to track
      return res.json([]);
    }

    const buses = await User.find({
      role: 'driver',
      createdBy: tracker.createdBy,
    }).select('vehicleName username driverId');

    res.json(buses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
