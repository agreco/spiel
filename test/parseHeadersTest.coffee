path = require 'path'
fs = require 'fs'
dox = require '../lib/dox'
helpers = require '../src/helpers'
chai = require 'chai'
expect = chai.expect
should = chai.should()
assert = chai.assert

describe 'parseHeaders', ->

  files = undefined
  headersObj = undefined

  it 'should throw when the first argument is missing', ->
    expect(-> helpers.parseHeaders()).to.throw('helpers.parseHeaders -> Missing argument [files]')

  it 'should return a headers object containing header objects', ->
    files = helpers.buildFileObjects helpers.cleanseFiles helpers.getFiles './'
    headersObj = helpers.parseHeaders(files, 'h1')

    assert.isObject(headersObj)
    expect(headersObj).to.not.be.empty

  it 'should return a headers property in headersObj', ->
    expect(headersObj.headers).to.be.defined
    expect(headersObj.headers).to.not.be.empty
  
  it 'should return a headerLinks property in headersObj', ->
    expect(headersObj.headerLinks).to.be.defined
    expect(headersObj.headerLinks).to.not.be.empty