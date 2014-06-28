var path = require('path'),
    fs = require('fs'),
    dox = require('dox'),
    helpers = require('../../src/helpers'),
    chai = require('chai'),
    expect = chai.expect,
    should = chai.should(),
    assert = chai.assert;

describe('.parseHeaders()', function () {

    it('should return an object with empty array properties if the first argument [files] is missing', function () {
        return assert.isObject(helpers.parseHeaders()),
               expect(helpers.parseHeaders().headers).to.not.be.undefined,
               expect(helpers.parseHeaders().headerLinks).to.not.be.undefined,
               expect(helpers.parseHeaders().headers).to.be.empty,
               expect(helpers.parseHeaders().headerLinks).to.be.empty;
    });

    it('should return a header object with a headers and headerLinks property', function () {
        var files = helpers.buildFileObjects(helpers.cleanseFiles(helpers.getFiles('./'))),
            headersObj = helpers.parseHeaders(files, 'h1');
        return assert.isObject(headersObj),
               expect(headersObj).to.not.be.empty,
               expect(headersObj.headers).to.not.be.undefined,
               expect(headersObj.headers).to.not.be.empty,
               expect(headersObj.headerLinks).to.not.be.undefined,
               expect(headersObj.headerLinks).to.not.be.empty;
    });
});