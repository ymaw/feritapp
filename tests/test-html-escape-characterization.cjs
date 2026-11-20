const path = require('node:path');
const { pathToFileURL } = require('node:url');
const assert = require('node:assert/strict');

function createDocumentMock() {
  return {
    createElement(tag) {
      assert.equal(tag, 'div');
      let text = '';
      return {
        set textContent(value) { text = String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); },
        get innerHTML() { return text; }
      };
    }
  };
}

(async function runHtmlEscapeTests() {
  const moduleUrl = pathToFileURL(path.join(__dirname, '..', 'js', 'utils', 'html.js')).href;
  const { escapeHtml } = await import(moduleUrl);
  const documentRef = createDocumentMock();

  assert.equal(escapeHtml('<script>alert(1)</script>', { documentRef }), '&lt;script&gt;alert(1)&lt;/script&gt;');
  assert.equal(escapeHtml('A & B', { documentRef }), 'A &amp; B');
  assert.equal(escapeHtml('"comillas" y \'apóstrofes\'', { documentRef }), '&quot;comillas&quot; y &#39;apóstrofes&#39;');
  assert.equal(escapeHtml(null, { documentRef }), '');
  assert.equal(escapeHtml(undefined, { documentRef }), '');
  assert.equal(escapeHtml('', { documentRef }), '');
  assert.equal(escapeHtml(0, { documentRef }), '');
  assert.equal(escapeHtml(false, { documentRef }), '');
  assert.equal(escapeHtml('texto seguro', { documentRef }), 'texto seguro');

  console.log('OK HTML escaping: preserves original coercion and neutralizes markup and quotes.');
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
