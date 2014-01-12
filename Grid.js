// Grid
var utils = require("./utils");

var Grid = exports.Grid = function() {
    this.rows = 6;
    this.cols = 6;
    this.data = utils.shuffleString(utils.possible);
    this.decode = function(encrypted, random_kb) {
        var decrypted = "";
        for (var i = 0; i < encrypted; i++) {
            var ind = random_kb.indexOf(encrypted[i]);
            decrypted += this.data[ind];
        }
        return decrypted;
    };
}
