import Ember from 'ember';

var retried = false;
export default Ember.Route.extend({
  lazyLoader: Ember.inject.service(),
  beforeModel: function (transition) {
    if (retried) {
      // Shortcircuit this in case the download fails.
      retried = !retried;
      return;
    }
    retried = !retried;
    transition.abort();
    return this.get('lazyLoader').loadBundleForUrl(transition.intent.url).then(()=>{
      transition.retry();
      retried = false;  // reset this so we can transition to another lazy loaded section
      return {};
    });
  }
});
