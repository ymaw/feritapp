# FeritApp V12.15 — Logo de alta resolución y comprobante

Cambios basados en V12.14. Se usó el archivo de logo proporcionado por el usuario, sin rediseñar su símbolo.

- Reemplazados `feritapp-icon.png`, `icon-192.png`, `icon-512.png`, `apple-touch-icon.png` y `favicon-32.png` con el logo proporcionado, redimensionado con filtro Lanczos.
- Añadido `feritapp-receipt-logo.png`: variante del logo con transparencia fuera del emblema circular para evitar bordes cuadrados en el pie del comprobante.
- Aumentado el logo en el pie del PNG exportado de 32×32 a 76×76.
- Añadido al pie de la vista previa el nombre de la tienda a la izquierda y el logo de FeritApp a la derecha.
- Actualizado el nombre visible de la aplicación en `manifest.json` a `FeritApp`.

Validación: `node --check script.js` pasó. No se probaron dispositivos reales ni la actualización de caché/PWA en producción. Para ver el nuevo icono instalado puede ser necesario volver a instalar la PWA o limpiar su caché, según el navegador.
