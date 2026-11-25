const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const source = fs.readFileSync(
  path.join(__dirname, '..', 'script.js'),
  'utf8'
);
const start = source.indexOf('  async function shareCustomerRanking(){');
const end = source.indexOf('  const shareRankingBtn=', start);
assert.notEqual(start, -1, 'ranking share renderer must exist');
assert.notEqual(end, -1, 'ranking share renderer must have a clear boundary');
const share = source.slice(start, end);

// Privacy: totals appear only when the visibility toggle was active at share time.
assert.match(share, /const includeTotals\s*=\s*rankingSortBy\s*===\s*'total'\s*&&\s*showRankingMoney\s*===\s*true/);
assert.match(share, /if\(includeTotals\s*\|\|\s*includeArticleCount\)/);
assert.match(share, /includeTotals\s*\?\s*money\(client\.total\)/);

// The exported artwork describes the period, not the selected ranking metric.
assert.match(share, /ctx\.fillText\('Ranking de clientes'/);
assert.match(share, /const periodLabel\s*=\s*rankingPeriodDescription\(\)/);
assert.doesNotMatch(share, /Mayor total gastado|Más artículos comprados/);

// Brand and modern visual identity.
assert.match(share, /assets\/images\/feritapp-icon\.png/);
assert.match(share, /#7657ff/);
assert.match(share, /#31b9e8/);
assert.match(share, /ctx\.textAlign\s*=\s*'center'/);
assert.match(share, /Muchas gracias por la confianza!/);
assert.match(share, /Ranking de clientes/);
assert.match(share, /canvas\.toBlob\(resolve,'image\/png'\)/);

console.log('OK: imagen compartida del ranking respeta privacidad, período y marca FeritApp');
