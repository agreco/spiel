path = require 'path'
fs = require 'fs'
dox = require '../lib/dox'
helpers = require '../src/helpers'
chai = require 'chai'
expect = chai.expect
should = chai.should()
assert = chai.assert

describe 'importTemplateResources', ->

  it 'should throw when the first argument is missing', ->
    expect(-> helpers.importTemplateResources()).to.throw('helpers.importTemplateResources -> Missing argument [options]')