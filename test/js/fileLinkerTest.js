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

    it('should return a string of html containing a name linked header', function () {
        var nameAnchorHeaderRegex = /<h1[^>]*.?><a[^>]*.?name="[^>]*.?>[^>]*.?<\/a><\/h1>/,
            files = helpers.buildFileObjects(helpers.cleanseFiles(helpers.getFiles('./README.md'))),
            headersObj = helpers.parseHeaders(files, 'h1');
            generatedLinkedFiles = helpers.fileLinker(files, headersObj.headers, './test/resources');

        _.each(generatedLinkedFiles, function (file) {
            if (_.isArray(file.outline)) _.each(file.outline, function (outline) {
                expect(outline.description.full).to.match(nameAnchorHeaderRegex);
            }); else if (_.isString(file.outline)) {
                expect(file.outline).to.match(nameAnchorHeaderRegex);
            }
        });
    });
});