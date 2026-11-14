const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const style = fs.readFileSync(path.join(root, 'css/style.css'), 'utf8');
const moduleCss = fs.readFileSync(path.join(root, 'css/confirmation-dialog.css'), 'utf8');
function assetVersion(assetPath) {
  const marker = assetPath + '?v=';
  const start = html.indexOf(marker);
  assert.notEqual(start, -1, 'Missing versioned reference for ' + assetPath);
  const match = html.slice(start + marker.length).match(/^([^\"']+)/);
  assert.ok(match, 'Could not read cache version for ' + assetPath);
  return match[1];
}
const styleVersion = assetVersion('css/style.css');
const dialogVersion = assetVersion('css/confirmation-dialog.css');
const scriptVersion = assetVersion('script.js');
assert.equal(dialogVersion, styleVersion, 'style.css and confirmation-dialog.css must share the cache version');
assert.equal(scriptVersion, styleVersion, 'script.js and stylesheets must share the cache version');
assert.match(html, /css\/confirmation-dialog\.css\?v=12\.125/);

for (const selector of ['.fa-dialog-backdrop', '.fa-dialog-icon', '.fa-dialog-actions', '.fa-dialog-cancel', '.fa-dialog-confirm', 'body.fa-dialog-open', '@keyframes fa-dialog-in']) assert.ok(moduleCss.includes(selector), `Missing extracted selector: ${selector}`);
assert.ok(!style.includes('.fa-dialog-backdrop{'), 'Dialog base styles should not remain in style.css');
assert.ok(style.includes('.delivery-client-card{padding:9px}'), 'Delivery responsive styles must remain in style.css');
assert.match(moduleCss, /width:\s*min\(100%,\s*620px\)/);
assert.match(moduleCss, /#saleDeleteDialog #saleDeleteDescription/);
assert.ok(fs.existsSync(path.join(root, 'tests/test-receipt-selection-v12.102.cjs')));
assert.ok(fs.existsSync(path.join(root, 'tests/test-receipt-selection-v12.99.cjs')));
assert.ok(!fs.existsSync(path.join(root, 'tests/test-receipt-period-v12.93.cjs')));
assert.ok(!fs.existsSync(path.join(root, 'tests/test-receipt-selection-v12.95.cjs')));
for (const m of html.matchAll(/(?:css\/[\w-]+\.css|script\.js)\?v=(12\.\d+)/g)) assert.equal(m[1], '12.125', 'cache versions must be uniform');
console.log('OK confirmation dialog extraction: responsive delivery styles preserved and cache versions synchronized (${styleVersion}).');
