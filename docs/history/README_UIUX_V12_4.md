# feritApp UI/UX V12.4

## Cambios incluidos

### Inicio > Pendientes de cobro
- Los artículos impagos ahora se agrupan por cliente.
- Cada cliente aparece una sola vez en el detalle, con el total pendiente y la cantidad de artículos pendientes.
- El encabezado indica la cantidad de clientes con cobro pendiente; el total general por cobrar se mantiene.
- Se conserva el acceso desde el nombre del cliente a su ficha en Clientes.

### Clientes > Detalle del cliente
- El historial y el total de la ficha muestran únicamente las compras de la semana actual, respetando el día de inicio de semana configurado en FeritApp.
- El comprobante compartido desde esta ficha también se limita a las ventas visibles de esta semana.
- Si el cliente no compró esta semana, se muestra un mensaje explícito y no se listan ventas anteriores.

### Obtener un enlace de Messenger para un perfil personal
- La forma más fiable es pedirle al cliente que comparta el enlace de su perfil, o abrir su perfil desde Facebook y copiar la dirección.
- Si el perfil tiene un nombre de usuario, el enlace de Messenger suele ser `https://m.me/usuario`; el nombre visible por sí solo no sirve para construir un enlace fiable.
- Probar el enlace antes de guardarlo. No todos los contactos tienen un enlace personal disponible y FeritApp no puede leer ni controlar la búsqueda privada de Messenger.

## Validación
- `node --check script.js`: correcto.
- No se realizaron pruebas end-to-end con la base de datos real.
- No se modificó el repositorio original ni se aplicaron cambios en Supabase.
