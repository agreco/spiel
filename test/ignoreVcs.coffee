path = require 'path'
fs = require 'fs'
helpers = require '../src/helpers'
chai = require 'chai'
expect = chai.expect
should = chai.should()

describe 'ignoreVcs', ->

  it 'should ignore vcs directories', ->
    dir = path.resolve('test/../')
    ignored = helpers.ignoreVcs dir
    ignored.should.be.true