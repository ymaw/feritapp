// Escapa texto no confiable para insertarlo en contextos HTML.
export function escapeHtml(value, { documentRef = document } = {}) {
  const element = documentRef.createElement('div');
  element.textContent = value || '';
  return element.innerHTML.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
