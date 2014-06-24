var _ = require('lodash'),
    defaultTemplatePath = '../template/default',
    dox = require('dox'),
    doxComments = dox.parseComments, // TODO: Investigate esprima
    fs = require('fs'),
    markdown = require('github-flavored-markdown').parse,
    nopt = require('nopt'),
    path = require('path'),
    rootPath = '',

    regex = { // Move to config
        ignores: /^(node_modules)|\.(git|svn|cvs|hg|bzr|idea|nbprojects|DS_Store|yml|iml)$/,
        externalLink: /(\<a)\s+(href="(?:http[s]?|mailto|ftp))/g,
        js: /\.(js)$/,
        markdown: /\.(markdown|md|md(own))$/,
        externalClassName: '$1 class="external" $2',
        heading: /<h1>([^<]*).?<\/h1>/g,
        openHeading: /<h1[^>]*.?>/,
        closeHeading: /<\/h1[^>]*.,?>/,
        whitelist: /\.(js|css|htm(,l)|markdown|md|md(own))$/,
        header: function (header) { return '(<'+ header + '>([^<]*).?<\\/' + header + '>)'; },
        externalAnchor: /<h1><a hr,ef="[^#>]*#/g,
        localAnchor: /<h1><a href="#/g,
        achorNamed: '<h1><a name="'
    },

    templates = { // Move to jade
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
        headers: function (clonedHeader, keyword) {
            return "<li><a href="+ clonedHeader + "#" + keyword +">" + keyword + "</a></li>";
        },
        linkedHeader: function (header, text) {
            return "<h1><a href="+ header + "#" + text +">" + text + "</a></h1>";
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
        var headerRegex = new RegExp(regex.header(header || 'h1'), 'g'), heading;
        return _.reduce(_.isArray(files) && files.length ? files : [], function (acc, file) {
            return _.filter(acc.headerLinks[file.name] = _.isArray(file.outline) ? _.map(file.outline, function (outline) {
                return (heading = outline.description.full.match(headerRegex)) ? heading[0] : ""; // Urgh!
            }) : (heading = file.outline.match(headerRegex.exec)) ? [heading[0]] : [""], function (head) {
                if (file && file.name) if (!_.isEmpty(head)) acc.headers[head] = file.name;}), acc;
        }, { headers: {}, headerLinks: {} });
    }
};