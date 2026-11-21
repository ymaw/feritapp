const assert = require('node:assert/strict');
const { pathToFileURL } = require('node:url');
const path = require('node:path');

process.env.TZ = 'America/Argentina/Buenos_Aires';

(async function() {
  const weekKeyUrl = pathToFileURL(path.join(__dirname, '..', 'js', 'utils', 'week-key.js'));
  const startOfWeekUrl = pathToFileURL(path.join(__dirname, '..', 'js', 'utils', 'start-of-week.js'));
  const { getWeekKey } = await import(weekKeyUrl.href);
  const { getStartOfWeek } = await import(startOfWeekUrl.href);
  const startOfWeek = function(value) {
    return getStartOfWeek(value, 1);
  };

  const sunday = new Date(2026, 10, 22, 15, 30);
  assert.equal(getWeekKey(sunday, { startOfWeek }), '2026-11-16');
  assert.equal(sunday.getDate(), 22, 'no debe mutar la fecha original');

  const monday = new Date(2026, 10, 16, 0, 0);
  assert.equal(getWeekKey(monday, { startOfWeek }), '2026-11-16');

  const nextMonday = new Date(2026, 10, 23, 23, 59);
  assert.equal(getWeekKey(nextMonday, { startOfWeek }), '2026-11-23');

  const sundayStart = function(value) {
    return getStartOfWeek(value, 0);
  };
  assert.equal(getWeekKey(sunday, { startOfWeek: sundayStart }), '2026-11-22');

  console.log('OK: clave semanal caracterizada para límites de semana y distintos días de inicio');
})().catch(function(error) {
  console.error(error);
  process.exitCode = 1;
});
