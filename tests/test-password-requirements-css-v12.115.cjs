const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const style = fs.readFileSync(path.join(root, 'css/style.css'), 'utf8');
const moduleCss = fs.readFileSync(path.join(root, 'css/password-requirements.css'), 'utf8');
assert.ok(html.includes('css/password-requirements.css?v=12.125'));
assert.ok(html.indexOf('css/style.css?v=12.125') < html.indexOf('css/password-requirements.css?v=12.125'));
for (const selector of ['.pw-requirements{', '.pw-requirements li{', '.pw-requirements .req-icon{', '.pw-requirements li.req-ok{', '.pw-requirements li.req-ok .req-icon{']) {
  assert.ok(moduleCss.includes(selector), `Missing extracted selector: ${selector}`);
  assert.ok(!style.includes(selector), `Selector should no longer be in style.css: ${selector}`);
}
assert.ok(html.includes('id="pwRequirements"'), 'Password requirements markup must remain present');
for (const m of html.matchAll(/(?:css\/[\w-]+\.css|script\.js)\?v=(12\.\d+)/g)) assert.equal(m[1], '12.125', 'cache versions must be uniform');
assert.ok(fs.existsSync(path.join(root, 'tests/test-receipt-selection-v12.99.cjs')));
assert.ok(fs.existsSync(path.join(root, 'tests/test-receipt-selection-v12.102.cjs')));
assert.ok(!fs.existsSync(path.join(root, 'tests/test-receipt-period-v12.93.cjs')));
assert.ok(!fs.existsSync(path.join(root, 'tests/test-receipt-selection-v12.95.cjs')));
console.log('OK V12.125: requisitos de contraseña extraídos, marcado conservado, caché uniforme y pruebas vigentes de comprobantes presentes.');
