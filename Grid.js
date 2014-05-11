// Grid
var utils = require("./utils");

var rows = 5
var cols = 5

var Grid = function Grid(rows, cols, data) {
    this.rows = rows
    this.cols = cols
    this.data = data
}

Grid.create = function(cb) {
    utils.randomChars(rows*cols, function(err, data) {
        cb(err, new Grid(rows, cols, data))
    })
}

Grid.prototype.decode = function(encrypted, random_kb) {
        var decrypted = ""
        //TODO assert that encrypted and random_kb are the same length
        for (var i = 0; i < encrypted.length; i++) {
            var ind = this.data.indexOf(encrypted[i])
            decrypted += random_kb[ind]
        }
        return decrypted
}

module.exports = Grid
