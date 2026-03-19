/**
 * node-red-contrib-insight-energiam
 * Nodo: ui-insight
 *
 * Widget nativo de FlowFuse Dashboard 2.0 con ECharts 5.5.1 offline.
 *
 * ════════════════════════════════════════════════════════════════════
 * CONTRATO DE SALIDA — query request
 * ════════════════════════════════════════════════════════════════════
 * Cuando el usuario cambia rango de tiempo, colecciones o hace refresh,
 * el nodo emite por su salida:
 *
 *   msg.topic   = "insight/query"
 *   msg.payload = {
 *     desde:       "2024-01-01T00:00:00.000Z",   // ISO 8601 UTC
 *     hasta:       "2024-01-01T00:15:00.000Z",   // ISO 8601 UTC
 *     colecciones: ["id-coleccion-a", "..."],     // array de IDs
 *     horas:       0.25   // null si es rango absoluto
 *   }
 *
 * ════════════════════════════════════════════════════════════════════
 * CONTRATO DE ENTRADA — datos del gráfico
 * ════════════════════════════════════════════════════════════════════
 * Enviar a la entrada del nodo con:
 *
 *   msg.topic   = "insight/data"
 *   msg.payload = {
 *     series: [
 *       {
 *         name:       "Circuito A · kW",   // nombre en leyenda
 *         metric:     "kW",                // unidad — define el eje Y
 *         type:       "line",
 *         yAxisIndex: 0,                   // 0=izq 1=der 2=izq2 3=der2
 *         data: [
 *           [1700000000000, 1.234],        // [timestamp_ms, valor]
 *           [1700000060000, 1.456],
 *           ...
 *         ],
 *         smooth:       true,
 *         connectNulls: false,
 *         lineStyle: { width: 1, color: "#58a6ff" },
 *         itemStyle: { color: "#58a6ff" }
 *       },
 *       ...
 *     ],
 *     colLabels: {
 *       "Nombre visible": "id-coleccion",  // para el selector de series
 *       ...
 *     }
 *   }
 *
 * ════════════════════════════════════════════════════════════════════
 * COLORES SUGERIDOS PARA SERIES
 * ════════════════════════════════════════════════════════════════════
 * #58a6ff · #3fb950 · #f78166 · #d2a8ff · #ffa657
 * #79c0ff · #56d364 · #ff7b72 · #bc8cff · #ffb366
 * #388bfd · #2ea043 · #da3633 · #8957e5
 */

const path = require('path')
const fs   = require('fs')

