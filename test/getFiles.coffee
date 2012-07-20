path = require 'path'
fs = require 'fs'
helpers = require '../src/helpers'
chai = require 'chai'
expect = chai.expect
should = chai.should()

describe 'getFiles', ->

  it 'should throw when invoking with no parameters', ->
    fn = -> helpers.getFiles()
    expect(helpers.getFiles).to.throw(Error)

  it 'should throw when invoking with a parameter other than an array', ->
    fn = -> helpers.getFiles('./')
    expect(fn).to.throw(Error)

  it 'should return and resolve a deep array of files from a given directory', ->
    dir = ['./']
    files = helpers.getFiles dir
    expect(files).to.be.defined
    for file, i in files
      fs.exists file, (exists) ->
        expect(exists).to.be.true