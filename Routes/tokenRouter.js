var express = require('express')
var User = require('../model/user.js')
var utils = require('../utils')
var redis = require('redis')

var client = redis.createClient()


router.post('/request', function(req, res, next) {
   utils.generateToken(function(token) {
        // write the token object to redis
        client.hmset(token, 'id', req.user.id, 'secret', req.body.secret, 'price', req.body.price)

        // exipire the token object after 10 minutes
        client.expire(token, 10*60) //seconds

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

        if (token) {
            req.tokenObj = tokenObj

            // delete the token object from redis now that it's redeemed
            client.del(token)

            next()
        } else {
            next(new Error('Token does not exist'))
        }
    })
})

router.post('/redeem/:token', function(req, res, next) {
    // send back the associated id
    res.json({'id' : req.tokenObj.id}
})
