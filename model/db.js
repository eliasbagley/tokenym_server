 //Author : Elias Bagley
 //Date   : 3/11/2014
 //Database connection manager

var mongoose = require('mongoose');

var dburl = 'mongodb://localhost/tokenym';

mongoose.connect(dburl);

// conection handler
mongoose.connection.on('connected', function () {
    console.log('Mongoose default connection open to ' + dburl);
});

// error handler
mongoose.connection.on('error', function (err) {
    console.log('Mongoose default connection error: ' + err)
});

// disconnection handler
mongoose.connection.on('disconnected', function () {
    console.log('Mongoose default connection disconnected');
});

// If the node process ends, close the mongoose connection
process.on('SIGINT', function () {
    mongoose.connection.close(function() {
        console.log('Mongoose default connection disconnected through app terminatoin');
        process.exit(0);
    }
});
