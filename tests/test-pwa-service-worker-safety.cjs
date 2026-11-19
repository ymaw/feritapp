const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');

(async function runPwaServiceWorkerSafetyTests() {
  const source = fs.readFileSync(path.join(__dirname, '..', 'sw.js'), 'utf8');
  const listeners = {};
  let skipWaitingCalls = 0;
  let clientsClaimCalls = 0;
  let cacheKeysCalls = 0;
  let cacheDeleteCalls = 0;

  const self = {
    addEventListener(name, callback) { listeners[name] = callback; },
    skipWaiting() { skipWaitingCalls += 1; return Promise.resolve(); },
    clients: {
      claim() {
        clientsClaimCalls += 1;
        return Promise.resolve();
      }
    }
  };
  const caches = {
    keys() {
      cacheKeysCalls += 1;
      return Promise.resolve(['another-app-cache']);
    },
    delete() {
      cacheDeleteCalls += 1;
      return Promise.resolve(true);
    }
  };

  vm.runInNewContext(source, { self, caches }, { filename: 'sw.js' });

  assert.equal(typeof listeners.install, 'function', 'install listener remains registered');
  assert.equal(typeof listeners.activate, 'function', 'activate listener remains registered');

  listeners.install({});
  assert.equal(skipWaitingCalls, 1, 'install continues to activate the worker promptly');

  let activationPromise;
  listeners.activate({
    waitUntil(promise) { activationPromise = promise; }
  });
  assert.ok(activationPromise && typeof activationPromise.then === 'function',
    'activation work is attached to waitUntil');
  await activationPromise;

  assert.equal(clientsClaimCalls, 1, 'activation claims existing clients');
  assert.equal(cacheKeysCalls, 0, 'activation never enumerates origin-wide caches');
  assert.equal(cacheDeleteCalls, 0, 'activation never deletes caches owned by other features');

  console.log('OK PWA service worker: install/activation preserved and shared Cache Storage untouched.');
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
