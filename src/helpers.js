var _ = require('lodash'),
    dox = require('dox'),
    doxComments = dox.parseComments, // TODO: Investigate esprima
    fs = require('fs'),
    markdown = require('github-flavored-markdown').parse,
    nopt = require('nopt'),
    path = require('path'),
    regex = require('./regex.js'),
    rootPath = '',
    templates = require('./templates.js');

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
        return _.each(fileObj ? _.isArray(fileObj) ? fileObj : [fileObj] : [], function (obj) {
            return obj ? (_.isArray(obj.outline) ?_.each(obj.outline, function (otl) {
                this.fileLinker(otl, headers, output); }, this) : _.isObject(obj) && !_.isUndefined(obj.description) ?
                    this.fileLinker((obj.description || ''), headers, output) : (obj.outline || obj.full) ?
                    (fileObj = obj.outline ? 'outline' : obj.full ? 'full' : '',
                    obj[fileObj] = obj[fileObj].replace(regex.extLink, regex.extCl)
                        .replace(_.isEmpty(headers) ? '' : regex.headings(_.keys(headers)), function (header, match) {
                            return templates.linkedHeader(output ? headers[header] : '', match);
                }), obj) : '') : void 0; // TODO: Double check the need for replacing anchors with named anchors
        }, this);
    },

    compileTemplateData: function compileTemplateData (file, template) { // TODO: introduce Jade processing
        return template = template || '', _.reduce(file && file.outline ? file.outline : [], function (outline) {
            return template.replace(regex.summary, outline.summary ? outline.summary : '').replace(regex.body,
                outline.body ? outline.body : ''), _.isArray(outline) ? _.each(outline, function (outl) {
                    api += outline.code ? outline.code : '';
                    template.replace(regex.api, outline ? function () { return templates.apiWrapper(api) } : '');
                }) : void 0;
        }, '', this);
    }
};