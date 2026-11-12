# FeritApp V12.123 — Modernización del acceso y accesibilidad del dashboard

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


## V12.113 — Extracción CSS de identidad visual

- Se trasladaron las reglas de transparencia, ajuste de imagen, sombra y bordes del logo desde `css/style.css` a `css/brand-identity.css`.
- Se conservaron exactamente los selectores y las declaraciones; la nueva hoja se carga después de los módulos CSS existentes para mantener la prioridad de cascada que tenía el bloque al final de `style.css`.
- Las referencias de caché de hojas CSS propias y `script.js` se actualizaron a `12.113`.
- No se modificaron imágenes, lógica JavaScript, comprobantes, Entregas, ventas ni Supabase.
- La validación de esta versión es estática y automatizada; no se ejecutó una prueba visual E2E en navegador.


## V12.114 — Extracción completa del diálogo de confirmación

- Se trasladaron a `css/confirmation-dialog.css` las reglas base del diálogo, sus acciones, foco accesible, bloqueo de scroll y animación, conservando las declaraciones originales.
- Se separaron las reglas responsive propias del diálogo de las reglas responsive de Entregas, que permanecen en `css/style.css`.
- Se conservaron en el módulo los overrides de V12.111 para el ancho del diálogo y el texto de confirmación.
- Se eliminaron las pruebas históricas de comprobantes V12.93 y V12.95 por estar desalineadas con el comportamiento vigente y/o tener un entorno de prueba defectuoso. Las pruebas vigentes V12.99 y V12.102 se mantienen como regresión.
- Referencias de caché actualizadas a `12.114`. Sin cambios en lógica de comprobantes, Entregas, datos, Supabase, GitHub ni producción.


## V12.115 — Extracción CSS de requisitos de contraseña

- Se trasladaron las reglas de `.pw-requirements`, sus elementos `li`, `.req-icon` y estados `.req-ok` a `css/password-requirements.css`.
- Se conservaron las declaraciones originales y se cargó el módulo después de `style.css`.
- Se agregó una prueba de regresión para comprobar la extracción, la presencia del marcado y la uniformidad de versiones de caché.
- Las pruebas históricas de comprobantes V12.93 y V12.95 ya se habían retirado en V12.114; las pruebas actuales V12.99 y V12.102 se conservan.
- No se modificó JavaScript, la lógica de comprobantes, Entregas, autenticación ni datos de Supabase. No se publicó en producción ni se modificó GitHub.
- Validación estática y automatizada local; no se ejecutó una prueba visual E2E en navegador.


## V12.116 — Corrección del logo en comprobante compartido
- Se ajustó únicamente el dibujo del logo FeritApp en `generateReceiptCanvas`: de 110×110 px a 98×98 px y se elevó su posición para que quede contenido en la franja superior de la imagen exportada.
- No se modificó el preview, el logo original, la selección de ventas, el contenido del comprobante ni la lógica de compartir.
- Referencias de caché actualizadas a V12.116.

## V12.118
- Se ajustó únicamente el logo del comprobante exportado: 88×88 px y posición vertical 29 px, para evitar que toque la línea superior del encabezado.
- La vista previa conserva su tamaño y presentación.
- No se modificó la lógica de comprobantes ni los datos.

## V12.118 — Centrado del logo en comprobante compartido
- Se ajustó el logo del PNG compartido a 90×90 px.
- Se centró horizontalmente dentro del espacio reservado a la derecha del encabezado y verticalmente dentro de la franja del encabezado (x calculada desde `W - PADDING - 106`, y=27 px).
- Se mantiene intacto el preview HTML/CSS.
- Se actualizó la prueba del logo para verificar tamaño, posición y conservación del preview.
- No se modificó la lógica de selección de ventas, el contenido del comprobante, ni los datos de Supabase. No se publicó en producción ni se modificó GitHub.


## V12.119 — Extracción CSS del detalle de Clientes

- Se trasladaron a `css/clients.css` los estilos del panel de detalle, resumen, lista de compras y acciones de copiar/compartir.
- Se conservaron los selectores y declaraciones originales. Las reglas base y sus overrides se mantuvieron en el mismo orden relativo dentro del módulo.
- Se dejó en `style.css` el resto de estilos compartidos o con dependencias de otras vistas (por ejemplo, nombres de clientes en Ventas/Ranking, flechas compartidas y estilos generales de modales).
- Se agregó el módulo después de `style.css` y se actualizaron las referencias de caché a `12.119`.
- Sin cambios en JavaScript, lógica de clientes, comprobantes, Entregas, Ventas, datos ni servicios externos.


## V12.120 — Modernización visual del acceso

- Se incorporó `css/auth.css` como capa de presentación aislada para login, creación de cuenta, recuperación de contraseña y onboarding.
- Se conservaron los identificadores y controles que utiliza la lógica de autenticación existente; no se reemplazó el flujo de Supabase Auth.
- Se preservaron el logo oficial transparente, el nombre FeritApp, el slogan exacto `Vendé. Organizá. Crecé.` y los temas claro/oscuro.
- Se añadieron estados de foco visibles, adaptación a pantallas pequeñas y respeto por `prefers-reduced-motion`.
- La hoja nueva se carga después de los estilos generales. Las referencias de caché de CSS y JavaScript se actualizaron de forma uniforme a `12.120` en esta etapa.

