path = require 'path'
fs = require 'fs'
dox = require '../lib/dox'
helpers = require '../src/helpers'
chai = require 'chai'
expect = chai.expect
should = chai.should()

describe 'hashDoc', ->

  jsOutline = []

  it 'should throw an error when first argument is missing', ->
    fn = -> helpers.hashDoc()
    expect(fn).to.throw('helpers.hashDoc -> Missing argument [outline]')

  it 'should throw an error when second argument is missing', ->
    fn = -> helpers.hashDoc({})
    expect(fn).to.throw('helpers.hashDoc -> Missing argument [fileType]')

  it 'should create a hash object from a given JS file', ->
    jsFile = 'test/resources/sample.js'

    jsContents = fs.readFileSync(path.resolve(jsFile), "utf8").toString()
    jsContents = dox.parseComments(jsContents)
    #TODO must test for html/css/sass/markdown
    jsOutline.push helpers.hashDoc item, "js" for item in jsContents
    expect(jsOutline).to.not.be.empty

  it 'jsOutline should contain a tag property', ->
    for outline in jsOutline
      expect(outline.tags).to.be.defined

  it 'jsOutline should contain a isPrivate property', ->
    for outline in jsOutline
      expect(outline.isPrivate).to.be.defined

  it 'jsOutline should contain a ignore property', ->
    for outline in jsOutline
      expect(outline.ignore).to.be.defined

  it 'jsOutline should contain a code property', ->
    for outline in jsOutline
      expect(outline.code).to.be.defined

  it 'jsOutline should contain a description property', ->
    for outline in jsOutline
      expect(outline.description).to.be.defined

  it 'jsOutline should contain a description.full property', ->
    for outline in jsOutline
      expect(outline.description.full).to.be.defined

  it 'jsOutline should contain a description.summary property', ->
    for outline in jsOutline
      expect(outline.description.summary).to.be.defined

  it 'jsOutline should contain a description.body property', ->
    for outline in jsOutline
      expect(outline.description.body).to.be.defined

  it 'jsOutline should contain a ctx property', ->
    for outline in jsOutline
      expect(outline.ctx).to.be.defined
