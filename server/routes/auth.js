
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Activity = require('../models/Activity');
const auth = require('../middleware/auth');


router.post('/register', async (req, res) => {
  try {
    const { firstName, lastName, username, password, location, occupation, description } = req.body;


    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ error: 'Username already exists' });
    }


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

    const activity = new Activity({
      user: user._id,
      type: 'USER_REGISTERED',
    });

    await activity.save();


    user.lastActivity = activity._id;
    await user.save();


    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET || 'yourSecretKeyHere',
      { expiresIn: '24h' }
    );

    res.status(201).json({
      token,
      user: {
        id: user._id,
        _id: user._id,
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


router.post('/login', async (req, res) => {
  try {
    console.log('Login attempt:', req.body.username);
    const { username, password } = req.body;


    const user = await User.findOne({ username });
    if (!user) {
      console.log('User not found:', username);
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    console.log(user, "hello?")


    let isMatch = false;


    if (typeof user.comparePassword === 'function') {
      try {
        isMatch = await user.comparePassword(password);
      } catch (err) {
        console.error('Error using comparePassword method:', err);
      }
    }


    if (!isMatch) {
      isMatch = await bcrypt.compare(password, user.password);
    }

    if (!isMatch) {
      console.log('Password mismatch for user:', username);
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    console.log('Login successful for user:', username);


    const activity = new Activity({
      user: user._id,
      type: 'USER_LOGIN',
    });

    await activity.save();


    user.lastActivity = activity._id;
    await user.save();


    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET || 'yourSecretKeyHere',
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        _id: user._id,
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


router.post('/logout', auth, async (req, res) => {
  try {

    const activity = new Activity({
      user: req.user.id,
      type: 'USER_LOGOUT',
    });

    await activity.save();


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