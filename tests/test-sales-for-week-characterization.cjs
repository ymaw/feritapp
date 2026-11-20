const assert = require('node:assert/strict');
const { pathToFileURL } = require('node:url');
const path = require('node:path');

(async function() {
  const moduleUrl = pathToFileURL(path.join(__dirname, '..', 'js', 'features', 'sales', 'sales-for-week.js'));
  const { salesForWeek } = await import(moduleUrl.href);
  const items = [
    { id: 1, fecha: '2026-11-16' },
    { id: 2, fecha: '2026-11-17' },
    { id: 3, fecha: '2026-11-23' },
    { id: 4, fecha: '' },
    null,
    { id: 5, fecha: 'invalid' }
  ];
  const parseDeliveryDate = function(value) {
    if (!/^\\d{4}-\\d{2}-\\d{2}$/.test(value)) return null;
    const date = new Date(value + 'T12:00:00');
    return Number.isNaN(date.getTime()) ? null : date;
  };
  const weekKey = function(date) {
    const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const day = start.getDay();
    start.setDate(start.getDate() - (day === 0 ? 6 : day - 1));
    return start.getFullYear() + '-' + String(start.getMonth() + 1).padStart(2, '0') + '-' + String(start.getDate()).padStart(2, '0');
  };

  assert.deepEqual(salesForWeek(items, '2026-11-16', { parseDeliveryDate, weekKey }), [items[0], items[1]]);
  assert.deepEqual(salesForWeek(items, '2026-11-23', { parseDeliveryDate, weekKey }), [items[2]]);
  assert.deepEqual(salesForWeek([], '2026-11-16', { parseDeliveryDate, weekKey }), []);
  assert.deepEqual(salesForWeek(null, '2026-11-16', { parseDeliveryDate, weekKey }), []);

  console.log('OK: selección de ventas por semana real caracterizada');
})().catch(function(error) {
  console.error(error);
  process.exitCode = 1;
});
