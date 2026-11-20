export function deltaHtml(a, b) {
  if (!b) {
    if (!a) return '<span class="delta flat">—</span>';
    return '<span class="delta up">▲ nuevo</span>';
  }

  const percentage = Math.round(((a - b) / b) * 100);
  if (percentage === 0) return '<span class="delta flat">0%</span>';

  const className = percentage > 0 ? 'up' : 'down';
  const arrow = percentage > 0 ? '▲' : '▼';
  return '<span class="delta ' + className + '">' + arrow + ' ' + Math.abs(percentage) + '%</span>';
}
