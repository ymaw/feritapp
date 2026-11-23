export function groupSalesByMonth(items, { monthKey }) {
  const groups = {};
  (items || []).forEach(function(item) {
    const key = monthKey(item.fecha);
    if (!groups[key]) groups[key] = [];
    groups[key].push(item);
  });
  return groups;
}
