// server/models/Comment.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const CommentSchema = new Schema({
  photo: {
    type: Schema.Types.ObjectId,
    ref: 'Photo',
    required: true
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  text: {
    type: String,
    required: true
  },
  dateCreated: {
    type: Date,
    default: Date.now
  },
  mentions: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }]
});

// Static method to parse mentions
CommentSchema.statics.parseMentions = function(text) {
  const mentionRegex = /@(\w+)/g;
  const usernames = [];
  let match;
  
  while ((match = mentionRegex.exec(text)) !== null) {
    usernames.push(match[1]);
  }
  
  return usernames;
};

module.exports = mongoose.model('Comment', CommentSchema);