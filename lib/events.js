class _events {
  constructor() {
    var localAdapter = require('./adapters/native.js');
    var remoteAdapter = require('./adapters/redis.js');

    this.localAdapter = new localAdapter;
    this.remoteAdapter = new remoteAdapter;
  }

  local() {
    return this.localAdapter;
  }

  remote() {
    return this.remoteAdapter;
  }
}

module.exports = new _events;
