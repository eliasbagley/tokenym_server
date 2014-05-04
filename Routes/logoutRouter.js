var express = require('express')

var router = express.Router()
module.exports = router

// logout user by revoking their api key
router.post('/', function(req, res, next) {
    var user = req.user

    user.api_key = null

    user.save()
})
