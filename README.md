
# Ember-cli-bundle-loader [![Build Status](https://travis-ci.org/MiguelMadero/ember-cli-bundle-loader.svg?branch=master)](https://travis-ci.org/MiguelMadero/ember-cli-bundle-loader) [![Download count all time](https://img.shields.io/npm/dt/ember-cli-bundle-loader.svg)](https://www.npmjs.com/package/ember-cli-bundle-loader) [![Ember Observer Score](http://emberobserver.com/badges/ember-cli-bundle-loader.svg)](http://emberobserver.com/addons/ember-cli-bundle-loader)

[![Code Climate](https://codeclimate.com/github/MiguelMadero/ember-cli-bundle-loader/badges/gpa.svg)](https://codeclimate.com/github/MiguelMadero/ember-cli-bundle-loader)
[![Test Coverage](https://codeclimate.com/github/MiguelMadero/ember-cli-bundle-loader/badges/coverage.svg)](https://codeclimate.com/github/MiguelMadero/ember-cli-bundle-loader/coverage)
[![Dependency Status](https://www.versioneye.com/user/projects/57df010fbf3e4c0034e22b35/badge.svg?style=flat-square)](https://www.versioneye.com/user/projects/57df010fbf3e4c0034e22b35)
[![Dependency Status](https://www.versioneye.com/user/projects/57df010b037c2000475cd3e9/badge.svg?style=flat-square)](https://www.versioneye.com/user/projects/57df010b037c2000475cd3e9)
[![npm version](https://badge.fury.io/js/ember-cli-bundle-loader.svg)](https://badge.fury.io/js/ember-cli-bundle-loader)

This project lets you build your app in different packages and load those packages lazily. The main goal of this is faster boot times for large applications, but it can also help with independentl build and deployments for different sub-products or sections of your app. 

You can see a demo live on http://miguelmadero.com/ember-cli-bundle-loader/

## How it works

We treat each package as an EmberApp, each of them will have its own JS and CSS output. For each package, it also changes certain things to avoid unnecessary processing of addons to get faster builds for packages.

## Installation

```
ember install MiguelMadero/ember-cli-bundle-loader # follow the prompts and diff
ember generate package package-name
```

On a new app, simply override all the files when prompted during the `ember install` step. For existing apps, you can do a diff of each file. Most of the changes are simple and you can see an [example diff](https://github.com/MiguelMadero/ember-cli-bundle-loader-consumer/commit/d5791080ef915d84b7095e261701134267a73fd8). 

Now you can add routes to the main app (`app/router.js`) and to each package `(package-name/router.js`). Additionally, you will need to edit `config/bundles.js` with information about your package and the routes it handles. 

## File Structure

### Current Ember Apps

The typical output of an Ember App looks something like:

- dist/
  - index.html
  - assets/
    app.js
    app.css
    vendor.js
    vendor.css

### Output of Packages with this addon

- dist/
  - index.html
  - assets/
    boot.js
    boot.css
    package1.js
    package1.css
    package2.js
    package2.css
    vedor.js*
    vendor.csss

\* We could also break vendor into smaller assets and define them as a dependency. More on this later. 

### Source File Structure

- app/
  - index.html, *router.js*, resolver.js, app.js
  - routes/, controllers/, helpers/, models/, styles/, templates/, etc/
  - pods/ 
- config
  - environment.js 
  - bundles.js (new)
  - package-names.js (new)
- packages (new)
  - package-name/
    - index.html, *router.js*, resolver.js, app.js
    - routes/, controllers/, helpers/, models/, styles/, templates/, etc/
    - pods/ 
  - another-package/
      - index.html, router.js, resolver.js, app.js
      - routes/, controllers/, helpers/, models/, styles/, templates/, etc/
      - pods/ 

The app folder is identical to a normal EmberApp, it is, in fact just a normal EmberApp. This app is responsible for the booting everything. Only put here anything that is strictly required to get to the first page(s) or whatever is more important for a first time load. For example, your login page, the navbar, the default landing page. Each app will have different requirements, but the guidance is to keep it small. Initializers also have to be here since packages won't be available when we create the app. We could, in theory, lazy load initializers, but that doesn't make a lot of sense, so I have not tested it.

There is a new top-level folder called `packages`, each package is like a normal EmberApp, with the exception that we don't need an index.html and we can't initializers. In the future this packages will become engines.

Tests. Currently, all tests live under the traditional folders. It is suggested to create sub-folders like `tests/unit/package-name/` to provide some separation. In the future, tests for a package will move under each package folder. (Future: `packages/my-package/tests` and `packages/my-package/app`). In-repo-addons and engine have the same problem today see [issues#4461](https://github.com/ember-cli/ember-cli/issues/4461).

### JS

All the JS modules are namespaced with the package name. For example, the route defined in `package1/routes/package1.js` is defined as `define('package1/routes/package1'` in the output code. This is because that's simply the name of the app when building. That gives us the advantage of being explicit about the way we consume and refer in code. However, this also requires a new resolver that can lookup for routes under the packages see `app/resolvers/packages.js` for more info. Please be aware of this namespace, it's especially important for `utils` or any other code that you import, for a hypothetical date-formatter utility under `package1/utils/date-formatter` will be imported as `import dateFormatter from 'package1/utils/date-formatter'`. Please be aware of this for tests.

#### Vendor assets

[ ] TODO: test
 We can define vendor assets as dependencies. Today, ember-cli supports specifying an `outputFile` when calling `app.import`. This works with static libraries and we'll add support to do it for addons. Once you have different vendor assets, you can simply define them as dependencies in `config/bundles.js`. For example:

```
// ember-cli-build.js
var EmberAppWithPackages = require('./lib/broccoli/ember-app-with-packages');
module.exports = function (defaults) {
 var app = new EmberAppWithPackages(defaults);
 app.import('bower_components/moment/moment.js', {outputFile: 'vendor2.js'});
 app.import('bower_components/lodash/lodash.js', {outputFile: 'vendor3.js'});
 return app.toTree();
};

// /config/bundles.js
module.exports = [{
    name: 'package1',
    routeNames: ['^package1']
    dependsOn: ['assets/vendor3.js']
  }, {
    name: 'package2',
    routeNames: ['^package2']
    dependsOn: ['assets/vendor2.js', 'package1']
}];
```

Based on the example above, when we go to `/package2`, we will load `vendor2.js`, `package1.js` and `vendor3.js`, only if they have not been loaded before. While the lbiraries are loaded in parallel, they will be executed in the order they were definied. 

#### Vendor assets from components

Sometimes we can't depend on routes to load the packages, but instead, 
components are the ones that depend on a vendor lib. In this case
they're responsible of initiating the load and providing a "loading" state. 
The following is an example using handsontable as a reference, assumine
we have a handsontable wrapper:

```
// components/handson-table.js
export default Ember.Component.extend({
  lazyLoader: Ember.inject.service(),
  init () {
    this._super.apply(this, arguments);
    this.get('lazyLoader').loadBundle('handsontable').then(() =>  
      this.initHandsOnTableInstance());
  },
  didInsertElement () {
    this.get('isInDom', true);
    this.initHandsOnTableInstance();
  },
  initHandsOnTableInstance () {
    if (this.get('lazyLoader').isBundleLoaded('handsontable') && this.get('isInDom')) {
      // actual initialization of the wrapper
      // Often components need to wait for didInsert, in this case we need both, didInsert/
      // and loading the assets.
    }
  }
})
```

On the HBS for the wrapper: 

```
{{#if lazyLoader.loadedBundles.handsontable}}
  {{!-- markup for handsontable --}}
{{else}}
  <div class="loading">Loading<div>
{{/if}}
```

In config/bundles.js

```
module.exports = [
  {
    // Other bundles here...
  // Vendor bundles
  }, {
    name: 'handsontable',
    urls: ['/assets/handsontable.js', '/assets/handsontable.css']
  }
];

```

In ember-cli-build.js

```
app.import('/bower_components/handsontable/handsontable.full.min.js', {outputFile: 'handsontable.js')
app.import('/bower_components/handsontable/handsontable.full.min.css', {outputFile: 'handsontable.css')
```

#### Potential issues

The config/environment lives under `[modulePrefix]/config/environment`, which means it has the same path for every package. This is fine in most cases except if you're planning to share your packages across applications.

### CSS

This demo uses ember-cli-sass, but the same technique would work with vanilla CSS (but please use a pre-processor) or Less. Is not tested with postCSS, but it isn't tested.

## Deploy

To deploy the dummy app, with examples for lazy-loading, you can use `ember deploy development`, this will publish it to http://miguelmadero.com/ember-cli-bundle-loader/


## Disclaimer

*Note:* there is a ton of overlap with the work being done for * [ember engines](https://github.com/dgeb/ember-engines). While you might find this interesting, I strongly recommend you NOT to use these techniques and instead wait for ember-engines unless you're really desperate (like I am) to get lazy loading.

## Running Tests

* `npm test` (Runs `ember try:testall` to test your addon against multiple Ember versions)
* `ember test`
* `ember test --server`

## References

* [Ember-engines](https://github.com/dgeb/ember-engines). The "official" path going forward
* [Ember-cli-lazy-load](https://github.com/duizendnegen/ember-cli-lazy-load). Another approach to lazy loading. Bundle-loader and lazy-load might merge in the future and both eventually deprecated in favor of engines. 
