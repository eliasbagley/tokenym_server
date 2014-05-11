var nodemailer = require('nodemailer')

var smtpTransport = nodemailer.createTransport("SMTP", {
    service: "Gmail",
    auth: {
        user: "elias.bagley@gmail.com",
        //TODO don't hard code this for long
        pass: "Brainfarm1+Gmail"
    }
})

exports.sendRegistrationStartedEmail = function(emailAddress, registrationKey, cb) {
    var mailOptions = {
        from: "Tokenym",
        to: emailAddress,
        subject: "Welcome to Tokenym",
        text: 'https://tokenym.com/user/register/' + registrationKey;
    }

    smtpTransport.sendMail(mailOptions, function (err, res) {
        cb(err)
    })
}

exports.sendRegistrationFinishedEmail = function(emailAddress, grid, pin, cb) {
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
