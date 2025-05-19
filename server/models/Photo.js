// server/models/Photo.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const PhotoSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  file: {
    type: String,
    required: true
  },
  dateUploaded: {
    type: Date,
    default: Date.now
  },
  caption: {
    type: String,
    default: ''
  },
  comments: [{
    type: Schema.Types.ObjectId,
    ref: 'Comment'
  }],
  likes: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  sharedWith: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  mentions: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  tags: [{
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    rect: {
      x: Number,
      y: Number,
      width: Number,
      height: Number
    }
  }]
});

// Virtual for like count
PhotoSchema.virtual('likeCount').get(function() {
  return this.likes.length;
});

// Virtual for comment count
PhotoSchema.virtual('commentCount').get(function() {
  return this.comments.length;
});

// Method to check if a user can view this photo
PhotoSchema.methods.canBeViewedBy = function(userId) {
  // If no sharing list, anyone can view
  if (!this.sharedWith || this.sharedWith.length === 0) {
    return true;
  }
  
  // Owner can always view
  if (this.user.toString() === userId.toString()) {
    return true;
  }
  
  // Check if user is in shared list
  return this.sharedWith.some(id => id.toString() === userId.toString());
};

module.exports = mongoose.model('Photo', PhotoSchema);