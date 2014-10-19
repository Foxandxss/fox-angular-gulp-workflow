var gulp               = require('gulp');
var plugins            = require('gulp-load-plugins')();
var es                 = require('event-stream');
var historyApiFallback = require('connect-history-api-fallback');

var config = {
  development: true
};

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
    .pipe(plugins.if(config.development, plugins.sourcemaps.init()))
    .pipe(plugins.concat('app.js'))
    .pipe(plugins.if(config.development, plugins.sourcemaps.write('.')))
    .pipe(plugins.if(!config.development, plugins.ngAnnotate()))
    .pipe(plugins.if(!config.development, plugins.uglify()))
    .pipe(plugins.if(config.development, gulp.dest(paths.tmpJavascript), gulp.dest(paths.distJavascript)))
    .pipe(plugins.connect.reload());
});

gulp.task('styles', function() {
  return gulp.src(paths.vendorCss.concat(paths.appMainSass))
    .pipe(plugins.if(/scss$/, plugins.sass()))
    .pipe(plugins.concat('app.css'))
    .pipe(plugins.if(!config.development, plugins.minifyCss()))
    .pipe(plugins.if(config.development, gulp.dest(paths.tmpCss), gulp.dest(paths.distCss)))
    .pipe(plugins.connect.reload());
});

gulp.task('images', function() {
  return gulp.src(paths.appImages)
    .pipe(plugins.if(config.development, gulp.dest(paths.tmpImages), gulp.dest(paths.distImages)))
    .pipe(plugins.connect.reload());
});

gulp.task('indexHtml', function() {
  return gulp.src(paths.indexHtml)
    .pipe(plugins.if(config.development, gulp.dest(paths.tmpFolder), gulp.dest(paths.distFolder)))
    .pipe(plugins.connect.reload());
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
  gulp.watch(paths.vendorCss, ['styles']);
});

gulp.task('webserver', ['scripts', 'styles', 'images', 'indexHtml'], function() {
  plugins.connect.server({
    root: paths.tmpFolder,
    port: 5000,
    livereload: true,
    middleware: function(connect, o) {
        return [ (function() {
            var url = require('url');
            var proxy = require('proxy-middleware');
            var options = url.parse('http://localhost:8080/api');
            options.route = '/api';
            return proxy(options);
        })(), historyApiFallback ];
    }
  });
});

gulp.task('set-production', function() {
  config.development = false;
});

gulp.task('default', ['watch']);
gulp.task('production', ['set-production', 'scripts', 'styles', 'images', 'indexHtml']);

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
