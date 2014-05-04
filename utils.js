var nodemailer = require("nodemailer");
var crypto = require("crypto");

var possible = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
var hex_chars = "0123456789abcdef";
var keyboardSize = 25
var n1 = 4
var n2 = 3
var pinLength = 4

//exports.possible = possible;


/* Given a hash, pin length, and n1 and n2, returns an array containing
 * the pin pulled from a random spot in the hash, and the id constructed from removing the
 * hash and n1 chars to the left of the pin string, and n2 chars to the right
 * of the pin string
 *
 * example: ['abcdefg', '1234'] = utils.createPinAndId('abcxx1234xxxdefg', 4, 2, 3)
 */
exports.createPinAndId = function createPinAndId(hashAndSalt, pinLength) {
    //TODO test this better
    var salt = hashAndSalt.substring(0, hashAndSalt.length - 31);
    var hash = hashAndSalt.substring(hashAndSalt.length - 31, hashAndSalt.length);

    // convert hash to hex
    hash = base64ToHex(hash);

    var i = Math.floor(Math.random()*(hash.length-pinLength-n1-n2) + n1);
    var pin = hash.slice(i, i+pinLength);
    var id = hash.replace(hash.substring(i-n2, i+pinLength+n2), "");

    return [id, pin];
}

// returns string with the first instance of each character in char_arr removed
exports.remove_chars = function remove_chars(hash, pin) {
    if (string.length < chars.length) {
        //TODO turn into error passing instead
        throw 'Bad arguments';
    }

    var i = string.search(chars);
    string = string.replace(string.substring(i-n1, i+pin.length+n2), "");

    return string;
}

// fixed time comparison to prevent timing attacks
exports.secureCompareString = function secureCompareString(str1, str2) {
    var same = true;
    var max_length = (str1.length < str2.length) ? str1.length : str2.length;

    for (var i = 0; i < max_length; ++i) {
        if (str1.length >= i && str2.length >= i && str1[i] != str2[i]) {
            same = false;
        }
    }

    return same;
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
var generateToken = function generateToken(callback) {
    var length = tokenLength
    crypto.randomBytes(length, function (err, buf) {
        if (err) {
            callback(err)
            return
        }

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

var randomChars = function getRandomChars(num) {
    var shuffledChars = shuffleString(possible);
    return shuffledChars.substring(0, num-1);
}
exports.getRandomChars = randomChars;

// generates a random on screen keyboard
exports.generateKeyboard = function generateKeyboard() {
    var length = keyboardSize
    if (length < hex_chars.length) {
        throw 'Keyboard length cannot be less than the number of hex characters';
    }

    var unshuffledKeyboard = hex_chars;

    // get it long enough to be the keyboard with the blanks
    //TODO make it so there's more variety than just extra spaces added on
    for (var i = 0; i < (length - hex_chars.length); i++) {
        unshuffledKeyboard += " ";
    }

    var shuffledKeyboard = shuffleString(unshuffledKeyboard);
    return shuffledKeyboard;
}


var base64ToHex = function base64ToHex(base64String) {
    var buf = new Buffer(base64String, 'base64');
    var hexString = buf.toString('hex');
    return hexString;
}

exports.base64ToHex = base64ToHex