## V12.121 — Accesibilidad del dashboard y controles de comparación

- Se incorporó `css/accessibility-dashboard.css` para mejorar el contraste de etiquetas, valores de estado, selector de período y encabezados de comparación.
- Los selectores dinámicos de comparación mensual y semanal recibieron nombres accesibles.
- Se mantuvo separada la capa visual de la lógica de ventas y de los datos.
- Las referencias de caché de CSS y JavaScript quedaron uniformadas en `12.121`, versión declarada en `VERSION.txt`.

## Validación de la rama feature/login-modernization

- GitHub Actions ejecuta la regresión estática y pruebas E2E con Chromium, Firefox y WebKit.
- La cobertura incorporada incluye autenticación simulada, restauración de sesión, cierre por inactividad y cierre remoto, recuperación de contraseña, XSS, navegación por teclado, accesibilidad automatizada, layout móvil y smoke de rendimiento.
- Las pruebas de autenticación usan mocks y no sustituyen una validación con el proyecto Supabase real.
- La matriz WebKit no sustituye una prueba en un iPhone/iPad físico.
- axe-core cubre las vistas y reglas incluidas en las pruebas; no representa una certificación WCAG completa.
- El smoke de rendimiento es una comprobación local de presupuesto de recursos y carga, no una medición real de Core Web Vitals.
- RLS y Storage no se validaron porque requieren acceso autorizado al proyecto Supabase correspondiente.
- La configuración de seguridad se verifica estáticamente; la validación independiente de encabezados HTTP efectivos en el despliegue sigue siendo una comprobación operativa separada.


## V12.122 — Resiliencia y expiración de sesión

- Los flujos de inicio de sesión, alta, recuperación y actualización de contraseña manejan excepciones de red, muestran mensajes recuperables y restauran los controles al finalizar.
- La lectura inicial de sesión muestra un error accesible si no puede comprobar el estado de autenticación.
- La expiración de inactividad de 30 minutos se conserva al restaurar una sesión después de recargar la página; cargar la app no reinicia el tiempo de inactividad.
- La última actividad se persiste por usuario y se comparte entre pestañas del mismo navegador.
- Se agregaron pruebas E2E para fallos de red en autenticación y sesiones persistidas vencidas.
- Se actualizaron las referencias de caché de CSS y JavaScript a `12.122`.

## Verificación operativa pendiente

- La URL y la clave publicable de `script.js` coinciden con el proyecto Supabase FeritApp activo. No se realizaron cambios en el proyecto.
- RLS está habilitado en `sales`, `categories`, `clients` y `user_settings`; existen políticas de propiedad basadas en `auth.uid() = user_id`. No se modificaron políticas ni datos.
- Supabase Security Advisor informa que la protección contra contraseñas filtradas está deshabilitada. Se recomienda habilitarla antes de producción; no se cambió la configuración.
- Falta completar pruebas con una cuenta real: inicio de sesión, confirmación de correo, recuperación, redirecciones permitidas y carga de datos posterior al acceso.


## V12.123 — Iconos profesionales para autenticación

- Se reemplazó el emoji del control mostrar/ocultar contraseña por iconos SVG lineales (mostrar/ocultar), manteniendo el comportamiento y los nombres accesibles.
- Se actualizaron las referencias de caché de CSS y JavaScript a `12.123`.
- Sin cambios en autenticación, datos, Supabase ni lógica de negocio.


## V12.124 — Endurecimiento de RLS y Storage (migración preparada)

- Se incorporó `supabase/migrations/MIGRACION_V12_124_SEGURIDAD_RLS.sql` en la rama `feature/login-modernization`.
- La migración retira los privilegios de `anon` sobre las tablas de negocio y limita `authenticated` a las operaciones necesarias por tabla.
- Las políticas de propiedad quedan asignadas a `authenticated`; las operaciones UPDATE verifican tanto la fila original como el nuevo `user_id` mediante `USING` y `WITH CHECK`.
- Los privilegios por defecto para objetos futuros creados por `postgres` en `public` se revocan para `anon` y `authenticated`; las futuras tablas requerirán grants explícitos.
- En Storage se conserva la lectura pública del bucket `avatars`; las operaciones de escritura/eliminación requieren autenticación y una ruta cuyo primer segmento coincida con el UID.
- **Estado operativo:** migración preparada en GitHub, todavía no aplicada al proyecto Supabase. No se modificaron datos, políticas remotas ni configuración de Auth/Storage.
- Se agregó `supabase/tests/rls_hardening_verification.sql`, un bloque de comprobaciones de solo lectura para ejecutar después de la migración y verificar grants, políticas, RLS y Storage.
- **Validación pendiente:** ejecutar las comprobaciones en un entorno de pruebas, obtener Actions en verde y luego aplicar en una ventana controlada con autorización; después comprobar operaciones reales con dos usuarios.
