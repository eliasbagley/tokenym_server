var express = require("express");
var mongoose = require("mongoose");
var bcrypt = require("bcrypt-nodejs");
var utils = require("./utils");
var grid = require("./Grid");

var app = express();
app.use(express.logger());
app.use(express.bodyParser());

var dburl = 'mongodb://localhost/tokenym';

mongoose.connect(dburl, function(err, res) {
    console.log("connected to db");
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

// API:
//register(email, password), sends email containing grid + 4 chars
// H(password), subtract 6 characters, 4 of which are pin
// create DB entry: email : user object containing email, grid, user_id api key, and id

app.post('/register', function(req, res) {
    var email = req.body.email;
    var password = req.body.password;

    // bcrypt hash the password
    var hashAndSalt = bcrypt.hashSync(password);
    console.log(hashAndSalt);
    var salt = hashAndSalt.substring(0, hashAndSalt.length - 31);
    console.log(salt);
    var hash = hashAndSalt.substring(hashAndSalt.length - 31, hashAndSalt.length);
    console.log(hash);

    // remove random characters from the bcrypt hash, 4 of which become the pin
    var pin = utils.choose(hash, 4);

    // generate the ID, which is the remainder from the previous step
    var id = utils.remove_chars(hash, pin);

    // generate a grid
    var g = new grid.Grid();

    // store the grid, email, id in the userSchema object
    console.log("grid data: " + g.data);
    var user = new User({
        "email": email,
        "id": id,
        "grid": g,
        "salt": salt
    });

    console.log("saving user...");
    user.save(function(err) {
        if (err) {
            res.send('Error creating user');
            console.log("error creating user");
        } else {
            res.send(user)
            console.log("user saved");
        }
    });

    // send the pin and grid to the email address
    utils.email(email, grid, pin);

    console.log("done registering!");
});

// login(username, password, xxxx), returns user_id api key
app.post('/login', function(req, res) {
    var email = req.body.email;
    var password = req.body.password;
    var pin = req.body.pin;
    console.log("pin: " + pin);

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
            var hashAndSalt = bcrypt.hashSync(password, user.salt);
            var hash = hashAndSalt.substring(hashAndSalt.length - 31, hashAndSalt.length);
            var id = utils.remove_chars(hash, pin);
            console.log("new id " + id);
            // compare the id's
            var same = true;

            // prevents timing attacks
            var max_length = (user.id.length < id.length) ? user.id.length : id.length;
            for (var i = 0; i < max_length; ++i) {
                if (user.id.length >= i && id.length >= i && user.id[i] != id[i]) {
                    same = false;
                }
            }
            console.log(same);
        }
    });
});

// returns a new token for user_id
// params: user_id
app.post('/token/new', function(req, res) { // TODO update the user object's token balance
    var user_id = req.body.user_id;
    var shared_secret = req.body.shared_secret;

    var query = User.find({
        _id: req.params.id
    });
    query.exec(function(err, results) {
        if (err) {
            res.end('Error in query');
        } else {
            var user = results[0];

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
                        res.send(token);
                    }
                });

            });
        }
    });
});

app.post('/token/redeem', function(req, res) {
    var token = req.body.token;
    var shared_secret = req.body.shared_secret;

    var query = Token.find({
        "token", token
    });
    query.exec(function(err, results) {
        if (err) {
            res.send('Error in query');
        } else {
            var tokenObj = results[0];

            if (shared_secret == tokenObj.secret) {
                res.send(tokenObj.id);
            } else {
                res.send(null);
            }

            // delete this tokenObj
            Token.remove({
                _id: tokenObj._id
            }, function(err) {});
        }
    });
});

app.post('/user/create', function(req, res) {
    var user = new User(req.body);
    user.save(function(err) {
        if (err) {
            res.send('Error creating user')
        } else {
            res.send(user)
        }
    });
});

app.delete('/user/:id', function(req, res) {
    User.remove({
        _id: req.params.id
    }, function(err) {
        if (err) {
            res.send('error removing');
        } else {
            res.send('removed user: ' + req.params.id);
        }
    });
});

app.get('/user/:id', function(req, res) {
    var query = User.find({
        _id: req.params.id
    });
    query.where('age').lt(60);
    query.exec(function(err, results) {
        if (err) {
            res.end('Error in query');
        } else {
            res.end(JSON.stringify(results[0], undefined, 2));
        }
    });
});



app.listen(port, function() {
    console.log('Tokenym Server listening on port ' + port);
});
