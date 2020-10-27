const EventEmitter = require('events');

class native extends EventEmitter {
  constructor(props) {
    super(props);

    this.services = [];
  }

  provide(name, callback) {
    if(this.services[name] !== undefined) {
      throw "Service already provided";
    }

    this.services[name] = callback;
  }

  call(...args) {
    var name = args[0];

    if(this.services[name] === undefined) {
      throw "Service not yet provided";
    }

    return new Promise((resolve, reject) => {
      args[0] = resolve;

      this.services[name](...args);
    });
  }
}

module.exports = native;
