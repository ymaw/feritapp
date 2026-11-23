const fs = require('node:fs');
const assert = require('node:assert/strict');

const html = fs.readFileSync('index.html', 'utf8');
const script = fs.readFileSync('script.js', 'utf8');
const moduleSource = fs.readFileSync('js/features/publisher/garment-publisher.js', 'utf8');
const css = fs.readFileSync('css/facebook-garment-publisher.css', 'utf8');

assert.match(html, /id="viewPublisher"/);
assert.match(html, /id="publisherPhoto"[^>]*accept="image\/jpeg,image\/png,image\/webp"/);
assert.match(html, /id="publisherPostText"/);
assert.match(script, /initGarmentPublisher/);
assert.match(script, /publisher:\{label:'Publicador',icon:'✦',view:'publisher'\}/);
assert.match(script, /viewPublisher/);
assert.match(moduleSource, /MEASUREMENT_CATEGORIES = new Set\(\['pantalones', 'capris', 'polleras', 'vestidos'\]\)/);
assert.match(moduleSource, /navigator\.canShare/);
assert.match(moduleSource, /navigator\.share/);
assert.match(moduleSource, /navigator\.clipboard\.writeText/);
assert.match(moduleSource, /URL\.createObjectURL/);
assert.match(css, /object-fit:contain/);
assert.match(css, /@media\(max-width:900px\)/);
console.log('Publicador: estructura, categorías, vista previa y rutas de compartir verificadas.');
