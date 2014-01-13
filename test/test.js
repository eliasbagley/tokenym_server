var should = require('should');
var utils = require('../utils');

// Utils tests
describe('Utils', function() {
    describe('#createPinAndId()', function() {
        it('should return an id and pin pulled from the given hash', function() {
            for (var i = 0; i < 10000; i++) {
                var hash = utils.shuffleString(utils.possible);
                var pinLength = Math.floor(Math.random()*7);
                var n1 = Math.floor(Math.random()*7);
                var n2 = Math.floor(Math.random()*7);
                var idPinArr = utils.createPinAndId(hash, pinLength, n1, n2);
                var id = idPinArr[0];
                var pin = idPinArr[1];

                id.should.have.length(hash.length-pinLength-n1-n2);
                pin.should.have.length(pinLength);
                hash.should.include(pin);
            }
        })
    })

    describe('#generateToken()', function() {
        it('should return an alphanumeric string of the specified length', function(done) {
            var length = Math.floor(Math.random()*20);
            utils.generateToken(length, function(token) {
                token.should.have.length(length);
                token.should.match(/^[a-z0-9]+$/);
                done();
            })
        })
    })

    describe('#shuffleString', function() {
        it('should shuffle a string', function() {
            for (var i = 0; i < 1000; i++) {
                var result = utils.shuffleString(utils.possible);
                result.should.have.length(utils.possible.length);
            }
        })
    })
})

