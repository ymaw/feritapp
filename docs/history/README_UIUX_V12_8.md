# FeritApp UI/UX V12.8 — Messenger y comprobante

Basada en la copia V12.7. No se modificó el repositorio original ni se realizaron cambios en Supabase.

## Correcciones
- El botón Messenger copia al portapapeles el nombre exacto del cliente antes de intentar abrir Messenger.
- En Android utiliza un intent dirigido al paquete oficial `com.facebook.orca`; en iOS intenta `fb-messenger://`. En escritorio abre Messenger web como alternativa.
- No redirige automáticamente a la web en móviles cuando falla el esquema nativo, porque eso aparentaba que la app se abría cuando no era así.
- La vista previa del comprobante ya no muestra el texto fijo “FeritApp”: presenta el nombre configurado en `user_settings.store_name` (o “Mi tienda” si no hay nombre configurado).
- El PNG del comprobante incluye el icono real de FeritApp al lado del nombre de la tienda.

## Validaciones
- `node --check script.js` pasó correctamente.
- Revisión estática de las referencias del nombre de tienda, icono y botones Messenger.
- No se pudo realizar una prueba real en el dispositivo ni una prueba end-to-end de Messenger/Supabase desde este entorno.

## Limitación de Messenger
Los esquemas de apertura dependen del sistema operativo, navegador y configuración de enlaces compatibles. El botón copia el nombre para que pueda buscarse, pero no puede abrir la conversación exacta sin un enlace/identificador del perfil del cliente.
