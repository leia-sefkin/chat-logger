/*

Routes for MongoDB api calls

*/
var _ = require('lodash'),
  moment = require('moment'),
  Event = require('../models/event');

module.exports = function(app) {

  //handle all return responses
  var handleResponse = function(res) {
    return function(err, result) {
      if (err) {
        console.log('error! ', err);
        res.status(err.statusCode || 400);
        return res.json(err);
      }

      res.json(result);
    };
  };

  /* save a new event
   * @param req.body {Object} required - the event object to create
   * @oaram req.body.date {Date} optional - if passed in, it must be in ISO format
   * @param req.body.user {String} required - the user associated with the event
   * @param req.body.type {String} required - the type of event
   * @param req.body.message {String} optional - the message sent between users
   * @param req.body.otheruser {String} optional - any other user associated with the event
  */
  app.post('/event', function(req, res) {
    console.info('creating event: ', req.body);
    var body = req.body;

    //validation
    if (!body || !body.user || !body.type) {
      console.warn('Invalid Request: ' + JSON.stringify(body));
      return handleResponse(res)(new Error('Post syntax incorrect.'));
    }

    var now;
    if (body.date) {

      //check the validity of the passed in date by attempting to parse, if it fails, get a new date, otherwise initialize with moment
      now = isNaN(Date.parse(body.date)) ? moment.utc() : moment.utc(body.date);

    } else {
      now = moment.utc();
    }

    //initialzie the event object with time details for easy sorting later
    var event = {
      date: now.toJSON()
    };

    //copy over all allowed properties from body
    _.assign(event, _.pick(body, ['user', 'type', 'message', 'otheruser']));

    //create the event and handle all errors
    Event.create(event, function(err, record) {
      console.info('created event: ', err, record);
      if (err) {
        console.error('Error while creating event: ', err);
        return handleResponse(res)(err);
      }

      return handleResponse(res)(null, {
        status: "ok"
      });
    });
  });

  /* get an event by id
  * @param req.params.id {Number} required - the id of the event in the database
  */
  app.get('/event/:id', function(req, res) {
    console.info('getting an event by id: ', req.params.id);
    var id = req.params.id;

    Event.find({
      _id: id
    },{
      _id: 0,
      date: 1,
      user: 1,
      type: 1,
      message: 1,
      otheruser: 1
    }).exec(function(err, entry) {
      if (err) {
        console.error('Error while reading event: ', err);
        return handleResponse(res)(err);
      }

      if (_.isEmpty(entry)) {
        console.warn('No entry found in database with id: ' + id);
      }

      handleResponse(res)(null, entry);
    });
  });

  /*get all events within a date range
   * @param req.query {String} required - the query string containing the DateTime
   * @param req.query.from {String} required - the start date to start searching from, in ISO format
   * @param req.query.to {String} required - the end date to search until, in ISO format
  */
  app.get('/events', function(req, res) {
    console.info('getting a list of events by date range: ', req.query);

    var startDate = req.query.from,
      endDate = req.query.to;

    if (!startDate || !endDate) {
      console.warn('Invalid Request');
      return handleResponse(res)(new Error('Post syntax incorrect.'));
    }

    //get all the events in the given timeframe
    Event.find({
      date: {
        $gte: new Date(startDate),
        $lt: new Date(endDate)
      }
    },{
      _id: 0,
      date: 1,
      user: 1,
      type: 1,
      message: 1,
      otheruser: 1
    }).exec(function(err, entries) {
      if (err) {
        console.error('Error while reading events: ', err);
        return handleResponse(res)(err);
      }

      if (_.isEmpty(entries)) {
        console.warn('No entries found in dates between ' + startDate + ' and ' + endDate);
      }

      handleResponse(res)(null, entries);
    });
  });

  /*get a summary of events within a date range and sort by a timeframe
   * @param req.query {String} required - the query string containing the DateTime
   * @param req.query.from {String} required - the start date to start searching from, in ISO format
   * @param req.query.to {String} required - the end date to search until, in ISO format
   * @param req.query.by {String} required - the timeframe to search by, options are 'day', 'hour' and 'minute'
  */
  app.get('/summary', function(req, res) {
    console.info('getting summary for events: ', req.query);

    var startDate = req.query.from,
      endDate = req.query.to,
      timeFrame = req.query.by;

    if (!startDate || !endDate || !timeFrame) {
      console.warn('Invalid Request');
      return handleResponse(res)(new Error('Post syntax incorrect.'));
    }

    /****building out the mongodb query***/

    //matching on the date range
    var match = {
      "$match": {
        "date": {
          "$gte": new Date(startDate),
          "$lt": new Date(endDate)
        }
    }};

    //need to roll up date appropriately
    var format = "%Y-%m-%dT";
    switch (timeFrame) {
      case 'day':
        format += ':00:00';
        break;
      case 'hour':
        format += '%H:00';
        break;
      case 'minute':
        format += '%H:%M';
        break;
    }

    format += ':00Z';

    //grouping by date, and gathering events into an array
    var group1 = {
      "$group": {
        "_id": {
          "date": {
            "$dateToString" : {
              "format": format,
              "date": "$date"
            }
          }
        },
        "events": { "$push": "$type" }
    }};

    //get the aggregate results from mongo
    Event.aggregate([match, group1]).exec(function(err, results) {
      if (err) {
        console.error('Error while retrieving event summary: ', err);
        return handleResponse(res)(err);
      }

      if (_.isEmpty(results)) {
        console.warn('No entries found in dates between ' + startDate + ' and ' + endDate);
        return handleResponse(res)(null, []);
      }

      //build out the return data
      var summaryData = [];
      var defaults = {
        enters: 0,
        leaves: 0,
        highfives: 0,
        comments: 0
      };

      _.forEach(results, function(result) {
        var events = result.events;

        //count events and pluralize
        var totalCount = _.countBy(events, function(event) {
          return event + "s";
        });

        //aggregate events with date, and make sure we have all categories
        summaryData.push(_.assign({
          date: result._id.date
        }, defaults, totalCount));
      });

      handleResponse(res)(null, summaryData);
    });
  });

};
