const redis = require('redis');
const uniqid = require('uniqid');

class redisAdapter {
  constructor() {
    this.subscriberCallbacks = {};
    this.subscriberOnetimeCallbacks = {};
    this.uniqueString = 'N3H5NNTSH7';
    this.serviceCallbacks = {};
    this.serviceRequests = {};

    var connection = {
      port: 6379,
      host: 'localhost'
    };

    this.publisherClient = redis.createClient(connection);

    this.subscriberClient = redis.createClient(connection);

    var parent = this;

    this.subscriberClient.on("message", function(channel, message) {
      //console.log('[REDIS][LISTEN]', channel, message);

      message = JSON.parse(message);

      if(parent.subscriberCallbacks[channel] !== undefined) {
        for(var i in parent.subscriberCallbacks[channel]) {
          parent.subscriberCallbacks[channel][i](...message)
        }
      }

      if(parent.subscriberOnetimeCallbacks[channel] !== undefined) {
        for(var i in parent.subscriberOnetimeCallbacks[channel]) {
          parent.subscriberOnetimeCallbacks[channel][i](...message)
        }

        parent.subscriberOnetimeCallbacks[channel] = [];
      }

      if(channel.substring(0, 12) == 'SC' + parent.uniqueString) {
        var serviceName = channel.substring(parent.uniqueString.length + 3),
            requestId = message.requestId;

        if(parent.serviceCallbacks[serviceName] === undefined) {
          parent.subscriberClient.unsubscribe(channel);

          return;
        }

        parent.publisherClient.publish('SA' + parent.uniqueString + '_' + serviceName, JSON.stringify({
          requestId: requestId
        }));

        var args = message.args;

        args.unshift((res) => {
          var response = {
            requestId: message.requestId,
            args: res
          };

          parent.publisherClient.publish('SR' + parent.uniqueString + '_' + serviceName, JSON.stringify(response));
        });

        parent.serviceCallbacks[serviceName](...args);
      } else if(channel.substring(0, 12) == 'SA' + parent.uniqueString) {
        var serviceName = channel.substring(parent.uniqueString.length + 3),
            requestId = message.requestId;

        try {
          parent.serviceRequests[serviceName][requestId].acknowledge();
        } catch(err) {
          throw "Unable to process service acknowledgement";
        }

        parent.subscriberClient.unsubscribe(channel);
      } else if(channel.substring(0, 12) == 'SR' + parent.uniqueString) {
        var serviceName = channel.substring(parent.uniqueString.length + 3),
            requestId = message.requestId;

        try {
          parent.serviceRequests[serviceName][requestId].resolve(message.args);
        } catch(err) {
          throw "Unable to process service acknowledgement";
        }

        parent.subscriberClient.unsubscribe(channel);
      }
    });
  }

  emit(...args) {
    var name = args[0];

    args.shift();

    this.publisherClient.publish(name, JSON.stringify(args));
  }

  on(name, callback) {
    if(this.subscriberCallbacks[name] === undefined) {
      this.subscriberCallbacks[name] = [];
    }

    this.subscriberCallbacks[name].push(callback);

    this.subscriberClient.subscribe(name);
  }

  off(name, callback) {
    if(this.subscriberCallbacks[name] === undefined) {
      return;
    }

    for(var i in this.subscriberCallbacks[name]) {
      if(this.subscriberCallbacks[name][i] == callback) {
        this.subscriberCallbacks[name].splice(i, 1);
      }
    }
  }

  once(name, callback) {
    if(this.subscriberOnetimeCallbacks[name] === undefined) {
      this.subscriberOnetimeCallbacks[name] = [];
    }

    this.subscriberOnetimeCallbacks[name].push(callback);

    this.subscriberClient.subscribe(name);
  }

  provide(name, callback) {
    this.serviceCallbacks[name] = callback;

    this.subscriberClient.subscribe('SC' + this.uniqueString + '_' + name);
  }

  call(...args) {
    var parent = this;

    return new Promise((resolve, reject) => {
      var name = args[0],
          requestChannel = 'SC' + parent.uniqueString + '_' + name,
          responseChannel = 'SR' + parent.uniqueString + '_' + name,
          acknowledgeChannel = 'SA' + parent.uniqueString + '_' + name,
          requestId = uniqid();

      args.shift();

      var request = { requestId: requestId, args: args };

      var isAcknowledged = false;

      if(parent.serviceRequests[name] === undefined) {
        parent.serviceRequests[name] = {};
      }

      parent.serviceRequests[name][requestId] = {
        acknowledge: () => {
          isAcknowledged = true;
        },
        resolve: resolve,
        reject: reject
      }

      parent.subscriberClient.subscribe(acknowledgeChannel, () => {
        parent.subscriberClient.subscribe(responseChannel, () => {
          parent.publisherClient.publish(requestChannel, JSON.stringify(request), () => {
            setTimeout(() => {
              if(isAcknowledged) {
                return;
              }

              reject('Service is not currently being provided or responding');
            }, 2000);
          });
        });
      });
    });
  }
}

module.exports = redisAdapter;
