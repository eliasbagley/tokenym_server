var express = require('express')
var User = require('../model/user.js')
var utils = require('../utils')
var redis = require('redis')

var client = redis.createClient()

var router = module.exports = express.Router()

router.post('/request', function(req, res, next) {
   utils.generateToken(function(err, token) {
       if (err) {
           next(err)
           return
       }
        // write the token object to redis
        var tokenKey = 'token:'+token
        client.hmset(tokenKey, 'id', req.user.id, 'secret', req.body.secret, 'price', req.body.price)

        // exipire the token object after 20 minutes
        client.expire(tokenKey, 10*60) //seconds

        // send back token
        res.json({'token' : token})
   })
})

// reads the token obj from redis
router.param('token', function(req, res, next, token) {
    client.hgetall(token, function (err, tokenObj) {
        if (err) {
            next(err)
            return
        }

        if (tokenObj) {
            req.tokenObj = tokenObj

            // delete the token object from redis now that it's redeemed
            client.del(token)

            next()
        } else {
            var err = new Error()
            err.status = 404
            err = new Error('token does not exist')
            next(err)
        }
    })
})

router.post('/redeem/:token', function(req, res, next) {
    // send back the associated id
    res.json({'id' : req.tokenObj.id})
})
