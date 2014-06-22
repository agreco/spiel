var path = require('path');

module.exports = {
    bower: {
        verbose: true,
        install: true
    },
    clean: {
        force: true
    },
    coffee: {
        bare: true
    },
    jade: { // TODO: env dependent switch
        pretty: true,
        data: {
            pkg: require('../package.json'),
            envDev: true,
            envProd: false
        }
    },
    less: { paths: [ path.join(__dirname, 'lib'), path.join(__dirname, 'partials') ] },
    mocha: {
        reporter: 'spec'
        // ignoreLeaks: true
        // timeout: 2000
        // compilers: 'coffee:coffee-script'
    },
    spritesmith: {
        'imgName': 'sprite-all.png',
        'cssName': 'all.less',
        'imgPath': '/images/sprite-all.png',
        'algorithm': 'binary-tree',
        'padding': 2,
        'engine': 'phantomjs',
        'cssFormat': 'less',
        'cssVarMap': function (sprite) {
            sprite.name = 'sprite-all-' + sprite.name;
        },
        'imgOpts': {
            'timeout': 10000
        },
        'cssOpts': {
            'functions': true,
            'cssClass': function (item) {
                return '.sprite-all-' + item.name;
            }
        }
    },
    uglify: {
        // inSourceMap:
        // outSourceMap: "app.js.map"
    }
}