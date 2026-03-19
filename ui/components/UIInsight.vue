<template>
    <div class="gf">

        <!-- TOOLBAR -->
        <div class="gf-bar">
            <div class="gf-bar-left">

                <!-- Time picker -->
                <div class="gf-tp" ref="tpRef">
                    <button class="gf-tp-btn" @click="toggleTp($event)">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style="opacity:.7">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67V7z"/>
                        </svg>
                        <span class="gf-tp-label">{{ tpLabel }}</span>
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" style="opacity:.5;margin-left:2px">
                            <path d="M7 10l5 5 5-5z"/>
                        </svg>
                    </button>
                    <div v-if="tpOpen" class="gf-tp-drop" :style="tpPos" @click.stop>
                        <div class="gf-tp-drop-inner">
                            <div class="gf-tp-abs">
                                <div class="gf-tp-sec">Rango absoluto</div>
                                <label class="gf-tp-lbl">Desde</label>
                                <input class="gf-tp-input" type="datetime-local" v-model="tpFrom" :step="60">
                                <label class="gf-tp-lbl" style="margin-top:8px">Hasta</label>
                                <input class="gf-tp-input" type="datetime-local" v-model="tpTo" :step="60">
                                <button class="gf-tp-apply" @click="applyAbsoluto">Aplicar rango</button>
                            </div>
                            <div class="gf-tp-presets">
                                <div class="gf-tp-sec">Rápidos</div>
                                <button v-for="r in rangosPreset" :key="r.v"
                                    :class="['gf-tp-preset', {on: rangoActivo===r.v && !tpAbsoluto}]"
                                    @click="setRango(r.v)">{{ r.l }}</button>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="gf-div"></div>

                <!-- Selector de colecciones -->
                <div class="gf-cdrop" ref="cdRef">
                    <button class="gf-tp-btn" @click="toggleCd($event)">
                        <span>{{ todasCols.length > 0 && colsAct.length === todasCols.length
                            ? 'Todas las series'
                            : colsAct.length + ' series' }}</span>
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" style="opacity:.5">
                            <path d="M7 10l5 5 5-5z"/>
                        </svg>
                    </button>
                    <div class="gf-cd-drop" v-if="cdOpen" :style="cdPos" @click.stop>
                        <div class="gf-cd-actions">
                            <span @click="selTodos">Todos</span>
                            <span @click="selNinguno">Ninguno</span>
                        </div>
                        <div v-for="c in todasCols" :key="c.v"
                            class="gf-md-item"
                            :style="colsAct.includes(c.v) ? {color:'#5794F2'} : {color:'#9fa7b3'}"
                            @click="toggleCol(c.v)">
                            <span class="gf-md-check">{{ colsAct.includes(c.v) ? '✓' : ' ' }}</span>
                            <span>{{ c.l }}</span>
                        </div>
                    </div>
                </div>

            </div>

            <div class="gf-bar-right">

                <!-- Selector de métricas (unidades) -->
                <div class="gf-mdrop" ref="mdRef">
                    <button class="gf-tp-btn" @click="toggleMd($event)">
                        <span>{{ metricasAct.join(', ') || 'métricas' }}</span>
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" style="opacity:.5">
                            <path d="M7 10l5 5 5-5z"/>
                        </svg>
                    </button>
                    <div class="gf-md-drop" v-if="mdOpen" :style="mdPos" @click.stop>
                        <div v-for="m in metricas" :key="m.v"
                            class="gf-md-item"
                            :style="metricasAct.includes(m.v) ? {color:m.color} : {color:'#9fa7b3'}"
                            @click="toggleMetrica(m.v)">
                            <span class="gf-md-check">{{ metricasAct.includes(m.v) ? '✓' : '\u00a0' }}</span>
                            <span>{{ m.l }}</span>
                        </div>
                    </div>
                </div>

                <div class="gf-div"></div>

                <!-- Controles de escala por eje -->
                <template v-if="ejesActivos.length">
                    <div v-for="eje in ejesActivos" :key="eje.k" class="gf-eje">
                        <span class="gf-eje-lbl" :style="{color:eje.color}">{{eje.k}}</span>
                        <input class="gf-ei" type="number" placeholder="auto"
                            :value="ejeConfig[eje.k] ? ejeConfig[eje.k].min : ''"
                            @change="setEje(eje.k,'min',$event.target.value)">
                        <span class="gf-eje-sep">–</span>
                        <input class="gf-ei" type="number" placeholder="auto"
                            :value="ejeConfig[eje.k] ? ejeConfig[eje.k].max : ''"
                            @change="setEje(eje.k,'max',$event.target.value)">
                    </div>
                    <div class="gf-div"></div>
                </template>

                <!-- Acciones -->
                <button class="gf-icon" @click="descargarPNG" title="Descargar PNG">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
                    </svg>
                </button>
                <button class="gf-icon" @click="descargarCSV" title="Descargar CSV">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19 9h-4V3H9v6H5l7 7 7-7zm-8 2V5h2v6h1.17L12 13.17 9.83 11H11zm-6 7h14v2H5z"/>
                    </svg>
                </button>
                <button class="gf-icon" @click="panelOpen=!panelOpen" title="Opciones" :class="{on:panelOpen}">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                        <circle cx="12" cy="5" r="1.5"/>
                        <circle cx="12" cy="12" r="1.5"/>
                        <circle cx="12" cy="19" r="1.5"/>
                    </svg>
                </button>
                <button class="gf-icon" @click="refresh" title="Actualizar">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.65 6.35A7.958 7.958 0 0012 4c-4.42 0-8 3.58-8 8s3.58 8 8 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0112 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
                    </svg>
                </button>

            </div>
        </div>

        <!-- CHART -->
        <div class="gf-main" ref="chartWrap">
            <div ref="chartEl" class="gf-canvas"></div>
        </div>

        <!-- LEYENDA -->
        <div class="gf-legend" v-if="seriesFiltradas.length">
            <div v-for="s in seriesFiltradas" :key="s.name"
                :class="['gf-li', {dim: seriesOcultas.includes(s.name)}]"
                @click="toggleSerie(s.name)">
                <span class="gf-li-line" :style="{background: s.itemStyle.color}"></span>
                <span class="gf-li-name">{{s.name}}</span>
                <span class="gf-li-val" v-if="s.data && s.data.length">
                    {{s.data[s.data.length-1][1]}}
                </span>
            </div>
        </div>

        <!-- STATS -->
        <div v-if="statsVisibles.length" class="gf-stats">
            <div v-for="st in statsVisibles" :key="st.name" class="gf-stat-row">
                <span class="gf-stat-dot" :style="{background:st.color}"></span>
                <span class="gf-stat-name">{{ st.name }}</span>
                <span class="gf-stat-val"><span class="gf-stat-lbl">min </span>{{ st.min }}</span>
                <span class="gf-stat-val"><span class="gf-stat-lbl">max </span>{{ st.max }}</span>
                <span class="gf-stat-val"><span class="gf-stat-lbl">avg </span>{{ st.avg }}</span>
            </div>
        </div>

        <!-- PANEL LATERAL DE OPCIONES -->
        <transition name="gf-panel-slide">
            <div class="gf-panel" v-if="panelOpen" @click.stop>
                <div class="gf-panel-hdr">
                    <span>Opciones de visualización</span>
                    <button class="gf-panel-close" @click="panelOpen=false">✕</button>
                </div>

                <!-- Global -->
                <div class="gf-panel-section">
                    <div class="gf-panel-title">GLOBAL</div>
                    <div class="gf-panel-row">
                        <label>Ancho de línea</label>
                        <div class="gf-panel-ctrl">
                            <input type="range" min="0.5" max="4" step="0.5"
                                v-model.number="globalOpts.lineWidth"
                                @input="applyChart(); saveState()">
                            <span>{{ globalOpts.lineWidth }}</span>
                        </div>
                    </div>
                    <div class="gf-panel-row">
                        <label>Tamaño puntos</label>
                        <div class="gf-panel-ctrl">
                            <input type="range" min="0" max="8" step="1"
                                v-model.number="globalOpts.pointSize"
                                @input="applyChart(); saveState()">
                            <span>{{ globalOpts.pointSize }}</span>
                        </div>
                    </div>
                    <div class="gf-panel-row">
                        <label>Fill</label>
                        <div class="gf-panel-ctrl">
                            <input type="range" min="0" max="100" step="5"
                                v-model.number="globalOpts.fillAlpha"
                                @input="applyChart(); saveState()">
                            <span>{{ globalOpts.fillAlpha }}%</span>
                        </div>
                    </div>
                    <div class="gf-panel-row">
                        <label>Smooth</label>
                        <div class="gf-panel-ctrl">
                            <input type="range" min="0" max="1" step="0.1"
                                v-model.number="globalOpts.smooth"
                                @input="applyChart(); saveState()">
                            <span>{{ globalOpts.smooth }}</span>
                        </div>
                    </div>
                    <div class="gf-panel-row">
                        <label>Umbral</label>
                        <div class="gf-panel-ctrl">
                            <input type="number" class="gf-panel-num" placeholder="—" step="0.5"
                                v-model.number="globalOpts.umbral"
                                @change="applyChart(); saveState()">
                        </div>
                    </div>
                    <div class="gf-panel-row">
                        <label>Tags en gráfico</label>
                        <div class="gf-panel-ctrl">
                            <label class="gf-toggle">
                                <input type="checkbox" v-model="globalOpts.showTags"
                                    @change="applyChart(); saveState()">
                                <span class="gf-toggle-sl"></span>
                            </label>
                        </div>
                    </div>
                </div>

                <!-- Por serie -->
                <div class="gf-panel-section">
                    <div class="gf-panel-title">POR SERIE</div>
                    <div v-for="s in seriesFiltradas" :key="s.name" class="gf-panel-serie">
                        <div class="gf-panel-serie-hdr">
                            <input type="color"
                                :value="serieOpts[s.name] && serieOpts[s.name].color
                                    ? serieOpts[s.name].color
                                    : s.itemStyle.color"
                                @input="setSerieOpt(s.name,'color',$event.target.value); applyChart(); saveState()"
                                class="gf-color-pick">
                            <span class="gf-panel-serie-name">{{ s.name }}</span>
                        </div>
                        <div class="gf-panel-row">
                            <label>Offset tiempo</label>
                            <div class="gf-panel-ctrl">
                                <input type="number" class="gf-panel-num" placeholder="0"
                                    :value="serieOpts[s.name] ? serieOpts[s.name].offsetMin || 0 : 0"
                                    @change="setSerieOpt(s.name,'offsetMin',+$event.target.value); applyChart(); saveState()">
                                <span>min</span>
                            </div>
                        </div>
                        <div class="gf-panel-row">
                            <label>Offset valor</label>
                            <div class="gf-panel-ctrl">
                                <input type="number" class="gf-panel-num" placeholder="0" step="0.1"
                                    :value="serieOpts[s.name] ? serieOpts[s.name].offsetVal || 0 : 0"
                                    @change="setSerieOpt(s.name,'offsetVal',+$event.target.value); applyChart(); saveState()">
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </transition>

    </div>
