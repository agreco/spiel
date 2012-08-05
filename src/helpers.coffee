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
}

templates = {
  jsDoc: (summary, tags, source) ->
    return """
      <div class="api_snippet">
      <div class="jsdoc">
      #{summary}
      #{tags}
      </div>
      <pre class="prettyprint source-code">
      <code>
      #{source.code}
      </code>
      </pre>
      </div>\n
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
  unless pathName
    throw new Error 'helpers.ignoreVcs -> Missing argument [pathName]'

  return !path.basename(pathName).match(regex.vcs)

getFiles = (pathName) ->
  unless pathName
    throw new Error 'helpers.getFiles -> Missing argument [pathName]'

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
  unless file 
    throw new Error 'helpers.catPath -> Missing argument [file]'

  unless delimiter
    throw new Error 'helpers.catPath -> Missing argument [delimiter]'
  
  file = file.replace(rootPath, '') if file.match rootPath
  
  delimiter = delimiter or '_'

  pathArr = file.split "/"
  pathArr = pathArr.map (index) -> return index.replace /^\.+/g, ""
  pathArr = pathArr.filter (index) -> return index isnt ""

  return file = pathArr.join(delimiter) + ".html"

cleanseFiles = (files) ->
  unless files
    throw new Error 'helpers.cleanseFiles -> Missing argument [files]'
  
  fileArray = []
  
  for file, i in files
    if file and file.match(regex.whitelist)
      fileArray.push(file)

  return fileArray

hashDoc = (outline, fileType) ->
  unless outline
    throw new Error 'helpers.hashDoc -> Missing argument [outline]'

  unless fileType
    throw new Error 'helpers.hashDoc -> Missing argument [fileType]'

  hash = undefined

  switch fileType
    when 'js'
      hash = {
        tags          : outline.tags
        isPrivate     : outline.isPrivate
        ignore        : outline.ignore
        code          : outline.code
        description   : outline.description
        summary       : outline.description.summary
        ctx           : outline.ctx
      }

  return hash

buildFileObjects = (files) ->
  unless files
    throw new Error 'helpers.buildFileObjects -> Missing argument [files]'

  return files = files.map (file) -> # Read files
    content = fs.readFileSync(file, "utf8").toString()

    description = null
    source = []
    obj = {}

    if /\.(js)$/.test(file) # JS files
      content = dox.parseComments(content)
      #TODO build extened file object from the content array
      description = content?[0]?.description?.full?
      source.push hashDoc item, "js" for item in content
    
    else if file.match(/\.(markdown|md|md(own))$/) # Markdown files
      content = markdown(content)
      description = content if content 

    else if file.match(/\.(sass)$/) # SaSS CSS files
      content = dox.parseComments(content);
      description = content?[0]?.description?.full?
      source.push hashDoc item, "sass" for item in content

    return {
      path: file
      name: catPath(file, '.')
      desc: description
      src: if source.length < 1 then null else source
    }

parseHeaders = (files, header) ->
  unless files
    throw new Error 'helpers.parseHeaders -> Missing argument [files]'
  
  unless header
    header = 'h1'

  headers = {}
  headerLinks = {}
  headerRegex = new RegExp('(<'+ header + '>([^<]*).?<\\/' + header + '>)', 'g')
  
  files.forEach (fileObj) ->
    accumlatedHeaders = []
    headings = ""

    accumlatedHeaders.push headings[1] while (headings = headerRegex.exec(fileObj.desc)) isnt null

    accumlatedHeaders.forEach (h) -> headers[h] = fileObj.name

    headerLinks[fileObj.name] = accumlatedHeaders

  return {
    headers : headers
    headerLinks : headerLinks
  }

lowerCaseSort = (a,b) ->
    if typeof a isnt "string" or typeof b isnt "string"
      return 0
    return a.toLocaleLowerCase().localeCompare(b.toLocaleLowerCase());

indexLinker = (headings, outputdir) ->
  unless headings
    throw new Error 'helpers.indexLinker -> Missing argument [headings]'

  clonedHeaders = {}
  keywords = {}
  keywordLetters = {}
  
  for heading of headings
    h = heading.replace(regex.heading, '$1')
    clonedHeaders[h] = headings[heading]

  keywords = Object.keys(clonedHeaders).sort(lowerCaseSort)
  
  formatter = (keyword) ->
    if outputdir
      return '<li><a href="' + clonedHeaders[keyword] + '#' + keyword + '">' + keyword + '</a></li>'
    else
      return '<li><a href="#' + keyword + '">' + keyword + '</a></li>'

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
  unless files
    throw new Error 'helpers.fileLinker -> Missing argument [files]'

  unless headers
    throw new Error 'helpers.fileLinker -> Missing argument [headers]'

  keywords = Object.keys(headers).sort().reverse().map (kw) ->
    return kw.replace(regex.heading, '$1')

  if not keywords.length then return files

  re = new RegExp(regex.openHeading.source + '(' + keywords.join("|") + ')' + regex.closeHeading.source, 'g')

  for file in files
    input = String(file.desc)
    input = input.replace(regex.externalLink, regex.externalClassName);

    if output
      input = input.replace re, (header, text) ->
        return '<h1><a href="'+headers[header]+'#'+text+'">'+text+'<\/a></h1>'

      input = input.replace(/<h1><a href="[^#>]*#/g,'<h1><a name="')

    else
      input = input.replace re, (header, match) ->
        return '<h1><a href="' + '#' + match + '">' + match + '<\/a></h1>'

      input = input.replace(/<h1><a href="#/g,'<h1><a name="')

    file.desc = input

  return files

renderTemplate = (input, template) ->
  unless input
    throw new Error 'helpers.renderTemplate -> Missing argument [input]'

  unless template
    throw new Error 'helpers.renderTemplate -> Missing argument [template]'

  api = ''
  
  if input.src?
    for inputObj in input.src
      api += inputObj.code if inputObj? and inputObj.code?
    template = template.replace /\$api/g, '<div id="api">' + api + "</div>"
  else 
    template = template.replace /\$api/g, ""

  return template = template.replace /\$title/g, input.name

importTemplateResources = (options, resource) ->
  unless options
    throw new Error 'helpers.importTemplateResources -> Missing argument [options]'

  unless options.output
    throw new Error 'helpers.importTemplateResources -> Missing argument property [options.output]'

  unless resource
    throw new Error 'helpers.importTemplateResources -> Missing argument [resource]'

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

formatJsDoc = (source) ->
  unless source
    throw new Error 'helpers.formatJsDoc -> Missing argument [source]'

  tags = []

  for tag in source.tags
    tagStr = ''
    tagStr += '<strong>@' + tag['type'] +  '</strong> '  if tag['type']?
    tagStr += tag['types'][0] + ' ' if tag['types']? and tag['types'][0]?
    tagStr += tag['name'] + ' ' if tag['name']?
    tagStr += tag['description'] + ' ' if tag['description']?
    tagStr += tag['title'] + ' ' if tag['title']?
    tagStr += tag['url'] + ' ' if tag['url']?
    tagStr += tag['local'] + ' ' if tag['local']?
    tags.push(tagStr)

  tags = tags.join('\n').trim()
  summary = source.summary ? source.summary + '\n' : ''
  
  return templates.jsDoc summary, tags, source

setRootPath = (root) ->
  unless root
    throw new Error 'helpers.setRootPath -> Missing argument [root]'
  rootPath = root.replace /\/?~\/+/, '/'
  return rootPath

### CODE BELOW UNTESTED ###

processJsDoc = (files) ->
  unless files
    throw new Error 'helpers.processJsDoc -> Missing argument [files]'

  for file in files
    if file.src?
      for src in file.src
        if src.code? and src.tags?
          src.code = formatJsDoc(src)

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