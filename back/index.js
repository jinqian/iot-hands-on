const mqttUrl = 'mqtt://jxhnfzti:feCowLGfSWA7@m20.cloudmqtt.com:12753';
const mongodbUrl = 'mongodb://qian:iothandson@ds047935.mongolab.com:47935/iot-hands-on';

var express = require('express');
var app = express();
var mqtt = require('mqtt');
var mongoClient = require('mongodb').MongoClient;

var sensorDB;

// connect to mongo db
mongoClient.connect(mongodbUrl, function(err, db) {
  if(!err) {
    console.log('MongoDB connected');
    mongoCollection = db.createCollection('test', {strict:true}, function(err, collection) {});
    sensorDB = db;
  }
});

// connect to MQTT broker
var mqttClient = mqtt.connect(mqttUrl);
mqttClient.on('connect', function () {
  console.log("MQTT connected.")
  mqttClient.subscribe('rasp_sensor');
});
 
mqttClient.on('message', function (topic, message) {
  console.log("Topic: " + topic);
	console.log("Message: " + message.toString());

  jsonMessage = JSON.parse(message)
  jsonMessage['date'] = new Date().toISOString()
  insertSensorData(sensorDB, jsonMessage, function(result) {
      console.log(result);
  });
});

// REST API
app.get('/sensor', function (request, response) {
  console.log("Get /sensor");
  response.header('Access-Control-Allow-Origin', '*');
  response.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
  response.header('Access-Control-Allow-Headers', 'Content-Type');
  response.header('Content-Type', 'application/json');
  findLastSensorDataItem(sensorDB, function(result) {
    response.send(result);
  });
});

app.listen(3000, function () {
  console.log('App listening on port 3000!');
});

// db helper
var insertSensorData = function(db, data, cb) {
  db.collection('rasp_sensor').insertOne(data, function(err, result) {
    console.log('Inserted a document into the rasp_sensor collection.');
  });
};

var findLastSensorDataItem = function(db, cb) {
  var cursor = db.collection('rasp_sensor').find().sort({'date': -1}).limit(1);
  cursor.each(function(err, doc) {
    if (doc != null) {
      console.log(doc);
      cb(doc);
    }
  });
};
