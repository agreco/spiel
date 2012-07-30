path = require 'path'
fs = require 'fs'
dox = require '../lib/dox'
helpers = require '../src/helpers'
chai = require 'chai'
expect = chai.expect
should = chai.should()
assert = chai.assert

describe 'buildFileObjects', ->

  files = []

  it 'should throw when the argument is missing', ->
    expect(-> helpers.buildFileObjects()).to.throw('helpers.buildFileObjects -> Missing argument [files]')
  
  it 'should return a files array containing file objects', ->
    files = helpers.buildFileObjects helpers.cleanseFiles helpers.getFiles './'

    assert.isArray(files)
    expect(files).to.not.be.empty

  it 'should contain a path property in fileObj', ->
    for fileObj in files
      expect(fileObj.path).to.defined

  it 'should contain a name property in fileObj', ->
    for fileObj in files
      expect(fileObj.name).to.defined

  it 'should contain a desc property in fileObj', ->
    for fileObj in files
      expect(fileObj.desc).to.defined

  it 'should contain a src property in fileObj', ->
    for fileObj in files
      expect(fileObj.src).to.be.defined