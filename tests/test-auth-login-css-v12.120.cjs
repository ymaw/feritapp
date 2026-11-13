const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(root, 'css/auth.css'), 'utf8');
const style = fs.readFileSync(path.join(root, 'css/style.css'), 'utf8');
const version = '12.123';

// The new stylesheet is loaded after the existing styles and uses the same cache version.
assert.match(html, /css\/auth\.css\?v=12\.123/);
assert.ok(html.indexOf('css/style.css?v=12.123') < html.indexOf('css/auth.css?v=12.123'));
for (const match of html.matchAll(/(?:css\/[\w-]+\.css|script\.js)\?v=(12\.\d+)/g)) {
  assert.equal(match[1], version, 'All app CSS/JS cache versions must match');
}

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
console.log('OK V12.123: login stylesheet, cache version, responsive/reduced-motion rules, brand and auth hooks preserved.');
