const fs = require('node:fs');
const assert = require('node:assert/strict');

(async () => {
  const source = fs.readFileSync('js/features/publisher/dictation-parser.js', 'utf8');
  const moduleUrl = 'data:text/javascript;base64,' + Buffer.from(source).toString('base64');
  const { parseGarmentDictation } = await import(moduleUrl);

  const parsed = parseGarmentDictation(
    'Es un capri de gabardina, marca Ossira, talle 40, cintura 42 cm, tiro delantero 17 cm, cadera 49 cm, largo 60 cm y precio siete mil pesos. Botón y cierre funcionando perfectamente.'
  );

  assert.equal(parsed.category, 'Capris');
  assert.equal(parsed.garmentName.toLocaleLowerCase('es'), 'capri de gabardina');
  assert.equal(parsed.brand, 'Ossira');
  assert.equal(parsed.size, '40');
  assert.equal(parsed.price, '7000');
  assert.equal(parsed.waist, '42');
  assert.equal(parsed.rise, '17');
  assert.equal(parsed.hip, '49');
  assert.equal(parsed.length, '60');
  assert.match(parsed.observations, /Botón y cierre funcionando perfectamente/i);

  const ambiguous = parseGarmentDictation('Capri, cintura 42 cm rígida debe ser 40.');
  assert.equal(ambiguous.waist, '42', 'must preserve the explicitly spoken measurement');
  assert.doesNotMatch(ambiguous.observations, /debe ser 40/i, 'do not reinterpret ambiguous sizing as a field value');

  const empty = parseGarmentDictation('');
  assert.equal(empty.category, '');
  assert.equal(empty.observations, '');
  console.log('Parser de dictado: categoría, atributos, medidas, precio verbal y observaciones verificados.');
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
