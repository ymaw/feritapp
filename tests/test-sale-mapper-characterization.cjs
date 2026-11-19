const path = require('node:path');
const { pathToFileURL } = require('node:url');
const assert = require('node:assert/strict');

(async function runSaleMapperTests() {
  const moduleUrl = pathToFileURL(path.join(__dirname, '..', 'js', 'utils', 'sale-mapper.js')).href;
  const { mapRowToSale } = await import(moduleUrl);

  const mapped = mapRowToSale({
    id: 'sale-1',
    fecha: '2026-11-19',
    semana_asignada: '',
    cliente: 'Cliente',
    articulo: 'Remera',
    precio: '12500.50',
    pagado: false,
    retira: 'local',
    tercero: null,
    categoria: '',
    entregado: 1,
    entregado_en: ''
  });

  assert.deepEqual(mapped, {
    id: 'sale-1',
    fecha: '2026-11-19',
    semana_asignada: null,
    cliente: 'Cliente',
    articulo: 'Remera',
    precio: 12500.5,
    pagado: false,
    retira: 'local',
    tercero: '',
    categoria: 'Sin categoría',
    entregado: true,
    entregado_en: null
  }, 'persisted row mapping must preserve existing coercions and fallbacks');

  const minimal = mapRowToSale({
    id: 'sale-2',
    precio: null,
    entregado: 0
  });
  assert.equal(minimal.precio, 0, 'null price must retain Number(null) coercion');
  assert.equal(minimal.entregado, false, 'falsy delivery state must remain false');
  assert.equal(minimal.semana_asignada, null);
  assert.equal(minimal.tercero, '');
  assert.equal(minimal.categoria, 'Sin categoría');
  assert.equal(minimal.entregado_en, null);

  console.log('OK sale mapper: persisted fields, numeric/boolean coercions and fallbacks.');
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
