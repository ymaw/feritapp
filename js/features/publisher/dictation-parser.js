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
  dieciocho: 18, diecinueve: 19, veinte: 20, veintiuno: 21, veintiun: 21, veintiuna: 21, veintidos: 22,
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

const NUMBER_WORD_PATTERN = Object.keys(NUMBER_WORDS)
  .concat('mil')
  .sort(function(a, b) { return b.length - a.length; })
  .join('|');
const NUMBER_PHRASE_SOURCE = '(?:' + NUMBER_WORD_PATTERN + ')(?:\\s+(?:y\\s+)?(?:' + NUMBER_WORD_PATTERN + '))*(?:\\s+coma\\s+(?:' + NUMBER_WORD_PATTERN + '))?';
const NUMBER_CAPTURE = '(' + NUMBER_PHRASE_SOURCE + '|\\d+(?:[,.]\\d+)?)';

function parseSpanishNumber(value) {
  const normalized = normalizeWords(value).trim();
  if (!normalized) return '';
  if (/^\d+(?:[,.]\d+)?$/.test(normalized)) return normalized.replace(',', '.');
  const parts = normalized.split(/\s+coma\s+/);
  const parseInteger = function(phrase) {
    const words = phrase.split(/\s+/).filter(function(word) { return word !== 'y'; });
    let total = 0;
    let current = 0;
    let found = false;
    for (const word of words) {
      if (word === 'mil') {
        total += (current || 1) * 1000;
        current = 0;
        found = true;
      } else if (NUMBER_WORDS[word] !== undefined) {
        current += NUMBER_WORDS[word];
        found = true;
      } else {
        return null;
      }
    }
    return found ? total + current : null;
  };
  const integer = parseInteger(parts[0]);
  if (integer === null) return '';
  if (parts.length === 1) return String(integer);
  const decimal = parseInteger(parts[1]);
  return decimal === null ? String(integer) : String(Number(String(integer) + '.' + String(decimal)));
}

function normalizeSpokenNumbersInText(value) {
  const numberPattern = new RegExp('\\b' + NUMBER_PHRASE_SOURCE + '\\b', 'giu');
  return String(value || '').replace(numberPattern, function(phrase) {
    return parseSpanishNumber(phrase) || phrase;
  });
}

