const assert = require('node:assert/strict');
const { pathToFileURL } = require('node:url');
const path = require('node:path');

(async function(){
  const moduleUrl = pathToFileURL(path.join(__dirname, '..', 'js', 'utils', 'note-date.js'));
  const { formatNoteDate } = await import(moduleUrl.href);

  assert.equal(formatNoteDate(null), '');
  assert.equal(formatNoteDate(undefined), '');
  assert.equal(formatNoteDate(''), '');
  assert.equal(formatNoteDate('fecha-invalida'), '');

  const localDate = new Date(2026, 10, 20, 15, 30);
  const expectedLocalizedDate = localDate.toLocaleString('es-AR', {
    dateStyle: 'short',
    timeStyle: 'short'
  });
  assert.equal(formatNoteDate(localDate), expectedLocalizedDate);

  console.log('OK: formato de fecha de notas caracterizado');
})().catch(function(error){
  console.error(error);
  process.exitCode = 1;
});
