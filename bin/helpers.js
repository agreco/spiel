// Generated by CoffeeScript 1.3.3
(function() {
    var buildFileObjects, catPath, cleanseFiles, defaultTemplatePath, dox, fileLinker, formatJsDoc, fs, getFiles, getOptions, hashDoc, ignoreVcs, importTemplateResources, indexLinker, lowerCaseSort, markdown, nopt, parseHeaders, path, processFiles, processJsDoc, processTemplate, regex, renderTemplate, rootPath, setRootPath, templates, toc_expander, toclinker;

    path = require('path');

    fs = require('fs');

    nopt = require('nopt');

    markdown = require('github-flavored-markdown').parse;

    dox = require('../lib/dox');

    defaultTemplatePath = '../template/default';

    rootPath = '';

    regex = {
        vcs: /^\.(git|svn|cvs|hg|bzr|idea|nbprojects)$/,
        externalLink: /(\<a)\s+(href="(?:http[s]?|mailto|ftp))/g,
        externalClassName: '$1 class="external" $2',
        heading: /<h1>([^<]*).?<\/h1>/g,
        openHeading: /<h1[^>]*.?>/,
        closeHeading: /<\/h1[^>]*.?>/,
        whitelist: /\.(js|css|htm(l)|markdown|md|md(own))$/,
        header: function(header) {
            return '(<' + header + '>([^<]*).?<\\/' + header + '>)';
        },
        externalAnchor: /<h1><a href="[^#>]*#/g,
        localAnchor: /<h1><a href="#/g,
        achorNamed: '<h1><a name="'
    };

    templates = {
        jsDoc: function(name, tags, outline) {
            return "<div class=\"api_snippet\">\n<div class=\"jsdoc\">\n<h2>" + name + "</h2>\n" + tags + "\n</div>\n<pre class=\"prettyprint source-code\">\n<code>\n" + outline.code + "\n</code>\n</pre>\n</div>\n";
        },
        headers: function(clonedHeader, keyword) {
            return "<li><a href=\"" + clonedHeader + "#" + keyword + "\">" + keyword + "</a></li>";
        },
        linkedHeader: function(header, text) {
            return "<h1><a href=\"" + header + "#" + text + "\">" + text + "</a></h1>";
        }
    };

    getOptions = function() {
        var opts, shortHands;
        opts = {
            root: path,
            output: path,
            specs: path,
            src: path,
            template: path
        };
        shortHands = {
            r: ["--root"],
            o: ["--output"],
            sp: ["--specs"],
            sr: ["--src"],
            t: ["--template"]
        };
        return nopt(opts, shortHands, process.argv);
    };

    ignoreVcs = function(pathName) {
        if (!pathName) {
            throw new Error('helpers.ignoreVcs -> Missing argument [pathName]');
        }
        return !path.basename(pathName).match(regex.vcs);
    };

    getFiles = function(pathName) {
        var collection;
        if (!pathName) {
            throw new Error('helpers.getFiles -> Missing argument [pathName]');
        }
        collection = [];
        if (!(pathName instanceof Array)) {
            pathName = [pathName];
        }
        pathName = pathName.filter(ignoreVcs);
        pathName.forEach(function(file) {
            var newfiles;
            if (fs.statSync(file).isDirectory()) {
                newfiles = fs.readdirSync(file).map(function(f) {
                    return path.join(file, f);
                });
                return collection = collection.concat(getFiles(newfiles));
            } else {
                return collection.push(file);
            }
        });
        return collection;
    };

    catPath = function(file, delimiter) {
        var pathArr;
        if (!file) {
            throw new Error('helpers.catPath -> Missing argument [file]');
        }
        if (!delimiter) {
            throw new Error('helpers.catPath -> Missing argument [delimiter]');
        }
        if (file.match(rootPath)) {
            file = file.replace(rootPath, '');
        }
        delimiter = delimiter || '_';
        pathArr = file.split("/");
        pathArr = pathArr.map(function(index) {
            return index.replace(/^\.+/g, "");
        });
        pathArr = pathArr.filter(function(index) {
            return index !== "";
        });
        return file = pathArr.join(delimiter) + ".html";
    };

    cleanseFiles = function(files) {
        var file, fileArray, i, _i, _len;
        if (!files) {
            throw new Error('helpers.cleanseFiles -> Missing argument [files]');
        }
        fileArray = [];
        for (i = _i = 0, _len = files.length; _i < _len; i = ++_i) {
            file = files[i];
            if (file && file.match(regex.whitelist)) {
                fileArray.push(file);
            }
        }
        return fileArray;
    };

    hashDoc = function(outline, fileType) {
        var hash;
        if (!outline) {
            throw new Error('helpers.hashDoc -> Missing argument [outline]');
        }
        if (!fileType) {
            throw new Error('helpers.hashDoc -> Missing argument [fileType]');
        }
        switch (fileType) {
            case 'js':
                hash = {
                    tags: outline.tags,
                    isPrivate: outline.isPrivate,
                    ignore: outline.ignore,
                    code: outline.code,
                    description: outline.description,
                    summary: outline.description.summary,
                    body: outline.description.body,
                    ctx: outline.ctx
                };
        }
        return hash;
    };

    buildFileObjects = function(files) {
        if (!files) {
            throw new Error('helpers.buildFileObjects -> Missing argument [files]');
        }
        return files = files.map(function(file) {
            var content, item, outline, _i, _j, _len, _len1;
            content = fs.readFileSync(file, "utf8").toString();
            outline = [];
            if (file.match(/\.(js)$/)) {
                content = dox.parseComments(content);
                for (_i = 0, _len = content.length; _i < _len; _i++) {
                    item = content[_i];
                    outline.push(hashDoc(item, "js"));
                }
            } else if (file.match(/\.(markdown|md|md(own))$/)) {
                content = markdown(content);
                if (content) {
                    outline = content;
                }
            } else if (file.match(/\.(sass)$/)) {
                content = dox.parseComments(content);
                for (_j = 0, _len1 = content.length; _j < _len1; _j++) {
                    item = content[_j];
                    outline.push(hashDoc(item, "sass"));
                }
            }
            return {
                path: file,
                name: catPath(file, '.'),
                outline: outline
            };
        });
    };

    parseHeaders = function(files, header) {
        var ah, file, headerLinks, headerRegex, headers, headings, outline, _i, _j, _len, _len1, _ref;
        if (!files) {
            throw new Error('helpers.parseHeaders -> Missing argument [files]');
        }
        if (!header) {
            header = 'h1';
        }
        headers = {};
        headerLinks = {};
        headerRegex = new RegExp(regex.header(header), 'g');
        for (_i = 0, _len = files.length; _i < _len; _i++) {
            file = files[_i];
            ah = [];
            if (file.outline) {
                if (file.outline instanceof Array) {
                    _ref = file.outline;
                    for (_j = 0, _len1 = _ref.length; _j < _len1; _j++) {
                        outline = _ref[_j];
                        while (headings = headerRegex.exec(outline.description.full)) {
                            ah.push(headings[1]);
                        }
                    }
                } else {
                    while (headings = headerRegex.exec(file.outline)) {
                        ah.push(headings[1]);
                    }
                }
            }
            ah.forEach(function(h) {
                if (file != null ? file.name : void 0) {
                    return headers[h] = file.name;
                }
            });
            headerLinks[file.name] = ah;
        }
        return {
            headers: headers,
            headerLinks: headerLinks
        };
    };

    lowerCaseSort = function(a, b) {
        var out;
        if (typeof a !== "string" || typeof b !== "string") {
            out = 0;
        } else {
            out = a.toLocaleLowerCase().localeCompare(b.toLocaleLowerCase());
        }
        return out;
    };

    indexLinker = function(headings, outputdir) {
        var clonedHeaders, formatter, h, heading, keywordLetters, keywords, keywordsMarked;
        if (!headings) {
            throw new Error('helpers.indexLinker -> Missing argument [headings]');
        }
        clonedHeaders = {};
        keywords = {};
        keywordLetters = {};
        for (heading in headings) {
            h = heading.replace(regex.heading, '$1');
            clonedHeaders[h] = headings[heading];
        }
        keywords = Object.keys(clonedHeaders).sort(lowerCaseSort);
        formatter = function(keyword) {
            if (outputdir) {
                return templates.headers(clonedHeaders[keyword], keyword);
            } else {
                return templates.headers('', keyword);
            }
        };
        keywords.forEach(function(keyword) {
            var letter;
            letter = keyword.toLocaleUpperCase().substring(0, 1);
            if (typeof keywordLetters[letter] === "undefined") {
                return keywordLetters[letter] = [formatter(keyword)];
            } else {
                return keywordLetters[letter].push(formatter(keyword));
            }
        });
        keywordsMarked = Object.keys(keywordLetters);
        keywordsMarked = keywordsMarked.map(function(letter) {
            var listOut;
            listOut = '<h2>' + letter + '</h2>' + '\n';
            listOut += '<ul>\n' + keywordLetters[letter].join("\n") + '\n</ul>';
            return listOut;
        });
        return '<h1>Index</h1>\n<div id="index">\n' + keywordsMarked.join("\n") + '\n</div>';
    };

    fileLinker = function(files, headers, output) {
        var file, input, keywords, outline, re, _i, _j, _len, _len1, _ref, _ref1;
        if (!files) {
            throw new Error('helpers.fileLinker -> Missing argument [files]');
        }
        if (!headers) {
            throw new Error('helpers.fileLinker -> Missing argument [headers]');
        }
        keywords = Object.keys(headers).sort().reverse().map(function(kw) {
            return kw.replace(regex.heading, '$1');
        });
        if (!keywords.length) {
            return files;
        }
        re = new RegExp(regex.openHeading.source + '(' + keywords.join("|") + ')' + regex.closeHeading.source, 'g');
        for (_i = 0, _len = files.length; _i < _len; _i++) {
            file = files[_i];
            if ((file != null ? file.outline : void 0) instanceof Array) {
                _ref = file.outline;
                for (_j = 0, _len1 = _ref.length; _j < _len1; _j++) {
                    outline = _ref[_j];
                    if ((_ref1 = outline.description) != null ? _ref1.full : void 0) {
                        input = String(outline.description.full).replace(regex.externalLink, regex.externalClassName);
                        if (output) {
                            input = input.replace(re, function(header, match) {
                                return templates.linkedHeader(headers[header], match);
                            }).replace(regex.externalAnchor, regex.achorNamed);
                        } else {
                            input = input.replace(re, function(header, match) {
                                return templates.linkedHeader('', match);
                            }).replace(regex.localAnchor, regex.achorNamed);
                        }
                        outline.description.full = input;
                    }
                }
            }
        }
        return files;
    };

    renderTemplate = function(file, template) {
        var api, outline, outlineObj, _i, _len, _ref, _ref1;
        if (!file) {
            throw new Error('helpers.renderTemplate -> Missing argument [file]');
        }
        if (!template) {
            throw new Error('helpers.renderTemplate -> Missing argument [template]');
        }
        outline = file.outline;
        if (((_ref = outline[0]) != null ? _ref.summary : void 0) != null) {
            template = template.replace(/\$summary/g, outline[0].summary);
        }
        if (((_ref1 = outline[0]) != null ? _ref1.body : void 0) != null) {
            template = template.replace(/\$body/g, outline[0].body);
        }
        api = '';
        if (outline != null) {
            for (_i = 0, _len = outline.length; _i < _len; _i++) {
                outlineObj = outline[_i];
                if ((outlineObj != null) && (outlineObj.code != null)) {
                    api += outlineObj.code;
                }
            }
            template = template.replace(/\$api/g, '<div id="api">' + api + "</div>");
        } else {
            template = template.replace(/\$api/g, "");
        }
        return template;
    };

    importTemplateResources = function(options, resource) {
        var encoding, resourceOutputPath, resources;
        if (!options) {
            throw new Error('helpers.importTemplateResources -> Missing argument [options]');
        }
        if (!options.output) {
            throw new Error('helpers.importTemplateResources -> Missing argument property [options.output]');
        }
        if (!resource) {
            throw new Error('helpers.importTemplateResources -> Missing argument [resource]');
        }
        if (!(options.template != null)) {
            options.template = path.resolve(__dirname, defaultTemplatePath);
        }
        encoding = 'utf8';
        resourceOutputPath = options.output.concat('/' + resource);
        if (!fs.existsSync(resourceOutputPath)) {
            fs.mkdirSync(resourceOutputPath, 511);
        }
        resources = getFiles(options.template + "/" + resource).filter(function(file) {
            if (resource.match(/(img(s)|image(s))/)) {
                resource = 'png|gif|jpeg';
                encoding = 'binary';
            }
            return file.match("\.(" + resource + ")$");
        });
        return resources.forEach(function(file) {
            var newFile;
            newFile = resourceOutputPath.concat('/' + path.basename(file));
            return fs.readFile(file, function(err, data) {
                if (err) {
                    throw err;
                }
                return fs.writeFile(newFile, data, encoding, function(err) {
                    if (err) {
                        throw err;
                    }
                });
            });
        });
    };

    formatJsDoc = function(outline) {
        var name, tag, tagStr, tags, _i, _len, _ref, _ref1;
        if (!outline) {
            throw new Error('helpers.formatJsDoc -> Missing argument [outline]');
        }
        tags = [];
        _ref = outline.tags;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            tag = _ref[_i];
            tagStr = '';
            if (tag.type != null) {
                tagStr += '<strong>@' + tag.type + '</strong> ';
            }
            if (((_ref1 = tag.types) != null ? _ref1[0] : void 0) != null) {
                tagStr += tag.types[0] + ' ';
            }
            if (tag.name != null) {
                tagStr += tag.name + ' ';
            }
            if (tag.description != null) {
                tagStr += tag.description + ' ';
            }
            if (tag.title != null) {
                tagStr += tag.title + ' ';
            }
            if (tag.url != null) {
                tagStr += tag.url + ' ';
            }
            if (tag.local != null) {
                tagStr += tag.local + ' ';
            }
            tags.push(tagStr);
        }
        tags = tags.join('\n').trim();
        name = outline.ctx.name;
        return templates.jsDoc(name, tags, outline);
    };

    setRootPath = function(root) {
        if (!root) {
            throw new Error('helpers.setRootPath -> Missing argument [root]');
        }
        return rootPath = root.replace(/\/?~\/+/, '/');
    };

    /* CODE BELOW UNTESTED
     */


    processJsDoc = function(files) {
        var file, outline, _i, _j, _len, _len1, _ref;
        if (!files) {
            throw new Error('helpers.processJsDoc -> Missing argument [files]');
        }
        for (_i = 0, _len = files.length; _i < _len; _i++) {
            file = files[_i];
            if (file.outline != null) {
                _ref = file.outline;
                for (_j = 0, _len1 = _ref.length; _j < _len1; _j++) {
                    outline = _ref[_j];
                    if ((outline.code != null) && (outline.tags != null)) {
                        outline.code = formatJsDoc(outline);
                    }
                }
            }
        }
        return files;
    };

    processFiles = function(pathName) {
        if (!pathName) {
            pathName = rootPath != null;
        }
        return buildFileObjects(cleanseFiles(getFiles(pathName)));
    };

    processTemplate = function(options, resources) {
        var resource, _i, _len, _results;
        _results = [];
        for (_i = 0, _len = resources.length; _i < _len; _i++) {
            resource = resources[_i];
            _results.push(importTemplateResources(options, resource));
        }
        return _results;
    };

    toclinker = function(toc, files, toc_regex) {
        var h1stuff, tocline, tocline_res, toclinked;
        tocline = toc_regex || /(\S*).\s*{(.+)}/;
        tocline_res = void 0;
        h1stuff = parseHeaders(files);
        toclinked = [];
        toc.forEach(function(line) {
            var headerses;
            if ((headerses = tocline.exec(line)) !== null) {
                return line = toc_expander(h1stuff, tocline_res[1], tocline_res[2]);
            }
        });
        toclinked.push(line);
        return toclinked.join('\n');
    };

    toc_expander = function(h1bag, indent, pathpart) {
        var files_to_h1s, matching_files, matching_h1s;
        files_to_h1s = h1bag.files_to_h1s;
        matching_files = Object.keys(files_to_h1s);
        matching_h1s = [];
        matching_files = matching_files.filter(function(file) {
            return file.indexOf(pathpart);
        });
        matching_files.forEach(function(matching_file) {
            return matching_h1s = matching_h1s.concat(files_to_h1s[matching_file]);
        });
        matching_h1s = matching_h1s.sort(caseless_sort).map(function(matching_h1) {
            return indent + '* ' + matching_h1;
        });
        return matching_h1s.join("\n").replace(/_/g, "\\_");
    };

    exports.getOptions = getOptions;

    exports.hashDoc = hashDoc;

    exports.ignoreVcs = ignoreVcs;

    exports.getFiles = getFiles;

    exports.catPath = catPath;

    exports.cleanseFiles = cleanseFiles;

    exports.buildFileObjects = buildFileObjects;

    exports.parseHeaders = parseHeaders;

    exports.indexLinker = indexLinker;

    exports.fileLinker = fileLinker;

    exports.importTemplateResources = importTemplateResources;

    exports.formatJsDoc = formatJsDoc;

    exports.processJsDoc = processJsDoc;

    exports.renderTemplate = renderTemplate;

    exports.processFiles = processFiles;

    exports.processTemplate = processTemplate;

    exports.setRootPath = setRootPath;

}).call(this);