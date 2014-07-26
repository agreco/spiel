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

    it('should return an empty array if [opts] argument is missing', function () {
        return expect(helpers.importTemplateResources()).to.be.empty;
    });

    it('should import default template resources into a given output directory', function () {
        var out = 'test/resources';
        return helpers.importTemplateResources({ out: out }), expect(fs.existsSync(out)).to.be.true,
            _.each(helpers.getFiles(out), function (file) {
                expect(file.match(regex.res)).to.be.true;
            }), childProcess.exec("rm -r" + out);
    });

    /*it('should import js template resources into the output directory', function (done) {
        var outputDir = 'test/resources', jsDir = outputDir + '/js';
        return helpers.importTemplateResources({output: outputDir}, 'js'), expect(fs.existsSync(jsDir)).to.be.true,
            _.each(helpers.getFiles(jsDir), function (file) { expect(path.extname(file)).to.equal('.js'); }),
                childProcess.exec("rm -r " + jsDir), done();
    });

    it('should import image template resources into the output directory', function (done) {
        var outputDir = 'test/resources', imgsDir = outputDir + '/imgs';
        return helpers.importTemplateResources({output:outputDir}, 'imgs'), fs.exists(imgsDir, function (exists) {
            return expect(exists).to.be.true; }), childProcess.exec("rm -r " + imgsDir), done();
    });*/
});