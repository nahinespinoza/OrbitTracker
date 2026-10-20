# Orbit Tracker · Guía para presentar en la feria

Simulador 3D interactivo de órbitas y satélites, con estética de "centro de control de misión".
Este documento es para **quien atiende el stand**: qué decir, qué mostrar, qué responder y qué hacer si algo falla.

---

## 1. Qué es (en 20 segundos)

> "Es un simulador en 3D de la Tierra donde puedes ver dónde está ahora mismo la Estación Espacial Internacional y otros satélites, cuánto vuelan de rápido y a qué altura, y acelerar el tiempo para ver cómo orbitan. También puedes ver miles de satélites Starlink o de basura espacial a la vez."

**Idea clave para el público:** la posición de los satélites **no se descarga en directo**. Se **calcula en el navegador** con las leyes de la mecánica orbital, a partir de unos datos llamados TLE.

---

## 2. Qué puede hacer el visitante

| Función | Dónde | Qué se ve |
|---|---|---|
| Elegir satélite | Panel izquierdo → Categoría + Objetivo | Marcador brillante sobre la Tierra y su telemetría |
| Categorías | Científicos · Meteorológicos · Telecom · Cubesats | Lista de 15 satélites |
| Telemetría | Panel derecho | Latitud, longitud, altitud (km) y velocidad (km/h) en tiempo real |
| Acelerar el tiempo | 1x · 10x · 100x · 500x | El satélite recorre su órbita mucho más rápido |
| Volver a ahora | Botón "Volver a ahora" | Reinicia el reloj a la hora real |
| Trayectoria orbital | Interruptor | Línea verde con la órbita completa |
| Seguir satélite | Interruptor | La cámara acompaña al satélite |
| Ver modelo 3D | Botón (o zoom con rueda/pellizco) | Modelo del satélite girando; "Vista global" regresa |
| Nube de satélites | Starlink · OneWeb · Basura espacial | 500 a 1.500 puntos a la vez alrededor de la Tierra |
| Mover la cámara | Arrastrar / zoom | Rotar y acercar la Tierra |

La Tierra muestra **día y noche reales** (las luces de las ciudades se ven en la zona oscura) según la posición actual del Sol.

---

## 3. Guion de demostración (3 minutos)

1. **Gancho (15 s).** Con la ISS ya seleccionada: *"Este punto es la Estación Espacial Internacional. Ahora mismo hay astronautas dentro."* Señalar la telemetría: *"Va a unos 27.500 km/h, a unos 430 km de altura."*
2. **Tiempo (30 s).** Pulsar **100x**: *"Si aceleramos el tiempo, vemos que da la vuelta a la Tierra en unos 90 minutos. Eso son unos 16 amaneceres al día para los astronautas."* Activar **Trayectoria orbital** para ver la línea.
3. **Zoom (30 s).** Pulsar **Ver modelo 3D**: *"Y si nos acercamos, aparece la estación."* Luego **Vista global**.
4. **Cambiar de satélite (30 s).** Categoría **Meteorológicos** → NOAA 19: *"Este pasa por los polos y escanea toda la Tierra, es el que nos da el pronóstico del tiempo."*
5. **El golpe visual (45 s).** Quitar el seguimiento, **Vista global**, y activar **Nube → Starlink**: *"Esto son 1.500 satélites Starlink de unos 9.000 que hay."* Luego **Basura espacial**: *"Y esto son restos de colisiones y pruebas. Cada punto rojo es un fragmento."*
6. **Cierre (30 s).** Invitar a que lo prueben: *"Elige el satélite que quieras y mira dónde está."*

**Consejo:** deja la app en reposo con la ISS y la nube de Starlink activa y la cámara alejada. Se ve espectacular desde lejos y atrae visitantes.

---

## 4. Cómo funciona (explicación sencilla)

### Los datos: TLE
Un **TLE** (Two-Line Element) son dos líneas de texto que describen la órbita de un satélite en un instante: inclinación, forma de la elipse, cuántas vueltas da al día, etc. Los publica **CelesTrak**, que los toma del seguimiento radar del catálogo NORAD.

Un TLE **no dice dónde está** el satélite, dice **cómo es su órbita**.

### El cálculo: SGP4
Con el TLE y la hora, un modelo matemático llamado **SGP4** (librería `satellite.js`) calcula posición y velocidad. De ahí salen latitud, longitud, altura y velocidad.

```
TLE (la órbita) + fecha y hora  →  SGP4  →  posición y velocidad  →  telemetría y dibujo 3D
```

### Datos "en vivo" vs "offline"
- **Live TLE (verde):** los datos de la órbita se descargaron hoy de internet.
- **Offline TLE (ámbar):** se usan los datos guardados en el proyecto.
- En ambos casos la posición **siempre se calcula en el navegador**. La red solo se usa una vez por satélite y, después, la app funciona sin conexión.

### La nube de satélites
Se dibujan miles de puntos con una sola llamada gráfica (`THREE.Points`). El cálculo orbital se reparte entre frames para que la animación sea fluida.

---

## 5. Stack tecnológico (si preguntan)

| Parte | Tecnología |
|---|---|
| Interfaz | React + Vite |
| Estilos | Tailwind CSS (efecto cristal, neón) |
| Iconos | Lucide React |
| 3D | Three.js con React Three Fiber y Drei |
| Mecánica orbital | satellite.js (SGP4) |
| Datos | CelesTrak (TLE) con respaldo local |
| Fuentes | Orbitron y JetBrains Mono (incluidas, sin internet) |

Todo es **código abierto**.

---

## 6. Preparación del stand

