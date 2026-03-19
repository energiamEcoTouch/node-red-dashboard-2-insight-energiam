# node-red-contrib-insight-energiam

Widget de visualización de series temporales con **ECharts 5.5.1 offline**, estilo Grafana, para **FlowFuse Dashboard 2.0**. Parte del ecosistema [EnergIAM](https://github.com/energiamEcoTouch).

---

## Características

- Gráfico de líneas multi-serie con múltiples ejes Y
- Time picker con rangos rápidos y rango absoluto personalizado
- Selector de colecciones (series) y métricas (unidades)
- Downsampling visual automático
- Leyenda interactiva (click para ocultar/mostrar series)
- Stats: min / max / avg por serie
- Panel de opciones: ancho de línea, fill, smooth, offset por serie, colores
- Descarga PNG y CSV
- Estado persistente por instancia (rango, colecciones, opciones)
- **ECharts bundleado — funciona 100% offline, sin CDN**
- Agnóstico a la fuente de datos (MongoDB, InfluxDB, PostgreSQL, API REST, etc.)

---

## Instalación (usuario final)

```bash
# Desde el contenedor Node-RED
npm install node-red-contrib-insight-energiam
```

O desde **Manage Palette** en Node-RED buscando `insight-energiam`.

---

## Uso rápido

1. Arrastrar el nodo **ui-insight** al canvas
2. Configurar grupo de Dashboard 2.0
3. Conectar la **salida** a una función que consulte la base de datos
4. Conectar la salida de esa función de vuelta a la **entrada** del nodo con `msg.topic = "insight/data"`

---

## Contrato I/O

### SALIDA — Query Request

El nodo emite automáticamente cuando el usuario interactúa con el widget:

```json
{
  "topic": "insight/query",
  "payload": {
    "desde":       "2024-01-01T00:00:00.000Z",
    "hasta":       "2024-01-01T00:15:00.000Z",
    "colecciones": ["id-coleccion-a", "id-coleccion-b"],
    "horas":       0.25
  }
}
```

| Campo | Descripción |
|---|---|
| `desde` / `hasta` | ISO 8601 UTC |
| `colecciones` | IDs de colecciones activas en el widget |
| `horas` | número si es rango relativo, `null` si es absoluto |

### ENTRADA — Datos del gráfico

```json
{
  "topic": "insight/data",
  "payload": {
    "series": [ ],
    "colLabels": { "Nombre visible": "id-coleccion" }
  }
}
```

#### Estructura de cada EChartsSerie

```json
{
  "name":       "Circuito A · kW",
  "metric":     "kW",
  "type":       "line",
  "yAxisIndex": 0,
  "data": [
    [1700000000000, 1.234],
    [1700000060000, 1.456]
  ],
  "smooth":       true,
  "connectNulls": false,
  "lineStyle": { "width": 1, "color": "#58a6ff" },
  "itemStyle": { "color": "#58a6ff" }
}
```

| Campo | Descripción |
|---|---|
| `name` | Nombre en leyenda. Convención: `"NombreSerie · unidad"` |
| `metric` | Unidad del eje Y. Series con igual `metric` comparten eje |
| `yAxisIndex` | 0=izq · 1=der · 2=izq2 · 3=der2 |
| `data` | `[[timestamp_ms, valor], ...]`. `null` es válido para gaps |

#### colLabels

```json
{
  "Circuito A": "z2m-tghc-H404_LP001",
  "Circuito B": "z2m-tghc-H406_LP002"
}
```

Claves = nombres visibles en el selector del widget. Valores = IDs que el nodo usa en el query request.

#### Colores sugeridos

```
#58a6ff · #3fb950 · #f78166 · #d2a8ff · #ffa657
#79c0ff · #56d364 · #ff7b72 · #bc8cff · #ffb366
#388bfd · #2ea043 · #da3633 · #8957e5
```

---

## Ejemplo — Adaptador MongoDB

```javascript
// Nodo función conectado a la salida de ui-insight
// Entrada: msg.topic === "insight/query"

const { desde, hasta, colecciones } = msg.payload;

const msgs = colecciones.map((col, i) => ({
    topic: col,
    payload: [
        { time: { $gte: new Date(desde), $lte: new Date(hasta) } },
        { sort: { time: 1 } }
    ],
    parts: {
        id:    Date.now(),
        type:  'array',
        count: colecciones.length,
        index: i
    }
}));

return [msgs];
```

Luego cada colección va a su nodo MongoDB4, el resultado pasa por un nodo Join y una función que formatea las series según el contrato de entrada, y vuelve al nodo insight con `msg.topic = "insight/data"`.

---

## Para desarrolladores — Build y publicación

### Prerequisitos

```bash
node >= 18
npm >= 9
```

### Clonar y preparar

```bash
git clone https://github.com/energiamEcoTouch/node-red-contrib-insight-energiam.git
cd node-red-contrib-insight-energiam
npm install
```

### Build del componente Vue

```bash
npm run build
```

Esto compila `ui/components/UIInsight.vue` → `ui/ui-insight.umd.js` con Vite.  
El archivo `.umd.js` resultante **debe incluirse en el commit y en el paquete npm**.

### Estructura del proyecto

```
node-red-contrib-insight-energiam/
├── nodes/
│   ├── ui-insight.js       # Backend Node-RED
│   └── ui-insight.html     # Editor + ayuda
├── ui/
│   ├── components/
│   │   └── UIInsight.vue   # Componente Vue (fuente)
│   ├── index.js            # Entry point Vite
│   └── ui-insight.umd.js  # ← generado por npm run build
├── resources/
│   └── echarts.min.js      # ECharts 5.5.1 bundleado
├── package.json
├── vite.config.js
└── README.md
```

### Publicar en npm

```bash
# Asegurarse de que el build está actualizado
npm run build

# Verificar que ui/ui-insight.umd.js existe
ls -lh ui/ui-insight.umd.js

# Publicar
npm publish
```

### Registrar en el catálogo de Node-RED

Una vez publicado en npm, registrar en [flows.nodered.org/add/node](https://flows.nodered.org/add/node) autenticando con GitHub.

---

## Dependencias de runtime

| Dependencia | Versión | Rol |
|---|---|---|
| Node-RED | ≥ 3.0.0 | Runtime |
| @flowfuse/node-red-dashboard | ≥ 1.0.0 | Dashboard 2.0 |
| ECharts 5.5.1 | bundleado | Gráficos (offline) |

---

## Stack EnergIAM

| Componente | Tecnología |
|---|---|
| Virtualización | Proxmox VE |
| Administración | Komodo |
| IoT | Node-RED + Zigbee2MQTT + MQTT |
| Bases de datos | MongoDB / InfluxDB |
| Visualización | Grafana + Dashboard 2.0 |

---

## Licencia

MIT — EnergIAM EcoTouch 2025