function normalizeNoisyTalle(value) {
  // El ASR es-AR suele separar o deformar "talle". Corregir solo
  // cuando la expresión está seguida de un talle reconocible.
  const sizeToken = '(?:xxxs|xxs|xs|s|m|l|xl|xxl|xxxl|\\d+|' + NUMBER_PHRASE_SOURCE + ')';
  const noisyLabel = new RegExp('\\b(?:ta\\s+sh(?:e)?l{1,2}e|ta\\s+che|tache|la\\s+sh(?:e)?l{1,2}e)(?=\\s+' + sizeToken + '\\b)', 'giu');
  return String(value || '').replace(noisyLabel, 'talle');
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
  const text = normalizeNoisyTalle(String(transcript || '')).replace(/\s+/g, ' ').trim();
  const result = {
    category: '', garmentName: '', brand: '', size: '', price: '',
    waist: '', rise: '', hip: '', length: '', observations: '', useMeasurementTemplate: false
  };
  if (!text) return result;

  const categoryRule = CATEGORY_RULES.map((rule) => ({ rule, index: text.search(rule[1]) })).filter((match) => match.index >= 0).sort((a, b) => a.index - b.index)[0]?.rule || null;
  result.useMeasurementTemplate = /\bmedidas?\b/i.test(text) || Boolean(categoryRule && ['Capris', 'Pantalones', 'Polleras', 'Vestidos'].includes(categoryRule[0]));
  if (categoryRule) {
    result.category = categoryRule[0];
    const match = text.match(categoryRule[1]);
    // Tomar la descripción inmediata completa hasta el primer dato estructurado.
    // Ej.: "Vestido negro, marca..." => "Vestido negro".
    const garmentPhrase = text.slice(match.index).split(/[,;.]|\b(?:es|son|tiene|tienen|le\s+falta|le\s+faltan|falta|faltan|presenta|presentan|se\s+encuentra|se\s+encuentran|est[aá]|se\s+observa|se\s+observan|cuenta\s+con|incluye|marca|talle|precio|cintura|tiro|cadera|largo|medidas?)\b/i)[0];
    result.garmentName = clean(garmentPhrase);
  }

  result.brand = normalizeSpokenNumbersInText(firstCapture(text, /\bmarca\s+([\p{L}0-9][\p{L}0-9 .'-]{0,39}?)(?=\s*(?:,|;|\.|\b(?:talle|taye|tali|tale)\b|\bprecio\b|\bcintura\b|\btiro\b|\bcadera\b|\blargo\b)|$)/iu));
  const sizeExpression = new RegExp('\\b(?:talle|taye|tali|tale)\\s+(' + NUMBER_PHRASE_SOURCE + '|[\\p{L}0-9-]{1,12})(?=\\s*(?:[,;.]|\\b(?:precio|cintura|tiro|cadera|largo|marca)\\b|$))', 'iu');
  const rawSize = firstCapture(text, sizeExpression);
  result.size = parseSpanishNumber(rawSize) || rawSize;

  const numericText = normalizeWords(text);
  const priceText = firstCapture(numericText, /\bprecio\s+(?:de\s+)?([\p{L}0-9 .,$]+?)(?=\s*(?:pesos?\b|presos?\b|,|;|\.|$))/iu);
  if (priceText) {
    const digits = priceText.replace(/\s/g, '').replace(/\.(?=\d{3}\b)/g, '').replace(',', '.').match(/^\$?(\d+(?:\.\d+)?)$/);
    result.price = digits ? digits[1].replace(/\.0+$/, '') : parseSpanishNumber(priceText);
  }

  const measurementBoundary = '(?=\\s*(?:cm|centimetros?\\b|[,;.]|\\by\\b|$))';
  const measurementNames = [
    ['waist', '(?:la\\s+)?cintura'],
    ['rise', 'tiro(?:\\s+delantero)?'],
    ['hip', '(?:la\\s+)?cadera'],
    ['length', '(?:el\\s+)?largo'],
    ['boot', '(?:la\\s+)?bota']
  ];
  const measurementExpressions = measurementNames.flatMap(([key, label]) => [
    [key, new RegExp('\\b' + label + '\\s+(?:de\\s+)?' + NUMBER_CAPTURE + '(?:\\s*(?:cm|centimetros?))?' + measurementBoundary, 'i')],
    [key, new RegExp('\\b' + NUMBER_CAPTURE + '\\s*(?:cm|centimetros?)\\s+(?:de\\s+)?' + label + measurementBoundary, 'i')]
  ]);
  for (const [key, expression] of measurementExpressions) {
    const match = numericText.match(expression);
    if (match) result[key] = parseSpanishNumber(match[1]) || numericValue(match[1]);
  }

  let remainder = text;
  const removals = [
    /\bmarca\s+[\p{L}0-9][\p{L}0-9 .'-]{0,39}/iu,
    sizeExpression,
    /\bprecio\s+(?:de\s+)?[\p{L}0-9 .,$]+?(?:\s+(?:pesos?|presos?))?(?=\s*(?:,|;|\.|$))/iu,
    ...measurementNames.flatMap(([key, label]) => [
      new RegExp('\\b' + label + '\\s+(?:de\\s+)?' + NUMBER_CAPTURE + '(?:\\s*(?:cm|centimetros?))?', 'iu'),
      new RegExp('\\b' + NUMBER_CAPTURE + '\\s*(?:cm|centimetros?)\\s+(?:de\\s+)?' + label, 'iu')
    ])
  ];
  for (const expression of removals) remainder = remainder.replace(expression, ' ');
  if (categoryRule) remainder = remainder.replace(result.garmentName || categoryRule[1], ' ');
  remainder = remainder.replace(/^\s*(?:es\s+)?(?:un|una|el|la)\s+/i, ' ');
  remainder = remainder.replace(/\b(?:y|con)\s*(?=[,.;])/gi, ' ');
  result.observations = clean(remainder);
  return result;
}
