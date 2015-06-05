/*

mongodb initialization

*/

var mongoose = require('mongoose');
//uncomment to see queries mongodb is sending
//mongoose.set('debug', true);

module.exports = {
  init: function() {
    mongoose.connection.on('error', console.error.bind(console, 'connection error:'));
    mongoose.connection.on('connected', console.log.bind(console, 'connection to mongo successful'));
    return mongoose.connect("mongodb://localhost:27017/records");
  }
};
