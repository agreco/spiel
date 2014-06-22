path = require 'path'
fs = require 'fs'
helpers = require '../src/helpers'
chai = require 'chai'
expect = chai.expect
should = chai.should()

describe 'ignoreVcs', ->

  it 'should throw an error when the argument is missing', ->
    fn = -> helpers.ignoreVcs()
    expect(fn).to.throw('helpers.ignoreVcs -> Missing argument [pathName]')

  it 'should ignore vcs directories', ->
    dir = path.resolve('test/../')
    ignored = helpers.ignoreVcs dir
    ignored.should.be.true