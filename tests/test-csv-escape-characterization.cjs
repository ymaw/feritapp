const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');

const script = fs.readFileSync(path.join(__dirname, '..', 'script.js'), 'utf8');
const match = script.match(/function csvEscape\(val\)\s*\{[\s\S]*?\n  \}/);

assert.ok(match, 'The current script must expose the csvEscape function declaration for characterization');

const csvEscape = vm.runInNewContext(`(${match[0]}; csvEscape)`);

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

console.log('OK CSV characterization: null handling, CSV quoting and formula-injection protection.');
