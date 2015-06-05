/*

Event schema for use with MongoDB

*/
var mongoose = require('mongoose');

var Event = new mongoose.Schema({
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  user: {
    type: String,
    required: true
  },
  type: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: false
  },
  otheruser: {
    type: String,
    required: false
  }
});

module.exports = mongoose.model('Event', Event);
