# Plan de prueba: español rioplatense

## Protocolo común

- Ejecutar cada frase 3 veces por motor (Whisper tiny y Vosk small).
- Mantener distancia al micrófono, volumen y velocidad similares.
- No corregir manualmente la transcripción antes de puntuar.
- Registrar texto literal reconocido, tiempo de procesamiento y observaciones.
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
- No completar silenciosamente un campo con un valor dudoso: debe quedar vacío o marcado para revisión.
- La categoría debe coincidir con una opción existente; nunca inventar categorías ni seleccionar automáticamente «Otros».
- El parser existente debe seguir siendo responsable de mapear el texto a campos y plantillas.
- La carga manual debe funcionar aunque el motor falle o no esté disponible.

La muestra de 10 frases es un primer filtro, no evidencia estadística suficiente. Ampliar a por lo menos 50 enunciados y varias voces antes de elegir el motor.
