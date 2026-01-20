const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// All routes require driver authentication
router.use(authenticate);
router.use(authorize('driver'));

// Get driver info
router.get('/info', async (req, res) => {
  try {
    res.json({
      id: req.user.id,
      username: req.user.username,
      driverId: req.user.driverId
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
