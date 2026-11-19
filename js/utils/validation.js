export function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

// Política alineada con Supabase Auth: mínimo 8 caracteres, minúscula,
// mayúscula, número y símbolo.
export function isValidPassword(value) {
  return /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9]).{8,}$/.test(value);
}
