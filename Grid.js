// Grid
var utils = require("./utils");

var Grid = exports.Grid = function(rows, cols) {
    this.rows = rows;
    this.cols = cols;
    this.data = function() {
        var randomChars = utils.getRandomChars(rows*cols);
        return randomChars;
    }
    this.decode = function(encrypted, random_kb) {
        var decrypted = "";
        for (var i = 0; i < encrypted.length; i++) {
            var ind = this.data.indexOf(encrypted[i]);
            decrypted += random_kb[ind];
        }
        return decrypted;
    };
}