</template>

<script>
export default {
    name: 'UIInsight',

    // Dashboard 2.0 inyecta $socket (Socket.IO) en todos los widgets
    inject: ['$socket'],

    props: {
        // id único del widget — lo provee Dashboard 2.0
        id:    { type: String,  required: true },
        // props = config del nodo (del editor)
        props: { type: Object,  default: () => ({}) },
        // state = estado de visibilidad/habilitación
        state: { type: Object,  default: () => ({ enabled: true, visible: true }) }
    },

    data () {
        return {
            // ── ECharts ──────────────────────────────────────────────
            chart:   null,
            _ro:     null,

            // ── Series y selección ────────────────────────────────────
            allSeries:     [],
            seriesOcultas: [],
            metricas:      [],
            metricCfg:     {},
            metricasAct:   [],
            todasCols:     [],
            colsAct:       [],
            ejeConfig:     {},

            // ── Estado UI ─────────────────────────────────────────────
            rangoActivo: 0.25,
            tpAbsoluto:  false,
            tpFrom:      '',
            tpTo:        '',
            tpOpen:      false,
            mdOpen:      false,
            cdOpen:      false,
            panelOpen:   false,
            tpPos:       { top: '0px', left: '0px' },
            mdPos:       { top: '0px', left: '0px' },
            cdPos:       { top: '0px', left: '0px' },

            // ── Opciones globales del gráfico ─────────────────────────
            globalOpts: {
                lineWidth: 1,
                pointSize: 3,
                fillAlpha: 20,
                smooth:    0.4,
                showTags:  true,
                umbral:    ''
            },
            serieOpts: {},

            // ── Presets de tiempo ─────────────────────────────────────
            rangosPreset: [
                { l: 'Últimos 5 min',    v: 0.083 },
                { l: 'Últimos 15 min',   v: 0.25  },
                { l: 'Últimos 30 min',   v: 0.5   },
                { l: 'Última 1 hora',    v: 1     },
                { l: 'Últimas 3 horas',  v: 3     },
                { l: 'Últimas 6 horas',  v: 6     },
                { l: 'Últimas 12 horas', v: 12    },
                { l: 'Últimas 24 horas', v: 24    },
                { l: 'Últimos 2 días',   v: 48    },
                { l: 'Últimos 7 días',   v: 168   }
            ],

            // Flag interno para no pisar colección seleccionada desde URL
            _colDesdeUrl: null
        }
    },

    computed: {
        tpLabel () {
            if (this.tpAbsoluto && this.tpFrom && this.tpTo) {
                const fmt = v => new Date(v).toLocaleString('es-AR', {
                    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
                })
                return fmt(this.tpFrom) + ' → ' + fmt(this.tpTo)
            }
            const r = this.rangosPreset.find(r => r.v === this.rangoActivo)
            return r ? r.l : 'Últimos 15 min'
        },

        seriesFiltradas () {
            const mFilt = this.allSeries.filter(s => this.metricasAct.includes(s.metric))
            if (!this.todasCols.length) return mFilt
            return mFilt.filter(s =>
                this.todasCols.some(c => {
                    if (!this.colsAct.includes(c.v)) return false
                    return s.name.startsWith(c.l + ' ·') || s.name === c.l
                })
            )
        },

        statsVisibles () {
            return this.seriesFiltradas.map(s => {
                const vals = s.data.map(d => d[1]).filter(v => v != null)
                if (!vals.length) return null
                const mn  = Math.min(...vals)
                const mx  = Math.max(...vals)
                const avg = vals.reduce((a, b) => a + b, 0) / vals.length
                return {
                    name:  s.name,
                    color: s.itemStyle.color,
                    min:   mn.toFixed(3),
                    max:   mx.toFixed(3),
                    avg:   avg.toFixed(3)
                }
            }).filter(Boolean)
        },

        ejesActivos () {
            const ejes = {}
            Object.values(this.metricCfg).forEach(cfg => {
                if (!this.metricasAct.includes(cfg.unit)) return
                if (!(cfg.yAxis in ejes)) {
                    ejes[cfg.yAxis] = { k: cfg.unit, color: cfg.color, yAxis: cfg.yAxis }
                }
            })
            return Object.values(ejes).sort((a, b) => a.yAxis - b.yAxis)
        }
    },

    mounted () {
        // ── Suscribir a eventos de Socket.IO de Dashboard 2.0 ────────────
        // Datos enviados desde Node-RED al widget
        this.$socket.on('msg-input:' + this.id, (msg) => {
            this.handleMsg(msg)
        })

        // Cuando el widget carga, pedir estado guardado al backend
        this.$socket.on('widget-load:' + this.id, (msg) => {
            if (msg && msg.payload) this.handleMsg(msg)
        })

        // Notificar a Node-RED que este widget está cargado
        this.$socket.emit('widget-load', this.id)

        // ── Parámetro ?col= en URL (integración con cards) ────────────────
        try {
            const params = new URLSearchParams(window.location.search)
            const colUrl = params.get('col')
            if (colUrl) {
                this._colDesdeUrl = decodeURIComponent(colUrl)
                this.colsAct = [this._colDesdeUrl]
            }
        } catch (e) {}

        // ── Inicializar ECharts ───────────────────────────────────────────
        this._cerrarDropdowns = e => this.cerrarDropdowns(e)
        document.addEventListener('click', this._cerrarDropdowns)

        this.refreshTpInputs()
        this.initResizeObserver()

        // ── Solicitar estado guardado + query inicial ─────────────────────
        setTimeout(() => {
            this.enviarAccion({
                action: 'get_state',
                value:  this._colDesdeUrl ? { colOverride: this._colDesdeUrl } : null
            })
        }, 400)
    },

    unmounted () {
        this.$socket.off('msg-input:' + this.id)
        this.$socket.off('widget-load:' + this.id)
        if (this._cerrarDropdowns) {
            document.removeEventListener('click', this._cerrarDropdowns)
        }
        if (this._ro) { this._ro.disconnect(); this._ro = null }
        if (this.chart && !this.chart.isDisposed()) this.chart.dispose()
        this.chart = null
    },

    methods: {

        // ════════════════════════════════════════════════════════════════
        // COMUNICACIÓN CON NODE-RED (via Socket.IO de Dashboard 2.0)
        // ════════════════════════════════════════════════════════════════

        /**
         * Envía una acción UI al backend del nodo en Node-RED.
         * Dashboard 2.0 enruta este emit al nodo por su id.
         */
        enviarAccion (payload) {
            this.$socket.emit('widget-action', this.id, { payload })
        },

        /**
         * Maneja mensajes entrantes desde Node-RED.
         * Discrimina por tipo de payload.
         */
        handleMsg (msg) {
            if (!msg || !msg.payload) return
            const p = msg.payload

            // ── Restaurar estado guardado ──
            if (p.type === 'restore_state') {
                this.restaurarEstado(p.state || {})
                return
            }

            // ── Datos del gráfico: {series, colLabels} ──
            if (p.series && Array.isArray(p.series)) {
                this.procesarSeries(p)
                return
            }
        },

        // ════════════════════════════════════════════════════════════════
        // PROCESAMIENTO DE DATOS
        // ════════════════════════════════════════════════════════════════

        restaurarEstado (s) {
            if (s.rangoActivo !== undefined) this.rangoActivo = s.rangoActivo
            if (s.tpAbsoluto  !== undefined) this.tpAbsoluto  = s.tpAbsoluto
            if (s.tpFrom)      this.tpFrom = s.tpFrom
            if (s.tpTo)        this.tpTo   = s.tpTo
            if (s.globalOpts)  Object.assign(this.globalOpts, s.globalOpts)
            if (s.serieOpts)   Object.assign(this.serieOpts,  s.serieOpts)
            if (s.ejeConfig)   Object.assign(this.ejeConfig,  s.ejeConfig)
            // No pisar colección seleccionada desde URL
            if (s.colsAct && s.colsAct.length && !this._colDesdeUrl) {
                this.colsAct = s.colsAct
            }
            if (s.metricasAct && s.metricasAct.length) {
                this.metricasAct = s.metricasAct
            }
            if (s.colLabels && Object.keys(s.colLabels).length) {
                this.todasCols = Object.entries(s.colLabels).map(([l, v]) => ({ l, v }))
            }
            // Pedir datos frescos con el estado restaurado
            this.$nextTick(() => {
                this.enviarAccion({ action: 'refresh' })
            })
        },

        procesarSeries (p) {
            this.allSeries = p.series

            // Construir metricCfg y metricas dinámicamente desde las series
            const metricasVistas = []
            const metricasSet    = new Set()
            const metricCfg      = {}

            p.series.forEach(s => {
                if (s.metric && !metricasSet.has(s.metric)) {
                    metricasSet.add(s.metric)
                    metricasVistas.push({ l: s.metric, v: s.metric, color: s.itemStyle.color })
                    metricCfg[s.metric] = {
                        yAxis: s.yAxisIndex || 0,
                        color: s.itemStyle.color,
                        unit:  s.metric
                    }
                }
            })

            if (metricasVistas.length) {
                this.metricas  = metricasVistas
                this.metricCfg = metricCfg
                // Agregar solo claves nuevas al ejeConfig (no pisar las editadas por el usuario)
                Object.values(metricCfg).forEach(cfg => {
                    if (!(cfg.unit in this.ejeConfig)) {
                        this.ejeConfig[cfg.unit] = { min: '', max: '' }
                    }
                })
                if (!this.metricasAct.length) {
                    this.metricasAct = [metricasVistas[0].v]
                }
            }

            // Actualizar todasCols desde colLabels
            if (p.colLabels) {
                const todasNuevas = Object.entries(p.colLabels).map(([label, v]) => ({ l: label, v }))
                if (todasNuevas.length) {
                    const existV = new Set(this.todasCols.map(c => c.v))
                    const nuevas = todasNuevas.filter(c => !existV.has(c.v))
                    if (nuevas.length) {
                        this.todasCols = [...this.todasCols, ...nuevas]
                    }
                    if (!this.colsAct.length) {
                        this.colsAct = [todasNuevas[0].v]
                    }
                }
            }

            this.seriesOcultas = []
            this.$nextTick(() => this.applyChart())
        },

        // ════════════════════════════════════════════════════════════════
        // ECHARTS
        // ════════════════════════════════════════════════════════════════

        initResizeObserver () {
            const waitForEl = () => {
                const wrap = this.$refs.chartWrap
                if (!wrap) { setTimeout(waitForEl, 50); return }
                this._ro = new ResizeObserver(() => {
                    this.$nextTick(() => {
                        const el = this.$refs.chartEl
                        if (!el) return
                        const { offsetWidth: w, offsetHeight: h } = el
                        if (w === 0 || h === 0) return
                        if (!this.chart || this.chart.isDisposed()) {
                            this.initChart()
                        } else {
                            try { this.chart.resize() } catch (e) {}
                        }
                    })
                })
                this._ro.observe(wrap)
            }
            waitForEl()
        },

        cargarECharts (callback) {
            // ECharts se carga desde el recurso estático del nodo (offline)
            if (typeof echarts !== 'undefined') { callback(); return }
            const sc = document.createElement('script')
            sc.src = '/insight-energiam/echarts.min.js'
            sc.onload = callback
            sc.onerror = () => {
                // Fallback CDN si hay conexión (no debería ocurrir en uso normal)
                const sc2 = document.createElement('script')
                sc2.src = 'https://cdn.jsdelivr.net/npm/echarts@5.5.1/dist/echarts.min.js'
                sc2.onload = callback
                document.head.appendChild(sc2)
            }
            document.head.appendChild(sc)
        },

        initChart () {
            this.cargarECharts(() => {
                if (typeof echarts === 'undefined') return
                const el = this.$refs.chartEl
                if (!el) return
                if (this.chart && !this.chart.isDisposed()) this.chart.dispose()
                this.chart = echarts.init(el)
                if (this.allSeries.length) this.applyChart()
            })
        },

        buildOption (series) {
            // Construir ejes Y dinámicamente desde metricCfg
            const yDefs      = []
            const ejesPorIdx = {}
            Object.values(this.metricCfg).forEach(cfg => {
                if (!(cfg.yAxis in ejesPorIdx)) {
                    ejesPorIdx[cfg.yAxis] = {
                        k:   cfg.unit,
                        color: cfg.color,
                        pos: cfg.yAxis % 2 === 0 ? 'left' : 'right',
                        off: Math.floor(cfg.yAxis / 2) * 60
                    }
                }
            })
            Object.keys(ejesPorIdx).sort((a, b) => a - b).forEach(i => yDefs.push(ejesPorIdx[i]))

            const yIdxMap = {}
            yDefs.forEach((y, i) => {
                const cfg = Object.values(this.metricCfg).find(c => c.unit === y.k)
                if (cfg) yIdxMap[cfg.yAxis] = i
            })

            const hasLeft2  = series.some(s => s.yAxisIndex >= 2 && s.yAxisIndex % 2 === 0)
            const hasRight2 = series.some(s => s.yAxisIndex >= 3 && s.yAxisIndex % 2 !== 0)

            return {
                backgroundColor: '#111217',
                animation: false,
                tooltip: {
                    trigger: 'axis',
                    axisPointer: {
                        type: 'cross', animation: false,
                        lineStyle:  { color: 'rgba(255,255,255,0.3)', width: 1, type: 'dashed' },
                        crossStyle: { color: 'rgba(255,255,255,0.3)', width: 1, type: 'dashed' },
                        label: { show: false }
                    },
                    backgroundColor: '#1a1c23',
                    borderColor:     '#2c3235',
                    borderWidth:     1,
                    padding:         [8, 12],
                    textStyle:       { color: '#d0d0d0', fontSize: 12, fontFamily: 'system-ui,sans-serif' },
                    confine:         true,
                    formatter: params => {
                        if (!params.length) return ''
                        const t  = new Date(params[0].value[0])
                        const ts = t.toLocaleString('es-AR', {
                            day: '2-digit', month: 'short',
                            hour: '2-digit', minute: '2-digit', second: '2-digit'
                        })
                        let h = `<div style="color:#666;font-size:11px;margin-bottom:5px">${ts}</div>`
                        params.forEach(p => {
                            if (p.value[1] == null) return
                            const serie = this.allSeries.find(s => s.name === p.seriesName)
                            const u = serie ? serie.metric : ''
                            h += `<div style="display:flex;justify-content:space-between;gap:20px;line-height:1.8">`
                               + `<span style="display:flex;align-items:center;gap:6px">`
                               + `<i style="display:inline-block;width:8px;height:2px;border-radius:1px;background:${p.color}"></i>`
                               + `<span style="color:#999">${p.seriesName}</span></span>`
                               + `<b style="color:#eee">${p.value[1]}`
                               + `<span style="color:#555;font-weight:400;margin-left:2px">${u}</span></b></div>`
                        })
                        return h
                    }
                },
                legend: { show: false },
                toolbox: {
                    show: true, right: 8, top: 4,
                    feature: {
                        dataZoom: {
                            yAxisIndex: 'none',
                            title: { zoom: 'Seleccionar zona', back: 'Deshacer zoom' },
                            iconStyle:  { borderColor: '#58a6ff' },
                            emphasis:   { iconStyle: { borderColor: '#79c0ff' } }
                        },
                        restore: {
                            title:      'Resetear zoom',
                            iconStyle:  { borderColor: '#9fa7b3' },
                            emphasis:   { iconStyle: { borderColor: '#d0d0d0' } }
                        }
                    }
                },
                grid: {
                    top:    8,
                    bottom: 52,
                    left:   hasLeft2  ? 85 : 52,
                    right:  hasRight2 ? 115 : (this.globalOpts.showTags ? 160 : 52)
                },
                dataZoom: [
                    { type: 'inside', xAxisIndex: 0, filterMode: 'weakFilter' },
                    {
                        type: 'slider', xAxisIndex: 0, height: 18, bottom: 2,
                        borderColor:    '#2c3235',
                        backgroundColor:'#181b1f',
                        fillerColor:    'rgba(88,166,255,0.1)',
                        handleStyle:    { color: '#58a6ff' },
                        textStyle:      { color: '#9fa7b3', fontSize: 10 },
                        moveHandleSize: 5
                    }
                ],
                xAxis: {
                    type: 'time', boundaryGap: false,
                    axisLine:  { show: true, lineStyle: { color: '#e8e9ea', width: 2 } },
                    axisTick:  { show: true, lineStyle: { color: '#e8e9ea' } },
                    axisLabel: {
                        color: '#e8e9ea', fontSize: 12, fontFamily: 'system-ui,sans-serif',
                        formatter: v => new Date(v).toLocaleTimeString('es-AR', {
                            hour: '2-digit', minute: '2-digit'
                        })
                    },
                    splitLine: { show: true, lineStyle: { color: '#2c3140', type: 'solid', width: 1 } }
                },
                yAxis: yDefs.map((y, i) => ({
                    name: y.k, type: 'value', position: y.pos, offset: y.off,
                    scale: !(this.ejeConfig[y.k] &&
                             this.ejeConfig[y.k].min !== '' &&
                             this.ejeConfig[y.k].min != null) &&
                           !(this.ejeConfig[y.k] &&
                             this.ejeConfig[y.k].max !== '' &&
                             this.ejeConfig[y.k].max != null),
                    min: (this.ejeConfig[y.k] &&
                          this.ejeConfig[y.k].min !== '' &&
                          this.ejeConfig[y.k].min != null)
                        ? Number(this.ejeConfig[y.k].min) : undefined,
                    max: (this.ejeConfig[y.k] &&
                          this.ejeConfig[y.k].max !== '' &&
                          this.ejeConfig[y.k].max != null)
                        ? Number(this.ejeConfig[y.k].max) : undefined,
                    nameTextStyle: { color: y.color, fontSize: 10, padding: [0, 4, 0, 4] },
                    axisLine:      { show: true, lineStyle: { color: '#e8e9ea', width: 2 } },
                    axisTick:      { show: true, lineStyle: { color: '#e8e9ea' } },
                    axisLabel:     { color: '#e8e9ea', fontSize: 12, fontFamily: 'system-ui,sans-serif' },
                    splitLine:     i === 0
                        ? { show: true, lineStyle: { color: '#2c3140', type: 'solid', width: 1 } }
                        : { show: false }
                })),
                series: series.map(s => ({
                    ...s,
                    yAxisIndex: yIdxMap[s.yAxisIndex] !== undefined ? yIdxMap[s.yAxisIndex] : 0,
                    ...(this.globalOpts.umbral && s.yAxisIndex === 0 ? {
                        markLine: {
                            silent: true, symbol: 'none',
                            data:   [{ yAxis: this.globalOpts.umbral }],
                            lineStyle: { color: '#f85149', width: 1, type: 'dashed' },
                            label: {
                                show: true, position: 'insideEndTop',
                                formatter: `Umbral ${this.globalOpts.umbral}`,
                                color: '#f85149', fontSize: 10
                            }
                        }
                    } : {})
                }))
            }
        },

        applyChart () {
            if (!this.chart || this.chart.isDisposed()) {
                if (this.$refs.chartEl) this.initChart()
                return
            }
            const alphaHex = Math.round((this.globalOpts.fillAlpha / 100) * 255)
                .toString(16).padStart(2, '0')
            const lw = this.globalOpts.lineWidth
            const ps = this.globalOpts.pointSize

            const visibles = this.seriesFiltradas.map(s => {
                const oculta    = this.seriesOcultas.includes(s.name)
                const sOpts     = this.serieOpts[s.name] || {}
                const offsetMs  = (sOpts.offsetMin || 0) * 60000
                const offsetVal = sOpts.offsetVal || 0
                const data = s.data.map(([t, v]) => [
                    offsetMs ? t + offsetMs : t,
                    v != null ? v + offsetVal : null
                ])
                const c = sOpts.color || s.itemStyle.color
                return {
                    ...s,
                    clip: true,
                    data,
                    areaStyle: oculta ? null : {
                        color: {
                            type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
                            colorStops: [
                                { offset: 0, color: c + alphaHex },
                                { offset: 1, color: c + '00' }
                            ]
                        }
                    },
                    smooth:     this.globalOpts.smooth,
                    lineStyle:  { ...s.lineStyle,  width: lw, opacity: oculta ? 0 : 1, color: c },
                    itemStyle:  { ...s.itemStyle,  opacity: oculta ? 0 : 1, color: c },
                    symbol:     ps > 0 ? 'circle' : 'none',
                    symbolSize: oculta ? 0 : ps,
                    showSymbol: ps > 0,
                    endLabel:   this.globalOpts.showTags && !oculta ? {
                        show:        true,
                        formatter:   p => p.seriesName.split(' · ')[0],
                        color:       c,
                        fontSize:    11,
                        fontFamily:  'system-ui,sans-serif',
                        padding:     [2, 4],
                        borderRadius: 2
                    } : { show: false },
                    labelLayout: { moveOverlap: 'shiftY' }
                }
            })

            const seriesLimpias = visibles.filter(s => s && s.type)
            this.chart.setOption(this.buildOption(seriesLimpias), { notMerge: true })
        },

        // ════════════════════════════════════════════════════════════════
        // ACCIONES DE TOOLBAR
        // ════════════════════════════════════════════════════════════════

        refresh () {
            this.seriesOcultas = []
            this.enviarAccion({ action: 'refresh' })
        },

        setRango (v) {
            this.rangoActivo   = v
            this.tpAbsoluto    = false
            this.tpOpen        = false
            this.seriesOcultas = []
            this.enviarAccion({ action: 'set_horas', value: v })
            this.saveState()
        },

        applyAbsoluto () {
            if (!this.tpFrom || !this.tpTo) return
            this.tpAbsoluto    = true
            this.tpOpen        = false
            this.seriesOcultas = []
            this.enviarAccion({ action: 'set_absoluto', value: { desde: this.tpFrom, hasta: this.tpTo } })
        },

        toggleCol (col) {
            const i = this.colsAct.indexOf(col)
            if (i >= 0) {
                if (this.colsAct.length > 1) this.colsAct.splice(i, 1)
            } else {
                this.colsAct.push(col)
            }
            this.seriesOcultas = []
            this.enviarAccion({ action: 'set_colecciones', value: [...this.colsAct] })
            this.saveState()
        },

        selTodos () {
            this.colsAct = [...this.todasCols.map(c => c.v)]
            this.cdOpen  = false
            this.enviarAccion({ action: 'set_colecciones', value: [...this.colsAct] })
        },

        selNinguno () {
            if (this.todasCols.length) this.colsAct = [this.todasCols[0].v]
            this.cdOpen = false
            this.enviarAccion({ action: 'set_colecciones', value: [...this.colsAct] })
        },

        toggleMetrica (m) {
            const i = this.metricasAct.indexOf(m)
            if (i >= 0) {
                if (this.metricasAct.length > 1) this.metricasAct.splice(i, 1)
            } else {
                this.metricasAct.push(m)
            }
            this.seriesOcultas = []
            this.applyChart()
            this.saveState()
        },

        toggleSerie (name) {
            const i = this.seriesOcultas.indexOf(name)
            if (i >= 0) this.seriesOcultas.splice(i, 1)
            else this.seriesOcultas.push(name)
            this.applyChart()
        },

        setEje (eje, lado, valor) {
            if (!this.ejeConfig[eje]) this.ejeConfig[eje] = { min: '', max: '' }
            const v = valor === '' ? '' : parseFloat(valor)
            this.ejeConfig[eje][lado] = isNaN(v) ? '' : v
            this.applyChart()
            this.saveState()
        },

        setSerieOpt (name, key, val) {
            if (!this.serieOpts[name]) this.serieOpts[name] = {}
            this.serieOpts[name][key] = val
        },

        saveState () {
            this.enviarAccion({
                action: 'save_state',
                value: {
                    metricasAct: [...this.metricasAct],
                    ejeConfig:   JSON.parse(JSON.stringify(this.ejeConfig)),
                    globalOpts:  JSON.parse(JSON.stringify(this.globalOpts)),
                    serieOpts:   JSON.parse(JSON.stringify(this.serieOpts)),
                    colsAct:     [...this.colsAct],
                    rangoActivo: this.rangoActivo,
                    tpAbsoluto:  this.tpAbsoluto,
                    tpFrom:      this.tpFrom,
                    tpTo:        this.tpTo
                }
            })
        },

        // ════════════════════════════════════════════════════════════════
        // DROPDOWNS
        // ════════════════════════════════════════════════════════════════

        toggleTp (e) {
            e.stopPropagation()
            const r = e.currentTarget.getBoundingClientRect()
            this.tpPos = { top: (r.bottom + 4) + 'px', left: r.left + 'px' }
            this.tpOpen = !this.tpOpen
            if (this.tpOpen && !this.tpAbsoluto) this.refreshTpInputs()
            this.mdOpen = false; this.cdOpen = false
        },

        toggleMd (e) {
            e.stopPropagation()
            const r = e.currentTarget.getBoundingClientRect()
            this.mdPos = { top: (r.bottom + 4) + 'px', left: Math.max(0, r.right - 160) + 'px' }
            this.mdOpen = !this.mdOpen
            this.tpOpen = false; this.cdOpen = false
        },

        toggleCd (e) {
            e.stopPropagation()
            const r = e.currentTarget.getBoundingClientRect()
            this.cdPos = { top: (r.bottom + 4) + 'px', left: r.left + 'px' }
            this.cdOpen = !this.cdOpen
            this.tpOpen = false; this.mdOpen = false
        },

        cerrarDropdowns (e) {
            const inTp = this.$refs.tpRef && this.$refs.tpRef.contains(e.target)
            const inMd = this.$refs.mdRef && this.$refs.mdRef.contains(e.target)
            const inCd = this.$refs.cdRef && this.$refs.cdRef.contains(e.target)
            if (!inTp) this.tpOpen = false
            if (!inMd) this.mdOpen = false
            if (!inCd) this.cdOpen = false
        },

        refreshTpInputs () {
            const ahora = new Date()
            const desde = new Date(ahora - (this.rangoActivo || 0.25) * 3600000)
            const pad   = n => String(n).padStart(2, '0')
            const fmt   = d => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
            this.tpFrom = fmt(desde)
            this.tpTo   = fmt(ahora)
        },

        // ════════════════════════════════════════════════════════════════
        // EXPORTACIONES
        // ════════════════════════════════════════════════════════════════

        descargarPNG () {
            if (!this.chart) return
            const url = this.chart.getDataURL({ type: 'png', pixelRatio: 2, backgroundColor: '#111217' })
            const a   = document.createElement('a')
            a.href     = url
            a.download = 'insight_' + new Date().toISOString().slice(0, 19).replace(/[T:]/g, '-') + '.png'
            a.click()
        },

        descargarCSV () {
            const visibles = this.seriesFiltradas.filter(s => !this.seriesOcultas.includes(s.name))
            if (!visibles.length) return
            const tsSet = new Set()
            visibles.forEach(s => s.data.forEach(([t]) => tsSet.add(t)))
            const timestamps = [...tsSet].sort((a, b) => a - b)
            const header = ['timestamp', ...visibles.map(s => s.name)].join(',')
            const rows   = timestamps.map(t => {
                const dt   = new Date(t).toISOString()
                const vals = visibles.map(s => {
                    const pt = s.data.find(([ts]) => ts === t)
                    return pt ? (pt[1] != null ? pt[1] : '') : ''
                })
                return [dt, ...vals].join(',')
            })
            const csv  = [header, ...rows].join('\n')
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
            const url  = URL.createObjectURL(blob)
            const a    = document.createElement('a')
            a.href     = url
            const d    = new Date(timestamps[0]).toISOString().slice(0, 16).replace('T', '_').replace(':', '-')
            const h    = new Date(timestamps[timestamps.length-1]).toISOString().slice(0, 16).replace('T', '_').replace(':', '-')
            a.download = `insight_${d}_${h}.csv`
            a.click()
            URL.revokeObjectURL(url)
        }
    }
}
</script>

