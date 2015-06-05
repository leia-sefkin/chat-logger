# Chat Logger API

An API for handling events in a chat room.

## Installation

 `npm install`

Prerequisites:
- NodeJS 0.12.2
- MongoDB 3+

## Running The App

From the root of the project

 `node server.js`

## Test

From the root of the project

  `mocha test`

## Usage

To add a new event:

```
# user and type are required, other optional fields include message and otheruser

#if date is not included one will be initialzied to the time of creation

curl -X POST -H "Content-Type: application/json" -d '{
    "user": "TestBot",
    "type": "enters"
}' http://localhost:3000/event

```

To get a list of events within a given date range:

```
# from and to should be ISO formatted date strings

  curl 'http://localhost:3000/events?from=2015-06-05T15%3A52%3A40.467Z&to=2015-06-05T15%3A52%3A40.659Z'

```

To get a summary of events within a given date range:

```
# from and to should be ISO formatted date strings
# by can be any of the following: minute, hour, day

  curl 'http://localhost:3000/summary?from=2015-06-05T15%3A52%3A40.467Z&to=2015-06-05T15%3A52%3A40.659Z&by=minute'

```


