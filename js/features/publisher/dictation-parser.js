const CATEGORY_RULES = [
  ['Capris', /\bcapri(?:s)?\b/i],
  ['Pantalones', /\bpantal[oó]n(?:es)?\b/i],
  ['Polleras', /\bpollera(?:s)?\b/i],
  ['Vestidos', /\bvestido(?:s)?\b/i],
  ['Camisas', /\bcamisa(?:s)?\b/i],
  ['Remeras', /\bremera(?:s)?\b/i],
  ['Musculosas', /\bmusculosa(?:s)?\b/i],
  ['Accesorios', /\b(?:accesorio|collar|pulsera|cartera)\b/i],
  ['Zapatillas', /\bzapatilla(?:s)?\b/i]
];

const NUMBER_WORDS = {
  cero: 0, un: 1, uno: 1, una: 1, dos: 2, tres: 3, cuatro: 4, cinco: 5,
  seis: 6, siete: 7, ocho: 8, nueve: 9, diez: 10, once: 11, doce: 12,
  trece: 13, catorce: 14, quince: 15, dieciseis: 16, diecisiete: 17,
  dieciocho: 18, diecinueve: 19, veinte: 20, veintiuno: 21, veintidos: 22,
  veintitres: 23, veinticuatro: 24, veinticinco: 25, veintiseis: 26,
  veintisiete: 27, veintiocho: 28, veintinueve: 29, treinta: 30,
  cuarenta: 40, cincuenta: 50, sesenta: 60, setenta: 70, ochenta: 80,
  noventa: 90, cien: 100, ciento: 100, doscientos: 200, trescientos: 300,
  cuatrocientos: 400, quinientos: 500, seiscientos: 600, setecientos: 700,
  ochocientos: 800, novecientos: 900
};

function normalizeWords(value) {
  return String(value || '').toLocaleLowerCase('es').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function parseSpanishNumber(value) {
  const words = normalizeWords(value).split(/\s+/).filter(Boolean);
  let total = 0;
  let current = 0;
  let found = false;
  for (const word of words) {
    if (NUMBER_WORDS[word] !== undefined) {
      current += NUMBER_WORDS[word];
      found = true;
    } else if (word === 'mil') {
      total += (current || 1) * 1000;
      current = 0;
      found = true;
    }
  }
  return found ? String(total + current) : '';
}

function clean(value) {
  return String(value || '').replace(/^[\s,.;:¡!¿?y]+|[\s,.;:¡!¿?]+$/gi, '').replace(/\s+/g, ' ').trim();
}

function firstCapture(text, expression) {
  const match = text.match(expression);
  return match ? clean(match[1]) : '';
}

function numericValue(value) {
  const match = String(value || '').match(/\d+(?:[,.]\d+)?/);
  return match ? match[0].replace(',', '.') : '';
}

export function parseGarmentDictation(transcript) {
  const text = String(transcript || '').replace(/\s+/g, ' ').trim();
  const result = {
    category: '', garmentName: '', brand: '', size: '', price: '',
    waist: '', rise: '', hip: '', length: '', observations: '', useMeasurementTemplate: false
  };
  if (!text) return result;

  const categoryRule = CATEGORY_RULES.find(([, expression]) => expression.test(text));
  result.useMeasurementTemplate = /\\bmedidas?\\b/i.test(text) || Boolean(categoryRule && ['Capris', 'Pantalones', 'Polleras', 'Vestidos'].includes(categoryRule[0]));
  if (categoryRule) {
    result.category = categoryRule[0];
    const match = text.match(categoryRule[1]);
    const suffix = text.slice(match.index + match[0].length).match(/^\s+de\s+[\p{L}]+/iu);
    result.garmentName = clean(match[0] + (suffix ? suffix[0] : ''));
  }

  result.brand = firstCapture(text, /\bmarca\s+([\p{L}0-9][\p{L}0-9 .'-]{0,39}?)(?=\s*(?:,|;|\.|\btalle\b|\bprecio\b|\bcintura\b|\btiro\b|\bcadera\b|\blargo\b)|$)/iu);
  result.size = firstCapture(text, /\btalle\s+([\p{L}0-9-]{1,12})/iu);

  const priceText = firstCapture(text, /\bprecio\s+(?:de\s+)?([\p{L}0-9 .,$]+?)(?=\s*(?:pesos?\b|,|;|\.|$))/iu);
  if (priceText) {
    const digits = priceText.replace(/\s/g, '').replace(/\.(?=\d{3}\b)/g, '').replace(',', '.').match(/^\$?(\d+(?:\.\d+)?)$/);
    result.price = digits ? digits[1].replace(/\.0+$/, '') : parseSpanishNumber(priceText);
  }

  const measurements = [
    ['waist', /\b(?:la\s+)?cintura\s+(?:de\s+)?(\d+(?:[,.]\d+)?)(?:\s*cm)?/i],
    ['rise', /\btiro(?:\s+delantero)?\s+(?:de\s+)?(\d+(?:[,.]\d+)?)(?:\s*cm)?/i],
    ['hip', /\b(?:la\s+)?cadera\s+(?:de\s+)?(\d+(?:[,.]\d+)?)(?:\s*cm)?/i],
    ['length', /\b(?:el\s+)?largo\s+(?:de\s+)?(\d+(?:[,.]\d+)?)(?:\s*cm)?/i]
  ];
  for (const [key, expression] of measurements) {
    const match = text.match(expression);
    if (match) result[key] = numericValue(match[1]);
  }

  let remainder = text;
  const removals = [
    /\bmarca\s+[\p{L}0-9][\p{L}0-9 .'-]{0,39}/iu,
    /\btalle\s+[\p{L}0-9-]{1,12}/iu,
    /\bprecio\s+(?:de\s+)?[\p{L}0-9 .,$]+?(?:\s+pesos?)?(?=\s*(?:,|;|\.|$))/iu,
    /\b(?:la\s+)?cintura\s+(?:de\s+)?\d+(?:[,.]\d+)?(?:\s*cm)?/iu,
    /\btiro(?:\s+delantero)?\s+(?:de\s+)?\d+(?:[,.]\d+)?(?:\s*cm)?/iu,
    /\b(?:la\s+)?cadera\s+(?:de\s+)?\d+(?:[,.]\d+)?(?:\s*cm)?/iu,
    /\b(?:el\s+)?largo\s+(?:de\s+)?\d+(?:[,.]\d+)?(?:\s*cm)?/iu
  ];
  for (const expression of removals) remainder = remainder.replace(expression, ' ');
  if (categoryRule) remainder = remainder.replace(categoryRule[1], ' ');
  remainder = remainder.replace(/^\s*(?:es\s+)?(?:un|una|el|la)\s+/i, ' ');
  remainder = remainder.replace(/\b(?:y|con)\s*(?=[,.;])/gi, ' ');
  result.observations = clean(remainder);
  return result;
}
