const assert = require('node:assert/strict');
const { pathToFileURL } = require('node:url');
const path = require('node:path');

(async function() {
  const moduleUrl = pathToFileURL(path.join(__dirname, '..', 'js', 'features', 'dashboard', 'ranked-clients.js'));
  const { getRankedClients } = await import(moduleUrl.href);

  const sales = [
    { cliente: 'Ana', precio: '100' },
    { cliente: 'Beto', precio: 500 },
    { cliente: 'Ana', precio: 50 },
    { cliente: 'Carla', precio: '300' },
    { cliente: '', precio: 'invalid' },
    { cliente: null, precio: 20 }
  ];
  const ranked = getRankedClients(sales);

  assert.deepEqual(ranked, [
    { name: 'Ana', count: 2, total: 150 },
    { name: 'Beto', count: 1, total: 500 },
    { name: 'Carla', count: 1, total: 300 },
    { name: 'Sin nombre', count: 2, total: 20 }
  ].sort(function(a, b) { return b.count - a.count || b.total - a.total; }));
  assert.deepEqual(getRankedClients([]), []);
  assert.deepEqual(getRankedClients(null), []);
  assert.deepEqual(getRankedClients(), []);

  console.log('OK: ranking de clientes caracterizado');
})().catch(function(error) {
  console.error(error);
  process.exitCode = 1;
});
