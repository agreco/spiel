path = require 'path'
fs = require 'fs'
dox = require '../lib/dox'
helpers = require '../src/helpers'
chai = require 'chai'
expect = chai.expect
should = chai.should()

describe 'buildFileObjects', ->

  it 'should throw when the first argument is missing', ->
    expect(-> helpers.buildFileObjects()).to.throw('helpers.buildFileObjects -> Missing argument [files]')
  
  it 'should return a files array', ->
    dir = ['./']
    files = helpers.getFiles dir
    files = helpers.buildFileObjects(files)
    expect(files).to.be.array
    expect(files).to.not.be.empty