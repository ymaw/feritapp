const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const vercel = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'vercel.json'), 'utf8'));
const cspTag = html.match(/<meta\b(?=[^>]*http-equiv="Content-Security-Policy")[^>]*>/i);
assert.ok(cspTag, 'A Content-Security-Policy meta tag must exist');

const contentAttribute = cspTag[0].match(/content="([\s\S]*?)"\s+http-equiv=/i);
assert.ok(contentAttribute, 'The CSP content attribute must be readable');
const csp = contentAttribute[1].replace(/\s+/g, ' ').trim();
const directives = Object.fromEntries(
  csp.split(';').map(part => part.trim()).filter(Boolean).map(part => {
    const [name, ...values] = part.split(/\s+/);
    return [name.toLowerCase(), values];
  })
);

assert.ok(directives['default-src']?.includes("'self'"), "default-src must restrict resources to self by default");
assert.ok(directives['object-src']?.includes("'none'"), "object-src must disable plugin content");
assert.ok(directives['base-uri']?.includes("'self'"), "base-uri must remain restricted");
assert.ok(directives['form-action']?.includes("'self'"), "form-action must remain restricted");

const scriptSrc = directives['script-src'] || [];
assert.ok(scriptSrc.includes("'self'"), "script-src must allow same-origin scripts");
assert.ok(scriptSrc.includes('https://cdn.jsdelivr.net'), "script-src must allow the pinned Supabase CDN host");
assert.ok(!scriptSrc.includes("'unsafe-inline'"), "script-src must not broadly allow inline scripts");
assert.ok(!scriptSrc.includes("'unsafe-eval'"), "script-src must not allow eval");

const inlineScripts = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)]
  .filter(([, attributes]) => !/\bsrc\s*=/.test(attributes));
assert.ok(inlineScripts.length > 0, 'Expected the early theme bootstrap script to be present');

for (const [, , body] of inlineScripts) {
  const digest = crypto.createHash('sha256').update(body, 'utf8').digest('base64');
  assert.ok(scriptSrc.includes("'sha256-" + digest + "'"), 'Every inline script must be authorized by its exact CSP hash');
}

const deploymentHeaders = vercel.headers.find(entry => entry.source === '/(.*)')?.headers || [];
const responseHeaders = Object.fromEntries(deploymentHeaders.map(header => [header.key.toLowerCase(), header.value]));
assert.equal(responseHeaders['x-frame-options'], 'DENY', 'Framing must be denied at the HTTP response layer');
assert.equal(responseHeaders['x-content-type-options'], 'nosniff', 'MIME sniffing must be disabled');
assert.equal(responseHeaders['strict-transport-security'], 'max-age=31536000; includeSubDomains', 'HTTPS must be enforced for the deployed origin');
assert.ok(responseHeaders['content-security-policy'], 'CSP must be delivered as an HTTP response header');

const responseDirectives = Object.fromEntries(
  responseHeaders['content-security-policy'].split(';').map(part => part.trim()).filter(Boolean).map(part => {
    const [name, ...values] = part.split(/\\s+/);
    return [name.toLowerCase(), values];
  })
);
for (const [name, values] of Object.entries(directives)) {
  assert.deepEqual(responseDirectives[name], values, `HTTP CSP must preserve the meta CSP directive: ${name}`);
}
assert.deepEqual(responseDirectives['frame-ancestors'], ["'none'"], 'HTTP CSP must prevent framing; frame-ancestors is not enforced from a meta policy');

console.log('OK: CSP is enforced at the response layer, framing is denied, and HSTS is configured.');
