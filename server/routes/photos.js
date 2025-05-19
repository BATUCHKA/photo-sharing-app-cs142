// server/routes/photos.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Photo = require('../models/Photo');
const User = require('../models/User');
const Activity = require('../models/Activity');
const Comment = require('../models/Comment');
const auth = require('../middleware/auth');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|gif/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only image files are allowed!'));
  }
});

// Get all photos visible to the current user
router.get('/', auth, async (req, res) => {
  try {
    // Find photos that are visible to the current user
    const photos = await Photo.find({
      $or: [
        { sharedWith: { $exists: false } },  // Public photos (no sharing list)
        { sharedWith: { $size: 0 } },        // Public photos (empty sharing list)
        { sharedWith: req.user.id },         // Shared with current user
        { user: req.user.id }                // Current user is the owner
      ]
    })
    .sort({ 
      'likes.length': -1,      // Sort by likes count (descending)
      dateUploaded: -1         // Then by upload date (most recent first)
    })
    .populate('user', 'firstName lastName username')
    .populate({
      path: 'comments',
      populate: { path: 'user', select: 'firstName lastName username' }
    });
    
    res.json(photos);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Get photos by user ID
router.get('/user/:userId', auth, async (req, res) => {
  try {
    // Find photos that are visible to the current user
    const photos = await Photo.find({
      user: req.params.userId,
      $or: [
        { sharedWith: { $exists: false } },  // Public photos (no sharing list)
        { sharedWith: { $size: 0 } },        // Public photos (empty sharing list)
        { sharedWith: req.user.id },         // Shared with current user
        { user: req.user.id }                // Current user is the owner
      ]
    })
    .sort({ 
      'likes.length': -1,      // Sort by likes count (descending)
      dateUploaded: -1         // Then by upload date (most recent first)
    })
    .populate('user', 'firstName lastName username')
    .populate({
      path: 'comments',
      populate: { path: 'user', select: 'firstName lastName username' }
    });
    
    res.json(photos);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Get single photo by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const photo = await Photo.findById(req.params.id)
      .populate('user', 'firstName lastName username')
      .populate({
        path: 'comments',
        populate: { path: 'user', select: 'firstName lastName username' }
      })
      .populate('likes', 'firstName lastName username')
      .populate('sharedWith', 'firstName lastName username')
      .populate('mentions', 'firstName lastName username')
      .populate('tags.user', 'firstName lastName username');
    
    if (!photo) {
      return res.status(404).json({ error: 'Photo not found' });
    }
    
    // Check if user has permission to view
    if (!photo.canBeViewedBy(req.user.id)) {
      return res.status(403).json({ error: 'Not authorized to view this photo' });
    }
    
    res.json(photo);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Upload a new photo
router.post('/', [auth, upload.single('photo')], async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No photo uploaded' });
    }
    
    const { caption, sharedWith } = req.body;
    
    // Create photo object
    const newPhoto = new Photo({
      user: req.user.id,
      file: `/uploads/${req.file.filename}`,
      caption: caption || '',
    });
    
    // Add sharing list if provided
    if (sharedWith && sharedWith.length > 0) {
      // Parse the shared users array if it's a string
      const sharedUsers = typeof sharedWith === 'string' 
        ? JSON.parse(sharedWith) 
        : sharedWith;
        
      // Validate that all users exist
      for (const userId of sharedUsers) {
        const user = await User.findById(userId);
        if (!user) {
          return res.status(400).json({ error: `User ${userId} not found` });
        }
      }
      
      newPhoto.sharedWith = sharedUsers;
    }
    
    await newPhoto.save();
    
    // Create activity for photo upload
    const activity = new Activity({
      user: req.user.id,
      type: 'PHOTO_UPLOAD',
      photo: newPhoto._id
    });
    
    await activity.save();
    
    // Update user's last activity
    const user = await User.findById(req.user.id);
    user.lastActivity = activity._id;
    await user.save();
    
    // Populate user data
    const photo = await Photo.findById(newPhoto._id)
      .populate('user', 'firstName lastName username');
    
    res.status(201).json(photo);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Add tag to photo
router.post('/:id/tags', auth, async (req, res) => {
  try {
    const { userId, rect } = req.body;
    
    // Validate user exists
    const taggedUser = await User.findById(userId);
    if (!taggedUser) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Get the photo
    const photo = await Photo.findById(req.params.id);
    if (!photo) {
      return res.status(404).json({ error: 'Photo not found' });
    }
    
    // Check if user has permission
    if (photo.user.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to tag this photo' });
    }
    
    // Add the tag
    photo.tags.push({
      user: userId,
      rect: {
        x: rect.x,
        y: rect.y,
        width: rect.width,
        height: rect.height
      }
    });
    
    await photo.save();
    
    // Populate user data in the tag
    const updatedPhoto = await Photo.findById(photo._id)
      .populate('tags.user', 'firstName lastName username');
    
    res.json(updatedPhoto);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Like a photo
router.post('/:id/like', auth, async (req, res) => {
  try {
    const photo = await Photo.findById(req.params.id);
    if (!photo) {
      return res.status(404).json({ error: 'Photo not found' });
    }
    
    // Check if photo can be viewed by the user
    if (!photo.canBeViewedBy(req.user.id)) {
      return res.status(403).json({ error: 'Not authorized to view this photo' });
    }
    
    // Check if already liked
    const alreadyLiked = photo.likes.some(id => id.toString() === req.user.id);
    if (alreadyLiked) {
      return res.status(400).json({ error: 'Photo already liked' });
    }
    
    // Add like
    photo.likes.push(req.user.id);
    await photo.save();
    
    // Get updated photo with populated fields
    const updatedPhoto = await Photo.findById(photo._id)
      .populate('user', 'firstName lastName username')
      .populate('likes', 'firstName lastName username');
    
    res.json(updatedPhoto);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Unlike a photo
router.delete('/:id/like', auth, async (req, res) => {
  try {
    const photo = await Photo.findById(req.params.id);
    if (!photo) {
      return res.status(404).json({ error: 'Photo not found' });
    }
    
    // Remove like
    photo.likes = photo.likes.filter(id => id.toString() !== req.user.id);
    await photo.save();
    
    // Get updated photo with populated fields
    const updatedPhoto = await Photo.findById(photo._id)
      .populate('user', 'firstName lastName username')
      .populate('likes', 'firstName lastName username');
    
    res.json(updatedPhoto);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Delete a photo
router.delete('/:id', auth, async (req, res) => {
  try {
    const photo = await Photo.findById(req.params.id);
    if (!photo) {
      return res.status(404).json({ error: 'Photo not found' });
    }
    
    // Check if user owns the photo
    if (photo.user.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to delete this photo' });
    }
    
    // Delete all comments on this photo
    await Comment.deleteMany({ photo: photo._id });
    
    // Delete activities related to this photo
    await Activity.deleteMany({ photo: photo._id });
    
    // Delete actual file from the server
    const filePath = path.join(__dirname, '..', photo.file);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    
    // Delete photo from database
    await photo.remove();
    
    res.json({ message: 'Photo deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;