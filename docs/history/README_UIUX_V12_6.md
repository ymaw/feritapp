# FeritApp UI/UX V12.6 — Abrir Messenger

- Se reemplaza la acción «Copiar nombre» por «Abrir Messenger».
- El botón muestra un icono estilo Messenger tanto en la fila de cliente como en su ficha.
- Al pulsarlo se abre https://www.messenger.com/ en una pestaña nueva, usando la sesión que el vendedor tenga iniciada en el navegador.
- Se mantiene el botón para compartir comprobante.
- No se intenta abrir el chat del cliente a partir de su nombre, porque el nombre visible no identifica de forma única un perfil personal.
- No se cambió el repositorio original ni la base de datos.

Validación: `node --check script.js`.
