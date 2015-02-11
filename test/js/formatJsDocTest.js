var _ = require('lodash'),
    path = require('path'),
    fs = require('fs'),
    dox = require('dox'),
    helpers = require('../../src/helpers'),
    chai = require('chai'),
    expect = chai.expect,
    should = chai.should();

describe('.formatJsDoc()', function () {

    beforeEach(function () {
        helpers.defaultOut = 'test/resources/out';
    });

    it('should return an empty array when the argument is missing', function () {
        expect(helpers.formatJsDoc()) .to .equal([]);
    });

    it('should return a string of html formatted JsDoc comments', function () {
        //_.each(helpers.buildFileObjects(helpers.cleanseFiles(helpers.getFiles('./test/resources/sample.js'))),
        //    function (file) {
        //    _.each(file, function (outline) {
        //        expect(fs.readFileSync(path.resolve(process.cwd(), 'test/resources/formattedJsDoc.html'))) .to
        //            .equal(helpers.formatJsDoc(outline));
        //    });
        //})
    });
});