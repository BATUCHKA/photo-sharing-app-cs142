// server/routes/comments.js
const express = require('express');
const router = express.Router();
const Comment = require('../models/Comment');
const Photo = require('../models/Photo');
const User = require('../models/User');
const Activity = require('../models/Activity');
const auth = require('../middleware/auth');

// Add a comment to a photo
router.post('/:photoId', auth, async (req, res) => {
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
    
    // Check if user can view the photo
    if (!photo.canBeViewedBy(req.user.id)) {
      return res.status(403).json({ error: 'Not authorized to comment on this photo' });
    }
    
    // Parse mentions from the comment text
    const mentionedUsernames = Comment.parseMentions(text);
    const mentions = [];
    
    // Find mentioned users
    for (const username of mentionedUsernames) {
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
router.delete('/:id', auth, async (req, res) => {
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

module.exports = router;