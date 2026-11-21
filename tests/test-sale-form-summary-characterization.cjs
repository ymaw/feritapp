const assert = require('node:assert/strict');
const { pathToFileURL } = require('node:url');
const path = require('node:path');

(async function() {
  const moduleUrl = pathToFileURL(path.join(__dirname, '..', 'js', 'features', 'sales', 'sale-form-summary.js'));
  const { getSaleFormSummary } = await import(moduleUrl.href);

  assert.deepEqual(getSaleFormSummary([]), { total: 0, hasCompleteItem: false });
  assert.deepEqual(getSaleFormSummary(null), { total: 0, hasCompleteItem: false });
  assert.deepEqual(getSaleFormSummary([
    { name: 'Remera', price: '1200' },
    { name: 'Pantalón', price: '2500.50' }
  ]), { total: 3700.5, hasCompleteItem: true });

  // Los importes parciales se suman, pero no habilitan el guardado si falta nombre o precio válido.
  assert.deepEqual(getSaleFormSummary([
    { name: '', price: '900' },
    { name: 'Buzo', price: '' },
    { name: 'Gorra', price: '0' },
    { name: 'Medias', price: '-10' },
    { name: 'Bufanda', price: 'no-numérico' }
  ]), { total: 890, hasCompleteItem: false });

  // Un artículo completo habilita el estado aunque existan filas incompletas.
  assert.deepEqual(getSaleFormSummary([
    { name: 'Camisa', price: '1500' },
    { name: '', price: '300' }
  ]), { total: 1800, hasCompleteItem: true });

  // Se conserva el comportamiento de parseFloat para valores con sufijos.
  assert.deepEqual(getSaleFormSummary([
    { name: 'Artículo', price: '25xyz' }
  ]), { total: 25, hasCompleteItem: true });

  console.log('OK: resumen del formulario de ventas caracterizado');
})().catch(function(error) {
  console.error(error);
  process.exitCode = 1;
});
