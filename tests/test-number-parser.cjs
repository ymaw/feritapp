const path = require('node:path');
const { pathToFileURL } = require('node:url');
const assert = require('node:assert/strict');

(async function runNumberParserTests() {
  const moduleUrl = pathToFileURL(path.join(__dirname, '..', 'js', 'utils', 'number-parser.js')).href;
  const { extractPrice } = await import(moduleUrl);

  assert.equal(extractPrice('1500'), 1500, 'numeric transcripts must return their first digit group');
  assert.equal(extractPrice('1.500 pesos'), 1500, 'Spanish thousands separators must be removed');
  assert.equal(extractPrice('1500.50'), 1500, 'decimal-like transcripts must preserve the first digit group only');
  assert.equal(extractPrice('mil quinientos'), 1500, 'Spanish number words must be parsed');
  assert.equal(extractPrice('dos mil trescientos pesos'), 2300, 'thousands and hundreds must be combined');
  assert.equal(extractPrice('veintidós pesos'), 22, 'accented number words must be normalized');
  assert.equal(extractPrice('quinientas pesos'), 500, 'feminine hundreds must be supported');
  assert.equal(extractPrice('un millón de pesos'), 1000000, 'million expressions must be supported');
  assert.equal(extractPrice('precio aproximado'), null, 'transcripts without a number must return null');
  assert.equal(extractPrice('primero 1500 y después 2000'), 1500, 'only the first digit group must be used');

  console.log('OK number parser: numeric groups, Spanish words, accents and null handling.');
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
