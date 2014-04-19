var express  = require("express");
var mongoose = require("mongoose");
var bcrypt   = require("bcrypt-nodejs");
var uuid     = require("node-uuid");
var utils    = require("./utils");
var Grid     = require("./Grid");
var Q        = require("Q");
var User     = require('./model/user.js');
var Token    = require('./model/token.js');
var redis    = require("redis");

var client = redis.createClient();

Q.longStackSupport = true;

var app = express();
app.use(express.logger());
app.use(express.bodyParser());


var port = 5000;

// magic numbers
var pinLength    = 4;
var n1           = 2;
var n2           = 3;
var keyboardSize = 25;
var tokenSize    = 10;
var rows         = 5;
var cols         = 5;

// API:
//register(email, password), sends email containing grid + 4 chars
// H(password), subtract 6 characters, 4 of which are pin
// create DB entry: email : user object containing email, grid, user_id api key, and id
app.post('/user/register/:key', function (req, res) {

    var registrationKey  = req.params.key;

    client.get(key, onReturnUserInfo);
    function onReturnUserInfo(err, user) {
       registerUser(user);
    }
});

function registerUser(user) {
    console.log('registering user');

    // pull out the email and hashAndSalt
    var idAndPin = generateIdAndPin(hashAndSalt);

    var id = idAndPin[0];
    var pin = idAndPin[1];

    // create the grid
    var grid = new Grid(rows, cols);

    // email the pin and grid
    //
    // create the user
    var user = createuser(email, id, hashAndSalt, grid);

    // save the user in the db
    saveUser(user);
}

function saveUser(user){
    user.save(function (err) {
        console.log('error saving user');
    })
}

function createUser(email, id, hash, grid) {
    // store the grid, email, id in the userSchema object
    var user = new User({
        "email": email,
        "id": id,
        "grid": g,
        "salt": null,
        "api_key": null,
        "hash": hash
    });

    return user;
}

function generateIdAndPin(hashAndSalt) {
    var salt = hashAndSalt.substring(0, hashAndSalt.length - 31);
    var hash = hashAndSalt.substring(hashAndSalt.length - 31, hashAndSalt.length);
    console.log("hash: " + hash + " salt: " + salt);

    // convert hash to hex
    hash = utils.base64ToHex(hash);
    console.log('Hex hash: ' + hash)

    // generate the pin and Id from the hash and magic numbers
    var idAndPinArr = utils.createPinAndId(hash, pinLength, n1, n2);
    var id = idAndPinArr[0];
    console.log('id: ' + id);
    var pin = idAndPinArr[1];
    console.log('pin: ' + pin);

    return idAndPinArr;
}

app.post('/user/register', function(req, res) {
    var email    = req.body.email;
    var password = req.body.password;

    var query = User.find({
        "email": email
    });

    query.exec(function(err, results) {

        console.log('query complete');
        if (err) {
            console.log('error in query')
            res.end('error in query')
        }
        if (results.length > 0) {
            // send a notice to the email address that someone tried registering (or ignore it)
            console.log('Email address in use');
            res.end('done')
            return;
        } else {
            // TODO send a registration link to the email address
            // generate a key to authenticate this user creation
            var registrationKey = uuid.v4();
            console.log(registrationKey);

            cacheUser(registrationKey, email, password);
            res.end('done')
        }
    });
});

function cacheUser(registrationKey, email, password) {
    bcrypt.hash(password, null, null, function (err, hash) {
        client.hmset(registrationKey, "email", email, "hash", hash);
    })
}


// request a random keyboard using the email address and password. The function
// looks up the user corresponding to that email address and bcrypt hashed password. The keyboard will encrypt
// the pin and be used to authenticate the user on each login attempt
// Even if there is no user with found with the given email and password, a keyboard will be sent anyways so an attacker
// cannot learn if credentails are correct

app.post('/keyboard/request', function(req, res) {
    var email = req.body.email;
    var password = req.body.password;

    // make this async
    var hashAndSalt = bcrypt.hashSync(password);

    // store the keyboard with the user object
    var query = User.find({
        "email"         : email,
        "hashAndSalt"   : hashAndSalt
    });

    var user;
    query.exec(function(err, results) {
        if (err) {
            res.send("error in query")
        } else {
            user = results[0];

            var keyboard = utils.generateKeyboard(keyboardSize);

            // send the keyboard even if there is no user
            if (user == null) {
                res.send({"keyboard": keyboard});
                console.log("sending kb even though user is null");
            }

            // set the current keyboard on the user object
            user.keyboard = keyboard;

            // save the user object
            user.save(function(err) {
                if (err) {
                    res.send("Error saving keyboard for user");
                    console.log("Error saving keyboard for user");
                } else {
                    console.log("User " + email + " updated with keyboard " + keyboard);
                    // send the generated keyboard
                    res.send({"keyboard" : keyboard});
                }
            })
        }
    })
})

