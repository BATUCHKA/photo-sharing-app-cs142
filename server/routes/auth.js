// server/routes/auth.js
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs'); // Add this import for direct password comparison
const User = require('../models/User');
const Activity = require('../models/Activity');
const auth = require('../middleware/auth');

// Register a new user
router.post('/register', async (req, res) => {
  try {
    const { firstName, lastName, username, password, location, occupation, description } = req.body;

    // Check if username exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    // Create new user
    const user = new User({
      firstName,
      lastName,
      username,
      password,
      location,
      occupation,
      description
    });

    await user.save();

    // Create activity for user registration
    const activity = new Activity({
      user: user._id,
      type: 'USER_REGISTERED',
    });

    await activity.save();

    // Update user's last activity
    user.lastActivity = activity._id;
    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET || 'yourSecretKeyHere',
      { expiresIn: '24h' }
    );

    res.status(201).json({
      token,
      user: {
        id: user._id,
        _id: user._id, // Add this to match the format expected by the frontend
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
        location: user.location,
        occupation: user.occupation,
        description: user.description
      }
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    console.log('Login attempt:', req.body.username); // Log for debugging
    const { username, password } = req.body;

    // Find user
    const user = await User.findOne({ username });
    if (!user) {
      console.log('User not found:', username);
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    console.log(user, "hello?")

    // Check password - Use both methods for compatibility
    let isMatch = false;

    // Method 1: Use the User model's method if available
    if (typeof user.comparePassword === 'function') {
      try {
        isMatch = await user.comparePassword(password);
      } catch (err) {
        console.error('Error using comparePassword method:', err);
      }
    }

    // Method 2: Direct comparison as fallback
    if (!isMatch) {
      isMatch = await bcrypt.compare(password, user.password);
    }

    if (!isMatch) {
      console.log('Password mismatch for user:', username);
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    console.log('Login successful for user:', username);

    // Create activity for user login
    const activity = new Activity({
      user: user._id,
      type: 'USER_LOGIN',
    });

    await activity.save();

    // Update user's last activity
    user.lastActivity = activity._id;
    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET || 'yourSecretKeyHere',
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        _id: user._id, // Include both formats for compatibility
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
        location: user.location,
        occupation: user.occupation,
        description: user.description
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Logout user
router.post('/logout', auth, async (req, res) => {
  try {
    // Create activity for user logout
    const activity = new Activity({
      user: req.user.id,
      type: 'USER_LOGOUT',
    });

    await activity.save();

    // Update user's last activity
    const user = await User.findById(req.user.id);
    if (user) {
      user.lastActivity = activity._id;
      await user.save();
    }

    res.json({ message: 'Logged out successfully' });
  } catch (err) {
    console.error('Logout error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Get current user profile
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (err) {
    console.error('Profile retrieval error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;