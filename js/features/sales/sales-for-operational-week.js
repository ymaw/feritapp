export function salesForOperationalWeek(items, key, { operationalWeekKey }) {
  return (items || []).filter(function(item) {
    return operationalWeekKey(item) === key;
  });
}
