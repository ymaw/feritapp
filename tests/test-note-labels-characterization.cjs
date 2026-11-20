const assert = require('node:assert/strict');
const { pathToFileURL } = require('node:url');
const path = require('node:path');

(async function() {
  const moduleUrl = pathToFileURL(path.join(__dirname, '..', 'js', 'utils', 'note-labels.js'));
  const { findNoteLabel } = await import(moduleUrl.href);
  const labels = [
    { id: 'type-1', kind: 'type', name: 'Trabajo' },
    { id: 'importance-1', kind: 'importance', name: 'Alta' },
    { id: 'type-1', kind: 'type', name: 'Duplicada' }
  ];

  assert.equal(findNoteLabel(labels, 'type-1'), labels[0]);
  assert.equal(findNoteLabel(labels, 'importance-1'), labels[1]);
  assert.equal(findNoteLabel(labels, 'missing'), null);
  assert.equal(findNoteLabel([], 'missing'), null);
  assert.equal(findNoteLabel(labels, 1), null);

  console.log('OK: búsqueda de etiquetas de notas caracterizada');
})().catch(function(error) {
  console.error(error);
  process.exitCode = 1;
});
