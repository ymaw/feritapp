export function getWeekKey(value, { startOfWeek }) {
  const start = startOfWeek(value);
  return start.getFullYear() + '-' + String(start.getMonth() + 1).padStart(2, '0') + '-' + String(start.getDate()).padStart(2, '0');
}
