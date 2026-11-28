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


## Auditoría detallada de eliminación en Ventas (código actual)

Se revisaron los flujos de `script.js` en la rama `feature/catalogo-prendas`:

- **Eliminar un artículo individual:** `deleteSale(id)` quita la fila de la vista y programa el DELETE de `sales` después de 10 segundos. Si se deshace, restaura la fila local; si falla el DELETE, también restaura la vista.
- **Eliminar varias ventas de un cliente:** `deleteSalesGroup(ids)` usa la misma ventana de 10 segundos y ejecuta un DELETE por conjunto de IDs.
- **Quitar artículos desde el editor de cliente:** las filas existentes que se quitan se eliminan mediante una operación con deshacer; las filas nuevas se insertan como ventas independientes y las conservadas se actualizan individualmente.
- **Eliminar todo el historial:** el botón de reinicio elimina todas las filas de `sales` tras la misma ventana de deshacer.
- **Editar una venta individual y agregar artículos:** la fila original se actualiza y cada artículo extra se inserta como una nueva fila de `sales`. No debe heredarse automáticamente el vínculo de Catálogo de la fila original.

### Comportamiento requerido al incorporar Catálogo

1. Todos los caminos que borran una venta —individual, grupo, quitar desde editor de cliente y borrar historial— deben liberar únicamente el vínculo de Catálogo al confirmarse el DELETE. La ficha permanece en Stock y conserva fotos y datos exclusivos.
2. Durante los 10 segundos de deshacer, no se debe cambiar definitivamente el estado de la ficha ni borrar sus fotografías.
3. Si se deshace, la venta conserva su vínculo original. Si el DELETE falla, la aplicación debe restaurar o volver a consultar el estado y no dejar la prenda falsamente disponible en Stock.
4. El borrado total del historial también debe dejar todas las fichas de Catálogo sin venta vinculada; nunca debe eliminar las fichas ni sus fotografías.
5. Al quitar una fila desde el editor de cliente, la desvinculación se aplica solo cuando el DELETE correspondiente se confirma. Las demás filas del cliente y sus vínculos no deben alterarse.
6. Al agregar artículos desde los editores de Ventas, cada fila nueva nace sin `catalog_item_id`; solo se vincula mediante la acción explícita de asignar una prenda existente desde Catálogo.
7. Las operaciones de grupo deben comprobar qué IDs fueron realmente eliminados y reconciliar el estado local con la respuesta del servidor. En el código actual, el borrado individual y el grupal verifican resultados, pero el borrado desde editor de cliente y el reinicio del historial no verifican de forma equivalente la cantidad/identidad de filas afectadas. Corregir esto dentro de la integración Catálogo, sin cambiar innecesariamente el comportamiento de Ventas.

**Decisión funcional confirmada:** eliminar desde Ventas nunca elimina la ficha del Catálogo; eliminar desde Catálogo sí elimina la ficha, su venta vinculada y sus fotos mediante el flujo seguro descrito arriba.


## Auditoría de carga, navegación y reutilización del Publicador

- `loadSales()` ejecuta `select('*')` y transforma las filas mediante `mapRowToSale()`. El mapper actual expone los campos comerciales, pero no conserva todavía un futuro `catalog_item_id`; habrá que incorporarlo explícitamente.
- La aplicación mantiene una carga central de ventas y un `render()` que actualiza Ventas, Entregas, resúmenes y otras vistas derivadas. El Catálogo debe tener su propia carga de `catalog_items` y metadatos de fotos, coordinada con la sesión y el usuario autenticado; no debe inferir el inventario recorriendo únicamente las ventas.
- La navegación usa vistas independientes (`viewSales`, `viewDeliveries`, `viewPublisher`) y accesos laterales/personalizables. Catálogo debe incorporarse como una vista propia y respetar el sistema de navegación existente, sin reemplazar ni duplicar el Publicador.
- El Publicador está modularizado en `js/features/publisher/garment-publisher.js` y `entry.js`. Su formulario ya reúne categoría, artículo, marca, talle, precio, observaciones, medidas y fotos; el intérprete de dictado completa esos campos mediante el parser modular.
- Actualmente el Publicador no persiste prendas ni imágenes: `queuedGarments`, los objetos `File` y las URLs de vista previa viven en memoria. Generar, copiar o abrir el menú nativo de compartir no crea una ficha persistente ni confirma publicación externa.
- La implementación debe separar el formulario reutilizable del ciclo de persistencia: guardar en Catálogo crea/actualiza `catalog_items` y sube fotos privadas; generar/compartir sigue siendo una acción independiente. El Catálogo puede reutilizar el intérprete y los controles existentes, pero no debe depender de la cola temporal de publicación para almacenar inventario.
- Las fotos persistidas deben representarse desde metadatos privados y URLs temporales/autorizadas; no se deben guardar ni reutilizar las URLs `blob:` del Publicador como almacenamiento.
- El precio aparece hoy en el formulario del Publicador para redactar el post. En Catálogo será dato comercial compartido con Ventas cuando la prenda se asigne; antes de asignarla puede conservarse en la ficha, pero al asignar debe definirse una única fuente de precio y sincronizarse sin crear filas duplicadas.

## Orden de implementación recomendado

1. Pruebas de contrato y migración aislada para tablas, FK, índices, RLS y Storage privado; primero validar localmente, sin aplicar DDL remoto.
2. Capa de acceso a Catálogo: carga, guardado, actualización, metadatos y subida/lectura/borrado de fotos.
3. Vista Catálogo con apartados Publicador, Stock y Archivadas, reutilizando el diseño visual y el formulario existentes.
4. Relación Catálogo-Ventas: asignación, edición de campos compartidos, reasignación permitida y actualización de vistas derivadas.
5. Integración de los cuatro caminos de eliminación de Ventas y de la eliminación definitiva desde Catálogo, incluyendo deshacer, fallos de red y reintentos de Storage.
6. Pruebas de regresión funcional, seguridad multiusuario, accesibilidad y responsive; recién entonces preparar PR.
