# Plan Familiar El Niño (prototipo)

Prototipo para el reto "Asistente de IA que traduce datos oficiales de riesgo en planes familiares de evacuación y prevención ante El Niño" (Perú).

Este repositorio es la **parte de prototipo** (interfaz y flujo). El equipo de IA y WhatsApp conecta sus piezas en los puntos de integración de abajo.

## Qué incluye
- Mapa real por secciones: departamento, provincia y distrito (ubigeo INEI).
- Tarjeta de riesgo, preguntas rápidas y pantalla del plan (Antes, Durante, Después, mochila, contactos).
- Panel "El Niño hoy" con barras de probabilidad (ENFEN) y semáforo de avisos (SENAMHI).
- Botones de compartir por WhatsApp (`wa.me`) y copiar enlace.
- Panel de chat (interfaz) con botones rápidos.

Se abre con `index.html` en el navegador. No necesita servidor.

## Datos
Todos los datos de riesgo son **de ejemplo** y están aislados en la capa de datos del script:
- `getRiesgoPorUbigeo(ubigeo)`: reemplazar por la API real (CENEPRED, INDECI).
- `getContextoHoy()`: estado ENFEN y avisos SENAMHI (hoy escritos a mano, leídos el 23-oct-2026).
- `GEO_DEP`, `GEO_PROV`, `GEO_DIST`: límites simplificados de un GeoJSON público (solo Tumbes, Piura y Lambayeque tienen provincias y distritos).

## Puntos de integración (para IA y WhatsApp)
Definir `window.INTEGRACIONES` antes del script principal. Todo es opcional; sin esto el prototipo usa un plan de respaldo local.

```js
window.INTEGRACIONES = {
  // Devuelve el plan. `datos` trae distrito, riesgo, familia, estado ENFEN y avisos.
  generarPlan: async ({ prompt, datos }) => plan,
  // Devuelve el texto de la respuesta del agente. `mensajes` es [{role, content}].
  chat: async ({ mensajes, datos }) => "texto",
  // Opcional: cambia cómo se comparte por WhatsApp.
  compartirWhatsApp: (texto) => {}
};
```

Forma del `plan` (JSON):
```json
{
  "resumen": "1 frase",
  "antes": ["..."], "durante": ["..."], "despues": ["..."],
  "mochila": ["..."],
  "ruta_y_reunion": "texto",
  "contactos": ["..."],
  "cuidados_perfil": ["..."],
  "fuentes": [{ "dato": "...", "fuente": "...", "fecha": "..." }],
  "alerta_urgente": "texto o vacío"
}
```

Reglas del agente (ya escritas en el prompt, conviene mantenerlas): responder solo con los datos recibidos, citar fuente y fecha, decir "no tengo ese dato" si falta, y remitir a INDECI (115) en emergencias.

## Fuentes oficiales a conectar
- ENFEN-IMARPE: comunicado oficial (estado de alerta y pronóstico).
- CENEPRED SIGRID: escenarios de riesgo.
- INDECI: base de emergencias y daños 2003-2020 (Excel).
- SENAMHI: avisos meteorológicos (página HTML) y observatorio.
- INEI: ubigeo.

## Noticias automáticas (opcional)
La sección Noticias muestra una lista de notas reales con enlace al medio. Para recibirlas automáticamente:
1. Publica `worker/noticias.js` como Cloudflare Worker (convierte Google Noticias en JSON con CORS).
2. Antes del script principal, define `window.NEWS_ENDPOINT = "https://TU-WORKER.workers.dev";`
   o bien `window.INTEGRACIONES.noticias = async ({filtro, lugar}) => [{t, url, fecha, fuente}]`.

## Datos reales que ya usa
- Riesgo histórico: base de emergencias y daños de INDECI 2003-2020 (nivel calculado por el prototipo).
- Lluvia por horas, mar y ríos: Open-Meteo (Forecast, Marine y Flood), sin clave.
- Refugios y puntos de apoyo: OpenStreetMap (Nominatim). Los albergues oficiales los define INDECI o la municipalidad.

## WhatsApp: dónde se conecta el bot
La página tiene una tarjeta **WhatsApp** (franja "Más información") y un botón "Hablar por WhatsApp" en el asistente. Se muestran vacías ("Pronto podrás hablar por WhatsApp") hasta que se define el número del bot:

```html
<script>
window.WHATSAPP_BOT = {
  numero: "51999999999",   // con código de país, sin + ni espacios
  mensaje: "Hola, quiero mi plan familiar ante El Niño."
};
</script>
```
(o `window.INTEGRACIONES.whatsapp = { numero, mensaje }`). Con eso aparecen el botón "Abrir chat de WhatsApp", el enlace para copiar y un código QR.

El mensaje inicial incluye la zona que eligió la persona, para que el bot arranque sin preguntar de nuevo:
`... Vivo en {distrito}, {provincia}, {departamento} (ubigeo {código}).`

El bot puede usar las mismas fuentes que la web (Open-Meteo, INDECI, Nominatim) y el mismo formato JSON de plan descrito arriba.

**Estado actual:** el botón flotante de WhatsApp ya apunta al bot (número +591 68643730, definido por defecto en `waConfig()` de `index.html`). Abre el chat con el mensaje "Hola" para que arranque el flujo del bot. Para cambiar el número, el mensaje o enviar también la zona, define `window.WHATSAPP_BOT = { numero, mensaje, incluirLugar: true }`. Con `incluirLugar` el mensaje añade "Vivo en {distrito}, {provincia}, {departamento} (ubigeo {código})", pero el bot actual pregunta el nombre primero, así que conviene dejarlo apagado.
