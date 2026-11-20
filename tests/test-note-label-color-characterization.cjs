const assert = require('node:assert/strict');
const { pathToFileURL } = require('node:url');
const path = require('node:path');

(async function() {
  const moduleUrl = pathToFileURL(path.join(__dirname, '..', 'js', 'utils', 'note-label-color.js'));
  const { generateTypeLabelColor } = await import(moduleUrl.href);

  assert.equal(generateTypeLabelColor(0), '#B82323');
  assert.equal(generateTypeLabelColor(0.25), '#6EB823');
  assert.equal(generateTypeLabelColor(0.5), '#23B8B8');
  assert.equal(generateTypeLabelColor(0.75), '#6E23B8');
  assert.match(generateTypeLabelColor(), /^#[0-9A-F]{6}$/);

  console.log('OK: generación de color de tipos de nota caracterizada');
})().catch(function(error) {
  console.error(error);
  process.exitCode = 1;
});
