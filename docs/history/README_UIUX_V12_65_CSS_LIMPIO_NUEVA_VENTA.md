# FeritApp V12.65 — CSS consolidado y rediseño de Nueva Venta

## Trabajo realizado
- Se retiraron los bloques acumulativos V12.60–V12.64 del final de `style.css`, que repetían selectores para el formulario de ventas y se contradecían en algunas dimensiones.
- Se reemplazaron por un único bloque compartido y acotado a `#sheet.new-sale-mode` y `#sheet.edit-sale-mode`.
- Se unificó el pie (Total + Guardar Venta) entre Nueva Venta y Editar Venta, incluyendo el comportamiento en pantallas angostas.
- Se mantiene un solo total visible al pie; el renglón interno se oculta. El código existente sigue actualizando `#sheetFooterTotal`.
- Se normaliza el tamaño de los botones e iconos SVG de micrófono dentro de ambas ventanas, no en otras vistas.
- Se mantienen variables de tema para colores, compatibles con tema claro y oscuro.
- Se conserva el rediseño de tarjetas de artículos, encabezado, categorías y botón para quitar artículos.

## Validaciones
- `node --check script.js`: correcto.
- Balance de llaves CSS: correcto.
- Se comprobó que el bloque consolidado no usa `!important`; su especificidad de `#sheet.<modo>` prevalece sobre reglas globales como `.sheet .mic-btn`.
- El CSS aún contiene reglas históricas y `!important` anteriores fuera del bloque reemplazado; no se reescribió todo el archivo para evitar un cambio masivo no validado. Se eliminaron redundancias concentradas de los últimos parches.

## Pendiente
No se completó una validación visual automatizada ni una prueba de voz/cambio de tema en una sesión autenticada. No se afirma que esas interacciones hayan sido verificadas en ejecución.

No se modificó el repositorio original ni la base de datos de producción.
