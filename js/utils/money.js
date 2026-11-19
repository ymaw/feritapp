// Formatea importes en pesos argentinos con el formato regional original de FeritApp.
export function money(value) {
  return "$" + Number(value || 0).toLocaleString('es-AR');
}
