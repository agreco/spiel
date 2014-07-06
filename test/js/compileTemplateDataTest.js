var _ = require('lodash'),
    path = require('path'),
    fs = require('fs'),
    dox = require('dox').parseComments,
    helpers = require('../../src/helpers'),
    chai = require('chai'),
    expect = chai.expect,
    should = chai.should();

describe('.compileTemplateData()', function () {

    it('should return an empty string when [files] arguments is missing', function () {
        var data = helpers.compileTemplateData();
        return expect(_.isString(data)).to.be.true, expect(data).to.be.empty;
    });

    it('should create the default template from a given document', function () {
        var files = helpers.buildFileObjects(helpers.cleanseFiles(helpers.getFiles('./test/resources/'))),
            rendered, template = fs.readFileSync(path.resolve('template/default/index.html'), "utf8").toString();
        _.each(files ? files : [], function (file) { rendered = helpers.compileTemplateData(file, template); });
    });
});