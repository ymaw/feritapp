const path = require('node:path');
const { pathToFileURL } = require('node:url');
const assert = require('node:assert/strict');

(async function runThemePreferenceTests() {
  const moduleUrl = pathToFileURL(path.join(__dirname, '..', 'js', 'preferences', 'theme.js')).href;
  const { resolveThemeIsDark } = await import(moduleUrl);

  assert.equal(resolveThemeIsDark('dark', false), true, 'dark preference must force dark mode');
  assert.equal(resolveThemeIsDark('dark', true), true, 'dark preference must ignore system light mode');
  assert.equal(resolveThemeIsDark('light', true), false, 'light preference must force light mode');
  assert.equal(resolveThemeIsDark('light', false), false, 'light preference must ignore system dark mode');
  assert.equal(resolveThemeIsDark('system', true), true, 'system preference must follow dark system mode');
  assert.equal(resolveThemeIsDark('system', false), false, 'system preference must follow light system mode');

  console.log('OK theme preferences: explicit light/dark and system resolution.');
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
