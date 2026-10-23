# FeritApp V12.105 — Reorganización de archivos

Esta versión parte de V12.103 y reconstruye primero los cambios documentados de V12.104; luego organiza la estructura sin cambiar la lógica de negocio.

## Estructura
- `index.html`, `script.js`, `manifest.json`: entrada y archivos principales.
- `css/`: hojas de estilo de la aplicación.
- `assets/images/`: iconos y logos.
- `supabase/migrations/`: migraciones SQL existentes (no ejecutadas).
- `tests/`: pruebas y comprobaciones existentes.
- `docs/history/`: documentación histórica.
- `tools/`: utilidades existentes.

## Cambios incluidos
- Se trasladaron a `css/` las hojas de estilo y se actualizaron sus referencias.
- Se trasladaron iconos/logos a `assets/images/` y se actualizaron las rutas HTML, JavaScript y PWA.
- Se trasladaron documentos históricos, pruebas, migraciones y herramienta auxiliar a carpetas específicas.
- Se reconstruyó el cambio CSS de V12.104: las reglas de selección de texto de `.weekly-summary-client-group` ahora viven en `css/weekly-summary-menu.css`; se conserva el orden de carga.
- Se uniformó el versionado de caché de CSS y `script.js` a `12.105`.
- No se modificó deliberadamente la lógica del comprobante ni se tocaron datos, políticas o servicios de Supabase.

## Validación
Verificaciones estáticas locales solamente. No se realizaron pruebas E2E en navegador ni validaciones contra Supabase.


## Identidad visual V12.106

Se sustituyeron las variantes de logo e icono por la nueva identidad oficial recibida, conservando el canal alfa (fondo transparente) y las dimensiones requeridas para favicon, PWA, encabezados y comprobantes.
