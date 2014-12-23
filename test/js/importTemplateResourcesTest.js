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

    var out, removeRes = function () {
        if (out && !_.isEmpty(out)) childProcess.exec("rm -rf " + out);
        /* if (fs.existsSync(out)) {
            console.log(out);
            _.each(fs.readdirSync(out), function(file) {
                file = out + "/" + file;
                fs.lstatSync(file).isDirectory() ? removeRes(file) : fs.unlinkSync(file);
            });
            fs.rmdirSync(out);
        }*/
    };

    before(removeRes);
    afterEach(removeRes);

    it('should import default template resources to default output dir when [out] argument is missing', function () {
        out = helpers.defaultOut;
        helpers.importTemplateResources();
        expect(fs.existsSync(out)).to.be.true;
        _.each(helpers.getFiles(out), function (file) {
            expect(file.match(regex.res)).to.be.true;
        });
    });

    /*it('should import default template resources into a given output directory', function () {
        _.each(_.range(1, 10), function (out) {
            out = 'out' + out + '/resources';
            helpers.importTemplateResources({ out: out });
            expect(fs.existsSync(out)).to.be.true;
            _.each(helpers.getFiles(out), function (file) { expect(file.match(regex.res)).to.be.true; });
            childProcess.exec("rm -r" + out);
        });
    });*/

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