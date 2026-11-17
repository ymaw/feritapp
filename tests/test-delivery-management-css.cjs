const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');

const root = path.resolve(__dirname, '..');
const style = fs.readFileSync(path.join(root, 'css/style.css'), 'utf8');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

assert.match(style, /\.delivery-management-main>div\{min-width:0;display:flex;flex-direction:column;gap:5px;\}/,
  'The original delivery content wrapper must retain its width and column layout');
assert.equal((style.match(/\.delivery-management-main>div\{min-width:0;display:flex;flex-direction:column;gap:5px;\}/g) || []).length, 1,
  'The content wrapper must define min-width only once in its base rule');
assert.doesNotMatch(style, /\.delivery-management-main>div\{min-width:0;?\}/,
  'A later standalone min-width override must not duplicate the base declaration');
assert.match(style, /\.delivery-management-main\{display:flex;align-items:flex-start;gap:11px;min-width:0;\}/,
  'The base delivery content row must retain its flex layout');
assert.match(style, /\.delivery-management-card\{grid-template-columns:minmax\(0,1fr\);gap:14px;padding:14px;\}/,
  'The mobile single-column card layout must remain present');
assert.ok(html.includes('css/style.css?v=12.159'), 'The main stylesheet cache key must be refreshed');

console.log('OK delivery CSS regression: duplicate width override removed; base and responsive layouts preserved.');
