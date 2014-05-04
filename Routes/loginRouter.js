var express = require('express')
var utils = require('../utils')
var User = require('../model/user')
var bcrypt = require('bcrypt-nodejs')

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

// hash(pin) -> id
function generateId(hash, pin) {
    // remove the salt
    var hash = hash.substring(hash.length - 31, hash.length)

    // convert the base 64 hash into hex
    hash = utils.base64ToHex(hash);

    return utils.remove_chars(hash, pin)
}

// Authentication step 1
// Request a randomized keyboard nonce
router.post('/keyboard', function(req, res, next) {
    var email = req.body.email

    var keyboard = utils.generateKeyboard()

    // only set the KB on the user if they are authenticated with the password
    if (res.authenticated) {
        var user = req.user
        user.keyboard = keyboard
        user.save()
    }

    res.json({'keyboard' : keyboard})
})

// Authentication step 2 with grid encrypted pin
router.post('/', function (req, res, next) {
    // decode the encrypted pin
    var pin = user.grid.decode(req.body.pin, user.keyboard)

    // recreate the id
    var id = generateId(user.hash, pin)

    // see if the id's match for 2nd factor of authentication:w
    var authenticated = utils.secureCompareString(user.id, id)

    // send 403 error if not authenticated
    if (!authenticated)
        var err = new Error('Forbidden')
        err.status 403
        next(err)
        return
    }

    var api_key = uuid.v4()

    user.api_key = apiKey
    user.save()

    res.json({'api_key', : api_key})
})

