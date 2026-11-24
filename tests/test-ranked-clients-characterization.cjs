const assert = require('node:assert/strict');
const { pathToFileURL } = require('node:url');
const path = require('node:path');
(async function() {
  const moduleUrl = pathToFileURL(path.join(__dirname, '..', 'js', 'features', 'dashboard', 'ranked-clients.js'));
  const { getRankedClients, getRankingPeriodRange } = await import(moduleUrl.href);
  const now = new Date(2026, 10, 24, 12);
  const sales = [
    { cliente: 'Ana', precio: '100', fecha: '2026-11-01' },
    { cliente: 'Beto', precio: 500, fecha: '2026-10-31' },
    { cliente: 'Ana', precio: 50, fecha: '2026-11-15' },
    { cliente: 'Carla', precio: '300', fecha: '2026-07-02' },
    { cliente: '', precio: 'invalid', fecha: '2026-11-20' },
    { cliente: null, precio: 20, fecha: '2026-02-01' }
  ];
  assert.deepEqual(getRankedClients(sales, { sortBy: 'articles', period: 'all', now }), [
    { name: 'Ana', count: 2, total: 150 }, { name: 'Sin nombre', count: 2, total: 20 },
    { name: 'Beto', count: 1, total: 500 }, { name: 'Carla', count: 1, total: 300 }
  ]);
  assert.deepEqual(getRankedClients(sales, { sortBy: 'total', period: 'all', now }).map(x => x.name), ['Beto','Carla','Ana','Sin nombre']);
  assert.deepEqual(getRankedClients(sales, { sortBy: 'total', period: 'month', now }).map(x => x.name), ['Ana','Sin nombre']);
  assert.deepEqual(getRankedClients(sales, { sortBy: 'articles', period: 'quarter', now }).map(x => x.name), ['Ana','Sin nombre']);
  assert.deepEqual(getRankedClients(sales, { sortBy: 'total', period: 'semester', now }).map(x => x.name), ['Ana','Sin nombre','Beto']);
  assert.deepEqual(getRankedClients(sales, { sortBy: 'total', period: 'year', now }).map(x => x.name), ['Beto','Carla','Ana','Sin nombre']);
  assert.deepEqual(getRankedClients([], { period: 'month', now }), []);
  assert.deepEqual(getRankingPeriodRange('quarter', new Date(2026,4,24)), { start: new Date(2026,4,1), end: new Date(2026,8,1) });
  assert.deepEqual(getRankingPeriodRange('semester', new Date(2026,10,24)), { start: new Date(2026,6,1), end: new Date(2027,0,1) });
  assert.throws(() => getRankedClients(sales, { period: 'rolling' }), RangeError);
  console.log('OK: ranking por artículos/monto y períodos calendario');
})().catch(function(error) { console.error(error); process.exitCode = 1; });
