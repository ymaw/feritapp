const path = require('node:path');
const { pathToFileURL } = require('node:url');
const assert = require('node:assert/strict');

process.env.TZ = 'America/Argentina/Buenos_Aires';

(async function runDeliveryDateTests() {
  const moduleUrl = pathToFileURL(path.join(__dirname, '..', 'js', 'utils', 'delivery-date.js')).href;
  const { parseDeliveryDate } = await import(moduleUrl);

  const dateOnly = parseDeliveryDate('2026-11-19');
  assert.ok(dateOnly instanceof Date, 'date-only input must return a Date');
  assert.equal(dateOnly.getFullYear(), 2026, 'date-only input must preserve the local year');
  assert.equal(dateOnly.getMonth(), 10, 'date-only input must preserve the local month');
  assert.equal(dateOnly.getDate(), 19, 'date-only input must preserve the local calendar day');
  assert.equal(dateOnly.getHours(), 0, 'date-only input must resolve to local midnight');

  const timestamp = parseDeliveryDate('2026-11-19T03:00:00.000Z');
  assert.equal(timestamp.toISOString(), '2026-11-19T03:00:00.000Z', 'timestamp strings must retain native Date parsing');

  const original = new Date('2026-11-19T12:34:56.000Z');
  const cloned = parseDeliveryDate(original);
  assert.notEqual(cloned, original, 'Date inputs must be cloned');
  assert.equal(cloned.getTime(), original.getTime(), 'Date clone must preserve its timestamp');

  assert.equal(parseDeliveryDate(null), null, 'null input must return null');
  assert.equal(parseDeliveryDate(undefined), null, 'undefined input must return null');
  assert.equal(parseDeliveryDate(''), null, 'empty input must return null');
  assert.equal(parseDeliveryDate('not-a-date'), null, 'invalid date strings must return null');
  assert.equal(parseDeliveryDate(new Date('invalid')), null, 'invalid Date objects must return null');

  console.log('OK delivery date: local calendar dates, timestamps, Date cloning and invalid inputs.');
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
