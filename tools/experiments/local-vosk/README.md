# POC: dictado local con Vosk

Este experimento sigue aislado y no forma parte del publicador ni de la aplicación de producción. Permite evaluar reconocimiento local en Firefox, Chromium y WebKit antes de decidir una integración.

## Ejecución

Servir el repositorio desde localhost o HTTPS (el micrófono requiere un contexto seguro) y abrir:

`/tools/experiments/local-vosk/index.html`

1. Pulsar **Descargar motor local**. La aplicación descarga Vosk y el modelo español pequeño (39,7 MB), verifica su tamaño y SHA-256 y lo carga bajo demanda.
2. Pulsar **Iniciar dictado** y conceder permiso al micrófono.
3. Dictar una descripción y pulsar **Detener**.
4. Revisar y corregir el texto reconocido. El experimento no publica ni guarda la transcripción.
5. Pulsar **Liberar memoria** al terminar.

## Privacidad y red

- El audio se captura y procesa en el dispositivo: MediaStream → AudioWorklet → Vosk Web Worker.
- El audio se divide en bloques transitorios en memoria; no se crea un archivo ni se usa MediaRecorder.
- No se envía audio ni transcripción a APIs externas.
- No se guarda audio o transcripción en localStorage, IndexedDB, Cache API, Supabase ni archivos.
- Las únicas descargas previstas son la biblioteca Vosk fijada a versión 0.0.8 desde jsDelivr y el modelo desde un commit inmutable de Hugging Face.
- Antes de cargar el modelo se verifica el tamaño esperado (39.748.934 bytes) y SHA-256.

## Tamaño y memoria

El modelo comprimido ronda 39,7 MB. Vosk indica que los modelos pequeños pueden requerir alrededor de 300 MB de memoria durante la ejecución. El modelo no se incluye en el bundle de FeritApp: se descarga solo cuando el usuario lo solicita, permanece en memoria mientras está cargado y se libera con **Liberar memoria**.

## Canalización de audio

- Usa AudioWorklet, no ScriptProcessorNode.
- El Worklet agrupa PCM en bloques de 4096 muestras y los transfiere al hilo principal.
- El hilo principal remuestrea a 16 kHz, crea AudioBuffers transitorios y los entrega al worker de Vosk.
- Al detener o salir: se cierra el puerto, se desconectan nodos, se detienen pistas, se elimina el recognizer y se cierra AudioContext.
- Si AudioWorklet no está disponible, el dictado no inicia: no hay fallback obsoleto.

## Limitaciones

- El modelo es español general, no especializado en español rioplatense, nombres de marcas, talles ni precios argentinos.
- La precisión real debe probarse con frases de indumentaria y acentos locales; el parser y los campos deben permitir revisar y corregir el texto antes de incorporarlo.
- El uso de memoria y CPU puede ser elevado en móviles de gama baja. La integración debe ser opt-in y mantener siempre la carga manual disponible.
- Este POC no prueba todavía micrófonos físicos en iOS/iPadOS ni instalación PWA.

## Criterios para aceptar la integración

1. Funciona en Firefox, Chromium y WebKit de escritorio y móvil/PWA.
2. No transmite audio ni transcripción fuera del dispositivo.
3. Reconoce razonablemente un conjunto de frases en español argentino con marcas, talles, medidas y precios.
4. La memoria y el uso de CPU son aceptables en móviles de gama media.
5. Libera el micrófono, AudioContext, recognizer y worker al finalizar.
6. El publicador manual funciona aunque el motor no esté disponible.
7. El usuario puede corregir la transcripción antes de completar campos.

No promover este POC a producción sin resolver y validar las limitaciones anteriores.
