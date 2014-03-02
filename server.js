var express = require("express");
var mongoose = require("mongoose");
var bcrypt = require("bcrypt-nodejs");
var uuid = require("node-uuid");
var utils = require("./utils");
var grid = require("./Grid");

var app = express();
app.use(express.logger());
app.use(express.bodyParser());

var dburl = 'mongodb://localhost/tokenym';

mongoose.connect(dburl, function(err, res) {
    if (err) {
        console.log("Failed to connect to db. Did you remember to start mongod?");
    } else {
        console.log("Connected to db");
    }
});

var userSchema = new mongoose.Schema({
    email: {
        type: String,
        trim: true
    },
    id: {
        type: String,
        trim: true
    },
    grid: mongoose.Schema.Types.Mixed,
    salt: {
        type: String,
        trim: true
    },
    balance: {
        type: Number,
        default: 100
    },
    // the last keyboard they requested. Gets reset after a successful login
    keyboard: {
        type: String
    },
    api_key: {
        type: String,
        trim: true
    }
});

var tokenSchema = new mongoose.Schema({
    token: {
        type: String,
        trim: true
    },
    id: {
        type: String,
        trim: true
    },
    secret: {
        type: String,
        trim: true
    }
});

var User = mongoose.model("Users", userSchema);
var Token = mongoose.model("Tokens", tokenSchema);

var port = 5000;

// magic numbers
var pinLength = 4;
var n1 = 2;
var n2 = 3;

// API:
//register(email, password), sends email containing grid + 4 chars
// H(password), subtract 6 characters, 4 of which are pin
// create DB entry: email : user object containing email, grid, user_id api key, and id

app.post('/user/register', function(req, res) {
    var email = req.body.email;
    var password = req.body.password;

    //check that the email address doesn't already exist in the db
    var query = User.find({
        "email": email
    });
    var user;
    query.exec(function(err, results) {
        if (err) {
            res.send("error in query")
        } else {
            if (results.length > 0) {
                res.send("email address taken");
            }
        }
    })

    //TODO email user with access code to complete registration

    // bcrypt hash the password
    var hashAndSalt = bcrypt.hashSync(password);
    console.log('Base64 hash and salt: ' + hashAndSalt);
    var salt = hashAndSalt.substring(0, hashAndSalt.length - 31);
    console.log('Base64 salt: ' + salt);
    var hash = hashAndSalt.substring(hashAndSalt.length - 31, hashAndSalt.length);
    console.log('Base64 hash: ' + hash);

    // convert the base64 hash into hex
    hash = utils.base64ToHex(hash);
    console.log('Hex hash: ' + hash);

    // generate the pin and Id form the hash and magic numbers
    var idAndPinArr = utils.createPinAndId(hash, pinLength, n1, n2);
    var pin = idAndPinArr[1];
    console.log(pin);
    var id = idAndPinArr[0];

    // generate a grid
    var g = new grid.Grid();
    console.log("Grid data: " + grid.data);

    // store the grid, email, id in the userSchema object
    console.log("grid data: " + g.data);
    var user = new User({
        "email": email,
        "id": id,
        "grid": g,
        "salt": salt,
        "api_key": null
    });

    console.log("saving user...");
    user.save(function(err) {
        if (err) {
            res.send('Error creating user');
            console.log("error creating user");
        } else {
            res.send(user)
            console.log(user);
        }
    });

    // send the pin and grid to the email address
    //utils.email(email, grid, pin);

    console.log("done registering!");
});

// request a random keyboard with an email address. The keyboard will encode
// the pin and be used to authenticate the user on each login attempt

//TODO check to suer if the user even exists first
app.post('/requestkeyboard', function(req, res) {
    var email = req.body.email;

    // store the keyboard with the user object
    var query = User.find({
        "email": email
    });

    var user;
    query.exec(function(err, results) {
        if (err) {
            res.send("error in query")
        } else {
            user = results[0];

            //TODO get the right size keyboard
            var keyboard = utils.generateKeyboard(25);

            user.keyboard = keyboard;

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
app.post('/user/login', function(req, res) {
    var email = req.body.email;
    var password = req.body.password;
    var encryptedPin = req.body.pin;
    var keyboard = req.body.keyboard;
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
            var same = true;

            // fixed time comparison to prevent timing attacks
            var max_length = (user.id.length < id.length) ? user.id.length : id.length;
            for (var i = 0; i < max_length; ++i) {
                if (user.id.length >= i && id.length >= i && user.id[i] != id[i]) {
                    same = false;
                }
            }
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
    var user_id = req.body.user_id;
    var shared_secret = req.body.shared_secret;
    var api_key = req.body.api_key;
    var price = req.body.price; //TODO attack a price to the token

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
            utils.generateToken(10, function(token) {
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
    var user_id = req.body.user_id;
    var api_key = req.body.api_key;
    var token = req.body.token;
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
