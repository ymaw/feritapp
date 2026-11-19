// Interpreta las columnas tipo DATE como fechas de calendario locales.
// Evita que new Date('YYYY-MM-DD') las convierta desde UTC y mueva el día.
export function parseDeliveryDate(value) {
  if (!value) return null;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : new Date(value.getTime());
  }
  const text = String(value);
  const dateOnly = text.match(/^(\\d{4})-(\\d{2})-(\\d{2})$/);
  if (dateOnly) {
    const localDate = new Date(Number(dateOnly[1]), Number(dateOnly[2]) - 1, Number(dateOnly[3]));
    return Number.isNaN(localDate.getTime()) ? null : localDate;
  }
  const parsed = new Date(text);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}
