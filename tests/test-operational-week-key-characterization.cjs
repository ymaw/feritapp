const assert = require('node:assert/strict');
const { pathToFileURL } = require('node:url');
const path = require('node:path');

process.env.TZ = 'America/Argentina/Buenos_Aires';

(async function() {
  const moduleUrl = pathToFileURL(path.join(__dirname, '..', 'js', 'features', 'sales', 'operational-week-key.js'));
  const dateUrl = pathToFileURL(path.join(__dirname, '..', 'js', 'utils', 'delivery-date.js'));
  const startUrl = pathToFileURL(path.join(__dirname, '..', 'js', 'utils', 'start-of-week.js'));
  const weekUrl = pathToFileURL(path.join(__dirname, '..', 'js', 'utils', 'week-key.js'));

  const { getOperationalWeekKey } = await import(moduleUrl.href);
  const { parseDeliveryDate } = await import(dateUrl.href);
  const { getStartOfWeek } = await import(startUrl.href);
  const { getWeekKey } = await import(weekUrl.href);
  const dependencies = {
    parseDeliveryDate,
    weekKey(date) {
      return getWeekKey(date, { startOfWeek: value => getStartOfWeek(value, 1) });
    }
  };

  assert.equal(getOperationalWeekKey(null, dependencies), null);
  assert.equal(getOperationalWeekKey(undefined, dependencies), null);
  assert.equal(getOperationalWeekKey({}, dependencies), null);
  assert.equal(getOperationalWeekKey({ fecha: 'invalid-date' }, dependencies), null);

  // La semana asignada válida prevalece sobre la fecha original de la venta.
  assert.equal(getOperationalWeekKey({
    fecha: '2026-11-16',
    semana_asignada: '2026-11-23'
  }, dependencies), '2026-11-23');

  // Una asignación vacía o inválida conserva la semana de la fecha original.
  assert.equal(getOperationalWeekKey({
    fecha: '2026-11-16',
    semana_asignada: ''
  }, dependencies), '2026-11-16');
  assert.equal(getOperationalWeekKey({
    fecha: '2026-11-16',
    semana_asignada: 'invalid-date'
  }, dependencies), '2026-11-16');

  // Sin asignación explícita, usa la fecha original.
  assert.equal(getOperationalWeekKey({
    fecha: '2026-11-22'
  }, dependencies), '2026-11-16');

  console.log('OK: clave de semana operativa caracterizada');
})().catch(function(error) {
  console.error(error);
  process.exitCode = 1;
});
