var path = require('path'),
    fs = require('fs'),
    dox = require('dox'),
    helpers = require('../../src/helpers'),
    chai = require('chai'),
    expect = chai.expect,
    should = chai.should(),
    assert = chai.assert;

describe('.indexLinker()', function () {

    var expectedContent = '<h1>Index</h1>\n<div id="index">\n<h2>G</h2>\n<ul>\n<li><a href="test.resources.sample.js.html#getName">getName</a></li>\n</ul>\n<h2>I</h2>\n<ul>\n<li><a href="README.md.html#Installation">Installation</a></li>\n</ul>\n<h2>Q</h2>\n<ul>\n<li><a href="README.md.html#Quickstart">Quickstart</a></li>\n</ul>\n<h2>R</h2>\n<ul>\n<li><a href="README.md.html#Requirements">Requirements</a></li>\n</ul>\n<h2>S</h2>\n<ul>\n<li><a href="test.resources.sample.js.html#Sample Class">Sample Class</a></li>\n<li><a href="test.resources.sample.js.html#setName">setName</a></li>\n<li><a href="README.md.html#spiel">spiel</a></li>\n<li><a href="test.resources.sample.js.html#squareNumber">squareNumber</a></li>\n</ul>\n<h2>T</h2>\n<ul>\n<li><a href="README.md.html#TODO’s">TODO’s</a></li>\n</ul>\n<h2>U</h2>\n<ul>\n<li><a href="README.md.html#Usage">Usage</a></li>\n</ul>\n</div>';

    it('should return an empty string if [headings] argument is missing', function () {
        return expect(helpers.indexLinker()).to.be.empty;
    });

    /*it('should return a string of html containing a list of header links', function () {
        var files = helpers.buildFileObjects(helpers.cleanseFiles(helpers.getFiles('./test/resources/'))),
            headersObj = helpers.parseHeaders(files, 'h1');
            console.log(helpers.indexLinker(headersObj.headers, './test/resources'));
            generatedContent = helpers.indexLinker(headersObj.headers, './test/resources');
        return expect(generatedContent).to.equal(expectedContent);
    });*/
});