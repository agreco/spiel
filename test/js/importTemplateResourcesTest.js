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

describe('importTemplateResources', function () {

    beforeEach(function () {
        helpers.defaultOut = 'test/resources/out';
    });

    /*afterEach(function () {
        if (!_.isEmpty(helpers.defaultOut)) childProcess.exec("rm -rf " + helpers.defaultOut);
    });*/

    it('should import default template resources to default output dir when [out] argument is missing', function () {
        helpers.importTemplateResources();
        expect(fs.existsSync(helpers.defaultOut)).to.be.true;
        _.each(helpers.getFiles(helpers.defaultOut), function (file) {
            expect(regex.res.test(file)).to.be.true;
        });
    });

    /*it('should import default template resources into a given output directory', function () {
        _.each(_.range(1, 10), function (out) {
            helpers.importTemplateResources({ out: helpers.defaultOut + '/' + out });
            expect(fs.existsSync(helpers.defaultOut + '/' + out)).to.be.true;
            _.each(helpers.getFiles(helpers.defaultOut + '/' + out), function (file) {
                expect(regex.res.test(file)).to.be.true;
            });
        });
    });

    it('should import js template resources into the output directory', function () {
        var jsDir = helpers.defaultOut + '/js';
        helpers.importTemplateResources({ out: helpers.defaultOut }, 'js');
        expect(fs.existsSync(jsDir)).to.be.true;
        _.each(helpers.getFiles(jsDir), function (file) {
            expect(path.extname(file)).to.equal('.js');
        });
    });*/

    /*
    it('should import image template resources into the output directory', function (done) {
        var outputDir = 'test/resources', imgsDir = outputDir + '/imgs';
        return helpers.importTemplateResources({output:outputDir}, 'imgs'), fs.exists(imgsDir, function (exists) {
            return expect(exists).to.be.true; }), childProcess.exec("rm -r " + imgsDir), done();
    });*/
});