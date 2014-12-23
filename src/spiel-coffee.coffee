#!/usr/bin/env node

path = require 'path'
fs = require 'fs'
markdown = require('github-flavored-markdown').parse
helpers = require './helpers'

options = helpers.getOptions()
files = []
srcFiles = []
specFiles = []
headersObj = {}
linkedFiles = []
out = null

unless options?
  throw new Error 'speil -> Missing options argument'

unless options.root?
  throw new Error 'speil -> Missing options.root argument'

unless options.output?
  throw new Error 'speil -> Missing options.output argument'

options.root = helpers.setRootPath options.root

fs.mkdirSync(options.output, 511) if !fs.existsSync(options.output)

files = helpers.processJsDoc helpers.processFiles options.root
headersObj = helpers.parseHeaders files, 'h1'
linkedFiles =  helpers.fileLinker files, headersObj.headers, options.root
linkedFiles.push({
  name: "_index.html"
  outline: helpers.indexLinker headersObj.headers, options.output
})

helpers.processTemplate options, ['css', 'js', 'imgs']

template = fs.readFileSync(options.template+'/index.html', "utf8").toString()

linkedFiles.forEach (file) ->
  fs.writeFileSync path.join(options.output, file.name), helpers.renderTemplate(file, template), 'utf8'