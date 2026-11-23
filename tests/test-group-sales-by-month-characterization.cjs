const assert = require('node:assert/strict');
const { pathToFileURL } = require('node:url');
const path = require('node:path');

(async function(){
  const moduleUrl = pathToFileURL(path.join(__dirname, '..', 'js', 'features', 'sales', 'group-sales-by-month.js'));
  const { groupSalesByMonth } = await import(moduleUrl.href);
  const monthKey = function(value) {
    const date = new Date(value);
    return date.getFullYear() + "-" + String(date.getMonth() + 1).padStart(2, '0');
  };
  const items = [
    { id: 1, fecha: '2026-11-02' },
    { id: 2, fecha: '2026-10-30' },
    { id: 3, fecha: '2026-11-18' },
    { id: 4, fecha: '2026-12-01' }
  ];

  assert.deepEqual(
    groupSalesByMonth(items, { monthKey }),
    { '2026-11': [items[0], items[2]], '2026-10': [items[1]], '2026-12': [items[3]] }
  );
  assert.deepEqual(groupSalesByMonth([], { monthKey }), {});
  assert.deepEqual(groupSalesByMonth(null, { monthKey }), {});

  console.log('OK: agrupación de ventas por mes caracterizada');
})().catch(function(error){
  console.error(error);
  process.exitCode = 1;
});
