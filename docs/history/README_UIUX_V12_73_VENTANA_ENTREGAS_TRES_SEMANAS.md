# FeritApp V12.73 — ajuste del período de Entregas

## Alcance

Continuación de la copia V12.71. No se modificó el repositorio remoto ni se ejecutaron escrituras contra Supabase.

## 1. Eliminar venta desde Ventas

- Se quitó la X permanente de cada artículo dentro de la tarjeta expandida.
- Para seleccionar qué venta borrar, se debe mantener presionado el artículo durante aproximadamente 650 ms. En teclado, enfocar el artículo y pulsar `Enter` o `Espacio`.
- La flecha de la tarjeta se convierte temporalmente en una X roja y el artículo elegido queda resaltado.
- Al pulsar la X, se solicita confirmación y se elimina únicamente el artículo seleccionado, no todas las ventas del cliente.
- Si se cancela la confirmación, el modo de eliminación se cierra y la flecha vuelve a su estado normal.
- `Escape` también sale del modo de eliminación para usuarios de teclado.
- Se conserva el manejo de errores de Supabase: la interfaz no quita la venta localmente si la eliminación no devuelve una fila eliminada. El resultado real depende de la política RLS `DELETE`.

## 2. Entregas: ventana de tres semanas

- Semana actual: se muestran las ventas entregadas y pendientes, para que los usuarios puedan revisar y validar el estado durante toda la semana.
- Semana inmediatamente anterior: se muestran solo ventas que continúan pendientes.
- Dos semanas atrás: se muestran solo ventas que continúan pendientes.
- A partir de la cuarta semana (más antiguas que las tres semanas visibles), las ventas ya no aparecen en la lista activa de Entregas, aunque sigan pendientes.
- La lista se recalcula usando las semanas de calendario configuradas en la aplicación; al cambiar de semana, los registros pasan de ventana automáticamente.
- El filtro no elimina ni modifica registros históricos. Cambiar el estado desde Entregas solo actualiza el campo de estado de entrega de los artículos de la semana elegida.

## 3. Accesibilidad y tamaño de letra conservados de V12.71

Se mantienen los presets globales 90%, 100%, 115%, 130% y 150%, el guardado entre sesiones y la opción de restablecer a 100% en `Configuración → Apariencia`.

## Verificaciones ejecutadas

- `node --check script.js`: correcto.
- Parseo sintáctico de CSS: correcto.
- Análisis estructural del HTML: sin errores de parseo del documento.
- Comprobación estática: la tarjeta de Ventas genera `data-sale-id`, el manejador de pulsación prolongada selecciona un solo ID y el botón X se genera dinámicamente, no de forma permanente.
- Comprobación estática: el filtro de Entregas descarta las ventas entregadas antes de agruparlas y conserva el límite de semana actual/anterior.
- Integridad del ZIP: verificada.

## Prueba manual recomendada

1. En Ventas, expandir un cliente con al menos dos artículos.
2. Confirmar que no hay X junto a cada artículo.
3. Mantener presionado uno de los artículos unos 650 ms; comprobar que solo ese artículo queda seleccionado y que la flecha cambia a X roja.
4. Pulsar la X y cancelar: la venta debe permanecer y la flecha debe volver.
5. Repetir y confirmar la eliminación con una venta de prueba. Verificar que desaparezca solo esa venta.
6. En Entregas, comprobar que en la semana actual aparezcan entregados y pendientes; en las dos semanas anteriores, solo pendientes. Marcar una entrega de la semana actual como entregada y comprobar que permanezca visible hasta el cierre semanal. Verificar que una entrega pendiente de más de dos semanas atrás ya no aparezca.
7. Probar también en pantalla estrecha y con teclado. La operación de borrado real debe verificarse con una sesión autenticada y permisos RLS vigentes.

## Limitaciones

No se pudo ejecutar una sesión real autenticada de Supabase ni una prueba visual automatizada en navegador en este entorno. Por lo tanto, las comprobaciones de UI, interacción táctil y permisos de producción siguen requiriendo prueba manual.
