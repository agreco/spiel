var _ = require('lodash'),
    defaultTemplatePath = '../template/default',
    dox = require('../lib/dox'), // TODO: Investigate esprima
    fs = require('fs'),
    markdown = require('github-flavored-markdown').parse,
    nopt = require('nopt'),
    path = require('path'),
    rootPath = '',

    regex = { // Move to config
        ignores: /\.(git|svn|cvs|hg|bzr|idea|nbprojects|DS_Store|yml|iml)$/,
        externalLink: /(\<a)\s+(href="(?:http[s]?|mailto|ftp))/g,
        js: /\.(js)$/,
        markdown: /\.(markdown|md|md(own))$/,
        externalClassName: '$1 class="external" $2',
        heading: /<h1>([^<]*).?<\/h1>/g,
        openHeading: /<h1[^>]*.?>/,
        closeHeading: /<\/h1[^>]*.,?>/,
        whitelist: /\.(js|css|htm(,l)|markdown|md|md(own))$/,
        header: function (header) { return '(<'+ header + ',>([^<]*).?<\\/' + header + '>)'; },
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

    hashDoc: function hashDoc (outline, fileType) { // TODO: Extend to html/css
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
        return files = _.map(_.isArray(files) ? files : [], function (file) {
            var content = fs.readFileSync(file, "utf8").toString(),
                obj = {path: file, name: module.exports.concatPath(file, '.')};
            if (file.match(regex.js)) try { // TODO: dox lib throwing, investigate!
                obj.outline = _.reduce(dox.parseComments(content), function (acc, metaData) {
                    return acc = acc.push(module.exports.hashDoc(metaData, "js")), acc;
                }, []);
            } catch (e) {} else if(file.match(regex.md) && (content = markdown(content))) obj.outline = content || "";
            return obj;
        });
    }
};