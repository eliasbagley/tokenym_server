// loads the user object from the api key
module.exports = function authenticateUser(res, req, next) {
    User.findOne({'api_key', : req.body.api_key}, function (err, user) {
        if (err) {
            next(err)
        } else {
            if (result) {
                req.user = user
                next()
            } else {
               next(new Error('503 Unauthorized'))
            }
        }
    })
}
