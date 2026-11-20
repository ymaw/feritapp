export function salesForWeek(items, key, { parseDeliveryDate, weekKey }) {
  return (items || []).filter(function(item) {
    if (!item || !item.fecha) return false;
    const date = parseDeliveryDate(item.fecha);
    return !!date && weekKey(date) === key;
  });
}
