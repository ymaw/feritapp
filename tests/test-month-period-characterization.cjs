const assert = require('node:assert/strict');
const { pathToFileURL } = require('node:url');
const path = require('node:path');

(async function(){
  const moduleUrl = pathToFileURL(path.join(__dirname, '..', 'js', 'utils', 'month-period.js'));
  const { monthKey, monthLabel } = await import(moduleUrl.href);

  assert.equal(monthKey(new Date(2026, 0, 5)), '2026-01');
  assert.equal(monthKey(new Date(2026, 10, 20)), '2026-11');
  assert.equal(monthKey('2025-12-31T12:00:00'), '2025-12');
  assert.equal(monthLabel('2026-01'), 'enero 2026');
  assert.equal(monthLabel('2026-11'), 'noviembre 2026');
  assert.equal(monthLabel('2025-12'), 'diciembre 2025');
  assert.equal(monthLabel('2026-13'), 'undefined 2026');

  console.log('OK: utilidades de período mensual caracterizadas');
})().catch(function(error){
  console.error(error);
  process.exitCode = 1;
});
