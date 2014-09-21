var express  = require('express');
var mongoose = require('mongoose');
var bcrypt   = require('bcrypt-nodejs');
var uuid     = require('node-uuid');
var redis    = require('redis')
var utils    = require('../utils');
var Grid     = require('../Grid')
var User     = require('../model/user.js')
var emailer  = require('../emailer.js')

var client = redis.createClient()

var router = express.Router()
module.exports = router

function createUser(user) {
    // store the grid, email, id in the userSchema object
    var user = new User({
        "email": user.email,
        "id": user.id,
        "grid": user.grid,
        "hash": user.hash
    })

    console.log('saving user')
    user.save()
}

function cacheUser(registrationKey, email, password) {
    bcrypt.hash(password, null, null, function (err, hash) {
        client.hmset(registrationKey, "email", email, "hash", hash)

        // set a timer to expire the key in 12 hours
        client.expire(registrationKey, 60*60*12) // seconds
    })
}

///////////////////////////////////////////////
// Routes
// ////////////////////////////////////////////

router.post('/', function(req, res, next) {
    var email    = req.body.email
    var password = req.body.password

    User.findOne({"email" : email}, function(err, user) {
        if (err) {
            next(err)
            return
        }

        if (!user) {
            var registrationKey = uuid.v4();
            console.log(registrationKey);

            emailer.sendRegistrationLinkEmail(email, registrationKey, function(err) {
                if (err) {
                    next(err)
                    return
                }

                cacheUser(registrationKey, email, password);
            })

        }

        res.json({'status' : true, 'message' : 'Registration link sent to email'})
    })
})


// pulls the registration user object from the redis cache
router.param('registration_key', function(req, es, next, key) {
    client.hgetall(key, function (err, user) {
        if (err) {
            next(err)
            return
        }

        if (user) {
            // delete the registration key since it's now redeemed
            req.user = user
            client.del(key)
            next()
        } else {
            var err = new Error('invalid registration key')
            err.status = 404
            next(err)
        }
    })
})

// API:
//register(email, password), sends email containing grid + 4 chars
// H(password), subtract 6 characters, 4 of which are pin
// create DB entry: email : user object containing email, grid, user_id api key, and id
router.post('/:registration_key', function(req, res, next) {
    // create pin, id, and grid
    var idAndPin = utils.createPinAndId(req.user.hash)

    var id = idAndPin[0]
    var pin = idAndPin[1]
    req.user.id = id
    req.user.pin = pin
    console.log('pin: ' + pin + ' id: ' + id)

    // create the grid
    Grid.create(function(err, grid) {
        if (err) {
            next(err)
        } else {
            req.user.grid = grid

            // create and save user object

            console.log('grid created, creating user')

            createUser(req.user)

            next()
        }
    })
}, sendRegistratonCompleteEmail)

function sendRegistratonCompleteEmail(req, res, next) {
    console.log("registration complete, sending email")
    emailer.sendGridAndPinEmail(req.user.email, req.user.grid.toString(), req.user.pin, function(err) {
        if (err) {
            console.log("error sending grid and pin email")
            next(err)
        } else {
            res.end("Thank you for registering. A grid and pin has been sent to your email")
            console.log('grid and pin email sent to ' + req.user.email)
        }
    })
}

