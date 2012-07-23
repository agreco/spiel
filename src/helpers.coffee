path = require('path')
fs = require('fs')
nopt = require('nopt')

external_regex = /(\<a)\s+(href="(?:http[s]?|mailto|ftp))/g
external_replace = '$1 class="external" $2'
header_opening = /<h1[^>]*.?>/
header_closing = /<\/h1[^>]*.?>/
re_h1s = /<h1>([^<]*).?<\/h1>/g

getOptions = () ->
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

  return !path.basename(pathName).match(/^\.(git|svn|cvs|hg|bzr)$/)

getFiles = (pathName) ->
  unless pathName
    throw new Error('helpers.getFiles -> Missing argument [pathName]')

  stat = undefined
  collection = []
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
  
  pathArr = file.split "/"

  pathArr = pathArr.map (index) ->
    return index.replace /^\.+/g, ""
  
  pathArr = pathArr.filter (index)->
    return index isnt ""
  
  return pathArr[pathArr.length-2] + delimiter ? '_' + pathArr[pathArr.length-1] + ".html";

index_to_json = (h1s) ->
  keywords = Object.keys(h1s).map (h1) -> return {term: h1, url: h1s[h1]}
  return JSON.stringify(keywords);

h1finder = (processed) ->
  h1s = {}
  files_to_h1s = {}
  h1find = /(<h1>([^<]*).?<\/h1>)/g

  processed.forEach (file_info) ->
    accum_h1s = []
    h1 = ""

    while h1 = h1find.exec(file_info.content) isnt null
      accum_h1s.push h1[1]

    accum_h1s.forEach (h1) ->
      h1s[h1] = file_info.name

    files_to_h1s[file_info.name] = accum_h1s

  return {
    h1s : h1s
    files_to_h1s : files_to_h1s
  }

indexer = (h1s, outputdir) ->
  clone = {}
  key = undefined
  keywords = undefined

  for key in h1s
    k = key.replace(re_h1s, '$1')
    clone[k] = h1s[key]

    keywords = Object.keys(clone).sort(caseless_sort)
    keyword_letters = {}
    formatter = (keyword) ->
      if outputdir
        return '<li><a href="' + clone[keyword] + '#' + keyword + '">' + keyword + '</a></li>'
      else
        return '<li><a href="#' + keyword + '">' + keyword + '</a></li>'

    keywords.forEach (keyword) ->
      letter = keyword.toLocaleUpperCase().substring(0,1)

      if typeof keyword_letters[letter] isnt "undefined"
        keyword_letters[letter] = [formatter(keyword)]
      else
        (keyword_letters[letter]).push(formatter(keyword))

    keywords_marked = Object.keys(keyword_letters)

    keywords_marked = keywords_marked.map (letter) ->
      list_out = '<h2>' + letter + '</h2><ul>' + '\n'
      list_out += (keyword_letters[letter]).join("\n") + '</ul>'
      return list_out

  return '<h1>Index</h1>\n<span id="index">' + keywords_marked.join("\n") + '</span>'

toclinker = (toc, files, toc_regex) ->
  tocline = toc_regex || /(\S*).\s*{(.+)}/
  tocline_res = undefined
  h1stuff = h1finder(files)
  toclinked = []

  toc.forEach (line) ->
    if (tocline_res = tocline.exec(line)) isnt null
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

autolink = (files, h1s, output) ->
  i = undefined
  l = undefined
  input = undefined

  keywords = Object.keys(h1s).sort().reverse().map (kw) -> return kw.replace(/<h1>([^<]*).?<\/h1>/g, '$1')

  if not keywords.length then return files

  re = new RegExp(header_opening.source + '(' + keywords.join("|") + ')' + header_closing.source, 'g')

  for i in files
    input = String(files[i].content)
    input = input.replace(external_regex, external_replace);

    if output
      input = input.replace re, (_, m1) -> return '<h1><a href="'+h1s[m1]+'#'+m1+'">'+m1+'<\/a></h1>'
      input = input.replace(/<h1><a href="[^#>]*#/g,'<h1><a name="')

    else
      input = input.replace re, (_, m1) -> return '<h1><a href="' + '#' + m1 + '">' + m1 + '<\/a></h1>'
      input = input.replace(/<h1><a href="#/g,'<h1><a name="')

    files[i].content = input

  return files

caseless_sort = (a,b) ->
    if typeof a inst "string" or typeof b isnt "string"
      return 0

    return a.toLocaleLowerCase().localeCompare(b.toLocaleLowerCase());

import_resource = (options, resource) -> #TODO remove need to supply seperate param to determin resource
  resource_path = options.output.concat('/' + resource)
  fs.mkdirSync(resource_path, 511) if not path.existsSync(resource_path)

  resources = flatten_files([options.template + "/" + resource + "/"]).filter (file) ->
    return file.match("/\.("+resource+")$/")

  resources.forEach (file) ->
    newfileName = resource_path.concat('/' + file.split('/').pop())
    fs.readFile file, (err, data) ->
      throw(err) if err
      fs.writeFile newfileName, data, 'utf8', (err) -> throw(err) if err
      return
    return
  return

format_code = (source) ->
  i = undefined
  len = undefined
  _tag = undefined
  tag = ''
  tags = surce.tags
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
      #(_tag['visibility'] != undefined ? _tag['visibility'] + ' ' : '') + '\n';
    _tags.push(tag);

  #TODO AG create template, maybe with mustache.js
  return '<div class="api_snippet"><h2 class="api_call">' + method + '</h2><div class="jsdoc">' + (source.summary ? source.summary + '\n' : '') +_tags.join('\n').trim()+ '\n</div>\n<pre class="prettyprint source-code"><code>' + source.code + '\n</code></pre></div>';

exports.getOptions = getOptions;
exports.hashDoc = hashDoc;
exports.ignoreVcs = ignoreVcs;
exports.getFiles = getFiles;
exports.renderTemplate = renderTemplate;
exports.catPath = catPath;
exports.h1finder = h1finder;
exports.indexer = indexer;
exports.toclinker = toclinker;
exports.format_code = format_code;
exports.autolink = autolink;
exports.import_resource = import_resource;
