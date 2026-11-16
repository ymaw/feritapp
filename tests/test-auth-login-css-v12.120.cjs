const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(root, 'css/auth.css'), 'utf8');
const style = fs.readFileSync(path.join(root, 'css/style.css'), 'utf8');

function assetVersion(assetPath) {
  const marker = assetPath + '?v=';
  const start = html.indexOf(marker);
  assert.notEqual(start, -1, `Missing versioned reference for ${assetPath}`);
  const match = html.slice(start + marker.length).match(/^([^"']+)/);
  assert.ok(match, `Could not read cache version for ${assetPath}`);
  return match[1];
}

const styleVersion = assetVersion('css/style.css');
const authVersion = assetVersion('css/auth.css');
const scriptVersion = assetVersion('script.js');

// The authentication stylesheet must load after the base stylesheet.
// Cache versions are independent because each asset changes on its own release cadence.
assert.ok(
  html.indexOf('css/style.css?v=') < html.indexOf('css/auth.css?v='),
  'auth.css must load after style.css'
);
assert.ok(authVersion.length > 0, 'auth.css must use a cache version');
assert.ok(scriptVersion.length > 0, 'script.js must use a cache version');

// Preserve the official logo, brand name, slogan, and all authentication flow hooks.
for (const required of [
  'assets/images/feritapp-icon.png',
  'Ferit<b>App</b>',
  'Vendé. Organizá. Crecé.',
  'id="gateEmail"', 'id="gatePin"', 'id="gatePinConfirm"',
  'id="loginBtn"', 'id="signupBtn"', 'id="forgotPinBtn"',
  'id="gateSent"', 'id="backToEmailBtn"',
  'id="gateNewPin"', 'id="newPinSubmit"',
  'id="onboardingGate"'
]) assert.ok(html.includes(required), `Missing existing auth markup: ${required}`);

// The presentation layer must not replace or rename the JS hooks.
for (const selector of ['#authGate', '#onboardingGate', '.gate-card', '.brand-lockup', '.gate-btn-primary', '.gate-btn-secondary']) {
  assert.ok(css.includes(selector), `Missing login styling: ${selector}`);
}
assert.match(css, /@media\s*\(max-width:\s*520px\)/);
assert.match(css, /@media\s*\(prefers-reduced-motion:\s*reduce\)/);
assert.match(style, /--primary-rgb:/);
assert.match(style, /--secondary-rgb:/);
assert.match(style, /--danger-rgb:/);
console.log(`OK login regression: stylesheet order, independently versioned assets (${styleVersion}), responsive/reduced-motion rules, brand and auth hooks preserved.`);

// Desktop navigation must remain outside the unauthenticated surface.
assert.match(css, /body\.auth-locked #sidebar\s*\{\s*display:\s*none\s*!important;/);
assert.match(css, /body\.auth-locked #authGate[\s\S]*?padding-left:\s*24px\s*!important;/);
