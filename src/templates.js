var _ = require('lodash');

module.exports = { // TODO: Move to jade
    apiWrapper: function (api) {
        return '<div id="api">' + api + "</div>";
    },
    indexLi: function (clonedHeader, keyword) {
        return '<li><a href="'+ clonedHeader + '#' + keyword +'">' + keyword + '</a></li>';
    },
    indexList: function (list) {
        return _.isUndefined(list) || _.isEmpty(list) ? '' : '<h1>Index</h1>\n<div id="index">\n'+list+'\n</div>';
    },
    indexUl: function (letter, key) {
        return (_.isUndefined(key) && _.isUndefined(letter)) || !_.isArray(letter) && _.isEmpty(letter) ? '' :
            '<h2>' + key + '</h2>' + '\n<ul>\n' + letter.join("\n") + '\n</ul>';
    },
    jsDoc: function (name, tags, outline) {
        return [
            '<div class="api_snippet">\n',
                '<div class="jsdoc">\n',
                    '<h2>'+name ? name : 'Name not available' +'</h2>\n',
                    tags ? tags : 'tags not available' +'\n',
                '</div>\n',
                '<pre class="prettyprint source-code">\n',
                    '<code>' 
                        + outline ? outline.code ? outline.code : 'Code not available' : 'Code not available' +
                    '</code>\n',
                '</pre>\n',
            '</div>\n'
        ].join('');
    },
    linkedHeader: function (header, text) {
        return '<h1><a href="'+ header + '#' + text +'" name="'+ text +'">' + text + '</a></h1>';
    },
    path: './template/default'
};