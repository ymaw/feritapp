const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');

const root = path.resolve(__dirname, '..');
const css = fs.readFileSync(path.join(root, 'css/dashboard-modernization.css'), 'utf8');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

const subtitleRules = [...css.matchAll(/#viewDashboard \.dashboard-toggle-copy \.dashboard-history-subtitle\s*\{([^}]*)\}/g)];
assert.ok(subtitleRules.length >= 2, 'The dashboard subtitle base and final layout rules must remain present');
assert.ok(
  subtitleRules.some((rule) => /line-height:\s*1\.4;/.test(rule[1])),
  'A preceding dashboard subtitle rule must preserve its 1.4 line height'
);

const finalRule = css.match(/#viewDashboard \.dashboard-toggle-copy \.dashboard-history-subtitle\s*\{\s*display:\s*block;\s*width:\s*100%;\s*margin:\s*0 !important;([^}]*)\}/);
assert.ok(finalRule, 'The final dashboard subtitle layout rule must remain present');
assert.doesNotMatch(finalRule[1], /line-height\s*:/, 'The final rule must not repeat the line height already established by the base rule');
assert.ok(html.includes('css/dashboard-modernization.css?v=15'), 'The dashboard stylesheet cache key must be refreshed');

console.log('OK dashboard CSS regression: repeated subtitle line-height removed; layout and cache key preserved.');
