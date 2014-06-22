var _ = require('lodash'),
    path = require('path'),
    fs = require('fs'),
    helpers = require('../../src/helpers'),
    chai = require('chai'),
    expect = chai.expect,
    should = chai.should();

describe('.cleanseFiles()', function () {
    it('should return an empty array if [files] argument is missing.', function () {
        var files = helpers.cleanseFiles();
        return expect(files).to.be.empty;
    });

    it('should only return the files used for parsing html/css/js/markdown', function () {
        _.each(helpers.cleanseFiles(helpers.getFiles('./')), function (file) {
            expect(/\.(js|css|htm(l)|markdown|md|md(own))$/.test(file)).to.be.true;
        });
    });
});