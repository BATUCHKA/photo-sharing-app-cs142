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
    const { text, mentions } = req.body;

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

    // Process mentions
    let mentionIds = [];

    // If mentions are explicitly provided in the request
    if (mentions && Array.isArray(mentions)) {
      mentionIds = mentions;

      // Verify all mentioned users exist
      for (const mentionId of mentionIds) {
        const mentionedUser = await User.findById(mentionId);
        if (!mentionedUser) {
          return res.status(400).json({ error: `Mentioned user with ID ${mentionId} not found` });
        }
      }
    } else {
      // Parse mentions from the comment text
      const mentionedUsernames = Comment.parseMentions(text);

      // Find mentioned users
      for (const username of mentionedUsernames) {
        const mentionedUser = await User.findOne({ username });
        if (mentionedUser) {
          mentionIds.push(mentionedUser._id);
        }
      }
    }

    // Create comment
    const newComment = new Comment({
      photo: req.params.photoId,
      user: req.user.id,
      text,
      mentions: mentionIds
    });

    await newComment.save();

    // Add comment to photo
    photo.comments.push(newComment._id);

    // Add mentioned users to photo
    for (const mentionId of mentionIds) {
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
    console.error('Error creating comment:', err);
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

    // Find the photo to remove the comment from it
    const photo = await Photo.findById(comment.photo);
    if (photo) {
      // Remove comment from photo
      photo.comments = photo.comments.filter(
        id => id.toString() !== comment._id.toString()
      );

      // Update mentions for the photo
      await photo.save();
    }

    // Delete activities related to this comment
    await Activity.deleteMany({ comment: comment._id });

    // Delete comment
    await Comment.findByIdAndDelete(comment._id);

    res.json({ message: 'Comment deleted successfully' });
  } catch (err) {
    console.error('Error deleting comment:', err);
    res.status(500).json({ error: err.message });
  }
});

// Get comments for a photo
router.get('/photo/:photoId', auth, async (req, res) => {
  try {
    const photo = await Photo.findById(req.params.photoId);
    if (!photo) {
      return res.status(404).json({ error: 'Photo not found' });
    }

    // Check if user can view the photo
    if (!photo.canBeViewedBy(req.user.id)) {
      return res.status(403).json({ error: 'Not authorized to view comments for this photo' });
    }

    const comments = await Comment.find({ photo: req.params.photoId })
      .sort({ dateCreated: 1 })
      .populate('user', 'firstName lastName username')
      .populate('mentions', 'firstName lastName username');

    res.json(comments);
  } catch (err) {
    console.error('Error fetching comments:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;