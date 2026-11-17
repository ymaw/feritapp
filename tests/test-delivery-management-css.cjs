const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');

const root = path.resolve(__dirname, '..');
const style = fs.readFileSync(path.join(root, 'css/style.css'), 'utf8');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

assert.match(style, /\.delivery-management-main>div\{min-width:0;display:flex;flex-direction:column;gap:5px;\}/,
  'The original delivery content wrapper must retain its width and column layout');
assert.equal((style.match(/\.delivery-management-main>div\{min-width:0;display:flex;flex-direction:column;gap:5px;\}/g) || []).length, 1,
  'The content wrapper must define min-width only once in its base rule');
assert.doesNotMatch(style, /\.delivery-management-main>div\{min-width:0;?\}/,
  'A later standalone min-width override must not duplicate the base declaration');
assert.match(style, /\.delivery-management-main strong\{white-space:normal;overflow-wrap:anywhere;line-height:1\.35;\}/,
  'The delivery content title must retain its wrapping behavior');
assert.match(style, /\.delivery-management-main strong\{display:block;line-height:1\.25\}/,
  'The later delivery title rule must not repeat the already-established overflow-wrap declaration');
assert.match(style, /\.delivery-management-main\{display:flex;align-items:flex-start;gap:11px;min-width:0;\}/,
  'The base delivery content row must retain its flex layout');
assert.match(style, /\.delivery-management-card\{grid-template-columns:minmax\(0,1fr\);gap:14px;padding:14px;\}/,
  'The mobile single-column card layout must remain present');
assert.ok(html.includes('css/style.css?v=12.161'), 'The main stylesheet cache key must be refreshed');
const deliveriesHero = html.split('id="viewDeliveries"')[1]?.split('id="viewNotes"')[0] || '';
assert.ok(deliveriesHero.includes('class="view-hero-kicker">ENTREGAS</div>'), 'The deliveries heading card must include its mini title');
assert.ok(deliveriesHero.indexOf('class="view-hero-kicker">ENTREGAS</div>') < deliveriesHero.indexOf('<h2>Entregas</h2>'), 'The deliveries mini title must appear above the main title');

console.log('OK delivery CSS regression: duplicate width override removed; base and responsive layouts preserved.');
