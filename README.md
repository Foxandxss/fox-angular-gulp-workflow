# Fox's Angular.js Gulp Workflow

[![devDependency Status](https://david-dm.org/Foxandxss/fox-angular-gulp-workflow/dev-status.svg)](https://david-dm.org/Foxandxss/fox-angular-gulp-workflow#info=devDependencies)

**If you would like a modern workflow using ES6, use my [webpack boilerplate](https://github.com/Foxandxss/angular-webpack-workflow)**

Here is *yet another opinionated angular boilerplate* with how I work with Angular. I made it for myself but if you find that my opinions are good for you, feel free to use it and collaborate with issues or pull requests.

Let's start with the `app` folder:

![App folder](http://i.imgur.com/Fppy0Ge.png)

In the `app` folder you can find 3 subdirectories:

* **images**: You can put there the images you need, nothing special here.
* **scss**: There is a `main.scss` file there were you import all your other `.scss` files.
* **js**: There is where you put your javascript code. It comes with a `app.js` file with the main `app` module created.

You can also find:

**index.html**: It is only the basic skeleton with the angular application loaded. It is a `lodash template` so we can have cache-busting on production.

## Structuring your Angular app in the `js` folder.

We split our application per `features`, so if we have an application to manage `users`, we can decide that a page to manage those `users` is a feature and also the `settings` page is another feature. Also we need some authentication services and stuff like that. That is not a feature of our app, but something **common** to the entire app. How can we organize that?

![App structure](http://i.imgur.com/RtlhXuE.png)

Looking at the image, we can see that `features` folder where we put all our features. We create a subdirectory with the feature name and then inside a `javascript` file to code that feature and also a `.tpl.html` file for its template. the `.tpl.html` is my convention, you can change that in the `gulpfile.js`.

If a feature gets big enough, you can create multiple `.js` files, that is not a problem.

For **common** stuff, we created a `common` folder where we can put all our `services` and `directives`. Notice how I put the `foo` directive template inside the same folder.

The workflow won't force you to use this structure, the only forced convention here is to put your templates under `/js` and not under `/templates` or something like that. Also the extension being `*.tpl.html` is needed (again, easy to change in the `gulpfile.js`). Leaving that aside, you're free to code your app in the way you like.

```javascript
appTemplates:     'app/js/**/*.tpl.html',
```

## Testing your app

The only convention here is to name your tests like: `*_spec.js`. Leaving that aside, you can structure it the way you like.

You can do it per features like our main code or organize them per type (`controllers`, `directives`, etc.).

As a test runner we are using `test'em`, `jasmine 2` as the framework of choice and `Chrome` to run the tests. You can change `jasmine` and `Chrome` in `testem.json`.

```json
{
  "framework" : "jasmine2",
  "launch_in_dev" : ["Chrome"],
  "src_files" : [
    "tmp/js/app.js",
    "vendor/angular-mocks/angular-mocks.js",
    "spec/**/*_spec.js"
  ]
}
```

## Talking with the backend

Our angular app will run on the port `5000` and by default all the requests to the backend are going to use a `proxy` to the port `8080`. How does that work?

Imagine you have a `Rails` backend (the workflow is backend agnostic) running on port `8080` and it serves some `users` information at `/api/users`. Since the `Rails` app runs on port `8080` and our `Angular` app runs on the port `5000` we would need to do something like:

```javascript
$http.get('localhost:8080/api/users');
```
And then activate `CORS` in our `Rails` app. That is not needed here, we can safely do:

```javascript
$http.get('/api/users');
```
Without any need of `CORS`. Thanks to our `proxy`, our `Angular` app will think that the backend is running in the same domain and port so if we deploy both application together (like putting our `angular` app into `Rails'` `/public` directory) we don't need to change anything in our code.

```javascript
gulp.task('webserver', ['indexHtml-dev', 'images-dev'], function() {
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
```

There you change our app port and also the port where our backend is running. Also notice that the requests that goes through the `proxy` are the ones that starts with `/api`.

## The gulp tasks

To run our tasks and watch for file changes, we just need to run:

```
$ gulp
```

That will generate a `tmp` folder with all our `javascript` files concatenated in one central place. That free us of having to create a `<script>` tag for every javascript we create. Also, our `templates` are going to be cached in `$templateCache` and also appended to the main `app.js` file.

Also that will compile our `scss`, move our images and compile our `index.hbs`, run the webserver and watch for file changes.

All our `javascript` are going to be linted by `jshint`.

To run our tests, having that `gulp` watching our files for changes, we can do in another terminal:

```
$ gulp testem
```
That will fire `test'em` which will grab all our changes and re-run the tests.

## Compiling your project for production

When you finish your project and you need to generate the final result with all your assets minified and your Angular annotated (for minification purposes), you can do:

```
$ gulp production
```

That will generate a `dist` folder and you can safely move its content to a backend `/public` folder or serve it as is.

## Managing vendors

For the vendors this workflow uses `bower`.

All the bower packages are installed directly on `/vendor` so if you want to install `angular-toastr` for example, you only need to:

```
$ bower install angular-toastr --save
```

That will install `angular-toastr` on `/vendor` and also save it on the `bower.json`.

Then you will need to tell `Gulp` that you want to load it, for that you need to open `/vendor/manifest.js` and modify it like:

```javascript
exports.javascript = [
  'vendor/angular/angular.js',
  'vendor/lodash/dist/lodash.js',
  'vendor/angular-toastr/dist/angular-toastr.js'
];
```

There is also a `css` array:

```javascript
exports.css = [

];
```

By default this project comes with `angular` and `lodash` already loaded for you.

**NOTE**: `npm install` will also do a `bower install`.

## Known Issues

Sometimes when adding new files (and the watch is running) you can see errors regarding sourcemaps. A restart of gulp fix that.

## TODO

* Proxying for sockets
* If you add new stuff to `/vendor/manifest.js` you will need to restart `Gulp`.
* Fix possible issues, this need to be used on real projects yet :P
* Anything you want?
