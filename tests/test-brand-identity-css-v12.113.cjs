const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const style = fs.readFileSync(path.join(root, 'css/style.css'), 'utf8');
const brand = fs.readFileSync(path.join(root, 'css/brand-identity.css'), 'utf8');

function assetVersion(assetPath) {
  const marker = assetPath + '?v=';
  const start = html.indexOf(marker);
  assert.notEqual(start, -1, `Missing versioned reference for ${assetPath}`);
  const match = html.slice(start + marker.length).match(/^([^"']+)/);
  assert.ok(match, `Could not read cache version for ${assetPath}`);
  return match[1];
}

const styleVersion = assetVersion('css/style.css');
const brandVersion = assetVersion('css/brand-identity.css');
const scriptVersion = assetVersion('script.js');
assert.ok(
  html.indexOf('css/style.css?v=') < html.indexOf('css/brand-identity.css?v='),
  'brand-identity.css must load after style.css'
);
assert.equal(brandVersion, styleVersion, 'style.css and brand-identity.css must share the cache version');
assert.equal(scriptVersion, styleVersion, 'script.js and the base/brand stylesheets must share the cache version');

assert.match(brand, /\.brand-logo, \.sidebar-logo, \.receipt-preview-ferit-logo, \.receipt-brand-logo\s*\{[^}]*object-fit:\s*contain\s*!important/s);
assert.match(brand, /background:\s*transparent\s*!important/);
assert.match(brand, /box-shadow:\s*none\s*!important/);
assert.match(brand, /\.brand-logo, \.sidebar-logo, \.receipt-brand-logo\s*\{\s*border-radius:\s*0\s*!important/s);
assert.ok(!/\.brand-logo, \.sidebar-logo, \.receipt-preview-ferit-logo, \.receipt-brand-logo\s*\{[^}]*object-fit:\s*contain\s*!important/s.test(style), 'Las reglas de identidad deben residir en el módulo nuevo');
console.log(`OK brand identity regression: extraction and load order preserved with synchronized cache versions (${styleVersion}).`);
