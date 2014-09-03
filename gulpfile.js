var gulp          = require('gulp'),
    gulpif        = require('gulp-if'),
    concat        = require('gulp-concat'),
    rimraf        = require('gulp-rimraf'),
    templateCache = require('gulp-angular-templatecache'),
    minifyHtml    = require('gulp-minify-html'),
    es            = require('event-stream'),
    sass          = require('gulp-sass'),
    rename        = require('gulp-rename');

var paths = {
  appJavascript:    ['app/js/app.js', 'app/js/**/*.js'],
  appTemplates:     'app/js/**/**.tpl.html',
  appSass:          'app/scss/main.scss',
  indexHtml:        'app/index.html',
  vendorJavascript: ['vendor/js/angular.js', 'vendor/js/**/*.js'],
  tmpFolder:        '.tmp',
  tmpJavascript:    '.tmp/js',
  tmpCss:           '.tmp/css'
};

gulp.task('scripts', function() {
  return gulp.src(paths.vendorJavascript.concat(paths.appJavascript, paths.appTemplates))
    .pipe(gulpif(/html$/, buildTemplates()))
    .pipe(concat('app.js'))
    .pipe(gulp.dest(paths.tmpJavascript));
});

gulp.task('styles', function() {
  return gulp.src(paths.appSass)
    .pipe(sass())
    .pipe(rename('app.css'))
    .pipe(gulp.dest(paths.tmpCss))
});

gulp.task('indexHtml', function() {
  return gulp.src(paths.indexHtml)
    .pipe(gulp.dest(paths.tmpFolder))
});

gulp.task('clean', function() {
  return gulp.src(paths.tmpFolder)
    .pipe(rimraf());
});

function buildTemplates() {
  return es.pipeline(
    minifyHtml({
      empty: true,
      spare: true,
      quotes: true
    }),
    templateCache()
  );
}