const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

(async function runToastCharacterizationTests() {
  const moduleUrl = pathToFileURL(path.join(__dirname, '..', 'js', 'ui', 'toast.js')).href;
  const { showToast } = await import(moduleUrl);
  const classes = new Set(['has-action']);
  const toast = {
    textContent: '',
    classList: {
      add(name) { classes.add(name); },
      remove(name) { classes.delete(name); },
      contains(name) { return classes.has(name); }
    }
  };
  const documentRef = { getElementById(id) {
    assert.equal(id, 'toast');
    return toast;
  }};
  const timers = [];
  const setTimeoutRef = (callback, delay) => {
    timers.push({ callback, delay });
    return timers.length;
  };

  showToast('Guardado', undefined, { documentRef, setTimeoutRef });
  assert.equal(toast.textContent, 'Guardado');
  assert.equal(classes.has('has-action'), false);
  assert.equal(classes.has('show'), true);
  assert.equal(timers[0].delay, 2200);
  timers[0].callback();
  assert.equal(classes.has('show'), false, 'toast hides after its default duration');

  showToast('Elemento eliminado', 3500, { documentRef, setTimeoutRef });
  assert.equal(timers[1].delay, 3500);
  classes.add('has-action');
  timers[1].callback();
  assert.equal(classes.has('show'), true, 'action toast remains visible while it has an action');

  showToast('Nuevo mensaje', 0, { documentRef, setTimeoutRef });
  assert.equal(timers[2].delay, 2200, 'zero duration preserves the original fallback');
  assert.equal(classes.has('has-action'), false, 'new toast clears previous action state');

  console.log('OK toast module: content, action reset, default/custom duration and action-preserving timeout.');
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