module.exports = function (RED) {

    function UIInsightNode (config) {
        RED.nodes.createNode(this, config)
        const node = this

        // ── Grupo de Dashboard 2.0 ────────────────────────────────────────
        const group = RED.nodes.getNode(config.group)
        if (!group) {
            node.error('ui-insight: No hay grupo de Dashboard configurado')
            return
        }
        const base = group.getBase()

        // ── Estado interno por instancia (node context) ───────────────────
        const ctx = node.context()
        if (!ctx.get('horas')) {
            ctx.set('horas', parseFloat(config.defaultHoras) || 0.25)
        }
        if (!ctx.get('colecciones')) {
            ctx.set('colecciones', [])
        }

        // ── Servir ECharts offline ────────────────────────────────────────
        const echartsPath = path.join(__dirname, '..', 'resources', 'echarts.min.js')
        RED.httpNode.get('/insight-energiam/echarts.min.js', function (req, res) {
            res.setHeader('Content-Type', 'application/javascript')
            res.setHeader('Cache-Control', 'public, max-age=86400')
            fs.createReadStream(echartsPath).pipe(res)
        })

        // ── Helper: construir y emitir query request ──────────────────────
        function emitQuery (send) {
            const horas    = ctx.get('horas')
            const absoluto = ctx.get('absoluto')
            const cols     = ctx.get('colecciones') || []

            let desde, hasta
            if (!horas && absoluto && absoluto.desde && absoluto.hasta) {
                desde = new Date(absoluto.desde).toISOString()
                hasta = new Date(absoluto.hasta).toISOString()
            } else {
                const h = horas || 0.25
                hasta   = new Date().toISOString()
                desde   = new Date(Date.now() - h * 3600000).toISOString()
            }

            send({
                topic:   'insight/query',
                payload: { desde, hasta, colecciones: cols, horas: horas || null }
            })
        }

        // ── Helper: armar y enviar restore_state al widget ────────────────
        function sendRestoreState (socketId) {
            const uiState  = ctx.get('ui_state')  || {}
            const cache    = ctx.get('cache')
            const colLabels = (cache && cache.colLabels) ? cache.colLabels : {}

            const state = Object.assign({
                rangoActivo: ctx.get('horas') || 0.25,
                colsAct:     ctx.get('colecciones') || [],
                tpAbsoluto:  ctx.get('absoluto') ? true : false,
                tpFrom:      ctx.get('absoluto')
                    ? isoToLocalInput(ctx.get('absoluto').desde) : '',
                tpTo:        ctx.get('absoluto')
                    ? isoToLocalInput(ctx.get('absoluto').hasta)  : '',
                colLabels
            }, uiState)

            const restoreMsg = { payload: { type: 'restore_state', state } }
            base.stores.data.save(base, node, restoreMsg)

            if (socketId) {
                base.emit('msg-input:' + node.id, restoreMsg, socketId)
            } else {
                base.emit('msg-input:' + node.id, restoreMsg)
            }
        }

        // ── Eventos de Dashboard 2.0 ──────────────────────────────────────
        const evts = {
            // onAction: mensajes que vienen del widget (frontend → Node-RED)
            onAction: true,

            // beforeSend: procesar msg antes de enviarlo al widget
            beforeSend: function (msg) {
                return msg
            }
        }

        // ── Registrar el nodo en el grupo de Dashboard 2.0 ───────────────
        group.register(node, config, evts)

        // ── Procesar mensajes entrantes (Node-RED → nodo) ─────────────────
        node.on('input', function (msg, send, done) {

            // ── Datos del gráfico: topic "insight/data" ──
            if (msg.topic === 'insight/data' && msg.payload && msg.payload.series) {
                // Cachear para restore_state futuro
                ctx.set('cache', msg.payload)

                // Actualizar colLabels si vienen
                if (msg.payload.colLabels) {
                    const uiState = ctx.get('ui_state') || {}
                    uiState.colLabels = msg.payload.colLabels
                    ctx.set('ui_state', uiState)
                }

                // Enviar datos al widget via Socket.IO de Dashboard 2.0
                base.stores.data.save(base, node, msg)
                base.emit('msg-input:' + node.id, msg)

                node.status({ fill: 'green', shape: 'dot', text: new Date().toLocaleTimeString('es-AR') })
                done()
                return
            }

            // ── Eventos UI desde el widget (frontend → Node-RED via widget-action) ──
            if (msg.payload && typeof msg.payload === 'object' && msg.payload.action) {
                const { action, value } = msg.payload
                handleAction(action, value, msg, send, done)
                return
            }

            // ── Datos sin topic explícito — intentar como datos del gráfico ──
            if (msg.payload && msg.payload.series && Array.isArray(msg.payload.series)) {
                msg.topic = 'insight/data'
                ctx.set('cache', msg.payload)
                base.stores.data.save(base, node, msg)
                base.emit('msg-input:' + node.id, msg)
                node.status({ fill: 'green', shape: 'dot', text: new Date().toLocaleTimeString('es-AR') })
                done()
                return
            }

            done()
        })

        // ── Manejador de acciones UI ──────────────────────────────────────
        function handleAction (action, value, msg, send, done) {
            switch (action) {

                case 'set_horas':
                    ctx.set('horas', Number(value))
                    ctx.set('absoluto', null)
                    emitQuery(send)
                    break

                case 'set_colecciones':
                    ctx.set('colecciones', Array.isArray(value) ? value : [])
                    emitQuery(send)
                    break

                case 'set_absoluto': {
                    const desde = value && value.desde ? value.desde : msg.payload.desde
                    const hasta = value && value.hasta ? value.hasta : msg.payload.hasta
                    ctx.set('absoluto', { desde, hasta })
                    ctx.set('horas', null)
                    emitQuery(send)
                    break
                }

                case 'refresh':
                    emitQuery(send)
                    break

                case 'save_state': {
                    const current = ctx.get('ui_state') || {}
                    ctx.set('ui_state', Object.assign({}, current, value))
                    break
                }

                case 'get_state': {
                    // Sincronizar colecciones con el estado guardado si corresponde
                    const uiState = ctx.get('ui_state') || {}
                    if (value && value.colOverride) {
                        ctx.set('colecciones', [value.colOverride])
                    } else if (uiState.colsAct && uiState.colsAct.length &&
                               (!ctx.get('colecciones') || !ctx.get('colecciones').length)) {
                        ctx.set('colecciones', uiState.colsAct)
                    }

                    // Enviar estado guardado al widget
                    sendRestoreState(msg._socketId || null)

                    // Enviar cache si existe
                    const cached = ctx.get('cache')
                    if (cached) {
                        setTimeout(() => {
                            const cacheMsg = { topic: 'insight/data', payload: cached }
                            base.emit('msg-input:' + node.id, cacheMsg)
                        }, 100)
                    }

                    // Emitir query fresca
                    emitQuery(send)
                    break
                }

                default:
                    break
            }
            done()
        }

        // ── Auto-arranque: status inicial ────────────────────────────────
        node.status({ fill: 'blue', shape: 'dot', text: 'iniciando...' })
        setTimeout(() => {
            const cols = ctx.get('colecciones') || []
            if (cols.length === 0) {
                node.status({ fill: 'grey', shape: 'ring', text: 'esperando datos' })
            } else {
                node.status({ fill: 'green', shape: 'dot', text: 'listo' })
            }
        }, 2000)

        // ── Limpieza ──────────────────────────────────────────────────────
        node.on('close', function (done) {
            done()
        })
    }

    RED.nodes.registerType('ui-insight', UIInsightNode)
}

// ── Utilitario: ISO string → formato datetime-local ──────────────────────────
function isoToLocalInput (iso) {
    if (!iso) return ''
    try { return new Date(iso).toISOString().slice(0, 16) } catch (e) { return '' }
}
