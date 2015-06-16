/*jshint expr: true*/
var request = require('supertest'),
  moment = require('moment'),
  expect = require('chai').expect;

var app = require('../server');

var host = app,
  request = request(host);

//the event model
var Event = require('../models/event');

//for seeding events so we can test appropriately
var today = new Date(),
  now = moment.utc(today),
  yesterday = moment.utc(new Date(today.getTime() - (1000*60*60*24))),
  hourAgo = moment.utc(new Date(today.getTime() - (1000*60*60))),
  from = now.toJSON(),
  eventId;


describe('Create Events', function() {
  this.timeout(3000);

  it('can create an enter event', function(done) {
    request
      .post('/event')
      .send({
        user: 'TestBot_' + now,
        type: 'enter'
      })
      .end(function(err, res) {
        var body = res.body;
        var type = res.get('Content-Type');
        console.log('Created Event: ', body, res.status);

        expect(err).to.not.exist;
        expect(res.status).to.equal(200);
        expect(type).to.contain('application/json');

        expect(body).to.be.an('object');
        expect(body).to.include.keys('status');
        expect(body.status).to.equal('ok');
        done();
      });
  });

  it('can create an event with an existing date', function(done) {
    request
      .post('/event')
      .send({
        user: 'TestBot_' + now,
        type: 'enter',
        date: hourAgo
      })
      .end(function(err, res) {
        var body = res.body;
        var type = res.get('Content-Type');
        console.log('Created Event: ', body, res.status);

        expect(err).to.not.exist;
        expect(res.status).to.equal(200);
        expect(type).to.contain('application/json');

        expect(body).to.be.an('object');
        expect(body).to.include.keys('status');
        expect(body.status).to.equal('ok');
        done();
      });
  });

  it('can create a leave event', function(done) {
    request
      .post('/event')
      .send({
        user: 'TestBot_' + now,
        type: 'leave',
        date: yesterday
      })
      .end(function(err, res) {
        var body = res.body;
        var type = res.get('Content-Type');
        console.log('Created Event: ', body, res.status);

        expect(err).to.not.exist;
        expect(res.status).to.equal(200);
        expect(type).to.contain('application/json');

        expect(body).to.be.an('object');
        expect(body).to.include.keys('status');
        expect(body.status).to.equal('ok');
        done();
      });
  });

  it('can create a message event', function(done) {
    request
      .post('/event')
      .send({
        user: 'TestBot_' + now,
        type: 'comment',
        message: 'Hey there, hi there, yo there!'
      })
      .end(function(err, res) {
        var body = res.body;
        var type = res.get('Content-Type');
        console.log('Created Event: ', body, res.status);

        expect(err).to.not.exist;
        expect(res.status).to.equal(200);
        expect(type).to.contain('application/json');

        expect(body).to.be.an('object');
        expect(body).to.include.keys('status');
        expect(body.status).to.equal('ok');
        done();
      });
  });

  it('can create a hi-five event', function(done) {
    request
      .post('/event')
      .send({
        user: 'TestBot_' + now,
        type: 'highfive',
        otheruser: 'FriendBot_' + now
      })
      .end(function(err, res) {
        var body = res.body;
        var type = res.get('Content-Type');
        console.log('Created Event: ', body, res.status);

        expect(err).to.not.exist;
        expect(res.status).to.equal(200);
        expect(type).to.contain('application/json');

        expect(body).to.be.an('object');
        expect(body).to.include.keys('status');
        expect(body.status).to.equal('ok');
        done();
      });
  });

  it('cannot create an event with missing data', function(done) {
    request
      .post('/event')
      .send({
        user: 'TestBot_' + now
      })
      .end(function(err, res) {
        expect(res.body).to.be.empty;
        expect(res.status).to.equal(400);
        done();
      });
  });

});

describe('Update Existing Events', function() {
  this.timeout(3000);

  before(function(done) {
    Event.create({
      date: hourAgo,
      user: 'TestBot_' + now,
      type: 'enter'
    }, function(err, res) {
      if (err) {
        console.warn('Error while creating event: ' + err);
        return done(err);
      }

      eventId = res._id;
      done();
    });
  });

  it('Can update stored event data', function(done) {
    var newUser = 'TestBot_' + now;
    var newType = 'leave';

    request.put('/event/' + eventId)
    .send({
      user: newUser,
      type: newType
    })
    .end(function(err, res) {
      var body = res.body;
      var type = res.get('Content-Type');
      console.log('Updated Event: ', body, res.status);

      expect(err).to.not.exist;
      expect(res.status).to.equal(200);
      expect(type).to.contain('application/json');

      expect(body).to.be.an('object');
      expect(body.user).to.equal(newUser);
      expect(body.type).to.equal(newType);
      done();
    });
  });
});

