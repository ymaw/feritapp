# FeritApp V12.70 — primera fase de accesibilidad

## Alcance

Cambios pequeños y reversibles sobre V12.69. No se alteraron los flujos de ventas, cobros, entregas ni las políticas de base de datos.

### Cambios

1. **Zoom de pantalla:** se quitó `maximum-scale=1.0` del viewport para permitir que el usuario amplíe la interfaz desde el navegador/dispositivo.
2. **Etiquetas de formulario:** se vincularon mediante `for` las etiquetas estáticas que tenían un único control identificable dentro del mismo campo.
3. **Avisos accesibles:** el contenedor de toast ahora usa `role="status"`, `aria-live="polite"` y `aria-atomic="true"` para que los lectores de pantalla puedan anunciar mensajes dinámicos.
4. **Historial semanal:** los botones expansibles ahora declaran `type="button"`, `aria-controls` y `aria-expanded`; el estado ARIA se actualiza al expandir/colapsar.
5. **Foco de teclado:** se añadió un indicador visible de foco para elementos interactivos, incluidos los elementos de menú que antes quitaban el outline.

## Verificaciones ejecutadas

- `node --check script.js`.
- Parseo del CSS con `tinycss2` y balance de llaves.
- Revisión de asociaciones `label[for]` contra IDs existentes.
- Revisión de `aria-controls` para los toggles del historial.
- Integridad del ZIP con `unzip -t`.

## No verificado todavía

- No se ejecutó en navegador real ni con sesión autenticada.
- No se ejecutaron pruebas con lector de pantalla (NVDA/VoiceOver/TalkBack), auditoría axe/Lighthouse, contraste medido ni pruebas de teclado de punta a punta.
- No se alteraron RLS, consultas ni esquema de Supabase.

## Prueba manual mínima

1. Abrí FeritApp en móvil y ampliá la página con zoom; confirmá que el contenido siga siendo utilizable.
2. Navegá con `Tab` y `Shift+Tab`; comprobá que siempre se vea el foco y que los botones se activen con `Enter` o `Espacio`.
3. Abrí y cerrá una semana del historial; comprobá que el lector de pantalla o el árbol de accesibilidad indique el estado expandido/contraído.
4. Provocá un mensaje toast y comprobá que el anuncio no interrumpa la navegación.
