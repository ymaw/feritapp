const CATEGORY_RULES = [
  ['Capris', /\\bcapri(?:s)?\\b/i], ['Pantalones', /\\bpantal[oó]n(?:es)?\\b/i],
  ['Polleras', /\\bpollera(?:s)?\\b/i], ['Vestidos', /\\bvestido(?:s)?\\b/i],
  ['Camisas', /\\bcamisa(?:s)?\\b/i], ['Remeras', /\\bremera(?:s)?\\b/i],
  ['Musculosas', /\\bmusculosa(?:s)?\\b/i], ['Accesorios', /\\b(?:accesorio|collar|pulsera|cartera)\\b/i],
  ['Zapatillas', /\\bzapatilla(?:s)?\\b/i]
];

function clean(value) {
  return String(value || '').replace(/[,.!?;:]+$/g, '').trim();
}

function capture(text, expression) {
  const match = text.match(expression);
  return match ? clean(match[1]) : '';
}

function numberValue(value) {
  const match = String(value || '').match(/\\d+(?:[,.]\\d+)?/);
  return match ? match[0].replace(',', '.') : '';
}

export function parseGarmentDictation(transcript) {
  const text = String(transcript || '').replace(/\\s+/g, ' ').trim();
  const result = { category: '', garmentName: '', brand: '', size: '', price: '', waist: '', rise: '', hip: '', length: '', observations: '' };
  if (!text) return result;

  const categoryRule = CATEGORY_RULES.find(item => item[1].test(text));
  if (categoryRule) result.category = categoryRule[0];
  result.brand = capture(text, /\\bmarca\\s+([\\p{L}0-9][\\p{L}0-9 .'-]{0,49}?)(?=\\s+(?:talle|precio|la cintura|cintura|tiro|cadera|largo|y|con)\\b|[,.;]|$)/iu);
  result.size = capture(text, /\\btalle\\s+([\\p{L}0-9-]{1,12})/iu);
  const priceText = capture(text, /\\bprecio\\s+(?:de\\s+)?([\\p{L}0-9 .,$]+?)(?=\\s+(?:pesos?|y|la|tiene|con)\\b|[,.;]|$)/iu);
  if (priceText) {
    const numeric = priceText.replace(/\\./g, '').replace(/,/g, '.').match(/\\d+(?:\\.\\d+)?/);
    if (numeric) result.price = numeric[0].replace(/\\.0+$/, '');
    else {
      const words = priceText.toLocaleLowerCase('es').normalize('NFD').replace(/[\\u0300-\\u036f]/g, '');
      const units = { uno:1, un:1, una:1, dos:2, tres:3, cuatro:4, cinco:5, seis:6, siete:7, ocho:8, nueve:9, diez:10, veinte:20, treinta:30, cuarenta:40, cincuenta:50, cien:100, ciento:100, quinientos:500, seiscientos:600, setecientos:700, ochocientos:800, novecientos:900 };
      const parts = words.split(/\\s+/); let total=0, current=0, found=false;
      parts.forEach(word => { if (units[word] !== undefined) { current += units[word]; found=true; } else if (word === 'mil') { current=(current||1)*1000; total+=current; current=0; found=true; } });
      if (found) result.price = String(total + current);
    }
  }
  const measurements = [
    ['waist', /\\bcintura\\s+(?:de\\s+)?(\\d+(?:[,.]\\d+)?)(?:\\s*cm)?/i],
    ['rise', /\\btiro(?:\\s+delantero)?\\s+(?:de\\s+)?(\\d+(?:[,.]\\d+)?)(?:\\s*cm)?/i],
    ['hip', /\\bcadera\\s+(?:de\\s+)?(\\d+(?:[,.]\\d+)?)(?:\\s*cm)?/i],
    ['length', /\\blargo\\s+(?:de\\s+)?(\\d+(?:[,.]\\d+)?)(?:\\s*cm)?/i]
  ];
  measurements.forEach(([key, regex]) => { const match=text.match(regex); if(match) result[key]=numberValue(match[1]); });

  if (result.category) {
    const categoryMatch = text.match(CATEGORY_RULES.find(item => item[0]===result.category)[1]);
    if (categoryMatch) {
      const start = Math.max(0, categoryMatch.index - 28);
      const prefix = text.slice(start, categoryMatch.index).replace(/^(?:es|seria|tengo|vendo|una|un|la|el)\\s+/i, '').trim();
      const categoryWord = categoryMatch[0];
      const suffix = text.slice(categoryMatch.index + categoryWord.length).match(/^\\s+de\\s+[\\p{L}]+/iu);
      result.garmentName = clean(categoryWord + (suffix ? suffix[0] : ''));
      if (!result.garmentName && prefix) result.garmentName = clean(prefix + ' ' + categoryWord);
    }
  }

  let remainder = text;
  const removals = [
    /\\bmarca\\s+[\\p{L}0-9][\\p{L}0-9 .'-]{0,49}? (?=\\b(?:talle|precio|cintura|tiro|cadera|largo)\\b)/iu,
    /\\btalle\\s+[\\p{L}0-9-]{1,12}/iu,
    /\\bprecio\\s+(?:de\\s+)?[\\p{L}0-9 .,$]+?(?=\\s+(?:pesos?|y|la|tiene|con)\\b|[,.;]|$)/iu,
    /\\b(?:la\\s+)?cintura\\s+(?:de\\s+)?\\d+(?:[,.]\\d+)?(?:\\s*cm)?/iu,
    /\\btiro(?:\\s+delantero)?\\s+(?:de\\s+)?\\d+(?:[,.]\\d+)?(?:\\s*cm)?/iu,
    /\\b(?:la\\s+)?cadera\\s+(?:de\\s+)?\\d+(?:[,.]\\d+)?(?:\\s*cm)?/iu,
    /\\b(?:el\\s+)?largo\\s+(?:de\\s+)?\\d+(?:[,.]\\d+)?(?:\\s*cm)?/iu
  ];
  removals.forEach(regex => { remainder = remainder.replace(regex, ' '); });
  if (result.brand) remainder = remainder.replace(new RegExp('\\\\bmarca\\\\s+' + result.brand.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\  removals.forEach(regex => { remainder = remainder.replace(regex, ' '); });'), 'i'), ' ');
  if (result.category) remainder = remainder.replace(CATEGORY_RULES.find(item => item[0] === result.category)[1], ' ');
  result.observations = clean(remainder.replace(/\\s+/g, ' ').replace(/^[,.;\\s]+|[,.;\\s]+$/g, ''));
  return result;
}
