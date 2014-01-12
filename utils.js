var nodemailer = require("nodemailer");
var crypto = require("crypto");

var possible = "abcdefghijklmnopqrstuvwxyz0123456789";
exports.possible = possible;

// choose num random characters from string, returns an array of removed characters of num length
exports.choose = function choose(string, num) {
    if (num >= string.length) {
        throw 'Bad arguments';
    }

    var rand_index = Math.floor(Math.random()*string.length/2+string.length/4);
    var chars = string.slice(rand_index, rand_index+num);

    return chars;
}

// returns string with the first instance of each character in char_arr removed
exports.remove_chars = function remove_chars(string, chars) {
    if (string.length < chars.length) {
        throw 'Bad arguments';
    }

    var i = string.search(chars);
    string = string.replace(string.substring(i-3, i+chars.length+3), "");

    return string;
}

exports.email = function email(email, grid, pin) {

    var smtpTransport = nodemailer.createTransport("SMTP", {
        service: "Gmail",
        auth: {
            user: "gmail.user@gmail.com",
            pass: "userpass"
        }
    });

    var mailOptions = {
        from: "Tokenym",
        to: email,
        subject: "Welcome to Tokenym",
        text: "grid: " + grid + " pin: " + pin
    }

    smtpTransport.sendMail(mailOptions, function (err, res) {
        if (err) {
            console.log(err);
        }
        else {
            console.log("Message sent: " + response.message);
        }
    });

    smtpTransport.close();
}

// securely generates a token with specified length
var generateToken = function generateToken(length, callback) {
    crypto.randomBytes(length, function (ex, buf) {
        if (ex) throw ex;

        var token = "";
        for (var i = 0; i < buf.length; i++) {
            token += possible[buf[i]%36];
        }

        callback(token);
    });
}
exports.generateToken = generateToken;

/**
 * Randomize array element order in-place.
 * Using Fisher-Yates shuffle algorithm.
 */
var shuffleArray = function shuffleArray(array) {
    for (var i = array.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }
    return array;
}
exports.shuffleArray = shuffleArray;

var shuffleString = function shuffleString(string) {
    return shuffleArray(string.split("")).join("");
}
exports.shuffleString = shuffleString;

// generates a random on screen keyboard
exports.gen_keyboard = function gen_keyboard() {
    return shuffleString(possible);
}
