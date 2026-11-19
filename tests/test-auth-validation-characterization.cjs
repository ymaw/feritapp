const path = require('node:path');
const { pathToFileURL } = require('node:url');
const assert = require('node:assert/strict');

(async function runAuthValidationTests() {
  const moduleUrl = pathToFileURL(path.join(__dirname, '..', 'js', 'utils', 'validation.js')).href;
  const { isValidEmail, isValidPassword } = await import(moduleUrl);

  for (const email of ['persona@example.com', 'nombre.apellido+tag@dominio.com']) {
    assert.equal(isValidEmail(email), true, 'valid email addresses must remain accepted');
  }
  for (const email of ['', 'persona', 'persona@', '@dominio.com', 'persona@dominio', 'persona con espacios@dominio.com']) {
    assert.equal(isValidEmail(email), false, 'invalid email addresses must remain rejected');
  }
  assert.equal(isValidEmail(null), false, 'null email must remain rejected');
  assert.equal(isValidEmail(undefined), false, 'undefined email must remain rejected');

  for (const password of ['Abcdef1!', 'ClaveSegura9#', 'A1!bcdef']) {
    assert.equal(isValidPassword(password), true, 'passwords meeting the existing policy must remain accepted');
  }
  for (const password of ['abcdef1!', 'ABCDEF1!', 'Abcdefgh!', 'Abcdef12', 'Ab1!', '']) {
    assert.equal(isValidPassword(password), false, 'passwords missing a required condition must remain rejected');
  }
  assert.equal(isValidPassword(null), false, 'null password must remain rejected');
  assert.equal(isValidPassword(undefined), false, 'undefined password must remain rejected');

  console.log('OK auth validation: email format and password policy preserved.');
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
