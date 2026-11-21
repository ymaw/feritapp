const assert = require('node:assert/strict');
const { pathToFileURL } = require('node:url');
const path = require('node:path');

process.env.TZ = 'America/Argentina/Buenos_Aires';

(async function() {
  const moduleUrl = pathToFileURL(path.join(__dirname, '..', 'js', 'utils', 'previous-week-key.js'));
  const { getPreviousWeekKey } = await import(moduleUrl.href);

  function startOfWeek(value) {
    const date = new Date(value);
    const diff = (date.getDay() + 6) % 7;
    date.setDate(date.getDate() - diff);
    date.setHours(0, 0, 0, 0);
    return date;
  }
  function weekKey(value) {
    return value.getFullYear() + '-' + String(value.getMonth() + 1).padStart(2, '0') + '-' + String(value.getDate()).padStart(2, '0');
  }

  const dependencies = { startOfWeek, weekKey };
  const sunday = new Date(2026, 10, 22, 15, 30);
  assert.equal(getPreviousWeekKey(sunday, dependencies), '2026-11-09');
  assert.equal(sunday.getDate(), 22, 'no debe mutar la fecha de referencia');

  const monday = new Date(2026, 10, 23, 0, 0);
  assert.equal(getPreviousWeekKey(monday, dependencies), '2026-11-16');

  const firstMondayOfYear = new Date(2027, 0, 4, 12, 0);
  assert.equal(getPreviousWeekKey(firstMondayOfYear, dependencies), '2026-12-28',
    'debe resolver correctamente el cambio de año');

  const customStartOfWeek = function(value) {
    const date = new Date(value);
    const diff = date.getDay();
    date.setDate(date.getDate() - diff);
    date.setHours(0, 0, 0, 0);
    return date;
  };
  assert.equal(getPreviousWeekKey(sunday, {
    startOfWeek: customStartOfWeek,
    weekKey
  }), '2026-11-15', 'debe respetar el día de inicio de semana configurado');

  console.log('OK: clave de semana anterior caracterizada para distintos límites y año');
})().catch(function(error) {
  console.error(error);
  process.exitCode = 1;
});
