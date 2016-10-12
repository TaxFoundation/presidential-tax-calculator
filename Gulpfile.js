'use strict';

var gulp = require('gulp'),
    fs = require('fs'),
    pug = require('gulp-pug'),
    // data = require('gulp-data'),
    // yaml = require('js-yaml'),
    sass = require('gulp-sass'),
    autoprefixer = require('gulp-autoprefixer'),
    webserver = require('gulp-webserver');

gulp.task('default', ['build', 'webserver', 'watch']);

gulp.task('build', ['renderHtml'], function (cb) {
  cb();
});

gulp.task('renderHtml', ['compileSass', 'moveJavascript', 'moveImage'], function () {
  gulp.src('./src/**/*.pug')
  // .pipe(data(function (file) {
  //   return yaml.safeLoad(fs.readFileSync('./src/data/plans.yml', 'utf-8'));
  // }))
  .pipe(pug({ pretty: true }))
  .pipe(gulp.dest('./dist/'));
});

gulp.task('compileSass', function () {
  gulp.src('./src/scss/style.scss')
  .pipe(sass().on('error', sass.logError))
  .pipe(autoprefixer({ browsers: ['> 5%'] }))
  .pipe(gulp.dest('./dist/css/'));
});

gulp.task('moveJavascript', function () {
  gulp.src('./src/js/**/*')
  .pipe(gulp.dest('./dist/js/'));
});

gulp.task('moveImage', function () {
  gulp.src('./src/images/**/*')
  .pipe(gulp.dest('./dist/images/'));
});

gulp.task('webserver', function () {
  gulp.src('./dist')
  .pipe(webserver({
    fallback: 'index.html',
    livereload: true,
    open: true,
    port: 1937,
  }));
});

gulp.task('watch', function () {
  gulp.watch('./src/js/**/*', ['moveJavascript']);
  gulp.watch('./src/scss/**/*.scss', ['compileSass']);
  gulp.watch(['./dist/css/style.css', './dist/js/app.js', './src/**/*.pug'], ['renderHtml']);
});
