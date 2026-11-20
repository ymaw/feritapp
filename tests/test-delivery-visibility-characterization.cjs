const assert = require('node:assert/strict');
const { pathToFileURL } = require('node:url');
const path = require('node:path');

(async function() {
  const moduleUrl = pathToFileURL(path.join(__dirname, '..', 'js', 'features', 'deliveries', 'visibility.js'));
  const { isDeliveryItemVisible } = await import(moduleUrl.href);
  const currentKey = '2026-11-16';
  const visibleKeys = new Set([currentKey, '2026-11-09']);
  const dependencies = {
    operationalWeekKey(item) { return item.weekKey || null; },
    parseDeliveryDate(value) { return value ? new Date(value + 'T12:00:00') : null; },
    weekKey(date) {
      const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const day = start.getDay();
      start.setDate(start.getDate() - (day === 0 ? 6 : day - 1));
      return start.getFullYear() + '-' + String(start.getMonth() + 1).padStart(2, '0') + '-' + String(start.getDate()).padStart(2, '0');
    }
  };

  assert.equal(isDeliveryItemVisible(null, visibleKeys, currentKey, dependencies), false);
  assert.equal(isDeliveryItemVisible({ fecha: null }, visibleKeys, currentKey, dependencies), false);
  assert.equal(isDeliveryItemVisible({ fecha: '2026-11-16', weekKey: null }, visibleKeys, currentKey, dependencies), false);
  assert.equal(isDeliveryItemVisible({ fecha: '2026-11-16', weekKey: '2026-11-02' }, visibleKeys, currentKey, dependencies), false);

  assert.equal(isDeliveryItemVisible({
    fecha: '2026-11-16', weekKey: currentKey, entregado: false
  }, visibleKeys, currentKey, dependencies), true);

  assert.equal(isDeliveryItemVisible({
    fecha: '2026-11-16', weekKey: currentKey, entregado: true, entregado_en: '2026-11-18'
  }, visibleKeys, currentKey, dependencies), true);

  assert.equal(isDeliveryItemVisible({
    fecha: '2026-11-16', weekKey: '2026-11-09', entregado: true, entregado_en: '2026-11-18'
  }, visibleKeys, currentKey, dependencies), false);

  assert.equal(isDeliveryItemVisible({
    fecha: '2026-11-16', weekKey: currentKey, entregado: true, entregado_en: '2026-11-09'
  }, visibleKeys, currentKey, dependencies), false);

  assert.equal(isDeliveryItemVisible({
    fecha: '2026-11-16', weekKey: currentKey, entregado: true, entregado_en: null
  }, visibleKeys, currentKey, dependencies), false);

  console.log('OK: regla de visibilidad de entregas caracterizada');
})().catch(function(error) {
  console.error(error);
  process.exitCode = 1;
});
