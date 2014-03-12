var mongoose = require('mongoose');

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
    },
    hashAndSalt: {
        type: String,
        trim: true
    }
});

var User = module.exports = mongoose.model('Users', userSchema);

