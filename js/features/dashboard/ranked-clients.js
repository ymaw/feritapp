// Ranking de clientes: agregación, períodos calendario y ordenamiento.
function parseCalendarDate(value) {
  if (!value) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : new Date(value.getTime());
  const text = String(value);
  const dateOnly = text.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  const date = dateOnly ? new Date(Number(dateOnly[1]), Number(dateOnly[2]) - 1, Number(dateOnly[3])) : new Date(text);
  return Number.isNaN(date.getTime()) ? null : date;
}
export function getRankingPeriodRange(period, now = new Date()) {
  const current = parseCalendarDate(now) || new Date();
  const year = current.getFullYear(), month = current.getMonth();
  let startMonth = 0, endMonth = 12, endYear = year;
  if (period === 'month') { startMonth = month; endMonth = month + 1; }
  else if (period === 'quarter') { startMonth = Math.floor(month / 4) * 4; endMonth = startMonth + 4; }
  else if (period === 'semester') { startMonth = Math.floor(month / 6) * 6; endMonth = startMonth + 6; }
  else if (period !== 'year' && period !== 'all') throw new RangeError('Período de ranking no válido: ' + period);
  if (endMonth > 12) { endYear += Math.floor(endMonth / 12); endMonth %= 12; }
  return period === 'all' ? null : { start: new Date(year, startMonth, 1), end: new Date(endYear, endMonth, 1) };
}
export function getRankedClients(sales, options = {}) {
  const sortBy = options.sortBy || 'articles', period = options.period || 'all';
  const range = getRankingPeriodRange(period, options.now || new Date());
  if (sortBy !== 'articles' && sortBy !== 'total') throw new RangeError('Criterio de ranking no válido: ' + sortBy);
  const byClient = new Map();
  (sales || []).forEach(function(sale) {
    if (!sale) return;
    if (range) {
      const date = parseCalendarDate(sale.fecha);
      if (!date || date < range.start || date >= range.end) return;
    }
    const name = String(sale.cliente || '').trim() || 'Sin nombre';
    if (!byClient.has(name)) byClient.set(name, { name, count: 0, total: 0 });
    const client = byClient.get(name);
    client.count += 1;
    client.total += Number(sale.precio) || 0;
  });
  return Array.from(byClient.values()).sort(function(a, b) {
    const primary = sortBy === 'total' ? b.total - a.total : b.count - a.count;
    if (primary) return primary;
    const secondary = sortBy === 'total' ? b.count - a.count : b.total - a.total;
    return secondary || a.name.localeCompare(b.name, 'es');
  });
}
