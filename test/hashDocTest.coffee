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
    jsOutline.push helpers.hashDoc item, "js" for item in jsContents
    expect(jsOutline).to.not.be.empty

  it 'should return a tag property', ->
    for outline, i in jsOutline
      expect(outline.tags).to.exist

  it 'should return a isPrivate property', ->
    for outline, i in jsOutline
      expect(outline.isPrivate).to.exist

  it 'should return a ignore property', ->
    for outline, i in jsOutline
      expect(outline.ignore).to.exist

  it 'should return a code property', ->
    for outline, i in jsOutline
      expect(outline.code).to.exist

  it 'should return a description property', ->
    for outline, i in jsOutline
      expect(outline.description).to.exist

  it 'should return a description.full property', ->
    for outline, i in jsOutline
      expect(outline.description.full).to.exist

  it 'should return a description.summary property', ->
    for outline, i in jsOutline
      expect(outline.description.summary).to.exist

  it 'should return a description.body property', ->
    for outline, i in jsOutline
      expect(outline.description.body).to.exist

  it 'should return a ctx property', ->
    for outline, i in jsOutline
      expect(outline.ctx).to.exist
