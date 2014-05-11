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

function createUser(email, id, hash, grid) {
    // store the grid, email, id in the userSchema object
    var user = new User({
        "email": email,
        "id": id,
        "grid": grid,
        "api_key": null,
        "keyboard" : null,
        "hash": hash
    });

    return user;
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

    User.findOne({"email":email}, function(err, result) {
        if (err) {
            next(err)
            return
        }

        if (!result) {
            //TODO registration link to email
            var registrationKey = uuid.v4();
            console.log(registrationKey);

            cacheUser(registrationKey, email, password);
        }

        res.json({'status' : 1, 'message' : 'Registration link sent to email'})
    })
})


// pulls the registration user object from the redis cache
router.param('registration_key', function(req, es, next, key) {
    client.hgetall(key, function (err, user) {
        if (err) {
            next(err)
        } else {
            if (user) {
                // delete the registration key since it's now redeemed
                req.user = user
                client.del(key)
                next()
            } else {
                console.log('registration key not found')
                var err = new Error('invalid registration key')
                err.status = 404
                next(err)
            }
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

    // create the grid
    Grid.create(function(err, grid) {
        if (err) {
            next(err)
        } else {
            // create and save user object
            var user = createUser(req.user.email, id, req.user.hash, grid)
            user.save()

            req.user.grid = grid
            req.user.pin = pin
            next()
        }
    })
}, function sendRegistrationCompleteEmail(req, res, next) {
    // email the grid data and pin to the user
    emailer.sendGridAndPinEmail(req.user.email, req.user.grid.data, req.user.pin, function(err) {
        if (err) {
            next(err)
        }
    })
})

