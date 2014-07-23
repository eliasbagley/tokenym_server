var express = require('express')
var utils = require('../utils')
var User = require('../model/user')
var bcrypt = require('bcrypt-nodejs')
var redis = require('redis')
var uuid = require('node-uuid')

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
            console.log('found user: ' + user)
            req.user = user
            next()
        }
    })
})

// middleware first 1st authentication with password
router.use(function(req, res, next) {
    var password = req.body.password

    if (req.user && req.user.hash) {
        bcrypt.compare(password, req.user.hash, function(err, authenticated) {
            if (err) {
                next(err)
            } else {
                console.log('first authentication successful')
                req.authenticated = authenticated
                next()
            }
        })
    } else {
        req.authenticated = false
        next()
    }
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
            if (req.authenticated) {
                var keyboardKey = 'keyboard:'+req.user.email
                client.set(keyboardKey, keyboard)
                client.expire(keyboardKey, 60*60*1) // expire in 1 hours
            }

            res.json({'keyboard' : keyboard})
        }
    })
})


// middleware to load the keyboard used for the user
router.use(function (req, res, next) {
    var keyboardKey = 'keyboard:'+req.user.email

    client.get(keyboardKey, function(err, keyboard) {
        if (err) {
            next(err)
            return
        }

        if (req.user) {
            req.user.keyboard = keyboard
        }

        next()
    })
})

// Authentication step 2 with grid encrypted pin
router.post('/', function (req, res, next) {
    // decode the encrypted pin
    var pin = user.grid.decode(req.body.pin, req.user.keyboard)
    console.log('encoded: ' + req.body.pin + " decoded: " + pin)

    // recreate the id
    var id = utils.generateId(req.user.hash, pin)
    console.log('generated id: ' + id)

    // // see if the id's match for 2nd factor of authentication
    var authenticated = req.authenticated && utils.secureCompareString(req.user.id, id)

    // generate an api key for the user and store in redis
    var api_key = uuid.v4()
    console.log('api key:' + api_key)

    if (authenticated) {
        console.log('ACCESS GRANTED')
        client.set(api_key, req.user.id)

        // expire the api key after 7 days
       client.expire(api_key, 60*60*24*7) //seconds
    } else {
        console.log('ACCESS DENIED')
    }

    res.json({'api_key' : api_key})
})


