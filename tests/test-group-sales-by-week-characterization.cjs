const assert = require('node:assert/strict');
const { pathToFileURL } = require('node:url');
const path = require('node:path');

(async function() {
  const moduleUrl = pathToFileURL(path.join(__dirname, '..', 'js', 'features', 'sales', 'group-sales-by-week.js'));
  const { groupSalesByWeek } = await import(moduleUrl.href);
  const items = [
    { id: 1, fecha: '2026-11-16', semana_asignada: null },
    { id: 2, fecha: '2026-11-17', semana_asignada: '2026-11-23' },
    { id: 3, fecha: '2026-11-23', semana_asignada: null },
    { id: 4, fecha: 'invalid', semana_asignada: null }
  ];
  const parseDeliveryDate = function(value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
    const date = new Date(value + 'T12:00:00');
    return Number.isNaN(date.getTime()) ? null : date;
  };
  const weekKey = function(date) {
    if (!date) return null;
    const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const day = start.getDay();
    start.setDate(start.getDate() - (day === 0 ? 6 : day - 1));
    return start.getFullYear() + '-' + String(start.getMonth() + 1).padStart(2, '0') + '-' + String(start.getDate()).padStart(2, '0');
  };
  const operationalWeekKey = function(item) {
    const assigned = parseDeliveryDate(item.semana_asignada);
    return assigned ? weekKey(assigned) : weekKey(parseDeliveryDate(item.fecha));
  };

  assert.deepEqual(
    groupSalesByWeek(items, false, { operationalWeekKey, parseDeliveryDate, weekKey }),
    { '2026-11-16': [items[0], items[1]], '2026-11-23': [items[2]] }
  );
  assert.deepEqual(
    groupSalesByWeek(items, true, { operationalWeekKey, parseDeliveryDate, weekKey }),
    { '2026-11-16': [items[0]], '2026-11-23': [items[1], items[2]] }
  );
  assert.deepEqual(groupSalesByWeek([], false, { operationalWeekKey, parseDeliveryDate, weekKey }), {});
  assert.deepEqual(groupSalesByWeek(null, true, { operationalWeekKey, parseDeliveryDate, weekKey }), {});

  console.log('OK: agrupación de ventas por semana caracterizada');
})().catch(function(error) {
  console.error(error);
  process.exitCode = 1;
});
