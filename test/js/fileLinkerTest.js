var _ = require('lodash'),
    path = require('path'),
    fs = require('fs'),
    dox = require('dox'),
    helpers = require('../../src/helpers'),
    chai = require('chai'),
    expect = chai.expect,
    should = chai.should(),
    assert = chai.assert;

describe('.fileLinker()', function() {

    it('should return an empty string when the first argument is missing', function () {
        return expect(helpers.fileLinker()).to.be.empty;
    });

    it('should add linked headers within the outline or full description of a file', function () {
        var nameAnchorHeaderRegex = /<h1[^>]*.?><a[^>]*.?name="[^>]*.?>[^>]*.?<\/a><\/h1>/,
            files = helpers.buildFileObjects(helpers.cleanseFiles(helpers.getFiles('./test/resources/'))),
            headersObj = helpers.parseHeaders(files, 'h1');
        return expect(_.reduce(helpers.fileLinker(files, headersObj.headers, './test/resources'), function (acc, file) {
            var match;
            if (_.isArray(file.outline)) _.each(file.outline, function (outline) {
                match = (outline.description && outline.description.full).match(nameAnchorHeaderRegex);
                if (match) acc.push(match);
            }); else if (_.isString(file.outline)) {
                match = (file.outline).match(nameAnchorHeaderRegex);
                if (match) acc.push(match);
            }
            return acc;
        }, [])).to.not.be.empty;
    });
});