const path = require('node:path');
const { pathToFileURL } = require('node:url');
const assert = require('node:assert/strict');

(async function runCsvEscapeTests() {
  const moduleUrl = pathToFileURL(path.join(__dirname, '..', 'js', 'utils', 'csv.js')).href;
  const { csvEscape } = await import(moduleUrl);

  assert.equal(csvEscape(null), '', 'null values must become empty CSV fields');
  assert.equal(csvEscape(undefined), '', 'undefined values must become empty CSV fields');
  assert.equal(csvEscape(1250), '1250', 'numeric values must be converted to text');
  assert.equal(csvEscape('plain text'), 'plain text');
  assert.equal(csvEscape('two,values'), '"two,values"', 'commas must trigger CSV quoting');
  assert.equal(csvEscape('two;values'), '"two;values"', 'semicolons must trigger CSV quoting');
  assert.equal(csvEscape('a "quoted" value'), '"a ""quoted"" value"', 'embedded quotes must be doubled');
  assert.equal(csvEscape('line 1\nline 2'), '"line 1\nline 2"', 'line feeds must trigger CSV quoting');
  assert.equal(csvEscape('=1+1'), "'=1+1", 'formula-leading equals signs must be neutralized');
  assert.equal(csvEscape('+SUM(A1:A2)'), "'+SUM(A1:A2)", 'formula-leading plus signs must be neutralized');
  assert.equal(csvEscape('-1+2'), "'-1+2", 'formula-leading minus signs must be neutralized');
  assert.equal(csvEscape('@SUM(A1:A2)'), "'@SUM(A1:A2)", 'formula-leading at signs must be neutralized');
  assert.equal(csvEscape('\t=1+1'), "'\t=1+1", 'tab-prefixed formulas must be neutralized');
  assert.equal(csvEscape('\r=1+1'), "'\r=1+1", 'carriage-return-prefixed formulas must be neutralized');

  console.log('OK CSV module: null handling, CSV quoting and formula-injection protection.');
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
