export function isDeliveryItemVisible(item, visibleKeys, currentKey, {
  operationalWeekKey,
  parseDeliveryDate,
  weekKey
}) {
  if (!item || !item.fecha) return false;
  const itemWeekKey = operationalWeekKey(item);
  if (!itemWeekKey || !visibleKeys.has(itemWeekKey)) return false;
  if (!item.entregado) return true;
  // Una venta entregada solo permanece visible si pertenece operativamente
  // a la semana actual Y fue marcada como entregada durante esa misma semana.
  // Evita que ventas de semanas anteriores reaparezcan si entregado_en se
  // actualizó accidentalmente al cambiar el estado de todo el cliente.
  if (itemWeekKey !== currentKey) return false;
  const deliveredAt = parseDeliveryDate(item.entregado_en);
  return !!deliveredAt && weekKey(deliveredAt) === currentKey;
}
