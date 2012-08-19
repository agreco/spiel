path = require 'path'
fs = require 'fs'
dox = require '../lib/dox'
helpers = require '../src/helpers'
chai = require 'chai'
expect = chai.expect
should = chai.should()
assert = chai.assert

describe 'fileLinker', ->

  files = undefined
  headersObj = undefined
  nameAnchorHeaderRegex = /<h1[^>]*.?><a[^>]*.?name="[^>]*.?>[^>]*.?<\/a><\/h1>/

  it 'should throw when the first argument is missing', ->
    expect(-> helpers.fileLinker()).to.throw('helpers.fileLinker -> Missing argument [files]')

  it 'should throw when the second argument is missing', ->
    expect(-> helpers.fileLinker(['./'])).to.throw('helpers.fileLinker -> Missing argument [headers]')

  it 'should return a string of html containing a name linked header', ->
    files = helpers.buildFileObjects helpers.cleanseFiles helpers.getFiles './test/resources'
    headersObj = helpers.parseHeaders files, 'h1'
    generatedLinkedFiles = helpers.fileLinker files, headersObj.headers, './test/resources'

    for file in generatedLinkedFiles
      for outline in file.outline
        expect(outline.description.full).to.match(nameAnchorHeaderRegex)