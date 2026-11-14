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

assert.match(moduleCss, /\.fa-dialog\s*\{[^}]*width:\s*min\(100%,\s*620px\)/s);
assert.match(moduleCss, /#saleDeleteDialog #saleDeleteDescription\s*\{[^}]*white-space:\s*nowrap/s);
assert.match(moduleCss, /overflow-x:\s*auto/);
assert.ok(!style.includes('width: min(100%, 620px)'), 'El ancho del diálogo debe estar en el módulo nuevo');
assert.ok(!style.includes('#saleDeleteDialog #saleDeleteDescription'), 'El texto de confirmación debe estar en el módulo nuevo');
assert.match(html, /script\.js\?v=12\.125/);
console.log('OK confirmation dialog regression: extraction, stylesheet order and synchronized cache versions (${styleVersion}).');