// login(username, password, xxxx), returns user_id api key
// TODO check to see if the user exists?
app.post('/user/login', function(req, res) {
    var email        = req.body.email;
    var password     = req.body.password;
    var encryptedPin = req.body.pin;
    var keyboard     = req.body.keyboard;
    console.log("encrypted pin: " + encryptedPin);

    // lookup user from email
    var query = User.find({
        "email": email
    });
    var user;
    query.exec(function(err, results) {
        if (err) {
            res.end('Error in query');
            console.log('error in query');
        } else {
            user = results[0];
            console.log("found user: " + user);

            if (user == null) {
                res.send("Invalid username or password");
                console.log("Invalid username or password");
            }

            var userKeyboard = user.keyboard;

            // the user has spend the generated keyboard from the last request, remove it from the user obj
            user.keyboard = null;
            user.save(function(err) {
                if (err) {
                    res.send("Error updating user object");
                    console.log("Error updating user object");
                } else {
                    console.log("Successfully removed stale kb from user obj");
                }
            })

            // verify that the keyboard matches the keyboard stored in user obj
            if (keyboard != userKeyboard) {
                res.send("Keyboards don't match") //TODO figure out how to send error code
            }

            // decode the pin using the keyboard and grid
            var grid = user.grid;

            var pin = grid.decode(encryptedPin, keyboard);

            var hashAndSalt = bcrypt.hashSync(password, user.salt);
            var hash = hashAndSalt.substring(hashAndSalt.length - 31, hashAndSalt.length);

            // conver the base 64 hash into hex
            hash = utils.base64ToHex(hash);
            console.log('Hex hash: ' + hash);

            var id = utils.remove_chars(hash, pin, n1, n2);
            console.log("new id " + id);

            // compare the id's
            var same = utils.secureCompareString(user.id, id);

            if (same) {
                // genereate uuid for apikey
                var api_key = uuid.v4();
                res.send(apikey);

                // write the apikey to the apikey db
                user.api_key = api_key;
                user.save(function (err) {
                    if (err) {
                        console.log("Error updating apikey in database");
                    } else {
                        console.log("Successfully set apikey in database");
                    }
                })
            }
            else {
                res.send("Incorrect username, password, or pin");
            }

        }
    });
});

// returns a new token for user_id
// params: user_id
app.post('/token/request', function(req, res) { //TODO update the user object's token balance
    var user_id       = req.body.user_id;
    var shared_secret = req.body.shared_secret;
    var api_key       = req.body.api_key;
    var price         = req.body.price; //TODO attack a price to the token

    var query = User.find({
        _id: req.params.id
    });
    query.exec(function(err, results) {
        if (err) {
            res.end('Error in query');
        } else {
            var user = results[0];

            var user_api_key = user.api_key;

            // invalid API key
            if (user_api_key != api_key) {
                res.send("Invalid API key");
                console.log("Invalid API key");
            }

            // create a token
            utils.generateToken(tokenSize, function(token) {
                // store the token in the token db, token : id
                var tokenObj = new Token({
                    "token": token,
                    "id": user.id,
                    "secret": shared_secret
                });
                tokenObj.save(function(err) {
                    if (err) {
                        console.log("Error saving token");
                    } else {
                        // return created token to user
                        res.send({"token" : token});
                    }
                });

            });
        }
    });
});

// only a logged in user can redeem a token, because it requires an api key
app.post('/token/redeem', function(req, res) {
    var user_id       = req.body.user_id;
    var api_key       = req.body.api_key;
    var token         = req.body.token;
    var shared_secret = req.body.shared_secret;

    var userQuery = User.find({
        _id : user_id
    });
    userQuery.exec(function(err, results) {
        if (err) {
            res.send("Invalid userId");
        } else {
            var user = results[0];

            if (user.api_key != api_key) {
                res.send("Invalid API key");
            }

            var query = Token.find({
                "token": token
            });
            query.exec(function(err, results) {
                if (err) {
                    res.send('Error in query');
                } else {
                    var tokenObj = results[0];

                    // if the shared secrets match
                    if (shared_secret == tokenObj.secret) {
                        // send the token's owner's id
                        res.send({"id" : tokenObj.id});
                    } else {
                        // send nothing back if the shared secret doesn't match
                        res.send("Shared secret doesn't match");
                    }

                    // delete this tokenObj
                    Token.remove({
                        _id: tokenObj._id
                    }, function(err) {
                        console.log("Error deleting token");
                    });
                }
            });
        }
    })
});

app.post('/user/logout', function(req, res) {
    var user_id = req.body.user_id;
    var api_key = req.body.api_key;

    // delete the user's API key to log them out
    var query = User.find({
        _id : user_id
    });
    query.exec(function(err, results) {
        if (err) {
            res.send("Error logging out");
        } else {
            var user = results[0];

            if (user.api_key != api_key) {
                res.send("Invalid user id");
            }

            user.api_key = null;

            user.save(function(err) {
                if (err) {
                    console.log("Error saving user object in logout");
                    res.send("Logout unsuccessful");
                } else {
                    console.log("Successfully saved user object logging out");
                    res.send("Logout successful");
                }
            });
        }
    });
})

app.listen(port, function() {
    console.log('Tokenym Server listening on port ' + port);
});
