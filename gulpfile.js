var configs = require('./configs/configs'),
    express = require('./server'),
    fs = require('fs'),
    gulp = require('gulp'),
    gulpBower = require('gulp-bower'),
    gulpBrowserify = require('gulp-browserify'),
    gulpClean = require('gulp-clean'),
    gulpCoffee = require('gulp-coffee'),
    gulpConcat = require('gulp-concat'),
    gulpImagemin = require('gulp-imagemin'),
    gulpJade = require('gulp-jade'),
    gulpJshint = require('gulp-jshint'),
    gulpLess = require('gulp-less'),
    gulpMinifyCSS = require('gulp-minify-css'),
    gulpMinifyHTML = require('gulp-minify-html'),
    gulpMocha = require('gulp-mocha'),
    gulpSmith = require('gulp.spritesmith'),
    gulpUglify = require('gulp-uglify'),
    gulpUtil = require('gulp-util'),
    path = require('path');

gulp.task('bower', function () {
    return bower(configs.bower) .pipe(gulp.dest('./src/scripts/libs/'));
});

gulp.task('clean', function() {
    return gulp.src('./build-dev/**/*', { read: false }) .pipe(gulpClean(configs.clean));
});

gulp.task('copy', function () {
    gulp.src('./src/fonts/**/*') .pipe(gulp.dest('./build-dev/fonts/'));
    gulp.src('./bower_components/**/*/') .pipe(gulp.dest('./src/scripts/libs/'));
    gulp.src('./src/scripts/libs/**/*') .pipe(gulp.dest('./build-dev/scripts/libs/'));
});

gulp.task('browserify', function () {
    gulpBrowserify()
        .require(require.resolve('./src/app/main.js'), { entry: true })
        .bundle({ debug: true }, function (err, bundle) { // Add gulp.watch for errors
            fs.mkdir('./build-dev/app/js/', function (err) {
                if (err) throw err;
                fs.writeFile('./build-dev/app/js/main.js', bundle, function (err) {
                    if (err) throw err;
                });
            });
        });
});

gulp.task('jade', function () {
    return gulp.src('./src/**/*.jade') .pipe(gulpJade(configs.jade)) .pipe(gulp.dest('./build-dev/'));
});

gulp.task('lint', function() {
    return gulp.src('./src/app/app.js') .pipe(gulpJshint()) .pipe(gulpJshint.reporter('default'));
});

gulp.task('sprites', function () {
    var spriteData = gulp.src('./src/sprites/**/*') .pipe(gulpSmith(configs.spritesmith));
    spriteData.img.pipe(gulp.dest('./build-dev/images/'));
    spriteData.css.pipe(gulp.dest('./build-dev/styles/lib/sprites/'));
});

gulp.task('less', function () {
    return gulp.src('./src/styles/main.less') .pipe(gulpLess(configs.less)) .pipe(gulp.dest('./build-dev/styles/'));
});

gulp.task('express', function () {
    express.listen('9100');
});

gulp.task('mocha', function () {
    return gulp.src('./test/js/importTemplateResourcesTest.js') .pipe(gulpMocha(configs.mocha));
});

gulp.task('default', ['mocha']);


//gulp.task('default', ['clean', 'lint', 'browserify', 'jade', 'sprites', 'less', 'copy', 'express']);

/*gulp.task('minify-css', function() {
    gulp.src('./static/css/*.css').pipe(minifyCSS(opts)).pipe(gulp.dest('./dist/'))
});

gulp.task('minify-html', function() {
    gulp.src('./static/html/*.html').pipe(minifyHTML(opts)).pipe(gulp.dest('./dist/'))
});

gulp.task('imagemin', function() {
    gulp.src('src/image.png').pipe(imagemin()).pipe(gulp.dest('dist'));
});

gulp.task('minify-js', function() { //TODO add support for source maps
    gulp.src('./app/js/*.js').pipe(uglify(configs.uglify)).pipe(gulp.dest('./app/js'))
});
*/