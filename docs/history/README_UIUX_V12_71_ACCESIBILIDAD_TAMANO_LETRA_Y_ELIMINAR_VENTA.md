# FeritApp V12.71 — tamaño de letra y eliminación visible de ventas

## Alcance

Cambios sobre una copia de V12.70. No se modificó el repositorio remoto ni se realizaron escrituras en Supabase.

## 1. Tamaño de letra en Configuración → Apariencia

- Se añadieron cinco presets: 90%, 100%, 115%, 130% y 150%.
- El valor inicial es 100%.
- La selección se guarda en `localStorage` con la clave `feritapp-font-scale` y se restaura al abrir la aplicación.
- Se actualiza el estado accesible `aria-pressed` de cada opción y se muestra el tamaño seleccionado.
- Se agregó «Restablecer tamaño de letra», que vuelve a 100%.
- Se escalaron las declaraciones CSS de tamaño de fuente, incluidas las que usan `clamp()` y las abreviaturas `font`, mediante una variable global. Los espacios, anchos y alturas no se escalan automáticamente; con tamaños grandes algunos componentes pueden necesitar ajustes visuales en dispositivos estrechos.
- Se conserva el zoom del navegador/dispositivo como alternativa.

## 2. Eliminar una venta en Ventas

- La función de eliminación y el evento `data-del` ya estaban presentes en V12.70.
- Se detectó que reglas CSS ocultaban `.row-actions` dentro del detalle expandido de los clientes en Ventas, por lo que el botón de eliminar no quedaba visible.
- Se ajustaron esas reglas para mantener oculto el control de pago duplicado, pero mostrar la acción de eliminar.
- Se dio al botón un área mínima de interacción y un estilo de peligro visible.
- Se conserva la confirmación antes de borrar y la actualización local únicamente cuando Supabase devuelve una fila eliminada. Si la operación falla o la política RLS no permite eliminar, se informa mediante un aviso.

## Verificaciones ejecutadas

- `node --check script.js`: correcto.
- Parseo CSS con `tinycss2`: 0 errores sintácticos.
- Comprobación estática de las cinco opciones, valor inicial, persistencia, restablecimiento y atributos `aria-pressed`.
- Comprobación estática de que el botón `data-del` se genera, tiene un manejador y la regla final de CSS ya no lo oculta en Ventas.
- Integridad del ZIP: verificada.

## Pendiente de prueba manual

No se probó con una sesión autenticada de Supabase ni con datos reales. La eliminación depende de que la política RLS `DELETE` de `sales` autorice la fila del usuario. Tampoco se ejecutó una auditoría visual completa con viewport móvil, lector de pantalla o axe/Lighthouse.

### Prueba recomendada

1. Abrir `Configuración → Apariencia`, elegir 130% y 150%, navegar por Inicio, Ventas, Clientes y Entregas, y confirmar que los textos sean legibles. Recargar la app y comprobar que se conserve la selección.
2. Elegir «Restablecer tamaño de letra» y confirmar que vuelva a 100%.
3. En Ventas, expandir un cliente con una venta de prueba. Presionar el botón de eliminar, cancelar en una segunda prueba y confirmar en la primera. Verificar que la venta confirmada desaparezca y que una venta cancelada permanezca.
4. Si Supabase rechaza la operación, comprobar la política RLS `DELETE` de `sales`; no se debe desactivar RLS para resolverlo.
