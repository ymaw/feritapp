const fs = require('node:fs');
const assert = require('node:assert/strict');

const html = fs.readFileSync('index.html', 'utf8');
const script = fs.readFileSync('script.js', 'utf8');
const entry = fs.readFileSync('js/features/publisher/entry.js', 'utf8');
const moduleSource = fs.readFileSync('js/features/publisher/garment-publisher.js', 'utf8');
const parserSource = fs.readFileSync('js/features/publisher/dictation-parser.js', 'utf8');
const audioModule = fs.readFileSync('js/features/publisher/audio-visualizer.js', 'utf8');
const css = fs.readFileSync('css/facebook-garment-publisher.css', 'utf8');
const baseCss = fs.readFileSync('css/style.css', 'utf8');

assert.match(html, /id="viewPublisher"/);
assert.match(html, /id="publisherPhoto"[^>]*accept="image\/jpeg,image\/png,image\/webp"/);
assert.match(html, /id="publisherPostText"/);
assert.match(entry, /import \{ initGarmentPublisher \} from '\.\/garment-publisher\.js'/);
assert.match(entry, /import \{ initAudioVisualizer \} from '\.\/audio-visualizer\.js'/);
assert.match(entry, /initGarmentPublisher\(/);
assert.match(entry, /initAudioVisualizer\(\)/);
assert.match(html, /js\/features\/publisher\/entry\.js/);
assert.match(audioModule, /cancelAnimationFrame/);
assert.match(audioModule, /requestAnimationFrame/);
assert.match(audioModule, /publisher:dictation-speaking/);
assert.match(audioModule, /document\.visibilityState === 'hidden'/);
assert.match(moduleSource, /function abortDictationForLifecycle\(\)/);
assert.match(moduleSource, /activeRecognition\.abort\(\)/);
assert.match(script, /publisher:\{label:'Publicador',icon:'✦',view:'publisher'\}/);
assert.match(script, /viewPublisher/);
assert.match(moduleSource, /MEASUREMENT_CATEGORIES = new Set\(\['pantalones', 'capris', 'polleras', 'vestidos'\]\)/);
assert.match(moduleSource, /dictationRequestsMeasurements \|\| MEASUREMENT_CATEGORIES/);
assert.match(moduleSource, /categoryCanBeReplaced/);
assert.match(moduleSource, /updateCategoryTemplate\(\);[\s\S]*?const fields = \[/);
assert.match(moduleSource, /dictationRequestsMeasurements = false/);
assert.match(html, /<option value="">Seleccioná una categoría<\/option>/);
assert.match(parserSource, /useMeasurementTemplate/);
assert.match(moduleSource, /navigator\.canShare/);
assert.match(moduleSource, /navigator\.share/);
assert.match(moduleSource, /navigator\.clipboard\.writeText/);
assert.match(moduleSource, /URL\.createObjectURL/);
assert.match(css, /object-fit:contain/);
assert.match(css, /@media\(max-width:899px\)/);

assert.match(moduleSource, /window\.SpeechRecognition \|\| window\.webkitSpeechRecognition/);
assert.match(moduleSource, /activeRecognition\.lang = 'es-AR'/);
assert.match(moduleSource, /activeRecognition\.continuous = true/);
assert.match(moduleSource, /activeRecognition\.interimResults = true/);
assert.match(moduleSource, /Dictá la prenda y revisá los datos sugeridos/);
assert.match(html, /id="publisherDictationStart"[^>]*>Iniciar dictado/);
assert.match(css, /publisher-preview-card\s*\{[^}]*position:\s*sticky/);

console.log('Publicador: estructura, categorías, vista previa, privacidad y rutas de compartir verificadas.');

assert.match(html, /id="publisherDictationStart"/);
assert.match(html, /id="publisherDictationStop"/);
assert.match(html, /id="publisherTranscript"/);
assert.match(html, /id="publisherUseTranscript"/);
assert.match(moduleSource, /activeRecognition\.continuous = true/);
assert.match(moduleSource, /activeRecognition\.interimResults = true/);
assert.match(moduleSource, /activeRecognition\.onresult = updateTranscript/);
assert.match(moduleSource, /activeRecognition\.onend = function\(\)[\s\S]*?Transcripción lista/);
assert.match(moduleSource, /parseGarmentDictation\(transcript\)/);
assert.match(moduleSource, /Interpretar y completar campos/);
assert.match(html, /Dictá la prenda y revisá los datos sugeridos/i);
assert.match(css, /publisher-dictation/);

assert.match(html, /id="publisherAddGarment"/);
assert.match(html, /id="publisherQueuedGarments"/);
assert.match(moduleSource, /queuedGarments\.push/);
assert.match(moduleSource, /PRENDA/);
assert.match(moduleSource, /navigator\.canShare\(\{ files: shareData\.files \}\)/);

assert.doesNotMatch(html, /publisherMicTest(Start|Stop)/);
assert.doesNotMatch(html, /Comprobación de dispositivo|Probar micrófono/);
assert.match(audioModule, /publisher:dictation-start/);
assert.match(audioModule, /publisher:dictation-stop/);
assert.match(html, /id="publisherAudioVisualizer"/);
assert.match(moduleSource, /activeRecognition\.continuous = true/);
assert.match(moduleSource, /Pausa breve detectada\. Retomando la escucha/);
assert.match(moduleSource, /function renderPreviewPhotos\(\)/);
assert.match(moduleSource, /remove\.addEventListener\('click',[\s\S]*?renderPreviewPhotos\(\);[\s\S]*?refreshLivePreview\(\);/);
assert.match(moduleSource, /photos\.forEach/);
assert.match(css, /publisher-photo-preview\.is-gallery/);
assert.match(html, /id="publisherOpenPreview"/);
assert.match(css, /publisher-audio-visualizer/);
assert.match(css, /color-scheme:dark/);
assert.match(css, /publisher-preview-modal/);
assert.match(moduleSource, /function getPreviewFocusableElements\(\)/);
assert.match(moduleSource, /event\.key !== 'Tab'/);
assert.match(moduleSource, /event\.shiftKey/);
assert.match(moduleSource, /previewReturnFocus/);

assert.match(moduleSource, /function interpretTranscript\(\)/);
assert.match(moduleSource, /activeRecognition\.onend = function\(\)[\s\S]*?Transcripción lista/);
assert.match(html, /id="publisherCategory" class="publisher-category-select"/);
assert.match(html, /id="publisherPhoto" class="publisher-photo-input" type="file"/);
assert.match(html, /id="publisherObservations" class="publisher-fixed-textarea"/);
assert.match(css, /publisher-category-select/);
assert.match(css, /publisher-photo-input::file-selector-button/);
assert.match(css, /publisher-fixed-textarea\{resize:none!important/);

assert.match(moduleSource, /interpretedFieldValues = new Map/);
assert.match(moduleSource, /isUnchangedInterpretation/);
assert.match(moduleSource, /interpretedObservations/);
assert.match(html, /publisher-transcript-panel/);
assert.match(html, /Medidas de la prenda/);
assert.ok(html.indexOf('class="publisher-dictation"') < html.indexOf('id="publisherMeasurements"'));
assert.match(css, /publisher-transcript-footer/);
assert.match(css, /publisher-dictation-tools/);

assert.match(html, /id="publisherCamera"[^>]*capture="environment"/);
assert.match(html, /id="publisherChoosePhoto"/);
assert.match(html, /id="publisherTakePhoto"/);
assert.match(moduleSource, /function handleSelectedPhoto\(file, sourceInput\)/);
assert.match(moduleSource, /cameraInput\.click\(\)/);
assert.match(moduleSource, /photoInput\.click\(\)/);
assert.match(css, /publisher-photo-actions/);
assert.match(css, /publisher-photo-action/);

assert.match(moduleSource, /if \(dictationRequested\)[\s\S]*?finalTranscriptParts = transcriptField\.value\.trim\(\)/);
assert.match(audioModule, /is-listening/);
assert.match(audioModule, /is-speaking/);
assert.match(audioModule, /publisher:dictation-speaking/);
assert.match(css, /publisher-audio-visualizer\.is-active\.is-listening/);
assert.match(css, /publisher-audio-visualizer\.is-active\.is-speaking/);

assert.match(css, /@media \(max-width: 899px\)[\s\S]*?grid-template-columns: minmax\(0, 1fr\)/);
assert.match(css, /#viewPublisher \.publisher-layout[\s\S]*?box-sizing: border-box/);
assert.match(script, /deliveries:\{label:'Entregas',icon:'<svg[\s\S]*?viewBox="0 0 24 24"/);
assert.match(script, /stroke="currentColor" stroke-width="1\.8"/);

assert.match(parserSource, /sort\(\(a, b\) => a\.index - b\.index\)/);
assert.match(parserSource, /measurementNames\.flatMap/);
assert.match(parserSource, /centimetros/);
assert.match(audioModule, /publisher:dictation-speaking/);
assert.match(audioModule, /is-speaking/);
assert.match(script, /function renderCategoryManager\(\)/);
assert.match(script, /function persistNewCategory\(name\)/);
assert.match(script, /categories\.filter\(function\(item\)\{return item!==name;\}\)/);
assert.match(html, /id="categoryManager"/);
assert.match(baseCss, /category-manager-actions/);

assert.match(html, /id="publisherBoot"/);
assert.match(html, /id="publisherSisa"/);
assert.match(moduleSource, /\['boot', 'publisherBoot'\]/);
assert.match(moduleSource, /\['sisa', 'publisherSisa'\]/);
assert.match(moduleSource, /label: 'Bota'/);
assert.match(parserSource, /presos\?/);
assert.match(parserSource, /\['boot', '\(\?:la\\\\s\+\)\?bota'\]/);

assert.match(html, /id="publisherHeight"/);
assert.match(html, /id="publisherShoulders"/);
assert.match(moduleSource, /\['height', 'publisherHeight'\]/);
assert.match(moduleSource, /\['shoulders', 'publisherShoulders'\]/);
assert.match(css, /publisher-measurements \.publisher-fields-grid[\s\S]*?repeat\(2,minmax\(0,1fr\)\)/);
assert.match(parserSource, /medidas\?/);

assert.match(parserSource, /capitalizeFirstWord/);
assert.match(html, /id="publisherMeasurementsDisclosure"/);
assert.match(html, /<summary class="publisher-card-heading">[\s\S]*?Datos de la prenda/);
assert.match(html, /<summary class="publisher-card-heading">[\s\S]*?Vista Previa/);
assert.ok(html.indexOf('id="publisherObservations"') < html.indexOf('id="publisherPhoto"'));
assert.match(css, /publisher-photo-upload/);
assert.match(css, /#278c72/);
assert.match(moduleSource, /resizeObservationsField/);
