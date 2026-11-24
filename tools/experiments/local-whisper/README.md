# POC de evaluación: Whisper.cpp WASM para español rioplatense

## Estado

Experimento aislado de evaluación. No integra Whisper en FeritApp, no modifica el publicador, no cambia el service worker y no toca Supabase ni producción.

Base: rama `feature/local-vosk-dictation-poc`, commit `aa5310a16a7ac0a724905451ca4e6671eb17034a`.

## Por qué evaluarlo

Whisper.cpp ofrece una compilación WebAssembly que ejecuta el reconocimiento en el navegador. El proyecto upstream documenta que el audio no sale del equipo, que el modelo multilingüe `tiny` ocupa aproximadamente 74–75 MB y que el rendimiento puede ser exigente: en CPU/navegador modernos informa alrededor de 2–3 veces tiempo real para tiny/base. Requiere WebAssembly SIMD.

Fuentes upstream:
- https://github.com/ggml-org/whisper.cpp/tree/master/examples/whisper.wasm
- https://github.com/ggml-org/whisper.cpp/blob/master/examples/whisper.wasm/README.md
- Demo oficial: https://ggml.ai/whisper.cpp/

## Prueba guiada

1. Abrir `index.html` desde localhost o HTTPS.
2. Abrir la demo oficial desde el enlace de la página.
3. Elegir el modelo multilingüe `tiny` (no `tiny.en`, que es inglés).
4. Elegir entrada **Microphone**, idioma **Spanish** y comenzar.
5. Dictar las mismas frases definidas en `TEST-PLAN.md`.
6. Detener y transcribir. Copiar únicamente el texto resultante al registro de evaluación; no descargar ni exportar audio.
7. Repetir en Chromium y Firefox desktop; luego en la PWA instalada y en un móvil real si el rendimiento de escritorio es aceptable.

## Auditoría de privacidad del ejemplo upstream

La implementación oficial de micrófono inspeccionada usa `MediaRecorder`, acumula fragmentos en memoria, crea un `Blob` temporal y lo decodifica a un buffer PCM para ejecutar Whisper. En el código inspeccionado, ese flujo no sube el audio a un endpoint ni lo escribe como archivo en el almacenamiento persistente. El `Blob` es temporal en memoria y no debe confundirse con un archivo guardado.

**Condición para FeritApp:** no copiar este flujo literalmente sin una revisión de ciclo de vida. La integración propia debe evitar descargas/exportaciones de audio, IndexedDB/localStorage/Cache API para audio, archivos temporales, logs de audio y cualquier request con audio. Los buffers PCM solo pueden existir en RAM durante el reconocimiento y deben liberarse al terminar; no se conserva audio para reintentar. Solo el texto final pasa al parser de prendas.

El demo upstream descarga el modelo y su código puede usar almacenamiento del navegador para gestionar el modelo. Eso no autoriza guardar audio. En FeritApp se evaluará por separado si conviene cachear el modelo; nunca se cacheará audio.

## Limitaciones y riesgos

- La demo oficial es externa y se usa únicamente para evaluar el motor; todavía no es una integración autocontenida de FeritApp.
- El modelo `tiny` es multilingüe, pero no garantiza precisión específica de español rioplatense, marcas de indumentaria ni números/precios argentinos.
- El ejemplo WASM requiere SIMD y advierte que el rendimiento es exigente. La documentación reporta 2–3x tiempo real para tiny/base en hardware moderno.
- El ejemplo de micrófono crea un Blob temporal en RAM. No lo persiste como archivo, pero la integración definitiva deberá tener cleanup explícito y no reutilizar buffers.
- No se midieron aún precisión, RAM, CPU, batería ni compatibilidad móvil/PWA en dispositivos reales.

## Decisión de integración

No integrar hasta cumplir todo lo siguiente:

1. Comparación lado a lado con Vosk usando exactamente las mismas frases rioplatenses.
2. Medir errores de categoría, marca, talle, medidas, números y precios; los valores numéricos incorrectos son bloqueantes.
3. Medir latencia, RAM, CPU y batería en escritorio y celular de gama media.
4. Probar Firefox, Chromium, WebKit y PWA instalada.
5. Implementar captura propia sin archivos de audio ni persistencia de buffers; liberar micrófono, AudioContext, worker y memoria al detener o salir.
6. Verificar en DevTools que no hay requests de audio, escrituras de audio en storage ni logs con contenido hablado.
7. Mantener carga manual y parser actual como fallback.

**No promover este experimento a producción ni fusionarlo con la rama principal del publicador sin revisión y aprobación explícitas.**
