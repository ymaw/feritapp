const assert = require('node:assert/strict');
const { pathToFileURL } = require('node:url');
const path = require('node:path');

(async function(){
  const moduleUrl = pathToFileURL(path.join(__dirname, '..', 'js', 'utils', 'week-stats.js'));
  const { weekStats } = await import(moduleUrl.href);

  assert.deepEqual(weekStats([]), {
    total: 0,
    cobrado: 0,
    pendiente: 0,
    count: 0
  });

  assert.deepEqual(weekStats([
    { precio: 100, pagado: true },
    { precio: 50, pagado: false },
    { precio: '25', pagado: true },
    { precio: null, pagado: false }
  ]), {
    total: 175,
    cobrado: 125,
    pendiente: 50,
    count: 4
  });

  assert.deepEqual(weekStats([
    { precio: -10, pagado: false },
    { precio: 'no-numero', pagado: true }
  ]), {
    total: -10,
    cobrado: 0,
    pendiente: -10,
    count: 2
  });

  console.log('OK: resumen de estadísticas semanales caracterizado');
})().catch(function(error){
  console.error(error);
  process.exitCode = 1;
});
