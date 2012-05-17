#!/usr/bin/env node

path = require('path')
fs = require('fs')
markdown = require('github-flavored-markdown').parse
dtils = require('../lib/docco')
dox = require('../lib/dox')
defaultTemplatePath = '../template/default'
options
files
h1stuff
linked_files
index
template
out

(() ->
  options = dtils.getOpts({})
  files = []

  if options.dir
    destination = options.dir + '/src/'
    if options.dir isnt destination then files.push(options.dir) else files.push(destination)
    files = dtils.flatten_files(files)
  else
    throw("Error! Directory to document not specified.")

  if not options.specs
    options.specs = options.dir + '/speclets/'

  specs = dtils.flatten_files([options.specs])

  specs.forEach (spec) ->
    files.push(spec)
    return

  files = files.filter (file) -> file.match(/\.(js|css|htm(l)?|md|md(own)?|markdown|sass)$/)

  fileAudit = {
    total     :files.length
    js        :0
    markdown  :0
    sass      :0
  }

  files = files.map (file) -> # read files
    content = fs.readFileSync(file, "utf8").toString()
    description = null
    source = []

    if file.match(/\.(js)$/) # JS files
      fileAudit.js++
      content = dox.parseComments(content)

      if content and content[0] isnt undefined
        description = content[0].description.full

      content.forEach (item) ->
        source.push({
          tags      : item.tags
          isPrivate : item.isPrivate
          ignore    : item.ignore
          code      : item.code
          summary   : item.description.summary
          ctx       : item.ctx
        })
        return

    else if file.match(/\.(markdown|md|md(own))$/)  # Markdown files
      fileAudit.markdown++
      content =  markdown(content)
      description = content

    else if file.match(/\.(sass)$/)  # SaSS CSS files
      fileAudit.sass++

      content = dox.parseComments(content);

      description = content[0].description.full;

      content.forEach (item) ->
        source.push({
          code    :item.code
          summary :item.description.summary
        })
        return

    return {
      filepath: file,
      name: dtils.munge_filename(file),
      content: description,
      source: if source.length < 1 then null else source
    }

  fileAudit.parsed  = (fileAudit.js + fileAudit.markdown + fileAudit.sass)
  fileAudit.ignored = fileAudit.total - fileAudit.parsed

  files.forEach (file) ->
    if file.source isnt null
      file.source.forEach (source, j) ->
        if j is 0
          source.summary = null
        if source.isPrivate isnt undefined and source.isPrivate is false and source.code isnt undefined
          if source.tags.length
            source.code = [dtils.format_code(source)].join('\n')
    return

  h1stuff = dtils.h1finder(files)
  linked_files = dtils.autolink(files, h1stuff.h1s, options.output)
  index = dtils.indexer(h1stuff.h1s, options.output)

  if options.output # destination option is supplied.

    if !path.existsSync(options.output) # the destination dir doesn't exist, create it.
      fs.mkdirSync(options.output, 0777)

    if options.template is undefined
      options.template = path.resolve(__dirname, defaultTemplatePath)

    dtils.import_js(options);
    dtils.import_css(options);
    template = fs.readFileSync(options.template+'/index.html', "utf8").toString()

    ###
    if options.toc # toclink the incoming files
      toc = fs.readFileSync(options.toc, "utf8").toString().split("\n")
      marked_toc = markdown(dtils.toclinker(toc, files))
      files.push({
        name:"index",
        content: marked_toc
      })
    ###

    if options.index # add index
      linked_files.push({
        name:"_index.html"
        content:index
        source:null
      })

    linked_files.forEach (linked_file) ->
      api = null

      if linked_file.source isnt null
        api = linked_file.source

      out = dtils.template_render(linked_file.content, api, linked_file.filepath, template);

      fs.writeFileSync(path.join(options.output, linked_file.name), out, 'utf8');

      return

  # File Audit Output
  console.log('File Audit');
  console.log('==========');
  console.dir(fileAudit);
  return

)()