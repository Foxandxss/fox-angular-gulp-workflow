var gulp               = require('gulp');
var fs                 = require('fs');
var plugins            = require('gulp-load-plugins')();
var es                 = require('event-stream');
var del                = require('del');
var historyApiFallback = require('connect-history-api-fallback');

var vendor             = require('./vendor/manifest');

var paths = {
  appJavascript:    ['app/js/app.js', 'app/js/**/*.js'],
  appTemplates:     'app/js/**/*.tpl.html',
  appMainSass:      'app/scss/main.scss',
  appStyles:        'app/scss/**/*.scss',
  appImages:        'app/images/**/*',
  indexHtml:        'app/index.html',
  vendorFonts:      vendor.fonts || [],
  vendorJavascript: vendor.javascript || [],
  vendorCss:        vendor.css || [],
  finalAppJsPath:   '/js/app.js',
  finalAppCssPath:  '/css/app.css',
  specFolder:       ['spec/**/*_spec.js'],
  tmpFolder:        'tmp',
  tmpJavascript:    'tmp/js',
  tmpAppJs:         'tmp/js/app.js',
  tmpCss:           'tmp/css',
  tmpFonts:         'tmp/fonts',
  tmpImages:        'tmp/images',
  distFolder:       'dist',
  distJavascript:   'dist/js',
  distCss:          'dist/css',
  distFonts:        'dist/fonts',
  distImages:       'dist/images',
  distJsManifest:   'dist/js/rev-manifest.json',
  distCssManifest:  'dist/css/rev-manifest.json'
};

gulp.task('scripts-dev', function() {
  return gulp.src(paths.vendorJavascript.concat(paths.appJavascript, paths.appTemplates))
    .pipe(plugins.if(/html$/, buildTemplates()))
    .pipe(plugins.sourcemaps.init())
    .pipe(plugins.concat('app.js'))
    .pipe(plugins.sourcemaps.write('.'))
    .pipe(gulp.dest(paths.tmpJavascript))
    .pipe(plugins.connect.reload());
});
gulp.task('scripts-prod', function() {
  return gulp.src(paths.vendorJavascript.concat(paths.appJavascript, paths.appTemplates))
    .pipe(plugins.if(/html$/, buildTemplates()))
    .pipe(plugins.concat('app.js'))
    .pipe(plugins.ngAnnotate())
    .pipe(plugins.uglify())
    .pipe(plugins.rev())
    .pipe(gulp.dest(paths.distJavascript))
    .pipe(plugins.rev.manifest({path: 'rev-manifest.json'}))
    .pipe(gulp.dest(paths.distJavascript));
});

gulp.task('styles-dev', function() {
  return gulp.src(paths.vendorCss.concat(paths.appMainSass))
    .pipe(plugins.if(/scss$/, plugins.sass()))
    .pipe(plugins.concat('app.css'))
    .pipe(gulp.dest(paths.tmpCss))
    .pipe(plugins.connect.reload());
});

gulp.task('styles-prod', function() {
  return gulp.src(paths.vendorCss.concat(paths.appMainSass))
    .pipe(plugins.if(/scss$/, plugins.sass()))
    .pipe(plugins.concat('app.css'))
    .pipe(plugins.cleanCss())
    .pipe(plugins.rev())
    .pipe(gulp.dest(paths.distCss))
    .pipe(plugins.rev.manifest({path: 'rev-manifest.json'}))
    .pipe(gulp.dest(paths.distCss));
});

gulp.task('fonts-dev', function() {
  return gulp.src(paths.vendorFonts)
    .pipe(gulp.dest(paths.tmpFonts));
});

gulp.task('fonts-prod', function() {
  return gulp.src(paths.vendorFonts)
    .pipe(gulp.dest(paths.distFonts));
});

gulp.task('images-dev', function() {
  return gulp.src(paths.appImages)
    .pipe(gulp.dest(paths.tmpImages))
    .pipe(plugins.connect.reload());
});

gulp.task('images-prod', function() {
  return gulp.src(paths.appImages)
    .pipe(gulp.dest(paths.distImages));
});

gulp.task('indexHtml-dev', ['scripts-dev', 'styles-dev'], function() {
  var manifest = {
    js: paths.finalAppJsPath,
    css: paths.finalAppCssPath
  };

  return gulp.src(paths.indexHtml)
    .pipe(plugins.template({css: manifest['css'], js: manifest['js']}))
    .pipe(gulp.dest(paths.tmpFolder))
    .pipe(plugins.connect.reload());
});

gulp.task('indexHtml-prod', ['scripts-prod', 'styles-prod'], function() {
  var jsManifest  = JSON.parse(fs.readFileSync(paths.distJsManifest, 'utf8'));
  var cssManifest = JSON.parse(fs.readFileSync(paths.distCssManifest, 'utf8'));

  var manifest = {
    js: '/js/' + jsManifest['app.js'],
    css: '/css/' + cssManifest['app.css']
  };

  return gulp.src(paths.indexHtml)
    .pipe(plugins.template({css: manifest['css'], js: manifest['js']}))
    .pipe(plugins.rename('index.html'))
    .pipe(gulp.dest(paths.distFolder));
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

gulp.task('clean', function(cb) {
  del([paths.tmpFolder, paths.distFolder], cb);
});

gulp.task('watch', ['webserver'], function() {
  gulp.watch(paths.appJavascript, ['lint', 'scripts-dev']);
  gulp.watch(paths.appTemplates, ['scripts-dev']);
  gulp.watch(paths.vendorJavascript, ['scripts-dev']);
  gulp.watch(paths.appImages, ['images-dev']);
  gulp.watch(paths.specFolder, ['lint']);
  gulp.watch(paths.indexHtml, ['indexHtml-dev']);
  gulp.watch(paths.appStyles, ['styles-dev']);
  gulp.watch(paths.vendorCss, ['styles-dev']);
});

gulp.task('webserver', ['indexHtml-dev', 'fonts-dev', 'images-dev'], function() {
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
      })(), historyApiFallback() ];
    }
  });
});

gulp.task('default', ['watch']);
gulp.task('production', ['scripts-prod', 'styles-prod', 'fonts-prod', 'images-prod', 'indexHtml-prod']);

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
