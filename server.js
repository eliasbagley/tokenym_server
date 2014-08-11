// utils
var express  = require("express");
var redis    = require('redis')

// models
var User     = require('./model/user.js');

// middleware
var morgan   = require("morgan");
var parser   = require("body-parser");


// Routers
var registrationRouter = require('./Routes/registrationRouter')
var loginRouter = require('./Routes/loginRouter')
var tokenRouter = require('./Routes/tokenRouter')
var logoutRouter = require('./Routes/logoutRouter.js')

// connect to mongodb
require("./model/db.js")

var client = redis.createClient();

var app = express();

app.use(morgan());
app.use(parser());

app.use('/user/register', registrationRouter)
app.use('/user/login', loginRouter)

app.use(authenticateUser)
app.use('/token', tokenRouter)
app.use('/logout', logoutRouter)
app.use(notFoundHandler)

app.use(errorHandler)

function notFoundHandler(req, res, next) {
    console.log("not found")
    var err = new Error('Not found')
    err.status = 404
    next(err)
}

function loadUser(id, cb) {
    console.log("loading user")
    User.findOne({'id' : id}, function(err, user) {
        if (err) {
            cb(err)
        } else {
            cb(null, user)
        }
    })
}

function authenticateUser(req, res, next) {
    var api_key = req.header('X-TKN-ApiKey')

    // load the user id from redis, and load the user from mongoose
    client.get(api_key, function (err, userId) {
        if (err) {
            next(err)
        } else {
            if (userId) {
                loadUser(userId, function (err, user) {
                    if (err) {
                        next(err)
                    }
                    console.log('loaded user ' + user)
                    req.user = user
                    next()
                })
            } else {
                next()
                // console.log('nonexistant api key')
                // var error = new Error('nonexistant API key')
                // error.status = 404
                // next(error)
            }
        }
    })
}

function errorHandler(err, req, res, next) {
    console.log('Error handler triggered: ' + err.message)

    if (req.accepts('json')) {
        res.json({
            'error_code' : err.status,
            'error_message' : err.message
            })
    }

    // default to plain text
    res.end('error code: ' + err.status + ' message: ' + err.message)
}

process.on('uncaughtException', function(err) {
    console.log(err)
})

var port = 5000;
app.listen(port, function() {
    console.log('Tokenym Server listening on port ' + port);
});
