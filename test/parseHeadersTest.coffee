path = require 'path'
fs = require 'fs'
dox = require '../lib/dox'
helpers = require '../src/helpers'
chai = require 'chai'
expect = chai.expect
should = chai.should()

describe 'parseHeaders', ->

  it 'should throw when the first argument is missing', ->
    expect(-> helpers.parseHeaders()).to.throw('helpers.parseHeaders -> Missing argument [files]')
  
  it 'should throw when the second argument is missing', ->
    dir = ['./']
    files = helpers.getFiles(dir)
    expect(-> helpers.parseHeaders(files)).to.throw('helpers.parseHeaders -> Missing argument [header]')

  it 'just works', ->
    jsOutline = []
    jsFile = './test/resources/Sample.js'
    jsContents = dox.parseComments(fs.readFileSync(path.resolve(jsFile), "utf8").toString())
    jsOutline.push helpers.hashDoc item, "js" for item in jsContents
    h1 = helpers.parseHeaders(jsOutline, 'h1')
    
    expect(h1.headers).to.be.defined
    #expect(h1.headers).to.not.be.empty