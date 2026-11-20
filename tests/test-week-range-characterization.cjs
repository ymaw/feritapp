const assert = require('node:assert/strict');
const { pathToFileURL } = require('node:url');
const path = require('node:path');

(async function() {
  const moduleUrl = pathToFileURL(path.join(__dirname, '..', 'js', 'utils', 'week-range.js'));
  const { formatRange, formatRangeShort } = await import(moduleUrl.href);

  assert.equal(formatRange('2026-11-16'), '16 nov – 22 nov');
  assert.equal(formatRangeShort('2026-11-16'), '16 nov');
  assert.equal(formatRange('2026-12-28'), '28 dic – 3 ene');
  assert.equal(formatRangeShort('2026-12-28'), '28 dic');
  assert.equal(formatRange('2026-01-26'), '26 ene – 1 feb');

  console.log('OK: formato de rangos semanales caracterizado');
})().catch(function(error) {
  console.error(error);
  process.exitCode = 1;
});
