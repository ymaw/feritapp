export function groupSalesByWeek(items, useOperationalAssignment, { operationalWeekKey, parseDeliveryDate, weekKey }) {
  const groups = {};
  (items || []).forEach(function(item) {
    const key = useOperationalAssignment
      ? operationalWeekKey(item)
      : weekKey(parseDeliveryDate(item.fecha));
    if (!key) return;
    if (!groups[key]) groups[key] = [];
    groups[key].push(item);
  });
  return groups;
}
