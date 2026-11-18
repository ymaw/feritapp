const path = require('node:path');
const { pathToFileURL } = require('node:url');
const assert = require('node:assert/strict');

(async function runFontScalePreferenceTests() {
  const moduleUrl = pathToFileURL(path.join(__dirname, '..', 'js', 'preferences', 'font-scale.js')).href;
  const { normalizeFontScale } = await import(moduleUrl);

  for (const scale of ['0.9', '1', '1.15', '1.3', '1.5']) {
    assert.equal(normalizeFontScale(scale), scale, `supported scale ${scale} must be preserved`);
  }

  assert.equal(normalizeFontScale(1.15), '1.15', 'numeric preset must be normalized to its string form');
  assert.equal(normalizeFontScale('1.2'), '1', 'unsupported scale must fall back to normal size');
  assert.equal(normalizeFontScale(''), '1', 'empty scale must fall back to normal size');
  assert.equal(normalizeFontScale(null), '1', 'null must fall back to normal size');
  assert.equal(normalizeFontScale(undefined), '1', 'undefined must fall back to normal size');

  console.log('OK font scale preferences: supported presets and safe fallback.');
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
