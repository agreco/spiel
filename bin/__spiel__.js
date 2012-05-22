#!/usr/bin/env node

var path = require('path'),
    fs = require('fs'),
    markdown = require('github-flavored-markdown').parse,
    dtils = require('../lib/docco'),
    dox = require('../lib/dox'),
    defaultTemplatePath = '../template/default',
    options,
    files,
    h1stuff,
    linked_files,
    index,
    template,
    out;

(function(){
    options = dtils.getOpts({});
    files = [];

    if(options.dir){
        var destination = options.dir + '/src/';
        options.dir !== destination ? files.push(options.dir) : files.push(options.dir + '/src/');
        files = dtils.flatten_files(files);
    }else{
        throw("Error! Directory to document not specified.")
    }

    if(!options.specs){
        options.specs = options.dir + '/speclets/';
    }

    var specs = dtils.flatten_files([options.specs]);
    specs.forEach(function(spec){
        files.push(spec);
    });

    files = files.filter(function (file) { // filter files js, css, sass, html, md
        return file.match(/\.(js|css|htm(l)?|md|md(own)?|markdown|sass)$/)
    });

    var fileAudit = {
        'total':files.length,
        'js':0,
        'markdown':0,
        'sass':0
    };

    files = files.map(function (file) {//read files
        var content = fs.readFileSync(file, "utf8").toString(),
            description, source = [];

        if (file.match(/\.(js)$/)) {
            fileAudit.js++;
            content = dox.parseComments(content);
						description = content[0].description.full;
            content.forEach(function(item){
                source.push({
                    tags:item.tags,
                    isPrivate:item.isPrivate,
                    ignore:item.ignore,
                    code:item.code,
                    summary:item.description.summary,
                    ctx:item.ctx
                })
            });

        }else if(file.match(/\.(markdown|md|md(own))$/)){
            fileAudit.markdown++;
            content =  markdown(content);
            description = content;

        }else if(file.match(/\.(sass)$/)){ // How to compile documentation for Sass CSS files
            fileAudit.sass++;
						content = dox.parseComments(content);
            description = content[0].description.full;
            content.forEach(function(item){
                source.push({
                    code:item.code,
                    summary:item.description.summary
                })
            });

        }

        return {
            filepath: file,
            name: dtils.munge_filename(file),
            content: description,
            source: source.length < 1 ? null : source
        };
    });

    fileAudit.parsed  = (fileAudit.js + fileAudit.markdown + fileAudit.sass);
    fileAudit.ignored = fileAudit.total - fileAudit.parsed;

    for(var i = 0, file, len = files.length; i < len; ++i){
        file = files[i];
        if(file.source !== null){
            for(var j = 0, source, jen = file.source.length; j < jen; ++j){
                source = files[i].source[j];
                if(j == 0){
                    source.summary = null;
                }
                if(source.isPrivate !== undefined && source.isPrivate === false && source.code !== undefined){
                    if(source.tags.length){
                        source.code = [dtils.format_code(source)].join('\n');
                    }
                }
            }
        }
    }

    h1stuff = dtils.h1finder(files);
    linked_files = dtils.autolink(files, h1stuff.h1s, options.output);
    index = dtils.indexer(h1stuff.h1s, options.output);

    if (options.output) { // destination option is supplied.
        if (!path.existsSync(options.output)) { // the destination dir doesn't exist, create it.
            fs.mkdirSync(options.output, 0777);
        }

        if(!options.template){
            options.template = path.resolve(__dirname, defaultTemplatePath);
        }

        dtils.import_js(options);
        dtils.import_css(options);
        template = fs.readFileSync(options.template+'/index.html', "utf8").toString();

        /*if (options.toc) { // toclink the incoming files
            var toc = fs.readFileSync(options.toc, "utf8").toString().split("\n");
            var marked_toc = markdown(dtils.toclinker(toc, files));
            files.push({
                name:"index",
                content: marked_toc
            });
        }*/

        if (options.index) { // add index
            linked_files.push({
                name:"_index.html",
                content:index,
                source:null
            });
        }

        for (i = 0, len = linked_files.length; i < len; i++) {
            var api = null;

            if(linked_files[i].source !== null){
                api = linked_files[i].source;
            }

            out = dtils.template_render(linked_files[i].content, api, linked_files[i].filepath, template);

            try{
                fs.writeFileSync(path.join(options.output, linked_files[i].name), out, 'utf8');
                /*console.log('Wrote '+linked_files[i].name);*/
            }catch(e){
                /*console.log('write ERROR');console.dir(e);*/
            }

            //try{fs.closeSync(path.join(options.output, linked_files[i].name));}catch(e){console.log('close ERROR');console.dir(e);}
        }
    }

    // File Audit Output
    console.log('File Audit');
    console.log('==========');
    console.dir(fileAudit);

})();