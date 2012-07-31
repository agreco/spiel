path = require 'path'
childProcess = require 'child_process'
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

  it 'should throw when the output property of the first argument is missing', ->
    expect(-> helpers.importTemplateResources({})).to.throw('helpers.importTemplateResources -> Missing argument property [options.output]')

  it 'should throw when the first second is missing', ->
    expect(-> helpers.importTemplateResources({output:'./'})).to.throw('helpers.importTemplateResources -> Missing argument [resource]')

  it 'should import css template resources into the output directory', ->
    outputDir = 'test/resources'
    cssDir = outputDir + '/css'

    helpers.importTemplateResources {output:outputDir}, 'css'
      
    expect(fs.existsSync(cssDir)).to.be.true

    cssFiles = helpers.getFiles cssDir
    
    for file in cssFiles
      expect(path.extname(file)).to.equal('.css')
    
    childProcess.exec("rm -r " + cssDir)

  it 'should import js template resources into the output directory', ->
    outputDir = 'test/resources'
    jsDir = outputDir + '/js'

    helpers.importTemplateResources {output:outputDir}, 'js'
    
    expect(fs.existsSync(jsDir)).to.be.true

    jsFiles = helpers.getFiles jsDir
    
    for file in jsFiles
      expect(path.extname(file)).to.equal('.js')
    
    childProcess.exec("rm -r " + jsDir)

  it 'should import image template resources into the output directory', ->
    outputDir = 'test/resources'
    imgsDir = outputDir + '/imgs'

    helpers.importTemplateResources {output:outputDir}, 'imgs'

    fs.exists imgsDir, (exists) ->
      expect(exists).to.be.true

    childProcess.exec("rm -r " + imgsDir)