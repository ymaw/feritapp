const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const style = fs.readFileSync(path.join(root, 'css/style.css'), 'utf8');
const clients = fs.readFileSync(path.join(root, 'css/clients.css'), 'utf8');
function assetVersion(assetPath) {
  const marker = assetPath + '?v=';
  const start = html.indexOf(marker);
  assert.notEqual(start, -1, 'Missing versioned reference for ' + assetPath);
  const match = html.slice(start + marker.length).match(/^([^"']+)/);
  assert.ok(match, 'Could not read cache version for ' + assetPath);
  return match[1];
}
const styleVersion = assetVersion('css/style.css');
const clientsVersion = assetVersion('css/clients.css');
const scriptVersion = assetVersion('script.js');
assert.ok(clientsVersion.length > 0, 'The module stylesheet must use a cache version');
assert.ok(scriptVersion.length > 0, 'script.js must use a cache version');
assert.ok(html.indexOf('css/style.css?v=') < html.indexOf('css/clients.css?v='));
for (const selector of ['.client-detail-panel{', '.client-detail-head{', '.client-detail-total{', '.client-purchase-list{', '.client-purchase-row{', '.client-detail-actions{', '.copy-client-name-btn{']) {
  assert.ok(clients.includes(selector), `Missing client selector: ${selector}`);
  assert.ok(!style.split(/\r?\n/).some(line => line.startsWith(selector)), `Selector remains in style.css: ${selector}`);
}
assert.match(clients, /\.client-detail-actions\{[^}]*display:grid;[^}]*grid-template-columns:minmax\(0,\.8fr\) minmax\(0,1\.2fr\)/, 'Consolidated base rule must retain the grid layout and its two-column proportions');
assert.ok(clients.includes('@media(max-width:520px){.client-detail-actions{grid-template-columns:1fr;}}'), 'Mobile detail actions layout must be preserved');
assert.ok(html.includes('id="viewClients"'), 'Clients view markup must remain present');

console.log('OK client detail regression: extraction, stylesheet order and synchronized cache versions (' + styleVersion + ').');