### Antes del evento (con internet)
1. **Refrescar los TLE de respaldo.** Los TLE se degradan con las semanas (el error pasa de pocos km a cientos). Regenerar `src/data/tle-fallback.json` y `src/data/constellations.json`.
   - CelesTrak solo permite **una descarga por consulta cada 2 horas**; espaciar las peticiones o devuelve error 403.
2. Compilar la versión de producción:
   ```bash
   cd orbit-tracker
   npm install
   npm run build
   ```
3. Abrir una vez la app con internet y probar cada satélite y cada nube.

### El día del evento
```bash
cd orbit-tracker
npm run preview      # sirve en http://localhost:4173
```
- Abrir `http://localhost:4173` en el navegador en **pantalla completa (F11)**.
- Usar un equipo con **tarjeta gráfica** o gráficos integrados decentes, y un navegador moderno (Chrome, Edge o Firefox).
- Resolución recomendada: 1920×1080.

---

## 7. Plan B: si algo falla

| Problema | Qué pasa | Solución |
|---|---|---|
| No hay internet | La app usa los datos locales y el indicador sale ámbar "Offline TLE" | Nada, funciona igual |
| Pantalla en negro o 3D lento | Falta aceleración gráfica | Cerrar otras pestañas, probar otro navegador, bajar la resolución |
| Aparece "Offline TLE" con internet | CelesTrak limitó la descarga (una vez cada 2 h) | Normal; la órbita sigue siendo correcta si el respaldo es reciente |
| El satélite no coincide con otras webs | TLE antiguos | Regenerar los TLE de respaldo |
| La página no carga | El servidor local se cerró | Ejecutar de nuevo `npm run preview` |
| La nube tarda en aparecer | Descarga de un grupo grande | Esperar unos segundos o usar el respaldo |

---

## 8. Preguntas frecuentes del público

**¿Esto es en tiempo real?**
Sí en el sentido de que usa la hora actual y la posición coincide con la real. Pero la posición se **calcula**, no se recibe de un sensor. Es una predicción muy precisa si los datos son recientes.

**¿Qué tan exacto es?**
Con datos de hoy, el error es de pocos kilómetros. Con datos de semanas atrás, puede ser de cientos.

**¿Por qué la ISS va tan rápido?**
Para no caer, tiene que moverse a unos 27.500 km/h. Está en caída libre permanentemente, pero se mueve tan rápido de lado que siempre "falla" el suelo.

**¿Cuánto tarda la ISS en dar una vuelta?**
Unos 93 minutos, unas 15,5 vueltas al día.

**¿Por qué el Hubble tiene menos altura que antes?**
Orbita a unos 480 km y la atmósfera, aunque muy tenue, lo frena poco a poco.

**¿Qué son los puntos rojos?**
Fragmentos de basura espacial de tres eventos conocidos: una prueba antisatélite china en 2007 (Fengyun-1C) y la colisión entre los satélites Iridium 33 y Cosmos 2251 en 2009. Es una muestra, no todo el catálogo.

**¿Esos son todos los Starlink?**
No, son 1.500 de unos 9.000. Se muestran repartidos para que se vea la forma de la constelación.

**¿Por qué los modelos 3D son tan sencillos?**
Son modelos simplificados hechos con figuras básicas, para que funcionen sin internet. Y están **muy agrandados**: a escala real serían invisibles a esa distancia.

**¿Se puede ver la Luna u otros planetas?**
No, solo satélites en órbita terrestre.

**¿Cómo se hizo?**
Con React y Three.js, que son tecnologías abiertas. La física orbital la calcula una librería llamada satellite.js.

---

## 9. Datos curiosos para conversar

- La **ISS** mide como un campo de fútbol americano y está habitada de forma continua desde el año 2000.
- **NOAA 19** pasa casi por los polos (inclinación ~99°): así cubre toda la Tierra en pocos días.
- **Starlink** vuela bajo (~550 km) para que la señal de internet tenga poca demora.
- Los **cubesats** (FUNcube, ESTCube, UWE-4) son satélites pequeños construidos por universidades: demuestran que un equipo estudiantil también puede ir al espacio.
- En la zona **oscura** de la Tierra se ven las luces de las ciudades.

---

## 10. Limitaciones conocidas (sé honesto con el público)

- Las posiciones son **calculadas**, no medidas.
- Los modelos 3D son **esquemáticos** y están a escala exagerada.
- Las nubes son una **muestra** del total.
- No incluye satélites geoestacionarios (están demasiado lejos para el zoom actual).
- La interfaz no se ha probado en pantalla táctil real.

---

## 11. Estructura del proyecto (para quien quiera ver el código)

```
orbit-tracker/
├── public/textures/            Texturas de la Tierra (día, noche, océanos)
└── src/
    ├── App.jsx                 Une todo: estado, reloj, paneles
    ├── components/
    │   ├── Earth3D.jsx         Escena 3D: Tierra, atmósfera, órbita, marcador
    │   ├── SatelliteModel.jsx  Modelos 3D de los satélites
    │   ├── SatelliteCloud.jsx  Nube de miles de satélites
    │   ├── TelemetryPanel.jsx  HUD de telemetría
    │   └── OrbitalControls.jsx Selector, tiempo, interruptores
    ├── hooks/                  useSatellite · useConstellation · useSimClock
    ├── lib/orbit.js            Cálculos orbitales (satellite.js)
    ├── services/tleService.js  Descarga de TLE, caché y respaldo
    └── data/
        ├── catalog.js          Lista de satélites y nubes (añadir uno = una línea)
        ├── tle-fallback.json   TLE de respaldo (modo offline)
        └── constellations.json Respaldo de las nubes
```

**Para añadir un satélite:** agregar una línea en `src/data/catalog.js` con su número NORAD y su categoría, y regenerar el JSON de respaldo.
