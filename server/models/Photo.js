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
  caption: {
    type: String,
    default: ''
  },
  dateUploaded: {
    type: Date,
    default: Date.now
  },
  likes: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  comments: [{
    type: Schema.Types.ObjectId,
    ref: 'Comment'
  }],
  mentions: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  sharedWith: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }]
});

// Check if user can view the photo
PhotoSchema.methods.canBeViewedBy = function(userId) {
  // Convert userId to string for comparison
  const userIdStr = userId.toString();
  const photoOwnerStr = this.user.toString();
  
  // Owner can always view
  if (userIdStr === photoOwnerStr) {
    return true;
  }
  
  // If sharedWith is not defined or empty, photo is public
  if (!this.sharedWith || this.sharedWith.length === 0) {
    return true;
  }
  
  // Check if user is in sharedWith list
  return this.sharedWith.some(id => id.toString() === userIdStr);
};

// Check if user has liked the photo
PhotoSchema.methods.isLikedBy = function(userId) {
  if (!userId || !this.likes || !Array.isArray(this.likes)) {
    return false;
  }
  
  // Convert userId to string for comparison
  const userIdStr = userId.toString();
  
  // Check if user ID is in the likes array
  return this.likes.some(likeId => likeId.toString() === userIdStr);
};

module.exports = mongoose.model('Photo', PhotoSchema);