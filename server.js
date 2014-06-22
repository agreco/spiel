'use strict';

var fs = require('fs'),
    util = require('util'),
    path = require('path'),
    _ = require('lodash'),
    express = require('express'),
    jade = require('jade'),
    app = express();

app.configure(function() {
    app.use(express.compress());
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    app.use(app.router);
});

app.all(/^\/\w+/, function (req, res) {
    res.sendfile(path.resolve(__dirname + '/../' + GLOBAL.EXPRESS_STATIC + '/index.html')   );
});

module.exports = app;