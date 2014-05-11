var fs = require('fs')
var nodemailer = require('nodemailer')

var smtpTransport;

// read the email credentials from the filesystem
fs.readFile('.emailcredentials', function(err, jsonCredentials) {
    // base64 decode the credentials on disk to prevent prying eyes
    var credentials = JSON.parse(jsonCredentials)
    var emailAddress = new Buffer(credentials.email, 'base64').toString('ascii')
    console.log('email address: ' + emailAddress)
    var password = new Buffer(credentials.password, 'base64').toString('ascii')
    console.log('password: ' + password)

    smtpTransport = nodemailer.createTransport('SMTP', {
        service: 'Gmail',
        auth: {
            user: emailAddress,
            pass: password
            }
        })
})

exports.sendRegistratonEmail = function(emailAddress, registrationKey, cb) {
    var mailOptions = {
        from: "Tokenym",
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
        from: "Tokenym",
        to: emailAddress,
        subject: "Welcome to Tokenym",
        text: "grid: " + grid + " pin: " + pin
    }

    smtpTransport.sendMail(mailOptions, function (err, res) {
        cb(err)
    })
}
