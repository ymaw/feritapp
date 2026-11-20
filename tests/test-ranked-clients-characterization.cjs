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
  assert.deepEqual(getRankedClients(sales), [
    { name: 'Ana', count: 2, total: 150 },
    { name: 'Sin nombre', count: 2, total: 20 },
    { name: 'Beto', count: 1, total: 500 },
    { name: 'Carla', count: 1, total: 300 }
  ]);
  assert.deepEqual(getRankedClients([]), []);

  console.log('OK: ranking de clientes caracterizado');
})().catch(function(error) {
  console.error(error);
  process.exitCode = 1;
});
