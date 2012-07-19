path = require 'path'
fs = require 'fs'
helpers = require '../src/helpers'
chai = require 'chai'
expect = chai.expect
should = chai.should()

describe 'getFiles', ->

  it 'should return an array of files from a given directory', ->
    dir = path.resolve('    ./')
    files = helpers.getFiles dir
    console.log(files)