var should = require('should');
var utils = require('../utils');
var grid = require('../Grid');

// Utils tests
describe('Utils', function() {
    describe('#createPinAndId()', function() {
        it('should return an id and pin pulled from the given hash', function() {
            for (var i = 0; i < 10000; i++) {
                var hash = utils.shuffleString(utils.possible);
                var pinLength = Math.floor(Math.random()*7);
                var idPinArr = utils.createPinAndId(hash, pinLength);
                var id = idPinArr[0];
                var pin = idPinArr[1];

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

// Grid tests
describe('Grid', function() {
    describe('#decode()', function() {
        it('should decode an encrypted pin given the random kb and secret grid', function() {
            var data = "abcdefghijklmnopqrstuvqxy";
            var kb   = "e6 ca 7 2 5f13  b  0d 948";
            var g = new grid.Grid(5, 5);
            g.data = data;
            var pin = "f3ad";
            var decoded_pin = g.decode("lneu", kb);
            decoded_pin.should.have.length(pin.length);
            decoded_pin.should.equal(pin);
        })
    })
})

