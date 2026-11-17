const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');

const root = path.resolve(__dirname, '..');
const style = fs.readFileSync(path.join(root, 'css/style.css'), 'utf8');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

assert.ok(style.includes('.chart-box { background: linear-gradient(180deg, var(--surface-2), var(--table-bg)); }'),
  'The mobile chart theme background must remain unchanged');
assert.ok(!style.includes('.chart-box { border-radius: 16px; background: linear-gradient(180deg, var(--surface-2), var(--table-bg)); }'),
  'The mobile rule must not repeat the radius already defined by the later shared chart rule');
assert.match(style, /\.chart-box\s*\{\s*overflow:\s*hidden;\s*border-radius:\s*16px;/,
  'The shared chart rule must continue to provide the 16px radius at every breakpoint');
assert.ok(html.includes('css/style.css?v=12.161'), 'The main stylesheet cache key must be refreshed');

console.log('OK chart CSS regression: redundant mobile radius removed; theme and shared radius preserved.');
