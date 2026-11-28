# Catálogo de prendas — diseño técnico

Estado: diseño previo a implementación. Este documento no aplica cambios en Supabase ni altera el comportamiento de Ventas.

## Alcance y reglas funcionales confirmadas

- El Catálogo mantiene un registro persistente de cada prenda, independiente de la semana operativa.
- Stock incluye prendas guardadas con o sin publicación y con o sin cliente asignado.
- Compartir/publicar y asignar a un cliente son operaciones independientes.
- El Catálogo muestra los estados de publicación y asignación. Pago y entrega se consultan desde la venta vinculada; no se editan desde Catálogo.
- La semana operativa y la visibilidad de Entregas siguen usando `week_start_day`, `semana_asignada`, `entregado` y `entregado_en` existentes. No se crea un calendario ni un cierre paralelo.
- Reasignar conserva el mismo ID de prenda y actualiza la venta vinculada, sin crear una segunda venta. Solo se permite si la venta no está abonada ni entregada.
- Eliminar una venta desde Ventas libera la prenda: vuelve a Stock sin cliente, conservando datos, medidas y fotos. Desaparece de Ventas, Entregas, Ranking y totales del cliente anterior.
- Eliminar una prenda desde Catálogo elimina también la venta vinculada, independientemente de pago o entrega, y sus fotografías. Requiere confirmación explícita. No existe papelera ni deshacer.
- Una publicación externa de Facebook nunca se elimina desde FeritApp. Abrir el menú nativo de compartir no confirma una publicación; el estado «Publicada» requiere confirmación explícita del usuario.

## Auditoría del esquema remoto (solo lectura)

Proyecto comprobado: `tzajchnflgvdbmiwfyvj` (FeritApp, región `sa-east-1`).

- `public.sales.id` es UUID y clave primaria.
- `public.sales.user_id` es UUID, no nulo y referencia `auth.users(id)`.
- `public.sales` conserva `cliente` como texto; no tiene FK a `clients` ni relación con Catálogo.
- `sales` ya contiene `pagado`, `entregado`, `entregado_en`, `fecha` y `semana_asignada`.
- `public.clients.id` y `user_id` son UUID; clientes y ventas tienen RLS habilitado.
- El bucket existente `avatars` es público, limitado a JPEG de 1 MiB. No existe bucket de prendas.
- No se encontraron triggers en `sales` o `clients`.
- La aplicación usa actualmente operaciones directas sobre `sales`; las eliminaciones desde Ventas pasan por una ventana de deshacer antes de confirmar el DELETE.
- El publicador conserva fotos en memoria/URL temporal y comparte mediante APIs del navegador; no persiste prendas ni confirma la publicación en Facebook.

No se consultaron datos personales ni se escribieron datos, DDL, políticas, buckets o archivos en el proyecto remoto.

## Modelo relacional propuesto (pendiente de migración y pruebas)

### `public.catalog_items`

- `id uuid primary key default gen_random_uuid()`
- `user_id uuid not null references auth.users(id) default auth.uid()`
- Datos propios de la prenda: categoría, nombre/artículo, marca, talle, observaciones y medidas estructuradas.
- Estado de publicación explícito y auditable: sin publicar / publicada, con fecha de confirmación nullable.
- `created_at`, `updated_at` y, si corresponde, marca de eliminación lógica temporal para coordinar limpieza de Storage.

El cliente y el estado comercial no se duplican como fuente de verdad: se derivan de la única fila de `sales` asociada.

### Relación con `public.sales`

Agregar `sales.catalog_item_id uuid null`.

- FK compuesta `(catalog_item_id, user_id) -> catalog_items(id, user_id)`, para impedir relaciones entre propietarios distintos.
- Índice único parcial sobre `sales(catalog_item_id)` cuando no sea NULL: una prenda no puede tener más de una venta activa.
- La FK debe tener `ON DELETE CASCADE` desde Catálogo hacia Ventas. Eliminar una venta no elimina la prenda; eliminar el maestro elimina su venta.
- La migración debe comprobar tipos, grants, RLS y constraints reales antes de aplicar cualquier DDL.

### Fotografías

- Bucket privado dedicado, nunca reutilizar el bucket público `avatars`.
- Rutas con propietario y prenda: `<user_id>/<catalog_item_id>/<photo_id>.<ext>`.
- Metadatos de fotos con orden y ruta de Storage; no guardar URLs públicas permanentes.
- Validar MIME real, extensión y límite por archivo en cliente y servidor. El publicador actual admite JPEG/PNG/WebP hasta 12 MiB por archivo; el límite definitivo del Catálogo debe conservar ese contrato salvo decisión explícita.
- Políticas de Storage deben exigir usuario autenticado y verificar que la prenda de la ruta pertenece a `auth.uid()`.

