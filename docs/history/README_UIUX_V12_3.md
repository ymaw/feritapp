# feritApp UI/UX V12.3

## Cambios
- En Inicio > Por cobrar, los nombres de clientes son enlaces accesibles que abren la ficha del cliente en Clientes.
- En Inicio > Para entregar, los nombres visibles también permiten abrir la ficha correspondiente.
- La búsqueda asistida de Messenger copia el nombre y abre el enlace universal `https://m.me/`, que puede derivar a la aplicación instalada en dispositivos compatibles. No puede forzar la apertura de la app ni pegar texto dentro de Messenger desde una página web; esto depende del sistema operativo, navegador y sesión.
- Se agregó la opción “Eliminar asociación” en el modal de Messenger para borrar el valor guardado en `clients.messenger_username`.

## Limitaciones conocidas
- Un nombre visible de Facebook no identifica de forma única una cuenta. Para un chat directo confiable se necesita un enlace/perfil correcto o un identificador compatible; no se automatiza la búsqueda interna de Messenger.
- El borrado de la asociación requiere que la columna `messenger_username` exista y que la política RLS permita actualizar el registro propio.
- No se modificó el repositorio original ni se aplicaron cambios en Supabase.

## Pruebas
- `node --check script.js`: correcto.
- No se hizo una prueba end-to-end contra la cuenta real de Supabase/Messenger.
