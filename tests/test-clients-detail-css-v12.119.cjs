const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const style = fs.readFileSync(path.join(root, 'css/style.css'), 'utf8');
const clients = fs.readFileSync(path.join(root, 'css/clients.css'), 'utf8');
assert.ok(html.includes('css/clients.css?v=12.124'));
assert.ok(html.indexOf('css/style.css?v=12.124') < html.indexOf('css/clients.css?v=12.124'));
for (const selector of ['.client-detail-panel{', '.client-detail-head{', '.client-detail-total{', '.client-purchase-list{', '.client-purchase-row{', '.client-detail-actions{', '.copy-client-name-btn{']) {
  assert.ok(clients.includes(selector), `Missing client selector: ${selector}`);
  assert.ok(!style.split(/\r?\n/).some(line => line.startsWith(selector)), `Selector remains in style.css: ${selector}`);
}
assert.ok(clients.indexOf('.client-detail-actions{display:grid;') < clients.indexOf('.client-detail-actions{grid-template-columns:'), 'Base rule must precede its override');
assert.ok(clients.includes('@media(max-width:520px){.client-detail-actions{grid-template-columns:1fr;}}'), 'Mobile detail actions layout must be preserved');
assert.ok(html.includes('id="viewClients"'), 'Clients view markup must remain present');
for (const m of html.matchAll(/(?:css\/[\w-]+\.css|script\.js)\?v=(12\.\d+)/g)) assert.equal(m[1], '12.124', 'cache versions must be uniform');
console.log('OK V12.124: estilos de detalle de Clientes extraídos, orden preservado y caché uniforme.');
