path = require 'path'
fs = require 'fs'
dox = require '../lib/dox'
helpers = require '../src/helpers'
chai = require 'chai'
expect = chai.expect
should = chai.should()

describe 'renderTemplate', ->

  jsOutline = []
  template = fs.readFileSync(path.resolve('template/default/index.html'), "utf8").toString()

  it 'should throw an error when arguments are missing', ->
    fn = -> helpers.renderTemplate()
    expect(fn).to.throw('helpers.renderTemplate -> Missing argument [input]')

  it 'should throw an error when the second argument is missing', ->
    fn = -> helpers.renderTemplate(1)
    expect(fn).to.throw('helpers.renderTemplate -> Missing argument [template]')

  it 'should render the default template from a given document', ->
    jsFile = 'test/resources/sample.js'
    title = path.basename(jsFile, '.js')
    jsContents = dox.parseComments fs.readFileSync(path.resolve(jsFile), "utf8").toString()

    for item in jsContents
      jsOutline.push helpers.hashDoc item, "js"
    renderedTemplate = helpers.renderTemplate({title: title, outline:jsOutline}, template)
    fs.writeFileSync('template/default/' + path.basename(jsFile, '.js') + '.html', renderedTemplate, 'utf8')
