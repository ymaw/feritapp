const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const style = fs.readFileSync(path.join(root, 'css/style.css'), 'utf8');
const moduleCss = fs.readFileSync(path.join(root, 'css/install-banner.css'), 'utf8');
const assert = require('assert');
function assetVersion(assetPath) {
  const marker = assetPath + '?v=';
  const start = html.indexOf(marker);
  assert.notEqual(start, -1, 'Missing versioned reference for ' + assetPath);
  const match = html.slice(start + marker.length).match(/^([^\"']+)/);
  assert.ok(match, 'Could not read cache version for ' + assetPath);
  return match[1];
}
const styleVersion = assetVersion('css/style.css');
const bannerVersion = assetVersion('css/install-banner.css');
const scriptVersion = assetVersion('script.js');
assert.equal(bannerVersion, styleVersion, 'style.css and install-banner.css must share the cache version');
assert.equal(scriptVersion, styleVersion, 'script.js and stylesheets must share the cache version');
assert.ok(html.indexOf('css/style.css?v=') < html.indexOf('css/install-banner.css?v='), 'The banner module must load after style.css');
assert.ok(!/\.install-banner\s*\{[^}]*position\s*:\s*fixed/s.test(style), 'Las reglas base no deben seguir duplicadas en style.css');
assert.match(moduleCss, /\.install-banner\s*\{[^}]*position\s*:\s*fixed/s);
assert.match(moduleCss, /@media\s*\(min-width:\s*900px\)\s*\{\s*\.install-banner\s*\{\s*left:\s*240px;/);
assert.match(moduleCss, /@media\s*\(min-width:\s*900px\)\s*\{\s*\.install-banner\s*\{\s*left:\s*248px;/);
console.log('OK install banner regression: module linked, base rules extracted, desktop offsets preserved and asset versions synchronized (' + styleVersion + ').');
