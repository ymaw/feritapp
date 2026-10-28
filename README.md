# FeritApp V12.109 — Refactor CSS del banner de instalación

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


## Corrección V12.108 — Entregas

- Los pendientes continúan visibles dentro de la ventana de semana actual y dos semanas anteriores.
- Las ventas marcadas como entregadas solo permanecen visibles si `entregado_en` corresponde a la semana configurada actual.
- La fecha de la venta y `semana_asignada` ya no permiten mantener visible una entrega registrada en una semana anterior.
- No se modificó la lógica del comprobante ni el esquema de Supabase.


## Refactor CSS V12.109 — Banner de instalación

- Se extrajeron las reglas base de `.install-banner`, sus textos, botones y cierre desde `css/style.css` a `css/install-banner.css`.
- Se trasladaron al módulo las dos reglas responsive de escritorio para el desplazamiento del banner junto al sidebar; se conserva su orden relativo (240px y luego 248px) para mantener el resultado de cascada existente.
- Se agregó la hoja después de `style.css` y de los módulos ya existentes; no se cambió el HTML del banner ni su lógica JavaScript.
- No se modificaron la lógica de Entregas, la selección de comprobantes, el logo ni Supabase.
- Esta es una extracción estructural; requiere validación visual en navegador para confirmar el comportamiento en escritorio y móvil.


## V12.110 — Extracción CSS de accesibilidad

- Se trasladaron las reglas específicas de `.font-scale-label`, `.font-scale-options`, `.font-scale-option`, `.font-scale-reset` y su adaptación móvil a `css/accessibility-font-scale.css`.
- Se conservaron los selectores, declaraciones y el breakpoint móvil de 520px.
- La regla de eliminación de ventas que compartía el bloque original permanece en `css/style.css`; no se mezcló con el módulo de accesibilidad.
- El nuevo módulo se carga después de `style.css`; las referencias de caché de CSS propio y `script.js` pasan a `12.110`.
- No se modificó JavaScript, Entregas, comprobantes, logo ni configuración de Supabase.
- Validación estática y pruebas locales; no se ejecutó una prueba E2E en navegador.


## V12.112 — Retención de datos y extracción CSS

- Se eliminó la ejecución del borrado automático semestral de ventas al iniciar sesión.
- Se retiró de la carga de configuración la lectura de `last_purge_semester`; la columna existente en Supabase se conserva sin cambios por compatibilidad y no se ejecutó ninguna migración.
- La exportación manual CSV sigue disponible; el texto ya no promete una descarga automática.
- Se extrajeron los estilos base de estados vacíos (`.empty-inline`, `.empty` y `.empty b`) y el ajuste de `#viewClients .empty-inline` a `css/empty-states.css`, conservando declaraciones y el orden de carga posterior a `style.css`.
- Se actualizaron las referencias de caché de CSS propio y `script.js` a `12.112`.
- No se modificó la lógica de ventas, Entregas, comprobantes, clientes, autenticación ni las políticas/tablas de Supabase.
- Las pruebas son estáticas/locales; no se hicieron cambios en producción ni pruebas E2E autenticadas.

### Pruebas heredadas con fallos previos/no alineadas

- `test-receipt-period-v12.93.cjs` falla porque espera incluir una venta anterior que la lógica actual excluye.
- `test-receipt-selection-v12.95.cjs` falla porque intenta evaluar `weekKey` sin definirla en su entorno de prueba.
- Estos dos tests son heredados y no se modificaron como parte de esta tarea; la validación de comprobantes actual de V12.102 sí pasa.
