const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');

const root = path.resolve(__dirname, '..');
const layout = fs.readFileSync(path.join(root, 'css/app-layout-centering.css'), 'utf8');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

assert.ok(!/header\\.has-back-button\\s*\\{\\s*padding-left:\\s*0\\s*!important;\\s*\\}/.test(layout),
  'The lower-specificity mobile header padding override must not return');
assert.match(layout, /#appRoot > header\\.has-back-button\\s*\\{\\s*padding-left:\\s*20px\\s*!important;\\s*\\}/,
  'The canonical mobile back-button header spacing must remain');
assert.ok(html.includes('css/app-layout-centering.css?v=24'),
  'The layout stylesheet cache key must be refreshed');

console.log('OK layout cascade regression: obsolete header padding override removed; canonical mobile spacing preserved.');
