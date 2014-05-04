// utils
var express  = require("express");

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

function notFoundHandler(res, req, next) {
    var err = new Error('Not found')
    err.status = 404
    next(err)
}

function authenticateUser(res, req, next) {
    User.findOne({'api_key' : req.body.api_key}, function (err, user) {
        if (err) {
            next(err)
        } else {
            if (result) {
                req.user = user
                next()
            } else {
                var err = new Error('Forbidden')
                err.status = 403
                next(err)
            }
        }
    })
}

function errorHandler(err, req, res, next) {
    console.log('Error handler triggered')

    if (req.accepts('json')) {
        res.json({
            'error_code' : err.status,
            'error_message' : err.message
            })
    }

    // default to plain text
    res.end('error code: ' + err.status + ' message: ' + err.message)
}

var port = 5000;
app.listen(port, function() {
    console.log('Tokenym Server listening on port ' + port);
});

