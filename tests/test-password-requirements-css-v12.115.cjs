const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const style = fs.readFileSync(path.join(root, 'css/style.css'), 'utf8');
const moduleCss = fs.readFileSync(path.join(root, 'css/password-requirements.css'), 'utf8');

function assetVersion(assetPath) {
  const match = html.match(new RegExp(assetPath.replaceAll('.', '\\.') + '\\?v=([^"\\s]+)'));
  assert.ok(match, 'Missing cache-busted asset reference: ' + assetPath);
  return match[1];
}

const styleVersion = assetVersion('css/style.css');
const moduleVersion = assetVersion('css/password-requirements.css');
const scriptVersion = assetVersion('script.js');
assert.equal(moduleVersion, styleVersion, 'password-requirements.css and style.css cache versions must match');
assert.equal(scriptVersion, styleVersion, 'script.js and style.css cache versions must match');
assert.ok(html.indexOf('css/style.css?v=' + styleVersion) < html.indexOf('css/password-requirements.css?v=' + moduleVersion));
for (const selector of ['.pw-requirements{', '.pw-requirements li{', '.pw-requirements .req-icon{', '.pw-requirements li.req-ok{', '.pw-requirements li.req-ok .req-icon{']) {
  assert.ok(moduleCss.includes(selector), 'Missing extracted selector: ' + selector);
  assert.ok(!style.includes(selector), 'Selector should no longer be in style.css: ' + selector);
}
assert.ok(html.includes('id="pwRequirements"'), 'Password requirements markup must remain present');
assert.ok(fs.existsSync(path.join(root, 'tests/test-receipt-selection-v12.99.cjs')));
assert.ok(fs.existsSync(path.join(root, 'tests/test-receipt-selection-v12.102.cjs')));
assert.ok(!fs.existsSync(path.join(root, 'tests/test-receipt-period-v12.93.cjs')));
assert.ok(!fs.existsSync(path.join(root, 'tests/test-receipt-selection-v12.95.cjs')));
console.log('OK: requisitos de contraseña extraídos, marcado conservado, caché sincronizada y pruebas vigentes de comprobantes presentes (cache ' + styleVersion + ').');
