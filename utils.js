var nodemailer = require("nodemailer");
var crypto = require("crypto");

var possible = "abcdefghijklmnopqrstuvwxyz0123456789";
exports.possible = possible;


/* Given a hash, pin length, and n1 and n2, returns an array containing
 * the pin pulled from a random spot in the hash, and the id constructed from removing the
 * hash and n1 chars to the left of the pin string, and n2 chars to the right
 * of the pin string
 *
 * example: ['abcdefg', '1234'] = utils.createPinAndId('abcxx1234xxxdefg', 4, 2, 3)
 */
exports.createPinAndId = function createPinAndId(hash, pinLength, n1, n2) {
    if (hash.length <= pinLength + n1 + n2) {
        throw 'Hash length must be longer then pin and n1 and n2'
    }

    var i = Math.floor(Math.random()*(hash.length-pinLength-n1-n2) + n1);
    var pin = hash.slice(i, i+pinLength);
    var id = hash.replace(hash.substring(i-n1, i+pinLength+n2), "");

    return [id, pin];
}

// returns string with the first instance of each character in char_arr removed
exports.remove_chars = function remove_chars(hash, pin, n1, n2) {
    if (string.length < chars.length) {
        throw 'Bad arguments';
    }

    var i = string.search(chars);
    string = string.replace(string.substring(i-n1, i+pin.length+n2), "");

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
exports.generateKeyboard = function generateKeyboard() {
    return shuffleString(possible);
}
