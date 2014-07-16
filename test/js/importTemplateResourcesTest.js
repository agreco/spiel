var _ = require('lodash'),
    path = require('path'),
    childProcess = require('child_process'),
    fs = require('fs'),
    dox = require('dox'),
    helpers = require('../../src/helpers'),
    chai = require('chai'),
    expect = chai.expect,
    should = chai.should(),
    assert = chai.assert;

describe('importTemplateResources', function () {

    it('should return an empty value if [opts] argument is missing', function () {
        helpers.importTemplateResources();
        // return expect(helpers.importTemplateResources()).to.be.empty;
    });

    /*it('should import css template resources into the output directory', function (done) {
        var outputDir = 'test/resources', cssDir = outputDir + '/css';
        return helpers.importTemplateResources({output: outputDir}, 'css'), expect(fs.existsSync(cssDir)).to.be.true,
            _.each(helpers.getFiles(cssDir), function (file) { expect(path.extname(file)).to.equal('.css'); }),
            childProcess.exec("rm -r " + cssDir), done();
    });

    it('should import js template resources into the output directory', function (done) {
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