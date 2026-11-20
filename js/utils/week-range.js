const MONTHS = ["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"];

export function formatRange(weekStartKey) {
  const start = new Date(weekStartKey + "T00:00:00");
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  return start.getDate() + " " + MONTHS[start.getMonth()] + " – " + end.getDate() + " " + MONTHS[end.getMonth()];
}

export function formatRangeShort(weekStartKey) {
  const start = new Date(weekStartKey + "T00:00:00");
  return start.getDate() + " " + MONTHS[start.getMonth()];
}
