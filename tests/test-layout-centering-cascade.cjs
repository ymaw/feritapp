const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');

const root = path.resolve(__dirname, '..');
const layout = fs.readFileSync(path.join(root, 'css/app-layout-centering.css'), 'utf8');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

assert.ok(!layout.includes('header.has-back-button {\n    padding-left: 0 !important;'),
  'The lower-specificity mobile header padding override must not return');
assert.ok(layout.includes('#appRoot > header.has-back-button {\n    padding-left: 20px !important;'),
  'The canonical mobile back-button header spacing must remain');
assert.ok(html.includes('css/app-layout-centering.css?v=24'),
  'The layout stylesheet cache key must be refreshed');

console.log('OK layout cascade regression: obsolete header padding override removed; canonical mobile spacing preserved.');
