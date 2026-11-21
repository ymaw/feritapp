export function getPreviousWeekKey(referenceDate, { startOfWeek, weekKey }) {
  const previousStart = startOfWeek(referenceDate || new Date());
  previousStart.setDate(previousStart.getDate() - 7);
  return weekKey(previousStart);
}
