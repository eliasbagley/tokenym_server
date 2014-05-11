var express = require('express')
var redis = require('redis')

var router = express.Router()
module.exports = router

var client = redis.createClient()

// logout user by revoking their api key
router.post('/', function(req, res, next) {
    client.del(req.api_key)
})
