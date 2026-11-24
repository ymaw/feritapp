# Plan de prueba: español rioplatense

## Protocolo común

- Comparación principal: Whisper Base multilingüe y Vosk small. Tiny queda como referencia histórica, no como candidato preferido por la lentitud y los errores críticos observados en el celular.
- Primera ronda rápida: ejecutar AR-01 y AR-02 tres veces por motor. Si ambos motores son utilizables, completar las 10 frases; después ampliar a 50 enunciados y varias voces.
- Mantener distancia al micrófono, volumen y velocidad similares.
- No corregir manualmente la transcripción antes de puntuar.
- Registrar texto literal reconocido, tiempo desde Detener hasta el resultado final, tiempo de carga inicial del modelo y observaciones. No mezclar descarga/carga con latencia de transcripción.
- Usar solamente frases sintéticas de prueba; no dictar datos personales ni información de clientes.
- No grabar, descargar ni conservar archivos de audio. El micrófono se usa en directo y el audio temporal solo existe en memoria durante el reconocimiento.

## Frases y datos esperados

| ID | Dictado esperado | Datos críticos que deben reconocerse |
|---|---|---|
| AR-01 | Vestido negro marca Ossira, talle M, precio treinta y cinco mil pesos | Vestidos; Ossira; M; 35000 |
| AR-02 | Pollera de jean, cintura treinta y ocho centímetros, cadera cincuenta y dos, largo setenta y cinco | Polleras; cintura 38; cadera 52; largo 75 |
| AR-03 | Remera básica marca Kosiuko, talle dos, veintidós mil quinientos pesos | Remeras; Kosiuko; talle 2; 22500 |
| AR-04 | Pantalón tiro alto, tiro delantero treinta centímetros, cintura cuarenta y uno, cadera cincuenta | Pantalones; tiro 30; cintura 41; cadera 50 |
| AR-05 | Camisa de lino color natural, marca Portsaid, talle cuarenta y dos | Camisas; lino; Portsaid; talle 42 |
| AR-06 | Buzo oversize, marca Adidas, talle extra large, precio cuarenta y ocho mil | Buzos/Otros según menú; Adidas; XL; 48000 |
| AR-07 | Vestido corto, no, vestido midi, marca Rapsodia, talle S | Corrección espontánea; Rapsodia; S; prevalece midi |
| AR-08 | Dos prendas: una pollera negra talle M y una remera blanca talle uno | Separación de prendas; categorías; talles |
| AR-09 | Zapatillas Nike número treinta y ocho, precio sesenta y nueve mil novecientos | Zapatillas; Nike; 38; 69900 |
| AR-10 | Pantalón de gabardina, cintura treinta y nueve, tiro delantero veintinueve, largo noventa y ocho, precio cincuenta y dos mil | Pantalones; medidas 39/29/98; 52000 |

## Registro de rendimiento

Para cada motor anotar: dispositivo y navegador, si es navegador o PWA instalada, tamaño/tiempo de descarga del modelo, tiempo de carga en frío, latencia de cada transcripción y mediana de latencia. Medir ambos motores en el mismo teléfono, en el mismo ambiente y con el mismo micrófono. No comparar una ejecución en escritorio con otra en móvil.

Como objetivo provisional de experiencia, una frase corta debería devolver el texto en alrededor de 3 segundos o menos después de detener el micrófono. No es un resultado medido ni un criterio de aceptación definitivo; sirve para identificar rápidamente motores claramente lentos.

## Puntuación

Puntuar cada dimensión por separado:

- **Categoría:** exacta / incorrecta / omitida.
- **Marca:** exacta / incorrecta / omitida.
- **Talle:** exacto / incorrecto / omitido.
- **Medidas:** cada número y su etiqueta deben coincidir.
- **Precio:** valor numérico exacto.
- **Correcciones:** debe prevalecer la corrección final del hablante.
- **Latencia:** segundos desde detener el micrófono hasta obtener el texto.
- **Estabilidad:** errores, bloqueos, cierre de pestaña o pérdida del modelo.

## Criterios de aprobación

- Cero errores críticos en precios y medidas en la muestra final de validación ampliada.
- La latencia debe ser suficientemente baja para que dictar sea más práctico que completar manualmente; reportar mediana y peor caso, no solo la mejor ejecución.
- No completar silenciosamente un campo con un valor dudoso: debe quedar vacío o marcado para revisión.
- La categoría debe coincidir con una opción existente; nunca inventar categorías ni seleccionar automáticamente «Otros».
- El parser existente debe seguir siendo responsable de mapear el texto a campos y plantillas.
- La carga manual debe funcionar aunque el motor falle o no esté disponible.

La muestra de 10 frases es un primer filtro, no evidencia estadística suficiente. Ampliar a por lo menos 50 enunciados y varias voces antes de elegir el motor.
