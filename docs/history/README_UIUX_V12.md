# feritApp UI/UX V12

V12 se preparó sobre una copia de la versión V11. No se modificó el repositorio original ni se aplicaron cambios en Supabase.

## Cambios incluidos

- Inicio/Dashboard queda como primera pantalla tras iniciar sesión.
- Navegación inferior reorganizada: Inicio, Clientes, botón +, Ventas, Más.
- Menú de escritorio reordenado para priorizar Inicio.
- Tarjetas de atención del Dashboard ajustadas para que títulos, subtítulos, montos y chevrons no se amontonen en pantallas pequeñas.
- Lista de Clientes rediseñada con tarjetas, iniciales visuales y menú contextual `…`.
- Menú de cliente permite asociar un usuario o enlace de Messenger; cuando ya existe un alias, la acción abre `https://m.me/<usuario>`.
- Se conserva el botón existente de compartir comprobante. Al tocarlo, se abre una vista previa donde se puede editar el mensaje incluido antes de compartir.
- El comprobante no muestra nombres de clientes, usuarios de redes sociales, método de pago ni estado de pago. El archivo se llama `comprobante-de-venta.png` para no filtrar datos en el nombre del archivo.
- Nueva venta no recibió cambios estructurales ni cambios de lógica; solo se conserva el diseño existente.
- Se conserva el logo, la foto de perfil y la paleta de colores de V11.

## Messenger: paso de configuración requerido

Para guardar el alias de Messenger en Supabase, ejecutar `MIGRACION_MESSENGER_V12.sql` en el SQL Editor del proyecto. La migración agrega `messenger_username` a `public.clients`; no cambia políticas RLS ni permisos.

Ingresar un nombre de usuario o un enlace `https://m.me/usuario`. La app abre la conversación, pero no envía mensajes automáticamente: el usuario confirma el envío desde Messenger.

## Privacidad

- No guardar contraseñas, cookies ni tokens de Facebook/Messenger.
- La vista previa y el PNG del comprobante usan datos anonimizados.
- Los nombres de clientes siguen visibles dentro de la app autenticada porque son necesarios para administrar las ventas; deben continuar protegidos por las políticas RLS existentes.

## Validación

- `node --check script.js` pasa.
- No se modificaron credenciales, políticas RLS, autenticación ni lógica de guardado de Nueva venta.
- La migración SQL debe aplicarse manualmente por el propietario del proyecto antes de usar el campo de Messenger.
