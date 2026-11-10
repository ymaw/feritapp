# FeritApp V12.20 — Pulido de interacción y tarjetas

## Cambios
- Ventas: título y leyenda en una card, buscador centrado y con paleta de tema.
- Ventas: se quitaron las referencias visuales a estados de entrega; conserva únicamente Pago/Pendiente.
- Entregas: filtro inicial Todos; estados Por Entregar/Entregado visibles como selector de dos opciones; al marcar Entregado el cliente sigue en Todos y aparece en Entregados.
- Navegación inferior: Inicio, Ventas, Nueva venta (+), Entregas, Más.
- Inicio: resumen semanal sin avatar, orden de secciones atención → historial → gráficos, últimas tres semanas cerradas y semana más reciente destacada.
- Tarjetas de clientes: anchura, columnas, saltos de línea y áreas de artículos ajustados para evitar contenido comprimido.
- Logo de alta resolución aprobado aplicado a los recursos de marca de la aplicación; el recurso específico del comprobante se mantiene separado.

## Validación realizada
- `node --check script.js`.
- Validación básica de HTML e identificadores.
- Verificación de integridad del ZIP.

## Pendiente de prueba real
No se ejecutó un flujo end-to-end contra Supabase ni una prueba visual en dispositivos reales. La persistencia del estado `entregado` requiere la migración `MIGRACION_V12_19_ENTREGAS.sql` de la versión anterior.
