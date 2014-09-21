// Grid
var utils = require("./utils");

var rows = 5
var cols = 5

function Grid(rows, cols, data) {
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
    if (this.data.length != random_kb.length) {
        return null
    }

    for (var i = 0; i < encrypted.length; i++) {
        var codedChar = encrypted[i];
        var decodedCharIndex = this.data.indexOf(codedChar)

        if (decodedCharIndex > 0) {
            decrypted += random_kb[decodedCharIndex]
        }
    }

    return decrypted
}

// adds newlines to form a row*col grid string
Grid.prototype.toString = function() {
   var gridString = ''

   for (var i = 0; i < rows; i++) {
       var row = this.data.slice(i*cols, (i+1)*cols)
       gridString += row + '\n'
   }

   return gridString
}

module.exports = Grid
