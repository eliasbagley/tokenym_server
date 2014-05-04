var express  = require("express");
var mongoose = require("mongoose");
var bcrypt   = require("bcrypt-nodejs");
var uuid     = require("node-uuid");
var redis    = require("redis")
var utils    = require("../utils");
var Grid     = require("../Grid")
var User     = require('../model/user.js')

var client = redis.createClient()

var router = express.Router()
module.exports = router

function registerUser(user, cb) {
    // pull out the email and hashAndSalt

    console.log('registering user')
    var idAndPin = utils.createPinAndId(user.hash)

    var id = idAndPin[0];
    var pin = idAndPin[1];

    // create the grid
    var grid = new Grid()

    //TODO email the pin and grid
    //
    // create the user
    var user = createUser(user.email, id, user.hash, grid);

    // save the user in the db
    saveUser(user, function(err) {
        cb(err)
    });
}

function saveUser(user, cb){
    user.save(function (err) {
        if (err) {
            console.log('error saving user')
            cb(err)
        } else {
            console.log('user ' + user.email + ' saved')
            cb(null)
        }
    })
}

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

        // set a timer to expire the key in 1 hr
        client.expire(registrationKey, 60*60) // seconds
    })
}

///////////////////////////////////////////////
// Routes
// ////////////////////////////////////////////

router.post('/', function(req, res, next) {
    var email    = req.body.email;
    console.log(email)
    var password = req.body.password;

    User.findOne({"email":email}, function(err, result) {
        if (err) {
            next(err)
        }

        console.log('registration link to email');
        if (result) {
            // send a notice to the email address that someone tried registering (or ignore it)
            res.end('done')
            return;
        } else {
            // TODO send a registration link to the email address
            // generate a key to authenticate this user creation
            console.log('sending registration link to email...')
            var registrationKey = uuid.v4();
            console.log(registrationKey);

            cacheUser(registrationKey, email, password);
            res.end('done')
        }
    });
});


// pulls the registration user object from the redis cache
router.param('registration_key', function(req, es, next, key) {
    client.hgetall(key, function (err, user) {
        if (err) {
            next(err)
        } else {
            if (user) {
                // delete the registration key since it's now redeemed
                client.del(key)
            }
            req.user = user
            next()
        }
    })
})

// API:
//register(email, password), sends email containing grid + 4 chars
// H(password), subtract 6 characters, 4 of which are pin
// create DB entry: email : user object containing email, grid, user_id api key, and id
router.post('/:registration_key', function (req, res, next) {
    registerUser(req.user, function(err) {
        if (err) {
            next(err)
        }

        res.end('you have been registered')
    })
});
