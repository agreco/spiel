// Generated by CoffeeScript 1.3.3
(function() {
  var defaultTemplatePath, dox, dtils, files, fs, h1stuff, index, linked_files, markdown, options, out, path, template;

  path = require('path');

  fs = require('fs');

  markdown = require('github-flavored-markdown').parse;

  dtils = require('../lib/docco');

  dox = require('../lib/dox');

  defaultTemplatePath = '../template/default';

  options = null;

  files = null;

  h1stuff = null;

  linked_files = null;

  index = null;

  template = null;

  out = null;

  (function() {
    var destination, file, fileAudit, i, spec, specs, _i, _j, _len, _len1;
    options = dtils.getOpts({});
    files = [];
    if (options.dir) {
      destination = options.dir + '/src/';
      if (options.dir !== destination) {
        files.push(options.dir);
      } else {
        files.push(destination);
      }
      files = dtils.flatten_files(files);
    } else {
      throw "Error! Directory to document not specified.";
    }
    if (!options.specs) {
      options.specs = options.dir + '/speclets/';
    }
    specs = dtils.flatten_files([options.specs]);
    for (_i = 0, _len = specs.length; _i < _len; _i++) {
      spec = specs[_i];
      files.push(spec);
    }
    for (i = _j = 0, _len1 = files.length; _j < _len1; i = ++_j) {
      file = files[i];
      if (file !== void 0 && !file.match(/\.(js|css|htm(l)?|md|md(own)?|markdown|sass)$/)) {
        files.splice(file, 1);
      }
    }
    fileAudit = {
      total: files.length,
      js: 0,
      markdown: 0,
      sass: 0
    };
    files = files.map(function(file) {
      var content, description, item, source, _k, _l, _len2, _len3;
      content = fs.readFileSync(file, "utf8").toString();
      description = null;
      source = [];
      if (file.match(/\.(js)$/)) {
        fileAudit.js++;
        content = dox.parseComments(content);
        if (content && content[0]) {
          description = content[0].description.full;
        }
        for (_k = 0, _len2 = content.length; _k < _len2; _k++) {
          item = content[_k];
          source.push(dtils.buildDocObject(item, "js"));
        }
      } else if (file.match(/\.(markdown|md|md(own))$/)) {
        fileAudit.markdown++;
        content = markdown(content);
        if (content) {
          description = content;
        }
      } else if (file.match(/\.(sass)$/)) {
        fileAudit.sass++;
        content = dox.parseComments(content);
        if (content && content[0]) {
          description = content[0].description.full;
        }
        for (_l = 0, _len3 = content.length; _l < _len3; _l++) {
          item = content[_l];
          source.push(dtils.buildDocObject(item, "sass"));
        }
      }
      return {
        filepath: file,
        name: dtils.munge_filename(file),
        content: description,
        source: source.length < 1 ? null : source
      };
    });
    fileAudit.parsed = fileAudit.js + fileAudit.markdown + fileAudit.sass;
    fileAudit.ignored = fileAudit.total - fileAudit.parsed;
    files.forEach(function(file) {
      if (file.source !== null) {
        file.source.forEach(function(source, j) {
          if (j === 0) {
            source.summary = null;
          }
          if (source.isPrivate !== void 0 && source.isPrivate === false && source.code !== void 0) {
            if (source.tags.length) {
              return source.code = [dtils.format_code(source)].join('\n');
            }
          }
        });
      }
    });
    h1stuff = dtils.h1finder(files);
    linked_files = dtils.autolink(files, h1stuff.h1s, options.output);
    index = dtils.indexer(h1stuff.h1s, options.output);
    if (options.output) {
      if (!path.existsSync(options.output)) {
        fs.mkdirSync(options.output, 0x1ff);
      }
      if (options.template === void 0) {
        options.template = path.resolve(__dirname, defaultTemplatePath);
      }
      dtils.import_js(options);
      dtils.import_css(options);
      template = fs.readFileSync(options.template + '/index.html', "utf8").toString();
      /*
          if options.toc # toclink the incoming files
            toc = fs.readFileSync(options.toc, "utf8").toString().split("\n")
            marked_toc = markdown(dtils.toclinker(toc, files))
            files.push({
              name:"index",
              content: marked_toc
            })
      */

      if (options.index) {
        linked_files.push({
          name: "_index.html",
          content: index,
          source: null
        });
      }
      linked_files.forEach(function(linked_file) {
        var api;
        api = null;
        if (linked_file.source !== null) {
          api = linked_file.source;
        }
        out = dtils.template_render(linked_file.content, api, linked_file.filepath, template);
        fs.writeFileSync(path.join(options.output, linked_file.name), out, 'utf8');
      });
    }
    console.log('File Audit');
    console.log('==========');
    console.dir(fileAudit);
  })();

}).call(this);
