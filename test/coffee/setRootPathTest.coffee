path = require 'path'
fs = require 'fs'
helpers = require '../src/helpers'
chai = require 'chai'
expect = chai.expect
should = chai.should()

describe 'setRootPath', ->

  it 'should throw if the first argument is missing', ->
    expect(-> helpers.setRootPath()).to.throw('helpers.setRootPath -> Missing argument [root]')
  
  it 'should process the home dir var ~, if one is present in the argument passed', ->
    root = helpers.setRootPath '~/Development/spiel/test/resources/'    
    expect(root).to.equal("/Development/spiel/test/resources/")

    root = helpers.setRootPath '/~/Development/speil'
    expect(root).to.equal("/Development/speil")