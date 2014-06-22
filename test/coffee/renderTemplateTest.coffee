path = require 'path'
fs = require 'fs'
dox = require '../lib/dox'
helpers = require '../src/helpers'
chai = require 'chai'
expect = chai.expect
should = chai.should()

describe 'renderTemplate', ->

  it 'should throw an error when arguments are missing', ->
    expect(-> helpers.renderTemplate()).to.throw('helpers.renderTemplate -> Missing argument [file]')

  it 'should throw an error when the second argument is missing', ->
    expect(-> helpers.renderTemplate(1)).to.throw('helpers.renderTemplate -> Missing argument [template]')

  it 'should create the default template from a given document', ->
    jsOutline = []
    template = fs.readFileSync(path.resolve('template/default/index.html'), "utf8").toString()
    jsFile = 'test/resources/sample.js'
    fileName = path.basename(jsFile, '.js')
    output = 'test/resources/docs/'
    extension = '.html'
    encoding = 'utf8'
    doc = output + fileName + extension

    jsContents = dox.parseComments fs.readFileSync(path.resolve(jsFile), encoding).toString()

    for item in jsContents
      jsOutline.push helpers.hashDoc item, "js"
    renderedTemplate = helpers.renderTemplate({title: fileName, outline:jsOutline}, template)

    if not fs.existsSync(output)
      fs.mkdirSync(output)

    fs.writeFileSync(doc, renderedTemplate, encoding)

    expect(fs.existsSync(doc)).to.be.true

    expect(fs.readFileSync(doc, encoding)).to.eql(renderedTemplate)

    fs.unlinkSync(doc)
    fs.rmdirSync(output)
