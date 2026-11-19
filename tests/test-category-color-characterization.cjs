const path = require('node:path');
const { pathToFileURL } = require('node:url');
const assert = require('node:assert/strict');

(async function runCategoryColorTests() {
  const moduleUrl = pathToFileURL(path.join(__dirname, '..', 'js', 'utils', 'category-color.js')).href;
  const { categoryColor } = await import(moduleUrl);

  assert.equal(categoryColor(''), '#446DF6', 'empty category must retain the first palette color');
  assert.equal(categoryColor(null), '#446DF6', 'null category must retain the first palette color');
  assert.equal(categoryColor(undefined), '#446DF6', 'undefined category must retain the first palette color');
  assert.equal(categoryColor('Ropa'), '#6C8EBF', 'category hash must remain stable');
  assert.equal(categoryColor('Calzado'), '#446DF6', 'different categories must retain deterministic colors');
  assert.equal(categoryColor('Ropa'), categoryColor('Ropa'), 'same category must always return the same color');
  assert.match(categoryColor('Categoría ñ'), /^#[0-9A-F]{6}$/i, 'unicode categories must resolve to a valid palette color');
  assert.match(categoryColor(123), /^#[0-9A-F]{6}$/i, 'non-string values must preserve String coercion');

  console.log('OK category color: stable hash, fallback values and unicode inputs.');
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
