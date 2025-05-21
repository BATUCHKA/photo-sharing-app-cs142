// server/webServer.js
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');
const cors = require('cors');
const morgan = require('morgan');
const fs = require('fs');
require('dotenv').config();

// Initialize Express app
const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(morgan('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/photo-app', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  // Remove useCreateIndex as it's no longer supported in newer Mongoose versions
})
.then(() => {
  console.log('MongoDB connected successfully');
})
.catch(err => {
  console.error('MongoDB connection error:', err);
  console.error('Make sure MongoDB is running on your system!');
  process.exit(1); // Exit the process with error
});

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
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

// Serve static files
app.use('/uploads', express.static(uploadsDir));

// API Routes
// ===========================

// Health check route
app.get('/api', (req, res) => {
  res.json({ message: 'API is running' });
});

// Import Models
const User = require('./models/User');
const Photo = require('./models/Photo');
const Comment = require('./models/Comment');
const Activity = require('./models/Activity');

// Auth Middleware
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

const auth = (req, res, next) => {
  // Get token from header
  const token = req.header('x-auth-token');
  
  // Check if no token
  if (!token) {
    return res.status(401).json({ error: 'No token, authorization denied' });
  }
  
  try {
    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Token is not valid' });
  }
};

// USER ROUTES
// ===========================

