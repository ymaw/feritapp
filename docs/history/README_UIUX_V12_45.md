# FeritApp V12.45 — Estados y salida mobile de Nueva/Editar Venta

## Cambios
- En Entregas, el estado de pago totalmente saldado se muestra como “Abonado” en lugar de “Pago”.
- En Inicio > Resumen Semanal, el estado de pago es accionable. Cambia el pago de los artículos de la semana anterior (no de la semana actual) y actualiza el resumen.
- Nueva Venta y Editar Venta pueden cerrarse con un botón visible en el encabezado. En mobile también se admite deslizar hacia abajo desde la parte superior del sheet, sin interferir con el desplazamiento normal del formulario.
- Los estados del resumen se disponen verticalmente para que el estado de entrega quede debajo del de pago y no comprima la información.

## Validaciones
- Validación sintáctica de JavaScript y prueba de integridad del ZIP realizadas.
- No se ejecutaron pruebas de navegador ni una sesión real de Supabase; validar esos escenarios antes de publicar.
