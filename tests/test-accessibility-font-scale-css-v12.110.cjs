const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const style = fs.readFileSync(path.join(root, 'css/style.css'), 'utf8');
const moduleCss = fs.readFileSync(path.join(root, 'css/accessibility-font-scale.css'), 'utf8');
assert.match(html, /css\/accessibility-font-scale\.css\?v=12\.120/);
assert.ok(html.indexOf('css/style.css?v=12.121') < html.indexOf('css/accessibility-font-scale.css?v=12.121'), 'El módulo debe cargarse después de style.css');
for (const selector of ['.font-scale-label{', '.font-scale-options{', '.font-scale-option{', '.font-scale-option small{', '.font-scale-option.active{', '.font-scale-option:focus-visible', '.font-scale-reset{']) {
  assert.ok(moduleCss.includes(selector), `Falta ${selector} en el módulo nuevo`);
  assert.ok(!style.includes(selector), `La regla ${selector} sigue en style.css`);
}
assert.match(moduleCss, /@media\s*\(max-width:\s*520px\)/);
assert.match(moduleCss, /grid-template-columns:repeat\(3,minmax\(0,1fr\)\)/);
assert.ok(style.includes('#viewSales .management-expanded-layout .sales-group-item-side .row-actions .del-btn'), 'La regla de eliminación no debe moverse con el módulo de accesibilidad');
assert.ok(html.includes('script.js?v=12.121'));
console.log('OK V12.121 (regresión V12.110): reglas de accesibilidad extraídas, responsividad móvil conservada y referencia de caché actualizada.');
