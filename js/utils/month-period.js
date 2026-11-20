const MONTH_NAMES = ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];

export function monthKey(value) {
  const date = new Date(value);
  return date.getFullYear() + "-" + String(date.getMonth() + 1).padStart(2, '0');
}

export function monthLabel(key) {
  const parts = key.split("-");
  const year = parts[0];
  const monthIndex = parseInt(parts[1], 10) - 1;
  return MONTH_NAMES[monthIndex] + " " + year;
}
