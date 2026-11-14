const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const style = fs.readFileSync(path.join(root, 'css/style.css'), 'utf8');
const moduleCss = fs.readFileSync(path.join(root, 'css/accessibility-font-scale.css'), 'utf8');

function assetVersion(assetPath) {
  const marker = assetPath + '?v=';
  const start = html.indexOf(marker);
  assert.notEqual(start, -1, `Falta la referencia versionada de ${assetPath}`);
  const version = html.slice(start + marker.length).match(/^([^"]+)/);
  assert.ok(version, `No se pudo leer la versión de ${assetPath}`);
  return version[1];
}

const styleVersion = assetVersion('css/style.css');
const moduleVersion = assetVersion('css/accessibility-font-scale.css');
const scriptVersion = assetVersion('script.js');
assert.ok(
  html.indexOf('css/style.css?v=') < html.indexOf('css/accessibility-font-scale.css?v='),
  'El módulo debe cargarse después de style.css'
);
assert.equal(moduleVersion, styleVersion, 'style.css y accessibility-font-scale.css deben compartir la versión de caché');
assert.equal(scriptVersion, styleVersion, 'script.js y las hojas principales deben compartir la versión de caché');

for (const selector of ['.font-scale-label{', '.font-scale-options{', '.font-scale-option{', '.font-scale-option small{', '.font-scale-option.active{', '.font-scale-option:focus-visible', '.font-scale-reset{']) {
  assert.ok(moduleCss.includes(selector), `Falta ${selector} en el módulo nuevo`);
  assert.ok(!style.includes(selector), `La regla ${selector} sigue en style.css`);
}
assert.match(moduleCss, /@media\\s*\\(max-width:\\s*520px\\)/);
assert.match(moduleCss, /grid-template-columns:repeat\\(3,minmax\\(0,1fr)\\)/);
assert.ok(style.includes('#viewSales .management-expanded-layout .sales-group-item-side .row-actions .del-btn'), 'La regla de eliminación no debe moverse con el módulo de accesibilidad');
console.log(`OK regresión V12.110: reglas extraídas, responsividad móvil y versiones de caché sincronizadas (${styleVersion}).`);
