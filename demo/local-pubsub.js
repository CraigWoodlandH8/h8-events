const Events = require('../lib/events.js');

var eventBus = new Events;

console.log('Demo Listener Once/On/Off & Publish');

var callback = (var1, var2) => {
  console.log('listener', var1, var2);
};

eventBus.local().on('test-event', callback);

eventBus.local().once('test-event', (var1, var2) => {
  console.log('onetime listener', var1, var2);
});

setTimeout(() => {
  console.log('1st Event Emitted');

  eventBus.local().emit('test-event', 'test1', { var1: null, var2: null });
}, 500);

setTimeout(() => {
  console.log('Removing event');

  eventBus.local().off('test-event', callback);
}, 750);

setTimeout(() => {
  console.log('2nd Event Emitted');

  eventBus.local().emit('test-event', 'test2', { var1: null, var2: null });
}, 1000);

setTimeout(() => {
  console.log('Adding event');

  eventBus.local().on('test-event', callback);
}, 1250);

setTimeout(() => {
  console.log('3rd Event Emitted');

  eventBus.local().emit('test-event', 'test3', { var1: null, var2: null });
}, 1500);

setTimeout(() => {
  process.exit(0);
}, 1750);
