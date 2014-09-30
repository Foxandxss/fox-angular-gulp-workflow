var gulp          = require('gulp'),
    gulpif        = require('gulp-if'),
    concat        = require('gulp-concat'),
    rimraf        = require('gulp-rimraf'),
    templateCache = require('gulp-angular-templatecache'),
    minifyHtml    = require('gulp-minify-html'),
    es            = require('event-stream'),
    sass          = require('gulp-sass'),
    jshint        = require('gulp-jshint'),
    rename        = require('gulp-rename'),
    ngAnnotate    = require('gulp-ng-annotate'),
    uglify        = require('gulp-uglify'),
    minifyCSS     = require('gulp-minify-css'),
    webserver     = require('gulp-webserver'),
    testem        = require('gulp-testem'),
    argv          = require('yargs').argv;

var paths = {
  appJavascript:    ['app/js/app.js', 'app/js/**/*.js'],
  appTemplates:     'app/js/**/*.tpl.html',
  appMainSass:      'app/scss/main.scss',
  appStyles:        'app/scss/**/*.scss',
  appImages:        'app/images/**/*',
  indexHtml:        'app/index.html',
  vendorJavascript: ['vendor/js/angular.js', 'vendor/js/**/*.js'],
  vendorCss:        ['vendor/css/**/*.css'],
  specFolder:       ['spec/**/*_spec.js'],
  tmpFolder:        'tmp',
  tmpJavascript:    'tmp/js',
  tmpCss:           'tmp/css',
  tmpImages:        'tmp/images',
  distFolder:       'dist',
  distJavascript:   'dist/js',
  distCss:          'dist/css',
  distImages:       'dist/images'
};

gulp.task('scripts', function() {
  return gulp.src(paths.vendorJavascript.concat(paths.appJavascript, paths.appTemplates))
    .pipe(gulpif(/html$/, buildTemplates()))
    .pipe(concat('app.js'))
    .pipe(gulpif(argv.production, ngAnnotate()))
    .pipe(gulpif(argv.production, uglify()))
    .pipe(gulpif(argv.production, gulp.dest(paths.distJavascript), gulp.dest(paths.tmpJavascript)));
});

gulp.task('styles', function() {
  return gulp.src(paths.vendorCss.concat(paths.appMainSass))
    .pipe(gulpif(/scss$/, sass()))
    .pipe(concat('app.css'))
    .pipe(gulpif(argv.production, minifyCSS()))
    .pipe(gulpif(argv.production, gulp.dest(paths.distCss), gulp.dest(paths.tmpCss)));
});

gulp.task('images', function() {
  return gulp.src(paths.appImages)
    .pipe(gulpif(argv.production, gulp.dest(paths.distImages), gulp.dest(paths.tmpImages)));
});

gulp.task('indexHtml', function() {
  return gulp.src(paths.indexHtml)
    .pipe(gulpif(argv.production, gulp.dest(paths.distFolder), gulp.dest(paths.tmpFolder)));
});

gulp.task('lint', function() {
  return gulp.src(paths.appJavascript.concat(paths.specFolder))
    .pipe(jshint())
    .pipe(jshint.reporter('jshint-stylish'));
});

gulp.task('testem', function() {
  return gulp.src(['']) // We don't need files, that is managed on testem.json
    .pipe(testem({
      configFile: 'testem.json'
    }));
});

gulp.task('clean', function() {
  return gulp.src([paths.tmpFolder, paths.distFolder], {read: false})
    .pipe(rimraf());
});

gulp.task('watch', ['webserver'], function() {
  gulp.watch(paths.appJavascript, ['lint', 'scripts']);
  gulp.watch(paths.appTemplates, ['scripts']);
  gulp.watch(paths.vendorJavascript, ['scripts']);
  gulp.watch(paths.appImages, ['images']);
  gulp.watch(paths.specFolder, ['lint']);
  gulp.watch(paths.indexHtml, ['indexHtml']);
  gulp.watch(paths.appStyles, ['styles']);
});

gulp.task('webserver', ['scripts', 'styles', 'images', 'indexHtml'], function() {
  gulp.src(paths.tmpFolder)
    .pipe(webserver({
      port: 5000,
      proxies: [
        {
          source: '/api', target: 'http://localhost:8080/api'
        }
      ]
    }));
});

gulp.task('default', ['watch']);

function buildTemplates() {
  return es.pipeline(
    minifyHtml({
      empty: true,
      spare: true,
      quotes: true
    }),
    templateCache({
      module: 'app'
    })
  );
}
