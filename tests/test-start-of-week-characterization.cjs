const assert = require('node:assert/strict');
const { pathToFileURL } = require('node:url');
const path = require('node:path');

process.env.TZ = 'America/Argentina/Buenos_Aires';

(async function() {
  const moduleUrl = pathToFileURL(path.join(__dirname, '..', 'js', 'utils', 'start-of-week.js'));
  const { getStartOfWeek } = await import(moduleUrl.href);

  const sunday = new Date(2026, 10, 22, 15, 30);
  const mondayStart = getStartOfWeek(sunday, 1);
  assert.equal(mondayStart.getFullYear(), 2026);
  assert.equal(mondayStart.getMonth(), 10);
  assert.equal(mondayStart.getDate(), 16);
  assert.equal(mondayStart.getHours(), 0);
  assert.equal(mondayStart.getMinutes(), 0);
  assert.equal(sunday.getDate(), 22, 'no debe mutar la fecha original');

  const sundayStart = getStartOfWeek(sunday, 0);
  assert.equal(sundayStart.getDate(), 22);
  assert.equal(sundayStart.getHours(), 0);

  const saturdayStart = getStartOfWeek(sunday, 6);
  assert.equal(saturdayStart.getDate(), 21);

  const wednesday = new Date(2026, 10, 18, 9, 45);
  const customStart = getStartOfWeek(wednesday, 3);
  assert.equal(customStart.getDate(), 18);
  assert.equal(customStart.getHours(), 0);

  console.log('OK: inicio de semana caracterizado para distintos días de inicio');
})().catch(function(error) {
  console.error(error);
  process.exitCode = 1;
});
