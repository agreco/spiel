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

    var rmDir = function (out) {
        if (out && !_.isEmpty(out)) childProcess.exec("rm -rf " + out);
    };

    it('should import default template resources to default output dir when [out] argument is missing', function () {
        var out = helpers.defaultOut;
        helpers.importTemplateResources();
        expect(fs.existsSync(out)).to.be.true;
        _.each(helpers.getFiles(out), function (file) {
            expect(regex.res.test(file)).to.be.true;
        });
        rmDir('out');
    });

    it('should import default template resources into a given output directory', function () {
        _.each(_.range(1, 10), function (out) {
            helpers.importTemplateResources({ out: 'out' + out + '/resources' });
            expect(fs.existsSync('out' + out + '/resources')).to.be.true;
            _.each(helpers.getFiles('out' + out + '/resources'), function (file) {
                expect(regex.res.test(file)).to.be.true;
            });
            rmDir('out' + out);
        });
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