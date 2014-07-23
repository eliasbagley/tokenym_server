var nodemailer = require('nodemailer')
var crypto = require('crypto')
var _ = require('underscore')

//TODO great place to use regular expressions
var possible = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"
var hex_chars = "0123456789abcdef";
var keyboardSize = 25
var n1 = 4
var n2 = 3
var pinLength = 4
var tokenLength = 7

// pulls the inner part from the hash given the pin index
// returns null if pin isn't inside hash
function createId(hash, pin) {
    console.log('in createId')
    var i = hash.search(pin)
    if (i < 0) {
        return null
    }

    return hash.replace(hash.substring(i - n1, i + pinLength + n2), '')
}

/* Given a hash, pin length, and n1 and n2, returns an array containing
 * the pin pulled from a random spot in the hash, and the id constructed from removing the
 * hash and n1 chars to the left of the pin string, and n2 chars to the right
 * of the pin string
 *
 * example: ['abcdefg', '1234'] = utils.createPinAndId('abcxx1234xxxdefg', 4, 2, 3)
 */
exports.createPinAndId = function createPinAndId(hashAndSalt) {
    //TODO test this better - this is the main part
    var hash = hashAndSalt.substring(hashAndSalt.length - 31, hashAndSalt.length)

    // convert hash to hex
    hash = base64ToHex(hash)

    var i = _.random(n1, hash.length - pinLength - n2)
    var pin = hash.slice(i, i+pinLength)


    var id = createId(hash, pin)

    return [id, pin]
}

// returns string with the first instance of each character in char_arr removed
// returns null if pin isn't inside hashAndSalt
exports.generateId = function generateId(hashAndSalt, pin) {
    console.log('generating id')
    var hash = hashAndSalt.substring(hashAndSalt.length - 31, hashAndSalt.length)
    hash = base64ToHex(hash)

    var id = createId(hash, pin)

    return id
}

// fixed time comparison to prevent timing attacks
exports.secureCompareString = function secureCompareString(str1, str2) {
    console.log('comparing strings ' + str1 + ' + and ' + str2)
    if (str1 == null || str2 == null) {
        return false
    }

    var same = true
    var max_length = (str1.length < str2.length) ? str1.length : str2.length

    for (var i = 0; i < max_length; ++i) {
        if (str1.length >= i && str2.length >= i && str1[i] != str2[i]) {
            same = false
        }
    }

    return same
}

// securely generates a token
module.exports.generateToken = function generateToken(callback) {
    console.log('in generate token')
    crypto.randomBytes(tokenLength, function (err, buf) {
        if (err) {
            callback(err)
            return
        }

        var token = ""
        for (var i = 0; i < buf.length; i++) {
            token += possible[buf[i]%possible.length]
        }
        console.log('token: ' + token)

        callback(null, token)
    })
}

/**
 * Randomize array element order in-place.
 * Using Fisher-Yates shuffle algorithm.
 */
var secureShuffleArray =  function secureShuffleArray(array, callback) {
    console.log('shuffling array')
    crypto.randomBytes(array.length, function(err, buf) {
        if (err) {
            callback(err)
            return
        }

        for (var i = array.length; i > 0; i--) {
            // 0 <= j <= i
            var j = buf[i]%(i+1)

            var temp = array[i];
            array[i] = array[j];
            array[j] = temp;
        }

        callback(null, array)
    })
}

var secureShuffleString = function secureShuffleString(string, callback) {
    secureShuffleArray(string.split(''), function(err, result) {
        var shuffledString = err ? null : result.join('')
        callback(err, shuffledString)
    })
}

module.exports.randomChars = function getRandomChars(num, callback) {
    secureShuffleString(possible, function(err, result) {
        console.log('got random chars')
        var randomChars = err ? null : result.substring(0, num-1)
        callback(err, randomChars)
    })
}

// generates a random on screen keyboard
module.exports.generateKeyboard = function generateKeyboard(callback) {
    console.log('calling generate keyboard')

    crypto.randomBytes(keyboardSize, function(err, buf) {
        if (err) {
            callback(err)
            return
        }

        var unshuffledKeyboard = "";
        for (var i = 0; i < buf.length; i++) {
            unshuffledKeyboard += hex_chars.charAt(buf[i]%hex_chars.length);
        }

        console.log('returning keyboard')
        callback(null, unshuffledKeyboard)

    })
}


var base64ToHex = module.exports.base64ToHex = function base64ToHex(base64String) {
    var buf = new Buffer(base64String, 'base64');
    var hexString = buf.toString('hex');
    return hexString;
}

