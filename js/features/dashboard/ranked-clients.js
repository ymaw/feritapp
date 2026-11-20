export function getRankedClients(sales) {
  const byClient = {};
  (sales || []).forEach(function(s) {
    const name = s.cliente || 'Sin nombre';
    if (!byClient[name]) byClient[name] = { name: name, count: 0, total: 0 };
    byClient[name].count += 1;
    byClient[name].total += Number(s.precio) || 0;
  });
  return Object.keys(byClient)
    .map(function(key) { return byClient[key]; })
    .sort(function(a, b) { return b.count - a.count || b.total - a.total; });
}
