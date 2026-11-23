const assert = require('node:assert/strict');
const { pathToFileURL } = require('node:url');
const path = require('node:path');

(async function() {
  const moduleUrl = pathToFileURL(path.join(__dirname, '..', 'js', 'features', 'receipts', 'receipt-selection.js'));
  const { getReceiptSelectionForClient } = await import(moduleUrl.href);

  const currentKey = '2026-11-23';
  const previousKey = '2026-11-16';
  const dateKeys = {
    '2026-11-24': currentKey,
    '2026-11-25': currentKey,
    '2026-11-18': previousKey,
    '2026-11-17': previousKey,
    '2026-11-10': '2026-11-09',
    invalid: null
  };
  const parseDeliveryDate = value => dateKeys[value] ? new Date(value + 'T12:00:00') : null;
  const weekKey = date => date.toISOString().slice(0, 10) === '2026-11-24' || date.toISOString().slice(0, 10) === '2026-11-25'
    ? currentKey
    : date.toISOString().slice(0, 10) === '2026-11-18' || date.toISOString().slice(0, 10) === '2026-11-17'
      ? previousKey
      : '2026-11-09';
  const previousWeekKey = () => previousKey;
  const salesForWeek = (items, key) => items.filter(item => weekKey(parseDeliveryDate(item.fecha)) === key);
  const dependencies = { parseDeliveryDate, weekKey, previousWeekKey, salesForWeek };
  const now = new Date('2026-11-25T12:00:00');

  const items = [
    { id: 'current-paid-later', cliente: 'Cliente A', fecha: '2026-11-25', pagado: true },
    { id: 'previous-unpaid-later', cliente: 'Cliente A', fecha: '2026-11-18', pagado: false },
    { id: 'current-paid-earlier', cliente: 'Cliente A', fecha: '2026-11-24', pagado: true },
    { id: 'previous-paid', cliente: 'Cliente A', fecha: '2026-11-17', pagado: true },
    { id: 'older', cliente: 'Cliente A', fecha: '2026-11-10', pagado: false },
    { id: 'invalid-date', cliente: 'Cliente A', fecha: 'invalid', pagado: false },
    { id: 'other-client', cliente: 'Cliente B', fecha: '2026-11-24', pagado: false }
  ];

  const result = getReceiptSelectionForClient(items, '  CLIENTE a ', now, dependencies);
  assert.deepEqual(result.items.map(item => item.id), [
    'previous-paid',
    'previous-unpaid-later',
    'current-paid-earlier',
    'current-paid-later'
  ]);
  assert.equal(result.isAbonado, true);

  const previousWeekFullyPaid = items.map(item =>
    item.id === 'previous-unpaid-later' ? { ...item, pagado: true } : item
  );
  const paidPreviousResult = getReceiptSelectionForClient(previousWeekFullyPaid, 'Cliente A', now, dependencies);
  assert.deepEqual(paidPreviousResult.items.map(item => item.id), [
    'current-paid-earlier',
    'current-paid-later'
  ]);
  assert.equal(paidPreviousResult.isAbonado, true);

  const mixedCurrentWeek = items.map(item =>
    item.id === 'current-paid-later' ? { ...item, pagado: false } : item
  );
  const mixedResult = getReceiptSelectionForClient(mixedCurrentWeek, 'Cliente A', now, dependencies);
  assert.equal(mixedResult.isAbonado, false);

  assert.deepEqual(getReceiptSelectionForClient(items, '  ', now, dependencies), {
    items: [],
    isAbonado: false
  });
  assert.deepEqual(getReceiptSelectionForClient([], 'Cliente A', now, dependencies), {
    items: [],
    isAbonado: false
  });

  console.log('OK: selección de comprobantes caracterizada por cliente, semana, pago y fecha');
})().catch(function(error) {
  console.error(error);
  process.exitCode = 1;
});
