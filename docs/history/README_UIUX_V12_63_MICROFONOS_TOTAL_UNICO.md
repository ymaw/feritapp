# FeritApp V12.63 — Micrófonos y total único

Cambios sobre V12.62:
- Se normalizan los botones e iconos de micrófono de los campos dinámicos de artículo (nombre y precio) tanto en Nueva Venta como en Editar Venta. El ajuste no depende de un campo específico y usa variables del tema.
- Se oculta el total dentro del formulario en ambas modalidades. El total continúa calculándose con `updateItemsTotal()` y se presenta una sola vez en la barra inferior (`#sheetFooterTotal`).
- Se ajusta la barra inferior de ambos formularios para reservar espacio al importe y al botón Guardar Venta.
- Los colores se heredan de variables CSS (`--text`, `--text-muted`, `--primary-soft`) para soportar tema claro y oscuro.

Validaciones realizadas:
- `node --check script.js`
- comprobación de integridad del ZIP
- revisión estática del CSS: el bloque V12.63 queda al final de `style.css` y sus selectores específicos con `!important` prevalecen sobre las reglas previas encontradas para `.items-total-row`, `.sheet-save-bar`, `.sheet-save-total` y micrófonos de los artículos.

Límite de validación: no se completó prueba visual/interactiva en navegador ni prueba real con dictado de voz, ni cambio de tema en una sesión autenticada. No se afirma que esos escenarios hayan sido verificados en ejecución.
No se modificó el repositorio original ni la base de datos de producción.
