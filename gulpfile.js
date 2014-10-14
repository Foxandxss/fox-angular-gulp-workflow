var gulp    = require('gulp');
var plugins = require('gulp-load-plugins')();
var es      = require('event-stream');
var argv    = require('yargs').argv;

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
  tmpAppJs:         'tmp/js/app.js',
  tmpCss:           'tmp/css',
  tmpImages:        'tmp/images',
  distFolder:       'dist',
  distJavascript:   'dist/js',
  distCss:          'dist/css',
  distImages:       'dist/images'
};

gulp.task('scripts', function() {
  return gulp.src(paths.vendorJavascript.concat(paths.appJavascript, paths.appTemplates))
    .pipe(plugins.if(/html$/, buildTemplates()))
    .pipe(plugins.concat('app.js'))
    .pipe(plugins.if(argv.production, plugins.ngAnnotate()))
    .pipe(plugins.if(argv.production, plugins.uglify()))
    .pipe(plugins.if(argv.production, gulp.dest(paths.distJavascript), gulp.dest(paths.tmpJavascript)));
});

gulp.task('styles', function() {
  return gulp.src(paths.vendorCss.concat(paths.appMainSass))
    .pipe(plugins.if(/scss$/, plugins.sass()))
    .pipe(plugins.concat('app.css'))
    .pipe(plugins.if(argv.production, plugins.minifyCss()))
    .pipe(plugins.if(argv.production, gulp.dest(paths.distCss), gulp.dest(paths.tmpCss)));
});

gulp.task('images', function() {
  return gulp.src(paths.appImages)
    .pipe(plugins.if(argv.production, gulp.dest(paths.distImages), gulp.dest(paths.tmpImages)));
});

gulp.task('indexHtml', function() {
  return gulp.src(paths.indexHtml)
    .pipe(plugins.if(argv.production, gulp.dest(paths.distFolder), gulp.dest(paths.tmpFolder)));
});

gulp.task('lint', function() {
  return gulp.src(paths.appJavascript.concat(paths.specFolder))
    .pipe(plugins.jshint())
    .pipe(plugins.jshint.reporter('jshint-stylish'));
});

gulp.task('testem', function() {
  return gulp.src(['']) // We don't need files, that is managed on testem.json
    .pipe(plugins.testem({
      configFile: 'testem.json'
    }));
});

gulp.task('clean', function() {
  return gulp.src([paths.tmpFolder, paths.distFolder], {read: false})
    .pipe(plugins.rimraf());
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
    .pipe(plugins.webserver({
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
    plugins.minifyHtml({
      empty: true,
      spare: true,
      quotes: true
    }),
    plugins.angularTemplatecache({
      module: 'app'
    })
  );
}
