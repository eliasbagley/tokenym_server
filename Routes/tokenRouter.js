var express = require('express')
var User = require('../model/user.js')
var utils = require('../utils')
var redis = require('redis')

var client = redis.createClient()

var router = express.Router()
module.exports = router

router.post('/request', function(req, res, next) {
    utils.generateToken(function(err, token) {
       if (err) {
           next(err)
           return
       }
       console.log('generated token: ' + token)

       // write the token object to redis
       var tokenObj = {'id' : req.user.id}
       if (req.body.secret) {
           tokenObj.secret = req.body.secret
       }
       if (req.body.price) {
           tokenObj.price = req.body.price
       }

       client.hmset(tokenKey, tokenObj)

       // exipire the token object after 10 minutes
       client.expire(tokenKey, 10*60) //seconds

       // send back token
       res.json({'token' : token})
   })
})

// reads the token obj from redis
router.param('token', function(req, res, next, token) {
    var tokenKey = 'token:' + token

    client.hgetall(tokenKey, function (err, tokenObj) {
        if (err) {
            next(err)
            return
        }

        if (tokenObj) {
            req.tokenObj = tokenObj
            console.log(tokenObj)

            // delete the token object from redis now that it's redeemed
            client.del(tokenKey)

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
