var _ = require('lodash'),
    path = require('path'),
    fs = require('fs'),
    dox = require('../../lib/dox'),
    helpers = require('../../src/helpers'),
    chai = require('chai'),
    expect = chai.expect,
    should = chai.should(),
    assert = chai.assert;

describe('.buildFileObjects()', function () {
    it('should return an empty array if [files] argument is missing', function () {
        return expect(helpers.buildFileObjects()).to.be.empty;
    });

    it('should return a files array containing file objects and properties', function () {
        var files = helpers.getFiles('./');
        var cleansedFiles = helpers.cleanseFiles(files);
        var fileObjs = helpers.buildFileObjects(cleansedFiles);
        assert.isArray(fileObjs);
        expect(fileObjs).to.not.be.empty;
        _.each(fileObjs, function (obj) {
            expect(obj.path).to.defined;
            expect(obj.name).to.defined;
            expect(obj.desc).to.defined;
            expect(obj.src).to.be.defined;
        });
    });
});