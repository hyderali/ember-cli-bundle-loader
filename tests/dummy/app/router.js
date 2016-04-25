import LazyRouter from 'ember-cli-bundle-loader/lazy-router';
import config from './config/environment';

const Router = LazyRouter.extend({
  location: config.locationType
});

Router.map(function() {
  this.route('boot');
  this.route('package1');
  this.route('package2');
});

export default Router;
