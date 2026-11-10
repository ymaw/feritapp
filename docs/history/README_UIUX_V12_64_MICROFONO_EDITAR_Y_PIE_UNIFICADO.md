# FeritApp V12.64 — micrófono de Editar Venta y pie unificado

Cambios sobre V12.63:
- Normaliza TODOS los botones de micrófono dentro de `#sheet.edit-sale-mode`, no solo los que están dentro de las filas de artículos. La caja del botón queda en 32×34 px (30 px de ancho en pantallas de hasta 380 px) y el SVG en 15×15 px. Esto cubre el campo afectado aunque no esté identificado.
- Rehace el pie de Editar Venta para usar la misma distribución visual que Nueva Venta: barra inferior, márgenes, padding, total a la izquierda y botón compacto a la derecha.
- Mantiene el total único en el pie; no se modifica el cálculo JavaScript.
- Colores basados en variables del tema, compatibles con tema claro y oscuro.
- Los overrides se agregan al final de `style.css` con `!important` y selectores específicos para prevalecer sobre reglas anteriores.

Validación estática:
- `node --check script.js`
- balance de llaves CSS
- integridad del ZIP
- inspección de reglas previas para micrófonos y barra inferior.

No se pudo completar prueba visual real en navegador ni dictado de voz. No se modificó el repositorio original ni Supabase de producción.
