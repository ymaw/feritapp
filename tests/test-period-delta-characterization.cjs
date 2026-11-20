const assert = require('node:assert/strict');
const { pathToFileURL } = require('node:url');
const path = require('node:path');

(async function(){
  const moduleUrl = pathToFileURL(path.join(__dirname, '..', 'js', 'utils', 'period-delta.js'));
  const { deltaHtml } = await import(moduleUrl.href);

  assert.equal(deltaHtml(0, 0), '<span class="delta flat">—</span>');
  assert.equal(deltaHtml(125, 0), '<span class="delta up">▲ nuevo</span>');
  assert.equal(deltaHtml(100, 100), '<span class="delta flat">0%</span>');
  assert.equal(deltaHtml(150, 100), '<span class="delta up">▲ 50%</span>');
  assert.equal(deltaHtml(75, 100), '<span class="delta down">▼ 25%</span>');
  assert.equal(deltaHtml(101, 100), '<span class="delta up">▲ 1%</span>');
  assert.equal(deltaHtml(99, 100), '<span class="delta down">▼ 1%</span>');

  console.log('OK: formateador de variación entre períodos caracterizado');
})().catch(function(error){
  console.error(error);
  process.exitCode = 1;
});