## Ciclos de operación

### Asignar / reasignar

1. Validar que la prenda existe y pertenece al usuario.
2. Para reasignar, validar que la venta actual no esté abonada ni entregada.
3. Actualizar la misma fila de `sales` con cliente, artículo, precio y categoría correspondientes; no insertar una segunda venta.
4. Mantener el mismo `catalog_items.id`; conservar medidas y fotos.
5. El Ranking, Ventas y Entregas siguen calculándose desde `sales` y sus reglas actuales.

### Eliminar venta desde Ventas

- La eliminación confirmada de la fila `sales` deja `catalog_items` intacta.
- Al desaparecer la relación, la prenda vuelve a Stock sin cliente.
- La actualización de Catálogo debe ocurrir después de confirmar la eliminación definitiva, no durante la ventana de deshacer.

### Eliminar prenda desde Catálogo

Storage no participa de la transacción PostgreSQL. Por eso no se debe borrar primero el maestro y asumir que las fotos también se eliminaron.

Flujo propuesto:
1. RPC transaccional valida propiedad, marca la prenda como pendiente de eliminación y elimina la venta vinculada; crea tareas de limpieza con todas las rutas de fotos.
2. La interfaz oculta la prenda y ejecuta la eliminación de objetos privados de Storage.
3. Solo cuando todas las fotos fueron eliminadas, una segunda operación finaliza el borrado del maestro y metadatos.
4. Si falla una foto, no se informa éxito; el registro pendiente y la cola conservan lo necesario para reintentar sin restaurar la venta ni exponer la prenda.
5. La limpieza debe poder reintentarse al volver a abrir la aplicación. No se afirma que la publicación externa de Facebook haya sido eliminada.

Las RPC privilegiadas, si fueran necesarias, deben vivir en un esquema no expuesto, verificar `auth.uid()` dentro de la función y conceder EXECUTE solo a `authenticated`. No se añadirá una función SECURITY DEFINER pública.

## Compatibilidad con el código existente

- `mapRowToSale` y `loadSales` deberán incorporar la relación sin cambiar la semántica de los campos existentes.
- Mantener `operationalWeekKey`, `isDeliveryItemVisible`, Ranking y sus filtros como fuente de verdad.
- Las funciones `deleteSale` y `deleteSalesGroup` usan actualmente borrado con deshacer; la liberación de Stock solo se considera definitiva después del DELETE confirmado.
- El formulario actual de Ventas puede editar únicamente los campos que ya pertenecen a «Nueva Venta» (por ejemplo, cliente, artículo, categoría y precio) y agregar artículos. Cuando una venta está vinculada a una prenda del Catálogo, los cambios confirmados en los campos compartidos se sincronizan con esa misma ficha de Catálogo; no se crea otra prenda ni otra venta.
- Ventas no debe mostrar ni editar campos exclusivos del Catálogo, como talle, medidas, marca, observaciones o fotografías. Esos datos permanecen únicamente en `catalog_items` y sus metadatos, y se conservan al editar la venta. La sincronización de campos compartidos no debe sobrescribir información exclusiva del Catálogo.
- El Publicador actual no debe convertirse en un inventario paralelo: el Catálogo persistente debe reutilizar su interpretación, formulario, medidas, validaciones y presentación de compartir, separando la persistencia de la lógica del intérprete.

## Seguridad y diagnósticos a tratar por separado

La auditoría automática actual informa protección de contraseñas filtradas deshabilitada (limitación ya aceptada del plan) y avisos de rendimiento RLS/índices. Las políticas remotas actuales de `sales` y `clients` están asignadas a `public`; sus predicados comparan `auth.uid()` con `user_id`. La migración de endurecimiento V12.124 del repositorio no debe darse por aplicada solo por existir como archivo. Cualquier endurecimiento de tablas existentes requiere auditoría y cambio separado, no se incluye silenciosamente en Catálogo.

## Criterios de aceptación principales

- Una prenda solo puede tener una venta activa y nunca vincularse a otro propietario.
- Eliminar una venta devuelve la prenda a Stock conservando sus datos y fotos.
- Reasignar actualiza la misma venta y no altera Ranking/totales del cliente anterior después de confirmarse.
- Eliminar desde Catálogo elimina la venta vinculada y todas las fotos; cualquier fallo de Storage impide mostrar éxito.
- Pago y entrega se muestran desde Ventas y no se editan desde Catálogo.
- La publicación externa no se infiere al abrir el menú de compartir.
- Las pruebas cubren RLS multiusuario, FK compuesta, unicidad, reasignación, deshacer/eliminación, Storage y regresión de Ventas/Entregas/Ranking.