<style scoped>
* { box-sizing: border-box; margin: 0; padding: 0 }
.gf { display: flex; flex-direction: column; height: 100%; min-height: 0; background: #111217; font-family: system-ui, -apple-system, sans-serif; font-size: 12px; color: #d8d9da; overflow: hidden; position: relative }
.gf-bar { display: flex; align-items: center; justify-content: space-between; padding: 5px 10px; background: #181b1f; border-bottom: 1px solid #2c3235; gap: 8px; flex-shrink: 0; flex-wrap: wrap }
.gf-bar-left, .gf-bar-right { display: flex; align-items: center; gap: 6px; flex-wrap: wrap }
.gf-div { width: 1px; height: 16px; background: #2c3235; flex-shrink: 0 }
.gf-eje { display: flex; align-items: center; gap: 4px }
.gf-eje-lbl { font-size: 11px; font-weight: 600; white-space: nowrap }
.gf-eje-sep { color: #6c7077 }
.gf-ei { background: #1a1c23; border: 1px solid #3a3f4a; color: #d8d9da; font-size: 11px; font-family: inherit; padding: 2px 5px; width: 60px; text-align: right; border-radius: 2px }
.gf-ei:focus { outline: none; border-color: #5794F2 }
.gf-ei::placeholder { color: #555; font-style: italic }
.gf-icon { background: #1a1c23; border: 1px solid #3a3f4a; color: #d8d9da; padding: 4px 6px; cursor: pointer; border-radius: 2px; display: flex; align-items: center; transition: all .1s }
.gf-icon:hover { background: #2c3235 }
.gf-icon.on { background: #1d2433; border-color: #3d71e8; color: #5794F2 }
.gf-tp { position: relative }
.gf-mdrop { position: relative }
.gf-cdrop { position: relative }
.gf-tp-btn { display: flex; align-items: center; gap: 6px; background: #1a1c23; border: 1px solid #3a3f4a; color: #d8d9da; font-size: 12px; font-family: inherit; padding: 4px 10px; border-radius: 2px; cursor: pointer; transition: all .1s; white-space: nowrap }
.gf-tp-btn:hover { background: #2c3235; border-color: #5794F2 }
.gf-tp-label { color: #d8d9da }
.gf-tp-drop { position: fixed; z-index: 9999; background: #1a1c23; border: 1px solid #3a3f4a; border-radius: 2px; box-shadow: 0 4px 20px rgba(0,0,0,.7) }
.gf-tp-drop-inner { display: flex }
.gf-md-drop { position: fixed; min-width: 160px; padding: 4px 0; z-index: 9999; background: #1a1c23; border: 1px solid #3a3f4a; border-radius: 2px; box-shadow: 0 4px 20px rgba(0,0,0,.7) }
.gf-cd-drop { position: fixed; min-width: 220px; max-height: 360px; overflow-y: auto; padding: 4px 0; z-index: 9999; background: #1a1c23; border: 1px solid #3a3f4a; border-radius: 2px; box-shadow: 0 4px 20px rgba(0,0,0,.7) }
.gf-tp-abs { padding: 12px; border-right: 1px solid #2c3235; flex: 1; min-width: 220px }
.gf-tp-presets { padding: 8px 12px; min-width: 150px }
.gf-tp-sec { color: #d8d9da; font-size: 11px; font-weight: 600; margin-bottom: 8px; text-transform: uppercase; letter-spacing: .4px }
.gf-tp-lbl { display: block; color: #9fa7b3; font-size: 11px; margin: 8px 0 3px }
.gf-tp-input { width: 100%; background: #111217; border: 1px solid #3a3f4a; color: #d8d9da; font-size: 12px; font-family: inherit; padding: 5px 8px; border-radius: 2px }
.gf-tp-input:focus { outline: none; border-color: #5794F2 }
.gf-tp-apply { width: 100%; background: #1f60c4; border: none; color: #fff; font-size: 12px; font-family: inherit; padding: 6px; border-radius: 2px; cursor: pointer; margin-top: 10px; transition: background .1s }
.gf-tp-apply:hover { background: #3d71e8 }
.gf-tp-preset { padding: 4px 8px; color: #d8d9da; font-size: 12px; cursor: pointer; border-radius: 2px; transition: all .1s; white-space: nowrap; display: block; width: 100%; background: none; border: none; text-align: left; font-family: inherit }
.gf-tp-preset:hover { background: #2c3235 }
.gf-tp-preset.on { background: #1d2433; color: #5794F2; font-weight: 600 }
.gf-md-item { display: flex; align-items: center; gap: 8px; padding: 6px 12px; cursor: pointer; transition: background .1s; font-size: 12px }
.gf-md-item:hover { background: #2c3235 }
.gf-md-check { font-size: 13px; width: 14px; text-align: center; flex-shrink: 0 }
.gf-cd-actions { display: flex; gap: 12px; padding: 6px 12px 8px; border-bottom: 1px solid #2c3235; margin-bottom: 4px }
.gf-cd-actions span { color: #5794F2; font-size: 11px; cursor: pointer }
.gf-cd-actions span:hover { text-decoration: underline }
.gf-main { flex: 1; min-height: 0; position: relative }
.gf-canvas { position: absolute; top: 0; left: 0; right: 0; bottom: 0 }
.gf-legend { display: flex; flex-wrap: wrap; padding: 3px 8px; border-top: 1px solid #2c3235; background: #181b1f; flex-shrink: 0; max-height: 56px; overflow-y: auto }
.gf-li { display: flex; align-items: center; gap: 5px; padding: 2px 8px; cursor: pointer; border-radius: 2px; transition: background .1s; white-space: nowrap }
.gf-li:hover { background: #1e2128 }
.gf-li.dim { opacity: .3 }
.gf-li-line { width: 14px; height: 2px; border-radius: 1px; flex-shrink: 0 }
.gf-li-name { color: #d8d9da; font-size: 11px }
.gf-li-val { color: #fff; font-size: 11px; font-weight: 600; margin-left: 4px; min-width: 30px; text-align: right }
.gf-stats { padding: 4px 10px; background: #181b1f; border-top: 1px solid #2c3235; overflow-x: auto; flex-shrink: 0; max-height: 120px; overflow-y: auto }
.gf-stat-row { display: flex; align-items: center; gap: 8px; padding: 2px 0; font-size: 11px; white-space: nowrap }
.gf-stat-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0 }
.gf-stat-name { color: #9fa7b3; flex: 1; min-width: 120px; overflow: hidden; text-overflow: ellipsis }
.gf-stat-val { color: #d0d0d0; min-width: 80px }
.gf-stat-lbl { color: #555; font-size: 10px; margin-right: 3px; text-transform: uppercase }
.gf-toggle { position: relative; display: inline-block; width: 32px; height: 18px }
.gf-toggle input { opacity: 0; width: 0; height: 0 }
.gf-toggle-sl { position: absolute; cursor: pointer; inset: 0; background: #3a3f4a; border-radius: 18px; transition: .2s }
.gf-toggle-sl:before { content: ''; position: absolute; width: 12px; height: 12px; left: 3px; bottom: 3px; background: #fff; border-radius: 50%; transition: .2s }
.gf-toggle input:checked + .gf-toggle-sl { background: #5794F2 }
.gf-toggle input:checked + .gf-toggle-sl:before { transform: translateX(14px) }
.gf-panel { position: absolute; top: 0; right: 0; width: 260px; height: 100%; background: #181b1f; border-left: 1px solid #2c3235; z-index: 100; overflow-y: auto; display: flex; flex-direction: column }
.gf-panel-slide-enter-active, .gf-panel-slide-leave-active { transition: transform .2s ease }
.gf-panel-slide-enter-from, .gf-panel-slide-leave-to { transform: translateX(100%) }
.gf-panel-hdr { display: flex; align-items: center; justify-content: space-between; padding: 10px 12px; border-bottom: 1px solid #2c3235; font-size: 12px; font-weight: 600; color: #d8d9da; flex-shrink: 0 }
.gf-panel-close { background: none; border: none; color: #9fa7b3; cursor: pointer; font-size: 16px; line-height: 1; padding: 0 }
.gf-panel-close:hover { color: #d8d9da }
.gf-panel-section { padding: 10px 12px; border-bottom: 1px solid #2c3235 }
.gf-panel-title { color: #6c7077; font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: .5px; margin-bottom: 8px }
.gf-panel-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; gap: 8px }
.gf-panel-row label { color: #9fa7b3; font-size: 11px; flex-shrink: 0 }
.gf-panel-ctrl { display: flex; align-items: center; gap: 6px }
.gf-panel-ctrl input[type=range] { width: 80px; accent-color: #5794F2 }
.gf-panel-ctrl span { color: #d8d9da; font-size: 11px; min-width: 28px; text-align: right }
.gf-panel-num { background: #111217; border: 1px solid #3a3f4a; color: #d8d9da; font-size: 11px; font-family: inherit; padding: 2px 6px; width: 56px; border-radius: 2px; text-align: right }
.gf-panel-num:focus { outline: none; border-color: #5794F2 }
.gf-panel-serie { padding: 8px 0; border-bottom: 1px solid #1e2128 }
.gf-panel-serie-hdr { display: flex; align-items: center; gap: 6px; margin-bottom: 6px }
.gf-panel-serie-name { color: #d8d9da; font-size: 11px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis }
.gf-color-pick { width: 22px; height: 22px; border: none; border-radius: 4px; cursor: pointer; padding: 0; background: none; flex-shrink: 0 }
</style>
