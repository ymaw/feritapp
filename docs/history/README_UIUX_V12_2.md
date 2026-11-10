# feritApp V12.2 — Clientes, Messenger y acceso privado

## Cambios
- La ventana de asociación de Messenger deja de pedir únicamente un supuesto username. Permite guardar el nombre con el que reconocés a la persona en Facebook/Messenger y, opcionalmente, un enlace directo compatible.
- Si no hay enlace directo, feritApp copia el nombre al portapapeles y abre Messenger para que se pegue en su buscador. Los navegadores no permiten que una página pegue texto automáticamente dentro de otra aplicación/sitio ni consultan los contactos privados de Facebook.
- Los botones Messenger/Vincular y Compartir comprobante aparecen al lado de cada cliente.
- Al tocar nombres en la lista, ranking, ventas y tareas del dashboard se abre Clientes y se despliega el detalle histórico del cliente, con artículos, fechas, importe por artículo y total.
- La pantalla de acceso pasa a ser una capa fija con scroll propio y bloquea el scroll del contenido de la aplicación mientras no hay sesión.
- Mantiene el botón de compartir comprobante existente y su editor de mensaje. No añade nombres de cliente ni datos de contacto al comprobante.

## Datos / compatibilidad
- Usa el campo `clients.messenger_username` ya introducido por la migración V12. Los contactos sin enlace directo se guardan con prefijo `search:` seguido del nombre de búsqueda.
- No se modifica el esquema ni las políticas RLS desde estos archivos.
- Si no se aplicó la migración que añade `messenger_username`, la asociación no podrá guardarse hasta aplicarla en Supabase.

## Limitaciones de Messenger
- El nombre visible o apodo que usás localmente no identifica de forma única una cuenta y no se puede consultar desde feritApp.
- El nombre guardado sirve para copiarlo y buscarlo manualmente; solo un enlace/identificador válido permite intentar abrir una conversación directa.
- La aplicación no envía mensajes automáticamente.

## Validación
- `node --check script.js` correcto.
- No se ejecutó una prueba de extremo a extremo con una sesión real de Supabase/Messenger. Probar en una copia de staging antes de publicar.
