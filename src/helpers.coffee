path = require('path')
fs = require('fs')
nopt = require('nopt')

external_regex = /(\<a)\s+(href="(?:http[s]?|mailto|ftp))/g
external_replace = '$1 class="external" $2'
header_opening = /<h1[^>]*.?>/
header_closing = /<\/h1[^>]*.?>/
re_h1s = /<h1>([^<]*).?<\/h1>/g

getOpts = (options) ->
  opts
    output: path
    template: path
    toc: path
    specs:path
    dir:path
    title: String
    index: Boolean

  shortHands
    o: ["--output"]
    d: ["--dir"]
    t: ["--title"]
    ni: ["--no-index"]

  options = nopt(opts, shortHands)
  if typeof options.index is "undefined" then options.index = true
  return options

buildDocObject = (item, type) ->
  obj = undefined

  if type is 'js'
    obj = {
      tags      : item.tags
      isPrivate : item.isPrivate
      ignore    : item.ignore
      code      : item.code
      summary   : item.description.summary
      ctx       : item.ctx
    }

  if type is 'sass'
    obj = {
      code    :item.code
      summary :item.description.summary
    }

  return obj

no_vcs = (infile) -> # skip VCS
  vcs = /^\.(git|svn|cvs|hg|bzr|idea|nbprojects)$/
  infile = path.basename(infile)
  return !infile.match(vcs)

flatten_files = (infiles) -> # flatten dir into files
  stat = undefined
  outfiles = []
  infiles = infiles.filter(no_vcs)

  infiles.forEach (file) ->
    stat = fs.statSync(file)

    if stat.isDirectory()
      newfiles = fs.readdirSync(file).map (f) -> #make sure readdir puts path back in after
        return path.join(file, f);

      flat = flatten_files(newfiles) # recursive
      outfiles = outfiles.concat(flat) # add the flattened bits back in

    else outfiles.push(file)

  return outfiles


template_render = (body, api, title, template) ->
  output = template
  _api = ''
  #title = title || "Docker";
  #output = output.replace(/\$title/g, title);

  output = output.replace /\$title/g, ""
  output = output.replace /\$body/g, body

  if api isnt null
    _api += apiObj.code for apiObj, i in api when apiObj isnt undefined and apiObj.isPrivate isnt false and apiObj.code isnt undefined
    output = output.replace(/\$api/g, '<div id="api"><h1>API</h1>' + _api + "</div>");
  else 
    output = output.replace(/\$api/g, "")

  return output;

munge_filename = (file) ->
  path_parts = file.split("/")

  path_parts = path_parts.map (index) ->
    return index.replace /^\.+/g, ""

  path_parts = path_parts.filter (index)->
    return index isnt ""

  #return path_parts.join("_") + ".html";
  return path_parts[path_parts.length-2] + "_" + path_parts[path_parts.length-1]+ ".html"; #Flithy hack!  TODO AG Refactor

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


import_js = (options) -> #DIRTY, move to one func!
  js_path = options.output.concat('/js')
  if not path.existsSync(js_path)
    fs.mkdirSync(js_path, 0o777)

  js_files = [options.template+"/js/"]
  js_assets = flatten_files(js_files)
  js_assets = js_assets.filter (file) ->
    return file.match(/\.(js)$/)

  js_assets.forEach (file) -> #What a muthafunc!
    filename = file.split('/')
    newfileName = js_path.concat('/' + filename.pop())
    fs.readFile file, (err, data) ->
      if err then throw(err)
      fs.writeFile newfileName, data, 'utf8', (err) ->
        if err then throw(err)
      return
    return
  return

import_css = (options) ->
  css_path = options.output.concat('/css');
  if not path.existsSync(css_path) #FILTH!!
    fs.mkdirSync(css_path, 0o777)

  css_files = [options.template+"/css/"]
  css_assets = flatten_files(css_files)
  css_assets = css_assets.filter (file) ->
    return file.match(/\.(css)$/)

  css_assets.forEach (file) -> #What a muthafunc!
    filename = file.split('/')
    newfileName = css_path.concat('/' + filename.pop())
    fs.readFile file, (err, data) ->
      if err then throw(err)
      fs.writeFile newfileName, data, 'utf8', (err) ->
        if err then throw(err)
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

exports.getOpts = getOpts;
exports.buildDocObject = buildDocObject;
exports.flatten_files = flatten_files;
exports.template_render = template_render;
exports.munge_filename = munge_filename;
exports.h1finder = h1finder;
exports.indexer = indexer;
exports.toclinker = toclinker;
exports.format_code = format_code;
exports.autolink = autolink;
exports.import_js = import_js;
exports.import_css = import_css;
