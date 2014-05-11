var mongoose = require('mongoose')

var userSchema = new mongoose.Schema({
    email: {
        type: String,
        trim: true
    },
    id: {
        type: String,
    },
    grid: mongoose.Schema.Types.Mixed,
    balance: {
        type: Number,
        default: 100
    },
    hash: {
        type: String,
    }
})

var User = module.exports = mongoose.model('Users', userSchema)
