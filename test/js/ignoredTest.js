var path = require('path'),
    fs = require('fs'),
    helpers = require('../../src/helpers'),
    chai = require('chai'),
    expect = chai.expect,
    should = chai.should();

describe('.ignored()', function () {

    it('should return an empty string if argument is missing', function () {
        expect(helpers.ignored()).to.be.empty;
    });

    it('should ignore vcs directories', function () {
        expect(helpers.ignored(path.resolve('test/../'))).to.be.true;
    });
});