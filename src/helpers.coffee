path = require 'path'
fs = require 'fs'
nopt = require 'nopt'
markdown = require('github-flavored-markdown').parse
dox =  require '../lib/dox'
defaultTemplatePath = '../template/default'
rootPath = ''

regex = {
  vcs: /^\.(git|svn|cvs|hg|bzr|idea|nbprojects)$/
  externalLink: /(\<a)\s+(href="(?:http[s]?|mailto|ftp))/g
  externalClassName: '$1 class="external" $2'
  heading: /<h1>([^<]*).?<\/h1>/g
  openHeading: /<h1[^>]*.?>/
  closeHeading: /<\/h1[^>]*.?>/
  whitelist: /\.(js|css|htm(l)|markdown|md|md(own))$/
  header: (header) -> return '(<'+ header + '>([^<]*).?<\\/' + header + '>)'
  externalAnchor: /<h1><a href="[^#>]*#/g
  localAnchor: /<h1><a href="#/g
  achorNamed: '<h1><a name="'
}

templates = {
  jsDoc: (name, tags, outline) ->
    return """
      <div class="api_snippet">
      <div class="jsdoc">
      <h2>#{name}</h2>
      #{tags}
      </div>
      <pre class="prettyprint source-code">
      <code>
      #{outline.code}
      </code>
      </pre>
      </div>\n
    """
  headers: (clonedHeader, keyword) ->
     return """
      <li><a href="#{clonedHeader}##{keyword}">#{keyword}</a></li>
    """
  linkedHeader: (header, text) ->
    return """
      <h1><a href="#{header}##{text}">#{text}</a></h1>
    """
}

getOptions = ->
  opts = {
    root:path
    output: path
    specs: path
    src: path
    template: path
  }

  shortHands = {
    r: ["--root"]
    o: ["--output"]
    sp: ["--specs"]
    sr: ["--src"]
    t: ["--template"]
  }

  return nopt(opts, shortHands, process.argv)

ignoreVcs = (pathName) ->
  throw new Error 'helpers.ignoreVcs -> Missing argument [pathName]' unless pathName
  return !path.basename(pathName).match(regex.vcs)

getFiles = (pathName) ->
  throw new Error 'helpers.getFiles -> Missing argument [pathName]' unless pathName

  collection = []
  pathName = [pathName] if pathName not instanceof Array
  pathName = pathName.filter ignoreVcs
  pathName.forEach (file) ->
    if fs.statSync(file).isDirectory()
      newfiles = fs.readdirSync(file).map (f) ->
        return path.join file, f
      collection = collection.concat getFiles newfiles
    else collection.push file

  return collection

catPath = (file, delimiter) ->
  throw new Error 'helpers.catPath -> Missing argument [file]' unless file
  throw new Error 'helpers.catPath -> Missing argument [delimiter]' unless delimiter

  file = file.replace(rootPath, '') if file.match rootPath
  delimiter = delimiter or '_'
  pathArr = file.split "/"
  pathArr = pathArr.map (index) -> return index.replace /^\.+/g, ""
  pathArr = pathArr.filter (index) -> return index isnt ""

  return file = pathArr.join(delimiter) + ".html"

cleanseFiles = (files) ->
  throw new Error 'helpers.cleanseFiles -> Missing argument [files]' unless files

  fileArray = []
  for file, i in files
    if file and file.match(regex.whitelist)
      fileArray.push(file)

  return fileArray

hashDoc = (outline, fileType) ->
  throw new Error 'helpers.hashDoc -> Missing argument [outline]' unless outline
  throw new Error 'helpers.hashDoc -> Missing argument [fileType]' unless fileType

  switch fileType
    when 'js'
      hash = {
        tags          : outline.tags
        isPrivate     : outline.isPrivate
        ignore        : outline.ignore
        code          : outline.code
        description   : outline.description
        summary       : outline.description.summary
        body          : outline.description.body
        ctx           : outline.ctx
      }

  return hash

buildFileObjects = (files) ->
  throw new Error 'helpers.buildFileObjects -> Missing argument [files]' unless files

  return files = files.map (file) -> # Read files
    content = fs.readFileSync(file, "utf8").toString()
    outline = []

    if file.match /\.(js)$/ # JS files TODO build extened file object from the content array
      content = dox.parseComments content
      outline.push hashDoc item, "js" for item in content

    else if file.match /\.(markdown|md|md(own))$/ # Markdown files
      content = markdown content
      outline = content if content

    else if file.match /\.(sass)$/ # SaSS CSS files
      content = dox.parseComments content
      outline.push hashDoc item, "sass" for item in content

    return {
      path: file
      name: catPath file, '.'
      outline: outline
    }

parseHeaders = (files, header) ->
  throw new Error 'helpers.parseHeaders -> Missing argument [files]' unless files

  header = 'h1' unless header
  headers = {}
  headerLinks = {}
  headerRegex = new RegExp regex.header(header), 'g'

  for file in files
    ah = [] # accumulated headers
    if file.outline
      if file.outline instanceof Array
        for outline in file.outline
          ah.push headings[1] while headings = headerRegex.exec(outline.description.full)
      else
        ah.push headings[1] while headings = headerRegex.exec(file.outline)

    ah.forEach (h) -> headers[h] = file.name if file?.name
    headerLinks[file.name] = ah

  return {
    headers : headers
    headerLinks : headerLinks
  }

lowerCaseSort = (a,b) ->
    if typeof a isnt "string" or typeof b isnt "string" then out = 0
    else out = a.toLocaleLowerCase().localeCompare(b.toLocaleLowerCase());
    return out

indexLinker = (headings, outputdir) ->
  throw new Error 'helpers.indexLinker -> Missing argument [headings]' unless headings

  clonedHeaders = {}
  keywords = {}
  keywordLetters = {}

  for heading of headings
    h = heading.replace(regex.heading, '$1')
    clonedHeaders[h] = headings[heading]

  keywords = Object.keys(clonedHeaders).sort(lowerCaseSort)

  formatter = (keyword) ->
    if outputdir
      return templates.headers(clonedHeaders[keyword], keyword)
    else
      return templates.headers('', keyword)

  keywords.forEach (keyword) ->
    letter = keyword.toLocaleUpperCase().substring(0,1)
    if typeof keywordLetters[letter] is "undefined"
      keywordLetters[letter] = [formatter(keyword)]
    else
      (keywordLetters[letter]).push(formatter(keyword))

  keywordsMarked = Object.keys(keywordLetters)

  keywordsMarked = keywordsMarked.map (letter) ->
    listOut =  '<h2>' + letter + '</h2>' + '\n'
    listOut += '<ul>\n' + (keywordLetters[letter]).join("\n") + '\n</ul>'
    return listOut

  return '<h1>Index</h1>\n<div id="index">\n' + keywordsMarked.join("\n") + '\n</div>'

fileLinker = (files, headers, output) ->
  throw new Error 'helpers.fileLinker -> Missing argument [files]' unless files
  throw new Error 'helpers.fileLinker -> Missing argument [headers]' unless headers

  keywords = Object.keys(headers).sort().reverse().map (kw) -> return kw.replace regex.heading, '$1'

  return files if not keywords.length

  re = new RegExp regex.openHeading.source + '(' + keywords.join("|") + ')' + regex.closeHeading.source, 'g'

  for file in files
    if file?.outline instanceof Array
      for outline in file.outline
        if outline.description?.full
          input = String(outline.description.full).replace regex.externalLink, regex.externalClassName
          if output then input = input.replace(re, (header, match) ->
              return templates.linkedHeader headers[header], match
            ).replace regex.externalAnchor, regex.achorNamed
          else
            input = input.replace(re, (header, match) ->
              return templates.linkedHeader '', match
            ).replace regex.localAnchor, regex.achorNamed
          outline.description.full = input

  return files

renderTemplate = (file, template) ->
  throw new Error 'helpers.renderTemplate -> Missing argument [file]' unless file
  throw new Error 'helpers.renderTemplate -> Missing argument [template]' unless template

  outline = file.outline
  template = template.replace /\$summary/g, outline[0].summary if outline[0]?.summary?
  template = template.replace /\$body/g, outline[0].body if outline[0]?.body?

  api = ''
  if outline?
    for outlineObj in outline
      api += outlineObj.code if outlineObj? and outlineObj.code?
    template = template.replace /\$api/g, '<div id="api">' + api + "</div>"
  else template = template.replace /\$api/g, ""

  return template

importTemplateResources = (options, resource) ->
  throw new Error 'helpers.importTemplateResources -> Missing argument [options]' unless options
  throw new Error 'helpers.importTemplateResources -> Missing argument property [options.output]' unless options.output
  throw new Error 'helpers.importTemplateResources -> Missing argument [resource]' unless resource

  options.template = path.resolve(__dirname, defaultTemplatePath) if !options.template?
  encoding = 'utf8'
  resourceOutputPath = options.output.concat('/' + resource)

  if not fs.existsSync(resourceOutputPath) then fs.mkdirSync(resourceOutputPath, 511)
  resources = getFiles(options.template + "/" + resource).filter (file) ->
    if resource.match(/(img(s)|image(s))/)
      resource = 'png|gif|jpeg'
      encoding = 'binary'
    return file.match(("\.("+resource+")$"))

  resources.forEach (file) ->
    newFile = resourceOutputPath.concat('/' + path.basename(file))
    fs.readFile file, (err, data) ->
      throw(err) if err
      fs.writeFile newFile, data, encoding, (err) ->
        throw(err) if err

formatJsDoc = (outline) ->
  throw new Error 'helpers.formatJsDoc -> Missing argument [outline]' unless outline

  tags = []
  for tag in outline.tags
    tagStr = ''
    tagStr += '<strong>@' + tag.type +  '</strong> ' if tag.type?
    tagStr += tag.types[0] + ' ' if tag.types?[0]?
    tagStr += tag.name + ' ' if tag.name?
    tagStr += tag.description + ' ' if tag.description?
    tagStr += tag.title + ' ' if tag.title?
    tagStr += tag.url + ' ' if tag.url?
    tagStr += tag.local + ' ' if tag.local?
    tags.push(tagStr)
  tags = tags.join('\n').trim()
  name = outline.ctx.name

  return templates.jsDoc name, tags, outline

setRootPath = (root) ->
  throw new Error 'helpers.setRootPath -> Missing argument [root]' unless root

  return rootPath = root.replace /\/?~\/+/, '/'

### CODE BELOW UNTESTED ###

processJsDoc = (files) ->
  throw new Error 'helpers.processJsDoc -> Missing argument [files]' unless files

  for file in files
    if file.outline?
      for outline in file.outline
        if outline.code? and outline.tags?
          outline.code = formatJsDoc(outline)

  return files

processFiles = (pathName) ->
  pathName = rootPath? unless pathName
  return buildFileObjects cleanseFiles getFiles pathName

processTemplate = (options, resources) ->
  for resource in resources
    importTemplateResources(options, resource)

toclinker = (toc, files, toc_regex) ->
  tocline = toc_regex || /(\S*).\s*{(.+)}/
  tocline_res = undefined
  h1stuff = parseHeaders(files)
  toclinked = []

  toc.forEach (line) ->
    if (headerses = tocline.exec(line)) isnt null
      line = toc_expander(h1stuff, tocline_res[1], tocline_res[2]);

  toclinked.push(line)

  return toclinked.join('\n')

toc_expander = (h1bag, indent, pathpart) ->
  files_to_h1s = h1bag.files_to_h1s
  matching_files = Object.keys(files_to_h1s)
  matching_h1s = [];

  matching_files = matching_files.filter (file) ->
    return file.indexOf(pathpart) #TODO AG needs thorough testing against dir structures!!

  matching_files.forEach (matching_file) ->
    matching_h1s = matching_h1s.concat(files_to_h1s[matching_file])

  matching_h1s = matching_h1s.sort(caseless_sort).map (matching_h1) ->
    return indent + '* ' + matching_h1;

  return matching_h1s.join("\n").replace(/_/g,"\\_")

exports.getOptions = getOptions
exports.hashDoc = hashDoc
exports.ignoreVcs = ignoreVcs
exports.getFiles = getFiles
exports.catPath = catPath
exports.cleanseFiles = cleanseFiles
exports.buildFileObjects = buildFileObjects
exports.parseHeaders = parseHeaders
exports.indexLinker = indexLinker
exports.fileLinker = fileLinker
exports.importTemplateResources = importTemplateResources
exports.formatJsDoc = formatJsDoc
exports.processJsDoc = processJsDoc
exports.renderTemplate = renderTemplate
exports.processFiles = processFiles
exports.processTemplate = processTemplate
exports.setRootPath = setRootPath