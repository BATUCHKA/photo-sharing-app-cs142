// server/routes/users.js
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Photo = require('../models/Photo');
const Comment = require('../models/Comment');
const Activity = require('../models/Activity');
const auth = require('../middleware/auth');

// Get all users
router.get('/', async (req, res) => {
  try {
    const users = await User.find().select('-password -__v');
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Get user by ID with usage info
router.get('/:id', auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password -__v');
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Find user's photos that are visible to the current user
    const photos = await Photo.find({ user: req.params.id })
      .where({
        $or: [
          { sharedWith: { $size: 0 } }, // Public photos
          { sharedWith: req.user.id },  // Shared with current user
          { user: req.user.id }         // Current user is the owner
        ]
      })
      .sort({ dateUploaded: -1 })
      .populate('comments');
    
    // Get most recent photo
    const mostRecentPhoto = photos.length > 0 ? photos[0] : null;
    
    // Get photo with most comments
    let mostCommentedPhoto = null;
    let maxComments = 0;
    
    photos.forEach(photo => {
      if (photo.comments.length > maxComments) {
        maxComments = photo.comments.length;
        mostCommentedPhoto = photo;
      }
    });
    
    // Find photos where this user is mentioned in comments
    const mentionedPhotos = await Photo.find({
      'comments.mentions': req.params.id
    }).populate('user', 'firstName lastName username');
    
    // Find user's last activity
    const lastActivity = await Activity.findOne({ user: req.params.id })
      .sort({ date: -1 })
      .populate('photo')
      .populate('comment');
    
    res.json({
      user,
      mostRecentPhoto,
      mostCommentedPhoto,
      mentionedPhotos,
      lastActivity
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Update user profile
router.put('/profile', auth, async (req, res) => {
  try {
    const { firstName, lastName, location, occupation, description } = req.body;
    
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Update fields
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (location) user.location = location;
    if (occupation) user.occupation = occupation;
    if (description) user.description = description;
    
    await user.save();
    
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Add photo to favorites
router.post('/favorites/:photoId', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const photo = await Photo.findById(req.params.photoId);
    if (!photo) {
      return res.status(404).json({ error: 'Photo not found' });
    }
    
    // Check if already favorited
    if (user.favorites.includes(req.params.photoId)) {
      return res.status(400).json({ error: 'Photo already in favorites' });
    }
    
    // Add to favorites
    user.favorites.push(req.params.photoId);
    await user.save();
    
    res.json(user.favorites);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Remove photo from favorites
router.delete('/favorites/:photoId', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Remove from favorites
    user.favorites = user.favorites.filter(
      id => id.toString() !== req.params.photoId
    );
    await user.save();
    
    res.json(user.favorites);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Get user's favorites
router.get('/favorites', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate({
        path: 'favorites',
        populate: { path: 'user', select: 'firstName lastName username' }
      });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(user.favorites);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Delete user account
router.delete('/', auth, async (req, res) => {
  try {
    // Get user
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Delete all user's photos
    const photos = await Photo.find({ user: req.user.id });
    for (const photo of photos) {
      // Delete all comments on this photo
      await Comment.deleteMany({ photo: photo._id });
      
      // Delete the photo
      await photo.remove();
    }
    
    // Delete all comments made by user
    await Comment.deleteMany({ user: req.user.id });
    
    // Delete all activities by user
    await Activity.deleteMany({ user: req.user.id });
    
    // Delete the user
    await user.remove();
    
    res.json({ message: 'User account deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;