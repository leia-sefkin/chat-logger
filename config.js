/*

app config

options for which storage and routes are used

*/

module.exports = {

  mongo: {
    dbInit: __dirname + '/lib/mongo.js',
    expressPort: process.env.EXPRESS_PORT || 3000,
    expressIp: '127.0.0.1',
    routes: __dirname + '/routes/event.js'
  }

};




