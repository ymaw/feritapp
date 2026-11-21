const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const script = fs.readFileSync(path.join(root, 'script.js'), 'utf8');
const index = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const categoryCss = fs.readFileSync(path.join(root, 'css', 'category-picker.css'), 'utf8');
const accessibilitySpec = fs.readFileSync(path.join(root, 'tests', 'e2e', 'accessibility-views.spec.cjs'), 'utf8');

assert.match(script, /const isNewSale = titleText === 'nueva venta';[\s\S]*?if\(isNewSale\) sheet\.scrollTop = 0;/,
  'Nueva venta debe volver al inicio del panel al abrirse');
assert.match(script, /const newCategoryName = search\.value\.trim\(\);[\s\S]*?await persistNewCategory\(newCategoryName\);[\s\S]*?categories\.push\(newCategoryName\);[\s\S]*?select\.value = newCategoryName;/,
  'la búsqueda sin coincidencias debe permitir crear y seleccionar la categoría');
assert.match(script, /if\(result && result\.error\) throw result\.error;/,
  'un error devuelto por Supabase debe impedir confirmar la creación');
assert.match(script, /return false;/,
  'el guardado fallido debe comunicarse al selector');
assert.doesNotMatch(script, /openNewCatBtn|newCatRow|fNuevaCategoria|confirmNewCat/,
  'el flujo independiente de nueva categoría debe estar eliminado');
assert.doesNotMatch(index, /openNewCatBtn|newCatRow|fNuevaCategoria|confirmNewCat/,
  'el formulario separado de nueva categoría debe estar eliminado');
assert.match(categoryCss, /\.category-picker-create\s*\{/,
  'la acción de creación debe tener estilos propios coherentes con el selector');
assert.doesNotMatch(accessibilitySpec, /locator\('#openNewCatBtn'\)/,
  'la navegación por teclado no debe depender del botón de categoría eliminado');
assert.match(accessibilitySpec, /itemRowsContainer \.row-articulo/,
  'la navegación por teclado debe continuar desde el selector hacia el primer artículo');

console.log('OK: formulario de venta reinicia el scroll y la categoría se crea desde la búsqueda');
