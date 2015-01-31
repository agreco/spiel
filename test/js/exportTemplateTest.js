var _ = require('lodash'),
    path = require('path'),
    childProcess = require('child_process'),
    fs = require('fs'),
    dox = require('dox'),
    helpers = require('../../src/helpers'),
    regex = require('../../src/regex'),
    chai = require('chai'),
    expect = chai.expect,
    should = chai.should(),
    assert = chai.assert;

describe('.exportTemplate()', function () {

    beforeEach(function () {
        helpers.defaultOut = 'test/resources/out';
    });

    it('should export default template to default output dir when [out] argument is missing', function () {
        helpers.exportTemplate();
        expect(fs.existsSync(helpers.defaultOut)).to.be.true;
        _.each(helpers.getFiles(helpers.defaultOut), function (file) {
            expect(regex.res.test(file)).to.be.true;
        });
    });

    it('should export default template into a given output directory', function () {
        _.each(_.range(1, 10), function (out) {
            helpers.exportTemplate({ out: helpers.defaultOut + '/' + out });
            expect(fs.existsSync(helpers.defaultOut + '/' + out)).to.be.true;
            _.each(helpers.getFiles(helpers.defaultOut + '/' + out), function (file) {
                expect(regex.res.test(file)).to.be.true;
            });
        });
    });
});