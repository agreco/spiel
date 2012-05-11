

var path = require('path'),
    fs = require('fs'),
    nopt = require('nopt');

var external_regex = /(\<a)\s+(href="(?:http[s]?|mailto|ftp))/g,
    external_replace = '$1 class="external" $2',
    header_opening = /<h1[^>]*.?>/,
    header_closing = /<\/h1[^>]*.?>/,
    re_h1s      = /<h1>([^<]*).?<\/h1>/g;

var getOpts = function(options) {
        var opts = {
            output: path,
            template: path,
            toc: path,
            specs:path,
            dir:path,
            title: String,
            index: Boolean
        },
        shortHands = {
            o: ["--output"],
            t: ["--title"],
            ni: ["--no-index"]
        };
        options = nopt(opts, shortHands);
        if (typeof options.index === "undefined") {
            options.index = true;
        }
        return options;
    },

    no_vcs = function(infile) { // avoid recursing down VCS directories
        var vcs = /^\.(git|svn|cvs|hg|bzr|idea|nbprojects)$/;// If there's any more, feel free to add
        infile = path.basename(infile);
        return !infile.match(vcs);
    },

    flatten_files = function(infiles) { // recursively flatten folders into files
        var stat;
        var outfiles = [];
        infiles = infiles.filter(no_vcs);
        infiles.forEach(function(file) {
            stat = fs.statSync(file);
            if (stat.isDirectory()) {
                var newfiles = fs.readdirSync(file).map(function(f){ // make sure readdir puts path back in after
                    return path.join(file, f);
                });
                var flat = flatten_files(newfiles); // recurse
                outfiles = outfiles.concat(flat);// add the flattened bits back in
            } else {
                outfiles.push(file);
            }
        });
        return outfiles;
    },

    template_render = function(body, api, title, template) {
        var output = template || default_template, _api = '';
        title = title || "Docker";
        output = output.replace(/\$title/g,title);
        output = output.replace(/\$body/g,body);
        if(api !== null){
            for(var i = 0, len = api.length; i < len; ++i){
                if(api[i].isPrivate !== undefined && api[i].isPrivate === false && api[i].code !== undefined){
                    _api += api[i].code;
                }
            }
            output = output.replace(/\$api/g, '<div id="api"><h1>API</h1>' + _api + "</div>");
        }else{
            output = output.replace(/\$api/g, "");
        }
        return output;
    },

    // output only the filename
    // excluding its path
    munge_filename =  function(file) {
        var path_parts = file.split("/");

        path_parts = path_parts.map(function(index) {
            return index.replace(/^\.+/g,"");
        });

        path_parts = path_parts.filter(function(index){
            return index !== ""
        });

        //return path_parts.join("_") + ".html";
       return path_parts[path_parts.length-2] + "_" + path_parts[path_parts.length-1]+ ".html"; //Flithy hack!  TODO AG Refactor
    },

    // turn h1s into an index propertybag
    // input: h1s
    // output: "Stringified index"
    index_to_json = function(h1s) {
        var keywords = Object.keys(h1s).map(function(h1){ return {term:h1, url:h1s[h1]} });
        return JSON.stringify(keywords);
    },

    // find and return all the h1 tags in the processed files
    // input: [{name:"filename", content:"file content"}]
    // output: {h1s: {h1:file_name,...}, files_to_h1s: {filename:[h1s_in_file],...}}
    h1finder = function(processed) {
        var h1s = {},
            files_to_h1s = {},
            h1find = /(<h1>([^<]*).?<\/h1>)/g;
        processed.forEach(function(file_info) {
            var accum_h1s = [];
            var h1 = "";
            while ((h1 = h1find.exec(file_info.content)) !== null){
                accum_h1s.push(h1[1]);
            }
            accum_h1s.forEach(function (h1) {
                h1s[h1] = file_info.name;
            });
            files_to_h1s[file_info.name] = accum_h1s;
        });
        return {h1s:h1s, files_to_h1s:files_to_h1s};
    },

    // make a nice index of the h1s
    // input: h1s, outputdir = true | false
    // output: "index html"
    indexer = function(h1s, outputdir) {
        var clone = {}, key, keywords;

        for(key in h1s){
            var k = key.replace(re_h1s, '$1');
            clone[k] = h1s[key];
        }

        keywords = Object.keys(clone).sort(caseless_sort);
        var keyword_letters = {};
        var formatter = function(keyword) {// format output markdown based on outputdir
            console.log('Indexing '+keyword);
            if (outputdir) {
                return '<li><a href="' + clone[keyword] + '#' + keyword + '">' + keyword + '</a></li>';
            } else {
                return '<li><a href="#' + keyword + '">' + keyword + '</a></li>';
            }
        };

        // split keyword list into lettered segments
        keywords.forEach(function(keyword) {
            var letter = keyword.toLocaleUpperCase().substring(0,1);// works for RTL languages only I guess
            if (typeof keyword_letters[letter] === "undefined") {
                keyword_letters[letter] = [formatter(keyword)];
            } else {
                (keyword_letters[letter]).push(formatter(keyword));
            }
        });

        var keywords_marked = Object.keys(keyword_letters);
        keywords_marked = keywords_marked.map(function(letter) {
            var list_out = '<h2>' + letter + '</h2><ul>' + '\n';
            list_out += (keyword_letters[letter]).join("\n") + '</ul>';
            return list_out;
        });
        return '<h1>Index</h1>\n<span id="index">' + keywords_marked.join("\n") + '</span>';
    },

    // Take a TOC template and expand it
    // toc_expander does the heavy lefting
    // input: [toc.split], {name:file.name, content:file.content}
    // optional input: /regex/ having two matches: $1 = indent, $2 = filename to find h1s in
    // output: Markdown ready TOC
    toclinker = function(toc, files, toc_regex) {
        var tocline = toc_regex || /(\S*).\s*{(.+)}/,
            tocline_res,
            h1stuff = h1finder(files),
            toclinked = [];

        toc.forEach(function(line) {
            if ((tocline_res = tocline.exec(line)) != null) {
                line = toc_expander(h1stuff, tocline_res[1], tocline_res[2]);
            }
            toclinked.push(line);
        });
        return toclinked.join('\n');
    },

    // Expand {} placeholders in table of contents
    // input: {h1s, files_to_h1s}, indent before '{}', interior of toc '{}' line
    // output: markdown list of matching h1s
    toc_expander = function(h1bag, indent, pathpart) {
        var files_to_h1s = h1bag.files_to_h1s,
            matching_files = Object.keys(files_to_h1s),
            matching_h1s = [];

        matching_files = matching_files.filter(function (file){
            return file.indexOf(pathpart); //TODO AG needs thorough testing against dir structures!!
        });

        matching_files.forEach(function (matching_file){
            matching_h1s = matching_h1s.concat(files_to_h1s[matching_file]);
        });

        matching_h1s = matching_h1s.sort(caseless_sort).map(function(matching_h1) {
            return indent + '* ' + matching_h1;
        });

        return matching_h1s.join("\n").replace(/_/g,"\\_");
    },

    // link keywords to their h1 tags
    // input: ([files], [h1s])
    // output: [linked_files]
    autolink = function(files, h1s, output) {
        var i, l, input,
            keywords = Object.keys(h1s)
                .sort()
                .reverse()
                .map(function(kw){
                    return kw.replace(/<h1>([^<]*).?<\/h1>/g, '$1');
                });

        if(!keywords.length) {
            return files;
        }

        var keys = '(' + keywords.join("|") + ')',
            re = new RegExp(header_opening.source + keys + header_closing.source, 'g');

        for(i = 0, l = files.length; i < l; i++) {
            input = String(files[i].content);
            input = input.replace(external_regex, external_replace);

            if (output) {
                input = input.replace(re, function(_, m1) {
                    return  '<h1><a href="'+h1s[m1]+'#'+m1+'">'+m1+'<\/a></h1>';
                });
                input = input.replace(/<h1><a href="[^#>]*#/g,'<h1><a name="');
            } else {
                input = input.replace(re, function(_, m1){
                    return '<h1><a href="' + '#' + m1 + '">' + m1 + '<\/a></h1>';
                });
                input = input.replace(/<h1><a href="#/g,'<h1><a name="');
            }

            files[i].content = input;
        }
        return files;
    },

    caseless_sort = function (a,b) {
        if (typeof a !== "string" || typeof b !== "string") {
            return 0;
        }
        return a.toLocaleLowerCase().localeCompare(b.toLocaleLowerCase());
    },

    import_js = function(options){//DIRTY, move to one func!
        var js_path = options.output.concat('/js');
        if(!path.existsSync(js_path)){
            fs.mkdirSync(js_path, 0777);
        }
        var js_files = [options.template+"/js/"],
        js_assets = flatten_files(js_files);
        js_assets = js_assets.filter(function (file) {
            return file.match(/\.(js)$/)
        });
        js_assets.forEach(function(file){ //What a muthafunc!
            var filename = file.split('/'),
                newfileName = js_path.concat('/' + filename.pop());
                fs.readFile(file, function(err, data){
                    if(err) throw(err);
                    fs.writeFile(newfileName, data, 'utf8', function(err){
                        if(err) throw(err);
                    });
                });
        });
    },

    import_css = function(options){
        var css_path = options.output.concat('/css');
        if(!path.existsSync(css_path)){//FILTH!!
            fs.mkdirSync(css_path, 0777);
        }
        var css_files = [options.template+"/css/"],
        css_assets = flatten_files(css_files);
        css_assets = css_assets.filter(function (file) {
            return file.match(/\.(css)$/)
        });
        css_assets.forEach(function(file){ //What a muthafunc!
            var filename = file.split('/'),
                newfileName = css_path.concat('/' + filename.pop());
                fs.readFile(file, function(err, data){
                    if(err) throw(err);
                    fs.writeFile(newfileName, data, 'utf8', function(err){
                        if(err) throw(err);
                    });
                });
        });
    },

    format_code = function(source){
        var i, len, _tag,  tag = '',
            tags = source.tags,
            _tags = [],
            method = '',
            code = source.code;

        for(i = 0, len = tags.length; i < len; ++i){//TODO AG not happy about this. Need to refactor.
            _tag = tags[i];
            if(_tag['method']){
                method = _tag['method'];
            }
            tag = ((_tag['type'] != undefined && _tag['type'] != 'method') ? '<strong>@' + _tag['type'] + '</strong> ' : '') +
                (_tag['types'] != undefined && _tag['types'][0] != undefined ? _tag['types'][0] + ' ' : '')+
                (_tag['name'] != undefined ? _tag['name'] + ' ' : '') +
                (_tag['description'] != undefined ? _tag['description'] + ' ' : '') +
                (_tag['title'] != undefined ? _tag['title'] + ' ' : '') +
                (_tag['url'] != undefined ? _tag['url'] + ' ' : '')+
                (_tag['local'] != undefined ? _tag['local'] + ' ' : '')+ '\n';
                //(_tag['visibility'] != undefined ? _tag['visibility'] + ' ' : '') + '\n';
            _tags.push(tag);
        }
        //TODO AG create template, maybe with mustache.js
        return '<div class="api_snippet"><h2 class="api_call">' + method + '</h2><div class="jsdoc">' + (source.summary ? source.summary + '\n' : '') +_tags.join('\n').trim()+ '\n</div>\n<pre class="prettyprint source-code"><code>' + source.code + '\n</code></pre></div>';
    };

exports.getOpts = getOpts;
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