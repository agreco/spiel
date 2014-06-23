var path = require('path'),
    fs = require('fs'),
    dox = require('../../lib/dox'),
    helpers = require('../../src/helpers'),
    chai = require('chai'),
    expect = chai.expect,
    should = chai.should(),
    assert = chai.assert;

describe('.parseHeaders()', function () {

    it('should return an object with empty array fields if the first argument [files] is missing', function () {
        return expect(helpers.parseHeaders().headers).to.not.be.undefined,
            expect(helpers.parseHeaders().headerLinks).to.not.be.undefined,
            expect(helpers.parseHeaders().headers).to.be.empty,
            expect(helpers.parseHeaders().headerLinks).to.be.empty;
    });

    it('should return a headers object containing header objects', function () {
        var files = helpers.buildFileObjects(helpers.cleanseFiles(helpers.getFiles('./test/resources'))),
            headersObj = helpers.parseHeaders(files, 'h1');
        assert.isObject(headersObj);
        return expect(headersObj).to.not.be.empty;
    });

    /*it('should return a headers property in headersObj', function () {
        var files = helpers.buildFileObjects(helpers.cleanseFiles(helpers.getFiles('./'))),
            headersObj = helpers.parseHeaders(files, 'h1');
        return expect(headersObj.headers).to.not.be.undefined, expect(headersObj.headers).to.not.be.empty;
    });

    it('should return a headerLinks property in headersObj', function () {
        var files = helpers.buildFileObjects(helpers.cleanseFiles(helpers.getFiles('./'))),
            headersObj = helpers.parseHeaders(files, 'h1');
        return expect(headersObj.headerLinks).to.not.be.undefined, expect(headersObj.headerLinks).to.not.be.empty;
    });*/
});