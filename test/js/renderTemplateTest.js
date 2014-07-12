var _ = require('lodash'),
    chai = require('chai'),
    dox = require('dox').parseComments,
    expect = chai.expect,
    fs = require('fs'),
    helpers = require('../../src/helpers'),
    jquery = fs.readFileSync('template/default/js/lib/jquery.min.js', 'utf-8'),
    jsdom = require('jsdom'),
    path = require('path'),
    should = chai.should();

describe('.renderTemplate()', function () {

    it('should return an empty string when [files] arguments is missing', function () {
        var data = helpers.renderTemplate();
        return expect(_.isString(data)).to.be.true, expect(data).to.be.empty;
    });

    it('should render default template from a given document', function () {
        var files = helpers.buildFileObjects(helpers.cleanseFiles(helpers.getFiles('./test/resources/'))),
            renderedTmpl, template = fs.readFileSync(path.resolve('template/default/index.html'), "utf8").toString();
        _.each(files ? files : [], function (file) { renderedTmpl = helpers.renderTemplate(file, template); });

        return expect(renderedTmpl).to.not.be.empty, jsdom.env({
            html: renderedTmpl,
            src: [jquery],
            done: function (err, window) {
                var $ = window.$, content = $('#content');
                return expect(content.find('h1').text()).to.not.be.empty,
                       expect(content.find('p').text()).to.not.be.empty,
                       expect(content.find('#api').text()).to.not.be.empty;
            }
        });
    });
});