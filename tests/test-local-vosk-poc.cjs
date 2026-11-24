const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'tools/experiments/local-vosk/index.html'), 'utf8');
const app = fs.readFileSync(path.join(root, 'tools/experiments/local-vosk/app.js'), 'utf8');
const readme = fs.readFileSync(path.join(root, 'tools/experiments/local-vosk/README.md'), 'utf8');

assert.match(html, /Dictado local/);
assert.match(html, /Descargar motor local/);
assert.match(html, /Liberar memoria/);
assert.match(app, /vosk-browser@0\.0\.5/);
assert.match(app, /vosk-model-small-es-0\.42\.tar\.gz/);
assert.match(app, /Vosk\.createModel/);
assert.match(app, /new model\.KaldiRecognizer/);
assert.match(app, /recognizer\.acceptWaveform/);
assert.match(app, /navigator\.mediaDevices\.getUserMedia/);
assert.match(app, /mediaStream\.getTracks\(\)\.forEach\(track => track\.stop\(\)\)/);
assert.match(app, /recognizer\.remove\(\)/);
assert.match(app, /model\.terminate\(\)/);
assert.doesNotMatch(app, /SpeechRecognition|webkitSpeechRecognition/);
assert.doesNotMatch(app, /XMLHttpRequest|sendBeacon/);
assert.match(readme, /No modifica.*garment-publisher\.js/i);
assert.match(readme, /300 MB/i);
assert.match(readme, /ScriptProcessorNode/);

console.log('Local Vosk POC static checks passed.');
