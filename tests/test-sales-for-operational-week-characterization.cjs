const assert = require('node:assert/strict');
const { pathToFileURL } = require('node:url');
const path = require('node:path');

(async function() {
  const moduleUrl = pathToFileURL(path.join(__dirname, '..', 'js', 'features', 'sales', 'sales-for-operational-week.js'));
  const { salesForOperationalWeek } = await import(moduleUrl.href);
  const items = [
    { id: 1, operationalWeek: '2026-11-16' },
    { id: 2, operationalWeek: '2026-11-23' },
    { id: 3, operationalWeek: '2026-11-16' },
    null,
    { id: 4, operationalWeek: null }
  ];
  const dependencies = {
    operationalWeekKey(item) {
      return item ? item.operationalWeek : null;
    }
  };

  assert.deepEqual(
    salesForOperationalWeek(items, '2026-11-16', dependencies),
    [items[0], items[2]]
  );
  assert.deepEqual(
    salesForOperationalWeek(items, '2026-11-23', dependencies),
    [items[1]]
  );
  assert.deepEqual(salesForOperationalWeek([], '2026-11-16', dependencies), []);
  assert.deepEqual(salesForOperationalWeek(null, '2026-11-16', dependencies), []);
  assert.deepEqual(salesForOperationalWeek(undefined, '2026-11-16', dependencies), []);

  console.log('OK: selección de ventas por semana operativa caracterizada');
})().catch(function(error) {
  console.error(error);
  process.exitCode = 1;
});
