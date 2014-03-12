var mongoose = require('mongoose');

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

var Token = module.exports = mongoose.model('Tokens', tokenSchema);
