# FeritApp UI/UX V12.56

- Micrófono más pequeño y centrado, con tamaño controlado tanto en el campo de cliente como en los artículos.
- Swipe horizontal: detección de dirección durante el movimiento, menor distancia mínima cuando el gesto es rápido y protección frente a doble activación. Se ignoran controles y tarjetas interactivas.
- Swipe vertical de cierre para Nueva Venta y Editar Venta: limitado a la zona superior/asa, umbral reducido y cancelación si el gesto es horizontal; no interfiere con el desplazamiento normal del formulario.
- No se alteraron los handlers de guardado ni el acceso a Supabase. No se modificó el repositorio original.

Validaciones: `node --check script.js` y prueba de integridad del ZIP. No se realizó prueba visual en navegador ni prueba real en dispositivo móvil/Supabase.
