var fs = require('fs')
var nodemailer = require('nodemailer')

var smtpTransport
var service = 'Gmail'

var from = "Tokenym"

// read the email credentials from the filesystem
fs.readFile('.emailcredentials', function(err, jsonCredentials) {
    // base64 decode the credentials on disk to prevent prying eyes
    var credentials = JSON.parse(jsonCredentials)
    var emailAddress = new Buffer(credentials.email, 'base64').toString('ascii')
    var password = new Buffer(credentials.password, 'base64').toString('ascii')

    smtpTransport = nodemailer.createTransport('SMTP', {
        service: service,
        auth: {
            user: emailAddress,
            pass: password
            }
        })
})

exports.sendRegistrationLinkEmail = function(emailAddress, registrationKey, cb) {
    var mailOptions = {
        from: from,
        to: emailAddress,
        subject: "Welcome to Tokenym",
        text: 'https://tokenym.com/user/register/' + registrationKey
    }

    smtpTransport.sendMail(mailOptions, function (err, res) {
        cb(err)
    })
}

exports.sendGridAndPinEmail = function(emailAddress, grid, pin, cb) {
    var mailOptions = {
        from: from,
        to: emailAddress,
        subject: "Welcome to Tokenym",
        text: "grid: " + grid + " pin: " + pin
    }

    smtpTransport.sendMail(mailOptions, function (err, res) {
        cb(err)
    })
}
