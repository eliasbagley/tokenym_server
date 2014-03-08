// Grid
var utils = require("./utils");

function Grid(rows, cols) {
    this.rows = rows;
    this.cols = cols;
    this.data = utils.getRandomChars(rows*cols);
}

Grid.prototype.decode = function(encrypted, random_kb) {
        var decrypted = "";
        //TODO assert that encrypted and random_kb are the same length
        for (var i = 0; i < encrypted.length; i++) {
            var ind = this.data.indexOf(encrypted[i]);
            decrypted += random_kb[ind];
        }
        return decrypted;
}

module.exports = Grid;
