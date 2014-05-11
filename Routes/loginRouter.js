var express = require('express')
var utils = require('../utils')
var User = require('../model/user')
var bcrypt = require('bcrypt-nodejs')
var redis = require('redis')

var client = redis.createClient()

var router = express.Router()
module.exports = router

// middleware to get user object
router.use(function(req, res, next) {
    var email = req.body.email

    User.findOne({'email' : email}, function(err, user) {
        if (err) {
            next(err)
        } else {
            req.user = user
            next()
        }
    })
})

// middleware to hash the password
router.use(function(req, res, next) {
    var password = req.body.password

    bcrypt.compare(password, req.user.hash, function(err, authenticated) {
        if (err) {
            next(err)
        } else {
            res.authenticated = authenticated
            next()
        }
    })
})

// Authentication step 1
// Request a randomized keyboard nonce
router.post('/keyboard', function(req, res, next) {
    utils.generateKeyboard(function(err, keyboard) {
        if (err) {
            next(err)
        } else {
            console.log('keyboard: ' + keyboard)
            // only set the KB on the user if they are authenticated with the password
            if (res.authenticated) {
                var keyboardKey = 'keyboard:'+req.user.email
                client.hmset(keyboardKey, req.user)
                client.expire(keyboardKey, 60*60*12) // expire in 12 hours
            }

            res.json({'keyboard' : keyboard})
        }
    })
})


// middleware to load the keyboard used for the user
router.use(function (req, res, next) {
    console.log('keyboard loading middleware being ran')
    var keyboardKey = 'keyboard:'+req.user.email
    client.hmgetall(keyboardKey, function(err, keyboard) {
        if (err) {
            next(err)
            return
        }

        req.user.keyboard = keyboard
        next()
    })
})

// Authentication step 2 with grid encrypted pin
router.post('/', function (req, res, next) {
    // decode the encrypted pin
    var pin = user.grid.decode(req.body.pin, req.user.keyboard)

    // recreate the id
    var id = utils.generateId(req.user.hash, pin)

    // see if the id's match for 2nd factor of authentication:w
    var authenticated = res.authenticated && utils.secureCompareString(user.id, id)

    // send 403 error if not authenticated
    if (!authenticated) {
        var err = new Error('Forbidden')
        err.status = 403
        next(err)
        return
    }

    // generate an api key for the user and store in redis
    var api_key = uuid.v4()

    //TODO maybe expire this
    client.hmset(api_key, req.user)

    res.json({'api_key' : api_key})
})


