class _events {
  setup(remote) {
    var localAdapter = require('./adapters/native.js');
    this.localAdapter = new localAdapter;

    if(remote == 'redis') {
      var remoteAdapter = require('./adapters/redis.js');
      this.remoteAdapter = new remoteAdapter;
    }

    return this;
  }

  local() {
    return this.localAdapter;
  }

  remote() {
    return this.remoteAdapter;
  }
}

module.exports = new _events;
