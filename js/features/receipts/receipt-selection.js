export function getReceiptSelectionForClient(items, clientName, now, {
  parseDeliveryDate,
  weekKey,
  previousWeekKey,
  salesForWeek
}) {
  const normalizedClientName = String(clientName || '').trim().toLocaleLowerCase('es');
  if (!normalizedClientName) return { items: [], isAbonado: false };

  const clientItems = (items || []).filter(function(item) {
    return !!item &&
      String(item.cliente || '').trim().toLocaleLowerCase('es') === normalizedClientName &&
      !!parseDeliveryDate(item.fecha);
  });
  const currentKey = weekKey(now);
  const previousKey = previousWeekKey(now);
  const currentWeekItems = salesForWeek(clientItems, currentKey);
  const previousWeekItems = salesForWeek(clientItems, previousKey);
  const isPaid = function(item) { return !!item.pagado; };
  const weekIsAbonado = function(weekItems) {
    return weekItems.length > 0 && weekItems.every(isPaid);
  };

  const previousWeekIsAbonado = weekIsAbonado(previousWeekItems);
  const eligibleItems = currentWeekItems.concat(
    previousWeekItems.length && !previousWeekIsAbonado ? previousWeekItems : []
  ).slice().sort(function(a, b) {
    return parseDeliveryDate(a.fecha) - parseDeliveryDate(b.fecha);
  });

  return {
    items: eligibleItems,
    isAbonado: weekIsAbonado(currentWeekItems)
  };
}
