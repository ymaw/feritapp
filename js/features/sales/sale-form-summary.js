export function getSaleFormSummary(rows) {
  let total = 0;
  let hasCompleteItem = false;

  (rows || []).forEach(function(row) {
    const price = parseFloat(row && row.price);
    if (!isNaN(price)) total += price;
    const name = row && row.name ? row.name : '';
    if (name.trim().length > 0 && Number.isFinite(price) && price > 0) {
      hasCompleteItem = true;
    }
  });

  return { total, hasCompleteItem };
}
