export function weekStats(items) {
  let total = 0;
  let cobrado = 0;
  let pendiente = 0;

  items.forEach(function(item) {
    const price = Number(item.precio) || 0;
    total += price;
    if (item.pagado) cobrado += price;
    else pendiente += price;
  });

  return { total: total, cobrado: cobrado, pendiente: pendiente, count: items.length };
}
