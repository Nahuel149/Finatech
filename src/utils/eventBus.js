const { EventEmitter } = require('events');

const BALANCE_UPDATED_EVENT = 'balances.updated';

class AppEventBus extends EventEmitter {}

const eventBus = new AppEventBus();

const emitBalanceUpdated = (payload = {}) => {
  eventBus.emit(BALANCE_UPDATED_EVENT, {
    ...payload,
    emittedAt: new Date().toISOString(),
  });
};

const subscribeBalanceUpdated = (listener) => {
  eventBus.on(BALANCE_UPDATED_EVENT, listener);
  return () => eventBus.off(BALANCE_UPDATED_EVENT, listener);
};

module.exports = {
  eventBus,
  BALANCE_UPDATED_EVENT,
  emitBalanceUpdated,
  subscribeBalanceUpdated,
};
