const assert = require('node:assert/strict');
const { pathToFileURL } = require('node:url');
const path = require('node:path');

(async function(){
  const moduleUrl = pathToFileURL(path.join(__dirname, '..', 'js', 'utils', 'money.js'));
  const { money } = await import(moduleUrl.href);

  assert.equal(money(0), '$0');
  assert.equal(money(null), '$0');
  assert.equal(money(undefined), '$0');
  assert.equal(money(''), '$0');
  assert.equal(money(false), '$0');
  assert.equal(money(1234.5), '$1.234,5');
  assert.equal(money('1234567.89'), '$1.234.567,89');
  assert.equal(money(-1234.5), '$-1.234,5');
  assert.equal(money('no-numero'), '$NaN');

  console.log('OK: formato ARS caracterizado');
})().catch(function(error){
  console.error(error);
  process.exitCode = 1;
});