//Note: this should be run after events have been created
describe('Read Existing Events', function() {
  this.timeout(3000);

  before(function(done) {
    Event.create({
      date: hourAgo,
      user: 'TestBot_' + now,
      type: 'enter'
    }, function(err, res) {
      if (err) {
        console.warn('Error while creating event: ' + err);
        return done(err);
      }

      eventId = res._id;
      done();
    });
  });

  it('can read events between a date range', function(done) {
    var until = moment.utc().toJSON();

    request
      .get('/events?from=' + from + '&to=' + until)
      .end(function(err, res) {
        var body = res.body;
        var type = res.get('Content-Type');
        console.log('Read events: ', body, res.status);

        expect(err).to.not.exist;
        expect(res.status).to.equal(200);
        expect(type).to.contain('application/json');

        expect(body).to.be.an('array');
        expect(body[0]).to.be.an('object');
        expect(body[0]).to.have.keys('date', 'user', 'type');
        done();
      });
  });

  it('will return an error with an invalid request', function(done) {
    request
      .get('/events')
      .end(function(err, res) {
        expect(res.body).to.be.empty;
        expect(res.status).to.equal(400);
        done();
      });
  });

  it('can retrieve an event by id', function(done) {
    request
      .get('/event/' + eventId)
      .end(function(err, res) {
        var body = res.body;
        var type = res.get('Content-Type');
        console.log('Read events: ', body, res.status);

        expect(err).to.not.exist;
        expect(res.status).to.equal(200);
        expect(type).to.contain('application/json');

        expect(body).to.be.an('array');
        expect(body[0]).to.be.an('object');
        expect(body[0]).to.have.keys('date', 'user', 'type');
        done();
      });
  });
});


describe('Get a summary of Events', function() {
  this.timeout(3000);

  it('can get a summary of events within a date range and organize by minute', function(done) {
    var until = moment.utc().toJSON();

    request
      .get('/summary?from=' + from + '&to=' + until + '&by=minute')
      .end(function(err, res) {
        var body = res.body;
        var type = res.get('Content-Type');
        console.log('Read events: ', body, res.status);

        expect(err).to.not.exist;
        expect(res.status).to.equal(200);
        expect(type).to.contain('application/json');

        expect(body).to.be.an('array');
        expect(body[0]).to.be.an('object');
        expect(body[0]).to.contain.keys('date', 'enters', 'leaves', 'comments');
        done();
      });
  });

  it('can get a summary of events within a date range and organize by hour', function(done) {
    var until = moment.utc().toJSON();
    var startHour = hourAgo.toJSON();

    request
      .get('/summary?from=' + hourAgo + '&to=' + until + '&by=hour')
      .end(function(err, res) {
        var body = res.body;
        var type = res.get('Content-Type');
        console.log('Read events: ', body, res.status);

        expect(err).to.not.exist;
        expect(res.status).to.equal(200);
        expect(type).to.contain('application/json');

        expect(body).to.be.an('array');
        expect(body[0]).to.be.an('object');
        expect(body[0]).to.contain.keys('date', 'enters', 'leaves', 'comments');
        done();
      });
  });

  it('can get a summary of events within a date range and organize by day', function(done) {
    var until = moment.utc().toJSON();
    var startDay = yesterday.toJSON();

    request
      .get('/summary?from=' + startDay + '&to=' + until + '&by=day')
      .end(function(err, res) {
        var body = res.body;
        var type = res.get('Content-Type');
        console.log('Read events: ', body, res.status);

        expect(err).to.not.exist;
        expect(res.status).to.equal(200);
        expect(type).to.contain('application/json');

        expect(body).to.be.an('array');
        expect(body[0]).to.be.an('object');
        expect(body[0]).to.contain.keys('date', 'enters', 'leaves', 'comments');
        done();
      });
  });

  it('will return an error with an invalid request', function(done) {
    request
      .get('/summary')
      .end(function(err, res) {
        expect(res.body).to.be.empty;
        expect(res.status).to.equal(400);
        done();
      });
  });
});
