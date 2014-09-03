var gulp          = require('gulp'),
    gulpif        = require('gulp-if'),
    concat        = require('gulp-concat'),
    rimraf        = require('gulp-rimraf'),
    templateCache = require('gulp-angular-templatecache'),
    minifyHtml    = require('gulp-minify-html'),
    es            = require('event-stream');

var paths = {
  appJavascript: ['app/js/app.js', 'app/js/**/*.js'],
  appTemplates:  'app/js/**/**.tpl.html',
  tmpFolder:     '.tmp',
  tmpJavascript: '.tmp/js'
};

gulp.task('scripts', function() {
  return gulp.src(paths.appJavascript.concat(paths.appTemplates))
    .pipe(gulpif(/html$/, buildTemplates()))
    .pipe(concat('app.js'))
    .pipe(gulp.dest(paths.tmpJavascript));
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