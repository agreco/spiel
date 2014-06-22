var _ = require('lodash'),
    path = require('path'),
    fs = require('fs'),
    helpers = require('../../src/helpers'),
    chai = require('chai'),
    expect = chai.expect,
    should = chai.should();

describe('.getFiles()', function () {
    it('should return empty array if [pathName] argument is missing', function () {
        var arr = helpers.getFiles();
        expect(arr).to.be.empty;
    });

    it('should return a deep array of files from a given directory', function () {
        var files = helpers.getFiles('./');
        expect(files).to.not.be.undefined;
        _.each(files, function (file) { fs.exists(file, function (exists) { return expect(exists).to.be.true; }); });
    });
});