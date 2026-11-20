const assert = require('node:assert/strict');
const { pathToFileURL } = require('node:url');
const path = require('node:path');

(async function() {
  const moduleUrl = pathToFileURL(path.join(__dirname, '..', 'js', 'ui', 'dashboard-expanders.js'));
  const { bindDashboardExpanders } = await import(moduleUrl.href);
  const listeners = {};
  const attributes = { 'data-dashboard-expand': 'weekly' };
  const trigger = {
    getAttribute(name) { return attributes[name] ?? null; },
    setAttribute(name, value) { attributes[name] = value; },
    addEventListener(name, callback) { listeners[name] = callback; }
  };
  const cardAttributes = { 'aria-expanded': 'false' };
  const card = {
    getAttribute(name) { return cardAttributes[name] ?? null; },
    setAttribute(name, value) { cardAttributes[name] = value; }
  };
  const details = { hidden: true };
  const selectors = [];
  const root = {
    querySelectorAll(selector) {
      assert.equal(selector, '[data-dashboard-expand]');
      return [trigger];
    },
    querySelector(selector) {
      selectors.push(selector);
      if (selector === '[data-dashboard-expand-card="weekly"]') return card;
      if (selector === '[data-dashboard-details="weekly"]') return details;
      return null;
    }
  };

  bindDashboardExpanders(root);
  assert.equal(typeof listeners.click, 'function');

  listeners.click();
  assert.equal(cardAttributes['aria-expanded'], 'true');
  assert.equal(attributes['aria-expanded'], 'true');
  assert.equal(details.hidden, false);

  listeners.click();
  assert.equal(cardAttributes['aria-expanded'], 'false');
  assert.equal(attributes['aria-expanded'], 'false');
  assert.equal(details.hidden, true);

  const missingRoot = {
    querySelectorAll() { return [{ ...trigger, addEventListener(name, callback) { callback(); } }]; },
    querySelector() { return null; }
  };
  assert.doesNotThrow(() => bindDashboardExpanders(missingRoot));
  assert.equal(selectors.length, 4);

  console.log('OK: comportamiento de expanders del dashboard caracterizado');
})().catch(function(error) {
  console.error(error);
  process.exitCode = 1;
});
