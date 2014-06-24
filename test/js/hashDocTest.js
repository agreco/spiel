var _ = require('lodash'),
    path = require('path'),
    fs = require('fs'),
    dox = require('dox'),
    helpers = require('../../src/helpers'),
    chai = require('chai'),
    expect = chai.expect,
    should = chai.should();

describe('.hashDoc()', function () {

  var jsOutline = [];

  it('should return an empty object if arguments are invalid.', function () {
    var hash = helpers.hashDoc();
    expect(hash).to.be.empty;

    hash = helpers.hashDoc({});
    expect(hash).to.be.empty;

    hash = helpers.hashDoc({}, '');
    expect(hash).to.be.empty;

    hash = helpers.hashDoc({}, 'js');
    expect(hash).to.be.empty;

    hash = helpers.hashDoc({tags: 'foo'}, '');
    expect(hash).to.be.empty;
  });

  it('should create a hash object from a given JS file', function () { //TODO must test for html/css/sass/markdown
    var jsContents = dox.parseComments(fs.readFileSync(path.resolve('test/resources/Sample.js'), "utf8").toString());
    return _.each(jsContents, function (metaData) {
      jsOutline.push(helpers.hashDoc(metaData, "js"));
    }), expect(jsOutline).to.not.be.empty;
  });

  it('jsOutline should contain a tag property', function () {
    _.each(jsOutline, function (outline) {
      expect(outline.tags).to.be.defined;
    });
  });

  it('jsOutline should contain a isPrivate property', function () {
    _.each(jsOutline, function (outline) {
      expect(outline.isPrivate).to.be.defined;
    });
  });

  it('jsOutline should contain a ignore property', function () {
    _.each(jsOutline, function (outline) {
      expect(outline.ignore).to.be.defined;
    });
  });

  it('jsOutline should contain a code property', function () {
    _.each(jsOutline, function (outline) {
      expect(outline.code).to.be.defined;
    });
  });

  it('jsOutline should contain a description property', function () {
    _.each(jsOutline, function (outline) {
      expect(outline.description).to.be.defined;
    });
  });

  it('jsOutline should contain a description.full property', function () {
    _.each(jsOutline, function (outline) {
      expect(outline.description.full).to.be.defined;
    });
  });

  it('jsOutline should contain a description.summary property', function () {
    _.each(jsOutline, function (outline) {
      expect(outline.description.summary).to.be.defined;
    });
  });

  it('jsOutline should contain a description.body property', function () {
    _.each(jsOutline, function (outline) {
      expect(outline.description.body).to.be.defined;
    });
  });

  it('jsOutline should contain a ctx property', function () {
    _.each(jsOutline, function (outline) {
      expect(outline.ctx).to.be.defined;
    });
  });
});