export function getOperationalWeekKey(item, { parseDeliveryDate, weekKey }) {
  if (!item) return null;
  if (item.semana_asignada) {
    const assignedDate = parseDeliveryDate(item.semana_asignada);
    if (assignedDate) return weekKey(assignedDate);
  }
  const saleDate = parseDeliveryDate(item.fecha);
  return saleDate ? weekKey(saleDate) : null;
}
