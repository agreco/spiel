path = require 'path'
fs = require 'fs'
helpers = require '../src/helpers'
chai = require 'chai'
expect = chai.expect
should = chai.should()

describe 'catPath', ->

  it 'should throw if the first argument is missing', ->
    expect(-> helpers.catPath()).to.throw('helpers.catPath -> Missing argument [file]')
  
  it 'should throw if the second argument is missing', ->
    expect(-> helpers.catPath([])).to.throw('helpers.catPath -> Missing argument [delimiter]')
