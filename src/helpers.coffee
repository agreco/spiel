path = require 'path'
fs = require 'fs'
nopt = require 'nopt'
markdown = require('github-flavored-markdown').parse
dox =  require '../lib/dox'

regex = {
  vcs: /^\.(git|svn|cvs|hg|bzr|idea|nbprojects)$/
  externalLink: /(\<a)\s+(href="(?:http[s]?|mailto|ftp))/g
  externalClassName: '$1 class="external" $2'
  heading: /<h1>([^<]*).?<\/h1>/g
  openHeading: /<h1[^>]*.?>/
  closeHeading: /<\/h1[^>]*.?>/
}

getOptions = ->
  opts = {
    output: path
    template: path
    specs: path
    dir: path
  }

  shortHands = {
    o: ["--output"]
    d: ["--dir"]
    s: ["--specs"]
    t: ["--template"]
  }

  return nopt(opts, shortHands, process.argv)

hashDoc = (outline, fileType) ->
  unless outline
    throw new Error('helpers.hashDoc -> Missing argument [outline]')

  unless fileType
    throw new Error('helpers.hashDoc -> Missing argument [fileType]')

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

ignoreVcs = (pathName) ->
  unless pathName
    throw new Error('helpers.ignoreVcs -> Missing argument [pathName]')

  return !path.basename(pathName).match(regex.vcs)

getFiles = (pathName) ->
  unless pathName
    throw new Error('helpers.getFiles -> Missing argument [pathName]')

  stat = undefined
  collection = []

  if pathName not instanceof Array
    pathName = [pathName] 

  pathName = pathName.filter(ignoreVcs)

  pathName.forEach (file) ->
    stat = fs.statSync(file)
    if stat.isDirectory()
      newfiles = fs.readdirSync(file).map (f) ->
        return path.join(file, f);
      collection = collection.concat(getFiles(newfiles))
    else collection.push(file)

  return collection

renderTemplate = (input, template) ->
  unless input
    throw new Error('helpers.renderTemplate -> Missing argument [input]')

  unless template
    throw new Error('helpers.renderTemplate -> Missing argument [template]')

  _api = ''

  if input.outline
    for inputObj, i in input.outline
      if inputObj and inputObj.isPrivate is false and inputObj.code
        _api += inputObj.code
    template = template.replace(/\$api/g, '<div id="api">' + _api + "</div>");

  else template = template.replace(/\$api/g, "")

  return template = template.replace(/\$title/g, input.title);

catPath = (file, delimiter) ->
  unless file 
    throw new Error('helpers.catPath -> Missing argument [file]')

  unless delimiter
    throw new Error('helpers.catPath -> Missing argument [delimiter]')
  
  delimiter = delimiter or '_'

  pathArr = file.split "/"

  pathArr = pathArr.map (index) ->
    return index.replace /^\.+/g, ""
  
  pathArr = pathArr.filter (index) ->
    return index isnt ""

  return file = pathArr.join(delimiter) + ".html"

cleanseFiles = (files) ->
  unless files
    throw new Error('helpers.cleanseFiles -> Missing argument [files]')
  
  fileArray = []
  
  for file, i in files
    if file and file.match(/\.(js|css|htm(l)|markdown|md|md(own))$/)
      fileArray.push(file)

  return fileArray

buildFileObjects = (files) ->
  unless files
    throw new Error('helpers.buildFileObjects -> Missing argument [files]')

  return files = files.map (file) -> # Read files
    content = fs.readFileSync(file, "utf8").toString()

    description = null
    source = []
    obj = {}

    if /\.(js)$/.test(file) # JS files
      content = dox.parseComments(content)
      #TODO build extened file object from the content array
      description = content[0].description.full if content and content[0]
      source.push hashDoc item, "js" for item in content
    
    else if file.match(/\.(markdown|md|md(own))$/) # Markdown files
      content = markdown(content)
      description = content if content 

    else if file.match(/\.(sass)$/) # SaSS CSS files
      content = dox.parseComments(content);
      description = content[0].description.full if content and content[0]
      source.push hashDoc item, "sass" for item in content

    return {
      path: file
      name: catPath(file, '.')
      desc: description
      src: if source.length < 1 then null else source
    }

parseHeaders = (files, header) ->
  unless files
    throw new Error('helpers.parseHeaders -> Missing argument [files]')
  
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
    throw new Error('helpers.indexLinker -> Missing argument [headings]')

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
    throw new Error('helpers.fileLinker -> Missing argument [files]')

  unless headers
    throw new Error('helpers.fileLinker -> Missing argument [headers]')

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

importTemplateResources = (options, resource) ->
  unless options
    throw new Error('helpers.importTemplateResources -> Missing argument [options]')

  unless options.output
    throw new Error('helpers.importTemplateResources -> Missing argument property [options.output]')  

  unless resource
    throw new Error('helpers.importTemplateResources -> Missing argument [resource]')

  if not options.template then options.template = 'template/default'

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

formatCode = (source) ->
  i = undefined
  len = undefined
  _tag = undefined
  tag = ''
  tags = source.tags
  _tags = []
  method = ''
  code = source.code

  for i in tags #TODO AG not happy about this. Need to refactor.
    _tag = tags[i];
    if _tag['method'] then method = _tag['method']

    tag = ((_tag['type'] != undefined && _tag['type'] != 'method') ? '<strong>@' + _tag['type'] + '</strong> ' : '') +
      (_tag['types'] != undefined && _tag['types'][0] != undefined ? _tag['types'][0] + ' ' : '')+
      (_tag['name'] != undefined ? _tag['name'] + ' ' : '') +
      (_tag['description'] != undefined ? _tag['description'] + ' ' : '') +
      (_tag['title'] != undefined ? _tag['title'] + ' ' : '') +
      (_tag['url'] != undefined ? _tag['url'] + ' ' : '')+
      (_tag['local'] != undefined ? _tag['local'] + ' ' : '')+ '\n';
      #(_tag['headersisibility'] != undefined ? _tag['visibility'] + ' ' : '') + '\n';
    _tags.push(tag);

  #TODO AG create template, maybe with mustache.js
  return '<div class="api_snippet"><h2 class="api_call">' + method + '</h2><div class="jsdoc">' + (source.summary ? source.summary + '\n' : '') +_tags.join('\n').trim()+ '\n</div>\n<pre class="prettyprint source-code"><code>' + source.code + '\n</code></pre></div>';

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

  return matching_h1s.join("\n").replace(/_/g,"\\_");

exports.getOptions = getOptions
exports.hashDoc = hashDoc
exports.ignoreVcs = ignoreVcs
exports.getFiles = getFiles
exports.renderTemplate = renderTemplate
exports.catPath = catPath
exports.cleanseFiles = cleanseFiles
exports.buildFileObjects = buildFileObjects
exports.parseHeaders = parseHeaders
exports.indexLinker = indexLinker
exports.fileLinker = fileLinker
exports.importTemplateResources = importTemplateResources
exports.formatCode = formatCode
exports.toclinker = toclinker