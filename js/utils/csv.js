/**
 * Escapes a value for safe inclusion in a CSV field.
 * Formula-leading characters are neutralized before CSV quoting.
 */
export function csvEscape(val) {
  let value = String(val === null || val === undefined ? '' : val);

  if (/^[=+\-@\t\r]/.test(value)) {
    value = "'" + value;
  }

  if (/[",\n;]/.test(value)) {
    value = '"' + value.replace(/"/g, '""') + '"';
  }

  return value;
}
