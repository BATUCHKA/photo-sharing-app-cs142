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
  mentions: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  dateCreated: {
    type: Date,
    default: Date.now
  }
});

// Static method to extract mentions from comment text
CommentSchema.statics.parseMentions = function (text) {
  if (!text) return [];

  // Match all @username patterns
  const mentionRegex = /@(\w+)/g;
  const matches = text.match(mentionRegex);

  if (!matches) return [];

  // Extract usernames without @
  return matches.map(match => match.substring(1));
};

module.exports = mongoose.model('Comment', CommentSchema);