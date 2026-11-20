export function getStartOfWeek(value, weekStartDay) {
  const date = new Date(value);
  const day = date.getDay();
  const diff = (day - weekStartDay + 7) % 7;
  date.setDate(date.getDate() - diff);
  date.setHours(0, 0, 0, 0);
  return date;
}
