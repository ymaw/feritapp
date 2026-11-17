const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');

const root = path.resolve(__dirname, '..');
const css = fs.readFileSync(path.join(root, 'css/dashboard-modernization.css'), 'utf8');
const legacyStyle = fs.readFileSync(path.join(root, 'css/style.css'), 'utf8');
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

const legacyHeadingRule = legacyStyle.match(/\.weekly-summary-heading\s*\{([^}]*)\}/);
assert.ok(legacyHeadingRule, 'The legacy weekly summary heading base rule must remain available');
assert.doesNotMatch(legacyHeadingRule[1], /padding\s*:/, 'The legacy heading rule must not retain superseded padding');
const legacyMobileRules = [...legacyStyle.matchAll(/@media\s*\(max-width:\s*520px\)\s*\{([^}]*)\}/g)].map((rule) => rule[1]);
const legacyMobileRule = legacyMobileRules.find((rule) => rule.includes('weekly-summary-content'));
assert.ok(legacyMobileRule, 'The legacy mobile media query must remain for content spacing');
assert.doesNotMatch(legacyMobileRule, /weekly-summary-heading/, 'The legacy mobile query must not override dashboard heading padding');
const headingLayoutRules = [...css.matchAll(/#viewDashboard \.weekly-summary-heading\s*\{([^}]*)\}/g)].map((rule) => rule[1]);
assert.ok(headingLayoutRules.some((rule) => /height:\s*68px;/.test(rule) && /padding:\s*16px 18px;/.test(rule)), 'Desktop heading dimensions must remain unchanged');
assert.match(css, /@media \(max-width:\s*899px\)\s*\{[^}]*#viewDashboard \.weekly-summary-heading\s*\{[^}]*height:\s*64px;[^}]*padding:\s*14px 15px;/s, 'Mobile heading dimensions must remain unchanged');
assert.match(css, /@media \(max-width:\s*380px\)\s*\{[^}]*#viewDashboard \.weekly-summary-heading\s*\{\s*padding:\s*12px;/s, 'Narrow mobile heading padding must remain unchanged');


console.log('OK dashboard CSS regression: repeated subtitle line-height removed; layout and cache key preserved.');
