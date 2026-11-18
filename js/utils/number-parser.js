/**
 * Converts Spanish dictation transcripts into whole-number prices.
 * Kept independent from browser APIs so parsing can be tested in isolation.
 */

const NUM_WORDS = {
  'cero':0,'un':1,'uno':1,'una':1,'dos':2,'tres':3,'cuatro':4,'cinco':5,'seis':6,'siete':7,'ocho':8,'nueve':9,
  'diez':10,'once':11,'doce':12,'trece':13,'catorce':14,'quince':15,'dieciseis':16,'diecisiete':17,'dieciocho':18,'diecinueve':19,
  'veinte':20,'veintiun':21,'veintiuno':21,'veintidos':22,'veintitres':23,'veinticuatro':24,'veinticinco':25,'veintiseis':26,'veintisiete':27,'veintiocho':28,'veintinueve':29,
  'treinta':30,'cuarenta':40,'cincuenta':50,'sesenta':60,'setenta':70,'ochenta':80,'noventa':90,
  'cien':100,'ciento':100,'doscientos':200,'doscientas':200,'trescientos':300,'trescientas':300,
  'cuatrocientos':400,'cuatrocientas':400,'quinientos':500,'quinientas':500,'seiscientos':600,'seiscientas':600,
  'setecientos':700,'setecientas':700,'ochocientos':800,'ochocientas':800,'novecientos':900,'novecientas':900
};

function stripAccents(value) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function wordsToNumber(text) {
  const clean = stripAccents(text.toLowerCase())
    .replace(/pesos|peso|con\s*\d+\s*centavos?/g, ' ')
    .replace(/[^a-z0-9\s]/g, ' ');
  const words = clean.split(/\s+/).filter(Boolean);
  let total = 0;
  let current = 0;
  let found = false;

  words.forEach(function(word) {
    if (/^\d+$/.test(word)) {
      current += parseInt(word, 10);
      found = true;
      return;
    }
    if (word in NUM_WORDS) {
      current += NUM_WORDS[word];
      found = true;
      return;
    }
    if (word === 'mil') {
      current = (current === 0 ? 1 : current) * 1000;
      total += current;
      current = 0;
      found = true;
      return;
    }
    if (word === 'millon' || word === 'millones') {
      current = (current === 0 ? 1 : current) * 1000000;
      total += current;
      current = 0;
      found = true;
    }
    // Filler words such as "y" and "de" are intentionally ignored.
  });

  total += current;
  return found ? total : null;
}

export function extractPrice(transcript) {
  const digitMatch = transcript.replace(/[.,](?=\d{3}\b)/g, '').match(/\d+/g);
  if (digitMatch) {
    // Preserve the original rule: use only the first digit group.
    return parseInt(digitMatch[0], 10);
  }
  return wordsToNumber(transcript);
}
