var _ = require('lodash');

module.exports = {
    achorNamed: '<h1><a name="',
    api: /\$api/g,
    body: /\$body/g,
    closeHeading: /<\/h1[^>]*.?>/,
    extAnchor: /<h1><a href="[^#>]*#/g,
    extCl: '$1 class="external" $2',
    extLink: /(<a)\s+(href="(?:http[s]?|mailto|ftp))/g,
    header: function (header) { return '(<'+ header + '>([^<]*).?<\\/' + header + '>)'; },
    heading: /<h1>([^<]*).?<\/h1>/g,
    headings: function (list) {
        return list && _.isArray(list) && list.length ? new RegExp(module.exports.openHeading.source + '(' +
        (_.map(list.sort().reverse(), function (kw) { return kw.replace(module.exports.heading, '$1'); })).join("|") +
        ')' + module.exports.closeHeading.source, 'g') : [];
    },
    ignores: /^(node_modules)|\.(git|svn|cvs|hg|bzr|idea|nbprojects|DS_Store|yml|iml)$/,
    js: /\.(js)$/,
    imgs: /(img(s)|image(s))/,
    imgExt: 'png|gif|jpeg',
    localAnchor: /<h1><a href="#/g,
    md: /\.(markdown|md|md(own))$/,
    openHeading: /<h1[^>]*.?>/,
    res: /\.(js|css|png|gif|jpeg|htm(l)?)$/,
    summary: /\$summary/g,
    whitelist: /\.(js|css|htm(l)|markdown|md|md(own))$/
};