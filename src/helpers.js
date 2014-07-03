var _ = require('lodash'),
    dox = require('dox'),
    doxComments = dox.parseComments, // TODO: Investigate esprima
    fs = require('fs'),
    markdown = require('github-flavored-markdown').parse,
    nopt = require('nopt'),
    path = require('path'),
    rootPath = '',

    regex = { // TODO: Move to config
        ignores: /^(node_modules)|\.(git|svn|cvs|hg|bzr|idea|nbprojects|DS_Store|yml|iml)$/,
        extlLink: /(<a)\s+(href="(?:http[s]?|mailto|ftp))/g,
        js: /\.(js)$/,
        md: /\.(markdown|md|md(own))$/,
        extCl: '$1 class="external" $2',
        heading: /<h1>([^<]*).?<\/h1>/g,
        openHeading: /<h1[^>]*.?>/,
        closeHeading: /<\/h1[^>]*.?>/,
        whitelist: /\.(js|css|htm(l)|markdown|md|md(own))$/,
        header: function (header) { return '(<'+ header + '>([^<]*).?<\\/' + header + '>)'; },
        headings: function (list) {
            return list && _.isArray(list) && list.length ? new RegExp(regex.openHeading.source + '(' +
               (_.map(list.sort().reverse(), function (kw) { return kw.replace(regex.heading, '$1'); })).join("|") +
            ')' + regex.closeHeading.source, 'g') : [];
        },
        extAnchor: /<h1><a href="[^#>]*#/g,
        localAnchor: /<h1><a href="#/g,
        achorNamed: '<h1><a name="'
    },

    templates = { // TODO: Move to jade
        defaultTemplatePath: '../template/default',
        jsDoc: function (name, tags, outline) {
            return [
                '<div class="api_snippet">\n',
                '<div class="jsdoc">\n',
                    '<h2>'+name+'</h2>\n',
                    tags+'\n',
                '</div>\n',
                '<pre class="prettyprint source-code">\n',
                    '<code>' + outline.code +'</code>\n',
                '</pre>\n',
                '</div>\n'
            ].join('');
        },
        linkedHeader: function (header, text) {
            return '<h1><a href="'+ header + '#' + text +'">' + text + '</a></h1>';
        },
        indexList: function (list) {
            return _.isUndefined(list) || _.isEmpty(list) ? '' : '<h1>Index</h1>\n<div id="index">\n'+list+'\n</div>';
        },
        indexLi: function (clonedHeader, keyword) {
            return '<li><a href="'+ clonedHeader + '#' + keyword +'">' + keyword + '</a></li>';
        },
        indexUl: function (letter, key) {
            return (_.isUndefined(key) && _.isUndefined(letter)) || !_.isArray(letter) && _.isEmpty(letter) ? '' :
                '<h2>' + key + '</h2>' + '\n<ul>\n' + letter.join("\n") + '\n</ul>';
        }
    };

module.exports = {

    getOptions: function getOptions () {
        return nopt({ root: path, output: path, specs: path, src: path, template: path },
            {r: ["--root"], o: ["--output"], sp: ["--specs"], sr: ["--src"], t: ["--template"] }, process.argv);
    },

    ignored: function ignored (pathName) {
        return _.isString(pathName) ? !path.basename(pathName).match(regex.ignores) : void 0;
    },

    getFiles: function getFiles (vector) {
        return _.reduce((_.isArray(vector) ? vector : [vector]).filter(module.exports.ignored), function (acc, file) {
            return fs.statSync(file).isDirectory() ? acc = acc.concat(module.exports.getFiles(fs.readdirSync(file)
                .map(function (f) { return path.join(file, f); }))) : acc.push(file), acc;
        }, []);
    },

    concatPath: function concatPath (file, delimiter) {
        // TODO: Add support for win paths. ATM only unix is supported & Investigate a string replacement method
        return (file = (_.isString(file) ? (file.match(rootPath) ? file.replace(rootPath, "") : file) : void 0)) ?
            (_.filter(_.map(file.split("/"), function (a) { return a.replace(/^\.+/g, ""); }),
                function (b) { return b !== ""; })).join(_.isString(delimiter) ? delimiter : "_") + ".html" : "";
    },

    cleanseFiles: function cleanseFiles (files) {
        return _.filter(_.isArray(files) && files.length ? files : [], function (file) {
            return _.isString(file) && file.match(regex.whitelist) && file;
        });
    },

    hashDoc: function hashDoc (outline, fileType) { // TODO: Extend to html/css and move to config.
        return _.isObject(outline) && !_.isEmpty(outline) && fileType === 'js' ? {
            tags : outline.tags || "",
            isPrivate : outline.isPrivate || "",
            ignore : outline.ignore || "",
            code : outline.code || "",
            description : outline.description || "",
            summary : outline.description.summary || "",
            body : outline.description.body || "",
            ctx : outline.ctx || ""
        } : {};
    },

    buildFileObjects: function buildFileObjects (files) {
        return !_.isArray(files) ? [] : _.reduce(files, function (acc, file) {
            var buldflobj = this, obj = {}, content = fs.readFileSync(file, "utf8").toString();
            try { obj.outline = file.match(regex.js) ? _.map(doxComments(content), function (metaData) {
                return buldflobj.hashDoc(metaData, "js"); }) : file.match(regex.md) ? markdown(content) : "";
            } catch (e) { obj.outline = ""; } // Boo, hiss, hiss, boo.
            return obj.path = file, obj.name = buldflobj.concatPath(file, '.'), acc.push(obj), acc;
        }, [], this);
    },

    parseHeaders: function parseHeaders (files, header) {
        var headerRegex = new RegExp(regex.header(header || 'h1'), 'g'), heading, headerObjects;
        return _.each((headerObjects = _.reduce(_.isArray(files) && files.length ? files : [], function (acc, file) {
            return _.filter(acc.headerLinks[file.name] = _.isArray(file.outline) ? _.map(file.outline, function (outl) {
                    // TODO: Test full object (outl) property access
                    return (heading = outl.description.full.match(headerRegex)) ? heading[0] : ""; // Urgh!
                }) : (heading = file.outline.match(headerRegex)) ? heading : "", function (head) {
                    if (file && file.name && !_.isEmpty(head)) acc.headers[head] = file.name;
            }), acc; }, { headers: {}, headerLinks: {} })).headerLinks, function (link, k) {
                if (_.isArray(link) && _.some(link, _.isEmpty))  delete headerObjects.headerLinks[k];
                if (_.isEmpty(link)) delete headerObjects.headerLinks[k];
        }), headerObjects;
    },

    indexLinker: function indexLinker (headings, outDir) {
        return headings = headings || {}, templates.indexList(_.map(_.reduce(_.keys(headings).sort(function (a, b) {
            return (!_.isString(a) || !_.isString(b)) ? 0 : a.toLocaleLowerCase().localeCompare(b.toLocaleLowerCase());
        }), function (acc, heading) {
            var hash = heading.replace(regex.heading, '$1'), letter = hash.toLocaleUpperCase().substring(0,1),
                li = templates.indexLi(outDir ? headings[heading] : '', hash);
            return acc[letter] ? (acc[letter]).push(li) : acc[letter] = [li], acc;
        }, {}), templates.indexUl).join("\n"));
    },

    fileLinker: function fileLinker (fileObj, headers, output) {
        return _.map(fileObj ? _.isArray(fileObj) ? fileObj : [fileObj] : [], function (obj) {
            if (obj) {
                if (_.isArray(obj.outline)) {
                    _.each(obj.outline, function (otl) { this.fileLinker(otl, headers, output); }, this);
                } else if (_.isObject(obj) && !_.isUndefined(obj.description)) {
                    this.fileLinker((obj.description || ''), headers, output);
                } else if (_.isString(obj) || obj.full) {
                    obj['full'] = obj['full'].replace(regex.extlLink, regex.extCl);
                    obj['full'] = obj['full'].replace(_.isEmpty(headers) ? '' : regex.headings(_.keys(headers)), function (header, match) {
                        return templates.linkedHeader(output ? headers[header] : '', match);
                    });
                    obj['full'] = obj['full'].replace(regex[output ? 'extAnchor' : 'localAnchor'], regex.achorNamed);
                }
            }
            return obj;
        }, this);
    }
};