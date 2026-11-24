# POC: dictado local con Vosk

Este experimento está aislado y no forma parte del publicador ni de la aplicación en producción. Sirve para comprobar compatibilidad real de Vosk WebAssembly en Firefox, Chromium y WebKit antes de decidir una integración.

## Ejecución

Servir el repositorio desde localhost o HTTPS (el micrófono requiere un contexto seguro) y abrir:

`/tools/experiments/local-vosk/index.html`

1. Pulsar **Descargar motor local**. Esta acción carga Vosk WebAssembly y descarga el modelo español pequeño (aprox. 39,7 MB).
2. Pulsar **Iniciar dictado** y conceder permiso al micrófono.
3. Dictar una descripción y pulsar **Detener**.
4. Revisar el texto reconocido. El experimento no publica, no guarda y no envía la transcripción.

## Privacidad y red

- El audio del micrófono se procesa en el dispositivo y se entrega al worker WebAssembly de Vosk.
- Las únicas descargas previstas son la biblioteca Vosk desde jsDelivr y el modelo desde Hugging Face.
- No hay llamadas a APIs de transcripción, ni subida de audio.
- El POC no guarda audio ni transcripciones en almacenamiento persistente.

## Tamaño y memoria

El archivo comprimido del modelo ronda 39,7 MB. La documentación de Vosk indica que los modelos pequeños pueden requerir alrededor de 300 MB de memoria durante la ejecución. Por eso el motor se carga solo al solicitarlo y existe una acción explícita para liberarlo.

## Limitaciones deliberadas

- No modifica `garment-publisher.js`, el parser actual, el visualizador ni el service worker.
- Usa `ScriptProcessorNode` porque es la interfaz de audio documentada por `vosk-browser`; está obsoleta y debe reemplazarse por una canalización AudioWorklet/worker antes de producción.
- La biblioteca `vosk-browser` expone reconocimiento parcial/final en Web Workers, pero esta prueba no garantiza todavía rendimiento adecuado en móviles.
- El modelo es español general; no hay resultados publicados específicos de español rioplatense, marcas de indumentaria ni precios argentinos.
- La descarga se realiza bajo demanda; este POC todavía no implementa persistencia offline del modelo ni verificación SHA-256 automática.

## Criterios para aceptar la integración

1. Funciona en Firefox, Chromium y WebKit en escritorio y móvil/PWA.
2. No transmite audio ni texto fuera del dispositivo.
3. La transcripción en español argentino identifica correctamente marcas, talles, medidas y precios de un conjunto de frases de prueba.
4. La memoria y el uso de CPU son aceptables en móviles de gama media.
5. Se libera el micrófono, AudioContext, recognizer y worker al finalizar.
6. El publicador manual continúa funcionando aunque el motor no esté disponible.

No promover este POC a producción sin resolver las limitaciones anteriores.
