var path = require('path'),
    fs = require('fs'),
    helpers = require(path.resolve(process.cwd(), 'src/helpers')),
    chai = require('chai'),
    expect = chai.expect,
    should = chai.should();

describe('.setRootPath()', function () {

    it('should set the root path to an empty string when [root] argument is missing', function () {
        expect(helpers.setRootPath()).to.be.equal('');
    });

    it('should process the home dir', function () {
        expect(helpers.setRootPath('~/Development/spiel/test/resources/')).to
            .equal("/Development/spiel/test/resources/");

        expect(helpers.setRootPath('~/Development/spiel')).to.equal("/Development/spiel");
    });
});