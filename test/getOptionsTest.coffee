path = require 'path'
fs = require 'fs'
helpers = require '../src/helpers'
chai = require 'chai'
expect = chai.expect
should = chai.should()

describe 'getOptions', ->

  it 'should not return an root path', ->
    options = helpers.getOptions()
    expect(options.dir).to.be.undefined

  it 'should not return an output path', ->
    options = helpers.getOptions()
    expect(options.output).to.be.undefined
  
  it 'should not return a src path', ->
    options = helpers.getOptions()
    expect(options.src).to.be.undefined

  it 'should not return a template path', ->
    options = helpers.getOptions()
    expect(options.template).to.be.undefined
  
  it 'should not return a speclets path', ->
    options = helpers.getOptions()
    expect(options.specs).to.be.undefined

  it 'should return an root path when supplying an root option', ->
    root = './'
    process.argv = [
      'node'
      'speil.js'
      '-r='+root
    ]
    options = helpers.getOptions()
    expect(options.root).to.exist
    expect(options.root).to.eql path.resolve(root)

  it 'should return an output path when supplying an output option', ->
    output = './docs'
    process.argv = [
      'node'
      'speil.js'
      '-o='+output
    ]
    options = helpers.getOptions()
    expect(options.output).to.exist
    expect(options.output).to.eql path.resolve(output)

  it 'should resolve and return a src path when supplying a src option', ->
    src = './src'
    process.argv = [
      'node'
      'speil.js'
      '-sr='+src
    ]
    options = helpers.getOptions()
    expect(options.src).to.exist
    fs.exists options.src, (exists) ->
      expect(exists).to.be.true

  it 'should resolve and return a speclet path when supplying a spec option', ->
    specs = './speclets'
    process.argv = [
      'node'
      'speil.js'
      '-sp='+specs
    ]
    options = helpers.getOptions()
    expect(options.specs).to.exist
    fs.exists options.specs, (exists) ->
      expect(exists).to.be.true

  it 'should resolve and return a template path when supplying a template option', ->
    template = '/Users/agreco/Development/spiel/template'
    process.argv = [
      'node'
      'speil.js'
      '-t='+template
    ]
    options = helpers.getOptions()
    expect(options.template).to.exist
    fs.exists options.template, (exists) ->
      expect(exists).to.be.true