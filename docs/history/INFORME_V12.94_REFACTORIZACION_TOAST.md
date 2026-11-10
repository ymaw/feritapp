# FeritApp V12.94 — refactorización CSS conservadora

## Alcance
Continuación sobre la copia independiente V12.93. No se tocó la lógica de negocio de `script.js`, las políticas/datos de Supabase ni el repositorio/despliegue original.

## Cambio
- Se movieron únicamente las reglas finales `.toast.has-action` y `.toast.has-action .toast-undo` desde `style.css` a `toast-actions.css`.
- La extracción conserva exactamente las declaraciones y el orden relativo de la cascada: `toast-actions.css` se carga después de `style.css` y de las hojas de componentes existentes.
- No se movieron reglas de categorías, formularios, comprobantes ni resumen semanal.
- Se conservaron las referencias y el orden previo de `receipt.css`, `style.css`, `category-picker.css` y `weekly-summary-menu.css`; se agregó `toast-actions.css` al final para no cambiar la prioridad de las reglas extraídas.
- Se actualizó el versionado de caché de assets propios a `12.94`.

## Validaciones estáticas
- El bloque extraído coincide exactamente con el bloque original registrado en V12.93.
- Orden de carga comprobado en `index.html`.
- `node --check script.js`.
- Parseo de todas las hojas CSS con `tinycss2` si está disponible.
- Integridad del ZIP.

## Limitaciones
No se ejecutaron pruebas visuales de navegador ni pruebas E2E contra Supabase. La extracción conserva las reglas y su prioridad relativa, pero la apariencia final debe validarse en navegador antes de publicar.
