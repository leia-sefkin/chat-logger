/*

API initialization and base configuration

*/

//node modules
var express = require('express'),
  bodyParser = require('body-parser');

//setting data store and route options
var env = process.env.NODE_ENV || 'mongo';
var config = require('./config')[env];

var app = express();

//initalize the datastore
var dbInitialize = require(config.dbInit);
//for when we need a reference to the datastore obj
db = dbInitialize.init();

//middleware
//parse app JSON
app.use(bodyParser.json());

//logging info
app.use(function(req, res, next) {

  if(res.statusCode !== null)
    console.log("" + req.method + " - " + req.url + " - " + res.statusCode);

  next();
});

//routes
require(config.routes)(app);

//start the app
app.listen(config.expressPort, config.expressIp, function (error) {

  if (error) {
    console.error("Unable to listen for connections", error);
    process.exit(10);
  }

  console.info("express is listening on http://" + config.expressIp + ":" + config.expressPort);
});

exports = module.exports = app;
