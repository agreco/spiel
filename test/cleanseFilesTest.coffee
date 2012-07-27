path = require 'path'
fs = require 'fs'
dox = require '../lib/dox'
helpers = require '../src/helpers'
chai = require 'chai'
expect = chai.expect
should = chai.should()

describe 'cleanseFiles', ->

  it 'should throw when the argument is missing', ->
    expect(-> helpers.cleanseFiles()).to.throw('helpers.cleanseFiles -> Missing argument [files]')
  
  it 'should only return the files used for parsing html/css/js/markdown', ->
    dir = ['./']
    files = helpers.getFiles dir
    files = helpers.cleanseFiles(files)
    for file in files
      expect(/\.(js|css|htm(l)|markdown|md|md(own))$/.test(file)).to.be.true