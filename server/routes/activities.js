// server/routes/activities.js
const express = require('express');
const router = express.Router();
const Activity = require('../models/Activity');
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit) : 5;
    
    const activities = await Activity.find()
      .sort({ date: -1 })
      .limit(limit)
      .populate('user', 'firstName lastName username')
      .populate('photo')
      .populate({
        path: 'comment',
        populate: { path: 'photo' }
      });
    
    res.json(activities);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

router.get('/user/:userId', auth, async (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit) : 5;
    
    const activities = await Activity.find({ user: req.params.userId })
      .sort({ date: -1 })
      .limit(limit)
      .populate('user', 'firstName lastName username')
      .populate('photo')
      .populate({
        path: 'comment',
        populate: { path: 'photo' }
      });
    
    res.json(activities);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;