<script setup>
import { ref, computed } from 'vue'
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Droplet, Plus, Trash2, X, Download, Upload } from 'lucide-vue-next'
import { store } from '../store.js'

// --- FECHAS Y CONTROL DE MES ---
const hoyObj = new Date()
const diaHoy = hoyObj.getDate()
const mesHoy = hoyObj.getMonth()
const añoHoy = hoyObj.getFullYear()

const mesActual = ref(mesHoy)
const añoActual = ref(añoHoy)
const nombresMeses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']

const nombreMesActual = computed(() => nombresMeses[mesActual.value])
const diasEnMes = computed(() => new Date(añoActual.value, mesActual.value + 1, 0).getDate())
const espacioInicioMes = computed(() => new Date(añoActual.value, mesActual.value, 1).getDay())

const cambiarMes = (delta) => {
    let nuevoMes = mesActual.value + delta
    if (nuevoMes > 11) { nuevoMes = 0; añoActual.value++ }
    if (nuevoMes < 0) { nuevoMes = 11; añoActual.value-- }
    
    // Tope para no navegar hacia el futuro
    if(añoActual.value > añoHoy || (añoActual.value === añoHoy && nuevoMes > mesHoy)) {
        añoActual.value = añoHoy
        mesActual.value = mesHoy
        return
    }
    mesActual.value = nuevoMes
}

const construirFechaString = (dia) => {
    return `${añoActual.value}-${String(mesActual.value + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`
}

// --- HELPERS ---
const getPrenda = (id) => store.prendas.find(p => p.id === id)
const getCategoria = (id) => store.categorias.find(c => c.id === id)
const getMacroColor = (macro_id) => store.macroCategorias.find(m => m.id === macro_id)?.color || '#cbd5e1'

const nombreMostrado = (prendaId) => {
    const p = getPrenda(prendaId)
    if (!p) return 'Prenda eliminada'
    const cat = getCategoria(p.categoria_id)
    if (!cat) return p.nombre
    return cat.concatenar ? `${cat.nombre} ${p.nombre}` : p.nombre
}

// --- MAPEO REACTIVO DEL CALENDARIO ---
const eventosPorDiaMemo = computed(() => {
    // Se recalcula automáticamente cada vez que store.bitacora cambia (arreglando el bug de registros borrados)
    const mapa = {}
    const prefijoMes = `${añoActual.value}-${String(mesActual.value + 1).padStart(2, '0')}`
    
    store.bitacora.forEach(b => {
        if(b.fecha.startsWith(prefijoMes)) {
            if(!mapa[b.fecha]) mapa[b.fecha] = []
            mapa[b.fecha].push(b)
        }
    })
    return mapa
})

const coloresEventosDia = (dia) => {
    const fecha = construirFechaString(dia)
    const eventos = eventosPorDiaMemo.value[fecha] || []
    const colores = new Set()
    eventos.forEach(e => {
        if(e.tipo_evento === 'uso') {
            const p = getPrenda(e.prenda_id)
            if(p) {
                const cat = getCategoria(p.categoria_id)
                if(cat) colores.add(getMacroColor(cat.macro_id))
            }
        }
    })
    return Array.from(colores)
}

// --- MODAL DETALLE / EDICIÓN RETROACTIVA ---
const modalDiaAbierto = ref(false)
const diaSeleccionadoStr = ref('')
const modalAgregarRetroAbierto = ref(false)
const prendaSeleccionadaId = ref('')

const eventosDiaSeleccionado = computed(() => {
    if(!diaSeleccionadoStr.value) return []
    return store.bitacora.filter(b => b.fecha === diaSeleccionadoStr.value)
})

const diaSeleccionadoVisual = computed(() => {
    if(!diaSeleccionadoStr.value) return ''
    const [y, m, d] = diaSeleccionadoStr.value.split('-')
    return new Date(y, m - 1, d).toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })
})

const abrirDetalleDia = (dia) => {
    diaSeleccionadoStr.value = construirFechaString(dia)
    modalDiaAbierto.value = true
    modalAgregarRetroAbierto.value = false
}

// Prendas disponibles para registrar en fecha pasada
const prendasDisponiblesRetro = computed(() => {
    const usadasEseDia = eventosDiaSeleccionado.value.map(e => e.prenda_id)
    return store.prendas.filter(p => !usadasEseDia.includes(p.id))
})

