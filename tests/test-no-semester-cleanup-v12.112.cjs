const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const js = fs.readFileSync(path.join(root, 'script.js'), 'utf8');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const style = fs.readFileSync(path.join(root, 'css/style.css'), 'utf8');
const emptyCss = fs.readFileSync(path.join(root, 'css/empty-states.css'), 'utf8');

function assetVersion(assetPath) {
  const match = html.match(new RegExp(assetPath.replaceAll('.', '\\.') + '\\?v=([^"\\s]+)'));
  assert.ok(match, 'Missing cache-busted asset reference: ' + assetPath);
  return match[1];
}

assert.doesNotMatch(js, /checkSemesterCleanup|last_purge_semester|Mantenimiento semestral/);
assert.doesNotMatch(html, /Cada semestre se descarga uno automático/);
assert.match(html, /Exportá una copia periódicamente/);
const styleVersion = assetVersion('css/style.css');
const emptyStatesVersion = assetVersion('css/empty-states.css');
const scriptVersion = assetVersion('script.js');
assert.ok(emptyStatesVersion.length > 0, 'The module stylesheet must use a cache version');
assert.ok(scriptVersion.length > 0, 'script.js must use a cache version');
assert.ok(html.indexOf('css/style.css?v=' + styleVersion) < html.indexOf('css/empty-states.css?v=' + emptyStatesVersion));
assert.doesNotMatch(style, /\.empty-inline\s*\{|#viewClients \.empty-inline|\.empty\s*\{/);
assert.match(emptyCss, /\.empty-inline\s*\{/);
assert.match(emptyCss, /#viewClients \.empty-inline/);
console.log('OK: borrado semestral desactivado, exportación manual intacta y extracción de estados vacíos verificada (cache ' + styleVersion + ').');
