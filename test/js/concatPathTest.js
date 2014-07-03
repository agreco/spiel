var path = require('path'),
    fs = require('fs'),
    helpers = require('../../src/helpers'),
    chai = require('chai'),
    expect = chai.expect,
    should = chai.should();

describe('.concatPath()', function () {

    it('should return empty string if first argument is not a string or is falsy', function () {
        return expect(helpers.concatPath()).to.be.empty;
    });

    it('should return a file path with a default delimiter if the second argument is missing', function () {
        expect(helpers.concatPath('test/resources/sample.js')).to.eql('test_resources_sample.js.html');
    });

    it('should join a file path with a delimiter argument', function () {
        return expect(helpers.concatPath('test/resources/sample.js', '*')).to.eql('test*resources*sample.js.html');
    });
});