const registrarUsoRetroactivo = () => {
    if (!prendaSeleccionadaId.value) return
    const prenda = getPrenda(prendaSeleccionadaId.value)
    if(prenda) {
        prenda.estado = 'en_uso'
        prenda.usos_desde_lavado += 1
        
        store.bitacora.push({
            id: crypto.randomUUID(),
            prenda_id: prenda.id,
            tipo_evento: 'uso',
            fecha: diaSeleccionadoStr.value,
            usos_acumulados: prenda.usos_desde_lavado
        })
        prendaSeleccionadaId.value = ''
        modalAgregarRetroAbierto.value = false
    }
}

const eliminarEventoBitacora = (eventoId, prendaId) => {
    store.bitacora = store.bitacora.filter(b => b.id !== eventoId)
    const prenda = getPrenda(prendaId)
    if(prenda) {
        prenda.usos_desde_lavado = Math.max(0, prenda.usos_desde_lavado - 1)
        if(prenda.usos_desde_lavado === 0) prenda.estado = 'limpia'
    }
}

// --- EXPORTAR / IMPORTAR RESPALDO ---
const exportarDatos = () => {
    const data = {
        categorias: store.categorias,
        prendas: store.prendas,
        bitacora: store.bitacora,
        version: '2.0'
    }
    const blob = new Blob([JSON.stringify(data)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `wear_tracker_backup_${construirFechaString(diaHoy)}.json`
    a.click()
    URL.revokeObjectURL(url)
}

const importarDatos = (event) => {
    const file = event.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (e) => {
        try {
            const data = JSON.parse(e.target.result)
            if(data.categorias && data.prendas && data.bitacora) {
                store.categorias = data.categorias
                store.prendas = data.prendas
                store.bitacora = data.bitacora
                alert('Datos importados correctamente.')
            } else {
                alert('El archivo no tiene el formato correcto.')
            }
        } catch (err) {
            alert('Error leyendo el archivo JSON.')
        }
    }
    reader.readAsText(file)
}
</script>

<template>
    <div class="space-y-6">
        <!-- Controles de Mes -->
        <div class="flex justify-between items-center bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 transition-colors">
            <button @click="cambiarMes(-1)" class="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-600 dark:text-slate-300 transition-colors">
                <ChevronLeft class="w-5 h-5" />
            </button>
            <h3 class="font-bold text-slate-800 dark:text-slate-100 text-base capitalize">{{ nombreMesActual }} {{ añoActual }}</h3>
            <button @click="cambiarMes(1)" class="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-600 dark:text-slate-300 transition-colors" :disabled="mesActual === mesHoy && añoActual === añoHoy" :class="{'opacity-30 cursor-not-allowed': mesActual === mesHoy && añoActual === añoHoy}">
                <ChevronRight class="w-5 h-5" />
            </button>
        </div>

        <!-- Calendario Grid -->
        <div class="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 p-4 transition-colors">
            <div class="grid grid-cols-7 gap-1 mb-2">
                <div v-for="dia in ['D','L','M','M','J','V','S']" class="text-center text-xs font-bold text-slate-400 py-1">
                    {{ dia }}
                </div>
            </div>
            
            <div class="grid grid-cols-7 gap-1">
                <div v-for="n in espacioInicioMes" class="aspect-square"></div>
                
                <button 
                    v-for="dia in diasEnMes" 
                    :key="dia" 
                    @click="abrirDetalleDia(dia)"
                    class="aspect-square flex flex-col items-center p-1 rounded-xl border transition-all relative group"
                    :class="[
                        (dia === diaHoy && mesActual === mesHoy && añoActual === añoHoy) 
                            ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 font-bold' 
                            : 'border-transparent hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                    ]"
                >
                    <span class="text-xs z-10">{{ dia }}</span>
                    <!-- Indicadores de Macro-categorías -->
                    <div class="flex flex-wrap justify-center gap-0.5 mt-auto w-full px-0.5 h-3 overflow-hidden">
                        <div v-for="color in coloresEventosDia(dia).slice(0,3)" class="w-1.5 h-1.5 rounded-full shadow-sm" :style="{backgroundColor: color}"></div>
                    </div>
                </button>
            </div>
        </div>

        <!-- Sección de Respaldo -->
        <div class="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 text-center transition-colors">
            <p class="text-xs text-slate-500 dark:text-slate-400 mb-3">Tus datos viven seguros solo en este dispositivo.</p>
            <div class="flex gap-2">
                <button @click="exportarDatos" class="flex-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 py-2.5 rounded-xl text-sm font-bold hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center gap-2 transition-colors">
                    <Download class="w-4 h-4" /> Exportar
                </button>
                <label class="flex-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 py-2.5 rounded-xl text-sm font-bold hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center gap-2 cursor-pointer transition-colors">
                    <Upload class="w-4 h-4" /> Importar
                    <input type="file" class="hidden" accept=".json" @change="importarDatos">
                </label>
            </div>
        </div>

        <!-- MODAL: DETALLE DEL DÍA Y EDICIÓN RETROACTIVA -->
        <div v-if="modalDiaAbierto" class="absolute inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div class="bg-white dark:bg-slate-900 w-full rounded-2xl shadow-2xl p-6 animate-slide-up transition-colors max-h-[85dvh] flex flex-col">
                
                <div class="flex justify-between items-center mb-4 shrink-0">
                    <div>
                        <h3 class="font-bold text-slate-800 dark:text-slate-100 text-lg">Outfit del día</h3>
                        <p class="text-xs text-slate-500 capitalize">{{ diaSeleccionadoVisual }}</p>
                    </div>
                    <button @click="modalDiaAbierto = false" class="bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 p-2 rounded-full transition-colors">
                        <X class="w-5 h-5" />
                    </button>
                </div>

                <!-- Lista de prendas usadas ese día -->
                <div class="flex-1 overflow-y-auto space-y-2.5 my-2">
                    <div v-if="eventosDiaSeleccionado.length === 0 && !modalAgregarRetroAbierto" class="text-center py-8 text-slate-400 text-sm">
                        No hay ropa registrada en este día.
                    </div>
                    
                    <div v-for="evento in eventosDiaSeleccionado" :key="evento.id" class="p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-xl flex items-center justify-between">
                        <div class="flex items-center gap-3">
                            <div class="w-3.5 h-3.5 rounded-full shrink-0" :style="{ backgroundColor: getMacroColor(getCategoria(getPrenda(evento.prenda_id)?.categoria_id)?.macro_id) }"></div>
                            <div>
                                <p class="font-bold text-slate-800 dark:text-slate-200 text-sm">{{ nombreMostrado(evento.prenda_id) }}</p>
                                <p class="text-[10px] text-slate-400 uppercase tracking-wider font-bold">
                                    {{ evento.tipo_evento === 'uso' ? `Uso #${evento.usos_acumulados}` : 'Lavado' }}
                                </p>
                            </div>
                        </div>
                        <button @click="eliminarEventoBitacora(evento.id, evento.prenda_id)" class="text-slate-300 hover:text-red-500 p-1.5 transition-colors">
                            <Trash2 class="w-4 h-4" />
                        </button>
                    </div>

                    <!-- Acordeón interno para añadir ropa retroactiva -->
                    <div v-if="modalAgregarRetroAbierto" class="p-4 bg-blue-50/50 dark:bg-slate-800 rounded-xl border border-blue-100 dark:border-slate-700 space-y-3 mt-4">
                        <h4 class="text-xs font-bold text-blue-900 dark:text-blue-300 uppercase">Añadir prenda a este día</h4>
                        <select v-model="prendaSeleccionadaId" class="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 text-sm rounded-xl p-3 outline-none">
                            <option value="" disabled>Selecciona una prenda...</option>
                            <option v-for="p in prendasDisponiblesRetro" :key="p.id" :value="p.id">
                                {{ nombreMostrado(p.id) }}
                            </option>
                        </select>
                        <div class="flex gap-2">
                            <button @click="registrarUsoRetroactivo" class="flex-1 bg-blue-600 text-white font-bold py-2.5 rounded-xl text-xs">Guardar</button>
                            <button @click="modalAgregarRetroAbierto = false" class="bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold py-2.5 px-4 rounded-xl text-xs">Cancelar</button>
                        </div>
                    </div>
                </div>

                <!-- Botón para abrir el formulario retroactivo -->
                <div v-if="!modalAgregarRetroAbierto" class="pt-3 border-t border-slate-100 dark:border-slate-800 shrink-0">
                    <button @click="modalAgregarRetroAbierto = true" class="w-full bg-slate-900 dark:bg-blue-600 text-white font-bold py-3 rounded-xl text-sm flex items-center justify-center gap-2 shadow-sm transition-colors">
                        <Plus class="w-4 h-4" /> Agregar ropa a este día
                    </button>
                </div>
            </div>
            <div class="absolute inset-0 z-[-1]" @click="modalDiaAbierto = false"></div>
        </div>
    </div>
</template>