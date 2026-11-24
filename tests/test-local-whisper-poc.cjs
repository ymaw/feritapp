const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'tools/experiments/local-whisper/index.html'), 'utf8');
const readme = fs.readFileSync(path.join(root, 'tools/experiments/local-whisper/README.md'), 'utf8');
const plan = fs.readFileSync(path.join(root, 'tools/experiments/local-whisper/TEST-PLAN.md'), 'utf8');

assert.match(html, /https:\/\/ggml\.ai\/whisper\.cpp\//);
assert.match(html, /modelo multilingüe/);
assert.match(html, /Spanish/);
assert.match(html, /Microphone/);
assert.match(html, /Blob temporal en memoria/);
assert.match(html, /sin archivos, almacenamiento persistente/);
assert.doesNotMatch(html, /<input[^>]+type=["']file/i);
assert.doesNotMatch(html, /getUserMedia|MediaRecorder|indexedDB|localStorage|sendBeacon|XMLHttpRequest/i);

assert.match(readme, /no integra Whisper en FeritApp/i);
assert.match(readme, /el audio no sale del equipo/i);
assert.match(readme, /Blob temporal/i);
assert.match(readme, /ni lo escribe como archivo en el almacenamiento persistente/i);
assert.match(readme, /buffers PCM solo pueden existir en RAM/i);
assert.match(readme, /nunca se cacheará audio/i);
assert.match(readme, /No promover este experimento a producción/i);

for (const id of ['AR-01', 'AR-02', 'AR-03', 'AR-04', 'AR-05', 'AR-06', 'AR-07', 'AR-08', 'AR-09', 'AR-10']) {
  assert.match(plan, new RegExp(id));
}
assert.match(plan, /Cero errores críticos en precios y medidas/i);
assert.match(plan, /por lo menos 50/i);
assert.match(plan, /No grabar, descargar ni conservar archivos de audio/i);

console.log('Local Whisper WASM evaluation static checks passed.');
