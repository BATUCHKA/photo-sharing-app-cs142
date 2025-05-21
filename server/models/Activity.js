const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ActivitySchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['PHOTO_UPLOAD', 'COMMENT_ADDED', 'USER_REGISTERED', 'USER_LOGIN', 'USER_LOGOUT'],
    required: true
  },
  photo: {
    type: Schema.Types.ObjectId,
    ref: 'Photo'
  },
  comment: {
    type: Schema.Types.ObjectId,
    ref: 'Comment'
  },
  date: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Activity', ActivitySchema);