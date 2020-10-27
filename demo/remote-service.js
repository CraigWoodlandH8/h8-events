const Events = require('../lib/events.js');

var eventBus = new Events;

console.log('Demo Services Provide/Call');

console.log('Test Service Provide Registered');

eventBus.remote().provide('test-service', (cb, var1, var2) => {
  console.log('Test Service Provide Received', var1, var2);

  setTimeout(() => {
    console.log('Test Service Provide Responded');

    cb({
      response1: null,
      response2: null
    });
  }, 2000);
});

setTimeout(() => {
  console.log('Test Service Call Called');

  eventBus.remote().call('test-service', 'var1', 'var2').then((res) => {
    console.log('Test Service Call Response', res);
  }).catch((err) => {
    console.log('Test Service Call Error', err);
  });
}, 500);