// Get all users
app.get('/api/users', async (req, res) => {
  try {
    const users = await User.find().select('-password -__v');
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Get user by ID with usage info
app.get('/api/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password -__v');
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Find user's photos that are visible to the current user
    const photos = await Photo.find({ user: req.params.id })
      .sort({ dateUploaded: -1 })
      .populate('comments');
    
    // Get most recent photo
    const mostRecentPhoto = photos.length > 0 ? photos[0] : null;
    
    // Get photo with most comments
    let mostCommentedPhoto = null;
    let maxComments = 0;
    
    photos.forEach(photo => {
      if (photo.comments && photo.comments.length > maxComments) {
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

// Add photo to favorites
app.post('/api/users/favorites/:photoId', auth, async (req, res) => {
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
app.delete('/api/users/favorites/:photoId', auth, async (req, res) => {
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
app.get('/api/users/favorites', auth, async (req, res) => {
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
app.delete('/api/users', auth, async (req, res) => {
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

// PHOTO ROUTES
// ===========================

// Get all photos visible to the current user
app.get('/api/photos', auth, async (req, res) => {
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
app.get('/api/photos/user/:userId', auth, async (req, res) => {
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
app.get('/api/photos/:id', auth, async (req, res) => {
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
    if (photo.user.toString() !== req.user.id) {
      if (photo.sharedWith && photo.sharedWith.length > 0) {
        const isShared = photo.sharedWith.some(id => 
          id.toString() === req.user.id
        );
        
        if (!isShared) {
          return res.status(403).json({ error: 'Not authorized to view this photo' });
        }
      }
    }
    
    res.json(photo);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Upload a new photo
app.post('/api/photos', [auth, upload.single('photo')], async (req, res) => {
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

// Like a photo
app.post('/api/photos/:id/like', auth, async (req, res) => {
  try {
    const photo = await Photo.findById(req.params.id);
    if (!photo) {
      return res.status(404).json({ error: 'Photo not found' });
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
app.delete('/api/photos/:id/like', auth, async (req, res) => {
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
app.delete('/api/photos/:id', auth, async (req, res) => {
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

// COMMENT ROUTES
// ===========================

// Add a comment to a photo
app.post('/api/comments/:photoId', auth, async (req, res) => {
  try {
    const { text } = req.body;
    
    // Validate text
    if (!text || text.trim() === '') {
      return res.status(400).json({ error: 'Comment text is required' });
    }
    
    // Find the photo
    const photo = await Photo.findById(req.params.photoId);
    if (!photo) {
      return res.status(404).json({ error: 'Photo not found' });
    }
    
    // Parse mentions from the comment text
    const mentionRegex = /@(\w+)/g;
    const mentions = [];
    let match;
    
    while ((match = mentionRegex.exec(text)) !== null) {
      const username = match[1];
      const mentionedUser = await User.findOne({ username });
      if (mentionedUser) {
        mentions.push(mentionedUser._id);
      }
    }
    
    // Create comment
    const newComment = new Comment({
      photo: req.params.photoId,
      user: req.user.id,
      text,
      mentions
    });
    
    await newComment.save();
    
    // Add comment to photo
    photo.comments.push(newComment._id);
    
    // Add mentioned users to photo
    for (const mentionId of mentions) {
      if (!photo.mentions.includes(mentionId)) {
        photo.mentions.push(mentionId);
      }
    }
    
    await photo.save();
    
    // Create activity for comment
    const activity = new Activity({
      user: req.user.id,
      type: 'COMMENT_ADDED',
      photo: photo._id,
      comment: newComment._id
    });
    
    await activity.save();
    
    // Update user's last activity
    const user = await User.findById(req.user.id);
    user.lastActivity = activity._id;
    await user.save();
    
    // Populate user data
    const populatedComment = await Comment.findById(newComment._id)
      .populate('user', 'firstName lastName username')
      .populate('mentions', 'firstName lastName username');
    
    res.status(201).json(populatedComment);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Delete a comment
app.delete('/api/comments/:id', auth, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }
    
    // Check if user owns the comment
    if (comment.user.toString() !== req.user.id) {
      // Also check if user owns the photo
      const photo = await Photo.findById(comment.photo);
      if (!photo || photo.user.toString() !== req.user.id) {
        return res.status(403).json({ error: 'Not authorized to delete this comment' });
      }
    }
    
    // Remove comment from photo
    await Photo.updateOne(
      { _id: comment.photo },
      { $pull: { comments: comment._id } }
    );
    
    // Delete activities related to this comment
    await Activity.deleteMany({ comment: comment._id });
    
    // Delete comment
    await comment.remove();
    
    res.json({ message: 'Comment deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// AUTH ROUTES
// ===========================

// Register a new user
app.post('/api/auth/register', async (req, res) => {
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
      password, // will be hashed in the User model pre-save hook
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
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    res.status(201).json({
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
        location: user.location,
        occupation: user.occupation,
        description: user.description
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Login user
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Find user
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }
    
    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }
    
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
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    res.json({
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
        location: user.location,
        occupation: user.occupation,
        description: user.description
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Logout user
app.post('/api/auth/logout', auth, async (req, res) => {
  try {
    // Create activity for user logout
    const activity = new Activity({
      user: req.user.id,
      type: 'USER_LOGOUT',
    });
    
    await activity.save();
    
    // Update user's last activity
    const user = await User.findById(req.user.id);
    user.lastActivity = activity._id;
    await user.save();
    
    res.json({ message: 'Logged out successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Get current user profile
app.get('/api/auth/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ACTIVITY ROUTES
// ===========================

// Get recent activities
app.get('/api/activities', auth, async (req, res) => {
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

// Get recent activities for a specific user
app.get('/api/activities/user/:userId', auth, async (req, res) => {
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

// Serve React app for any other routes - IMPORTANT: Use middleware, not wildcard route
// This fixes the path-to-regexp error by avoiding wildcard routes
const clientBuildPath = path.join(__dirname, '../client/build');
if (fs.existsSync(clientBuildPath)) {
  app.use(express.static(clientBuildPath));
  
  // Catch-all handler for client-side routing
  app.use((req, res) => {
    res.sendFile(path.join(clientBuildPath, 'index.html'));
  });
} else {
  console.warn('Client build directory not found. Skipping static file serving.');
  
  // Fallback response for unmatched routes
  app.use((req, res) => {
    res.send('Server is running, but client build is not available.');
  });
}

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

module.exports = app;