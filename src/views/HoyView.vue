<script setup>
import { ref, computed } from 'vue'
import { Plus, Trash2, X, Search, CheckCircle, Sun } from 'lucide-vue-next'
import { store } from '../store.js'

// --- FECHAS BASE ---
const hoyObj = new Date()
// Aseguramos formato YYYY-MM-DD local
const fechaHoyStr = `${hoyObj.getFullYear()}-${String(hoyObj.getMonth() + 1).padStart(2, '0')}-${String(hoyObj.getDate()).padStart(2, '0')}`

// --- ESTADO ---
const modalUsoAbierto = ref(false)
const filtroTexto = ref('')
const filtroMacro = ref(null) // null = Todos, sino el id de la macro (ej. 'sup')

const abrirModalUso = () => {
    filtroTexto.value = ''
    filtroMacro.value = null
    modalUsoAbierto.value = true
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

// --- LÓGICA CORE ---
const eventosHoy = computed(() => {
    return store.bitacora
        .filter(b => b.fecha === fechaHoyStr && b.tipo_evento === 'uso')
        .reverse()
})

const deshacerUso = (eventoId, prendaId) => {
    // 1. Eliminar de bitácora
    store.bitacora = store.bitacora.filter(b => b.id !== eventoId)
    // 2. Ajustar prenda (quitarle el uso)
    const prenda = getPrenda(prendaId)
    if(prenda) {
        prenda.usos_desde_lavado = Math.max(0, prenda.usos_desde_lavado - 1)
        if(prenda.usos_desde_lavado === 0) prenda.estado = 'limpia'
    }
}

const registrarUso = (prendaId) => {
    const prenda = getPrenda(prendaId)
    if(prenda) {
        prenda.estado = 'en_uso'
        prenda.usos_desde_lavado += 1
        
        store.bitacora.push({
            id: crypto.randomUUID(),
            prenda_id: prendaId,
            tipo_evento: 'uso',
            fecha: fechaHoyStr,
            usos_acumulados: prenda.usos_desde_lavado
        })
        modalUsoAbierto.value = false
    }
}

// --- LÓGICA DE FILTRADO PARA EL MODAL ---
const prendasDisponibles = computed(() => {
    const registradasHoy = eventosHoy.value.map(e => e.prenda_id)
    const busqueda = filtroTexto.value.toLowerCase()

    return store.prendas.filter(p => {
        // 1. No mostrar si ya se registró hoy
        if (registradasHoy.includes(p.id)) return false
        
        const cat = getCategoria(p.categoria_id)
        if (!cat) return false

        // 2. Filtro por Macro-categoría (Chips)
        if (filtroMacro.value && cat.macro_id !== filtroMacro.value) return false

        // 3. Filtro por texto (busca en el nombre real o el concatenado)
        const nombreCompleto = cat.concatenar ? `${cat.nombre} ${p.nombre}`.toLowerCase() : p.nombre.toLowerCase()
        if (busqueda && !nombreCompleto.includes(busqueda)) return false

        return true
    }).sort((a,b) => {
        // Orden UX: Primero las que están en "La Silla" (en_uso)
        if(a.estado === 'en_uso' && b.estado === 'limpia') return -1;
        if(a.estado === 'limpia' && b.estado === 'en_uso') return 1;
        return 0;
    })
})
</script>

<template>
    <div class="space-y-6">
        <!-- Tarjeta Principal -->
        <div class="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-900 border border-blue-100 dark:border-slate-700 rounded-3xl p-6 text-center shadow-sm transition-colors">
            <div class="w-14 h-14 bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm border border-blue-50 dark:border-slate-700">
                <Sun class="w-7 h-7" />
            </div>
            <h2 class="text-blue-900 dark:text-slate-100 font-bold mb-1 text-xl">Tu Outfit de Hoy</h2>
            <p class="text-blue-600/70 dark:text-slate-400 text-sm mb-6">¿Qué ropa estás usando?</p>
            <button @click="abrirModalUso" class="bg-blue-600 dark:bg-blue-500 text-white px-5 py-3.5 rounded-2xl font-bold shadow-md hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors w-full flex items-center justify-center gap-2">
                <Plus class="w-5 h-5" /> Registrar Prenda
            </button>
        </div>
        
        <!-- Lista de usos de hoy -->
        <div class="space-y-3">
            <div class="flex items-center justify-between px-1">
                <h3 class="text-xs font-bold text-slate-400 uppercase tracking-wider">Registros actuales</h3>
                <span v-if="eventosHoy.length > 0" class="text-xs bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2.5 py-0.5 rounded-full font-bold">
                    {{ eventosHoy.length }}
                </span>
            </div>
            
            <div v-if="eventosHoy.length === 0" class="text-center py-12 text-slate-400 dark:text-slate-500 text-sm border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-white/50 dark:bg-slate-900/50">
                Aún no has registrado ropa hoy.
            </div>
            
            <div v-for="evento in eventosHoy" :key="evento.id" class="p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm flex items-center justify-between transition-colors">
                <div class="flex items-center gap-4">
                    <div class="w-4 h-4 rounded-full shadow-inner border border-slate-200 dark:border-slate-700" :style="{ backgroundColor: getMacroColor(getCategoria(getPrenda(evento.prenda_id)?.categoria_id)?.macro_id) }"></div>
                    <div>
                        <p class="font-bold text-slate-800 dark:text-slate-100">{{ nombreMostrado(evento.prenda_id) }}</p>
                        <p class="text-[11px] uppercase tracking-wider font-bold text-slate-500 dark:text-slate-400 mt-1">Uso #{{ evento.usos_acumulados }}</p>
                    </div>
                </div>
                <button @click="deshacerUso(evento.id, evento.prenda_id)" class="text-red-400 hover:text-red-500 dark:text-red-500/70 dark:hover:text-red-400 p-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors" aria-label="Deshacer">
                    <Trash2 class="w-5 h-5" />
                </button>
            </div>
        </div>

        <!-- MODAL: REGISTRAR USO -->
        <div v-if="modalUsoAbierto" class="absolute inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex flex-col justify-end">
            <div class="bg-white dark:bg-slate-900 w-full h-[85dvh] rounded-t-3xl shadow-2xl p-6 pb-safe animate-slide-up flex flex-col transition-colors">
                
                <!-- Modal Header -->
                <div class="flex justify-between items-center mb-5 shrink-0">
                    <h3 class="text-xl font-bold text-slate-800 dark:text-slate-100">¿Qué te pusiste?</h3>
                    <button @click="modalUsoAbierto = false" class="bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 p-2 rounded-full transition-colors">
                        <X class="w-5 h-5" />
                    </button>
                </div>
                
                <!-- Buscador de texto -->
                <div class="mb-4 shrink-0 relative">
                    <Search class="w-5 h-5 absolute left-4 top-3.5 text-slate-400" />
                    <input v-model="filtroTexto" type="text" placeholder="Buscar prenda..." class="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl py-3.5 pl-12 pr-4 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors">
                </div>

                <!-- Chips (Filtros por Macro-categoría) -->
                <div class="mb-4 shrink-0 overflow-x-auto pb-2 flex gap-2 hide-scrollbar">
                    <button @click="filtroMacro = null" class="px-4 py-1.5 rounded-full text-sm font-bold whitespace-nowrap transition-colors" :class="filtroMacro === null ? 'bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'">
                        Todo
                    </button>
                    <button v-for="macro in store.macroCategorias" :key="macro.id" @click="filtroMacro = macro.id" class="px-4 py-1.5 rounded-full text-sm font-bold whitespace-nowrap transition-colors border" :class="filtroMacro === macro.id ? 'border-transparent text-white shadow-md' : 'border-slate-200 dark:border-slate-700 bg-transparent text-slate-600 dark:text-slate-300'" :style="{ backgroundColor: filtroMacro === macro.id ? macro.color : '' }">
                        {{ macro.nombre }}
                    </button>
                </div>

                <!-- Lista de prendas disponibles -->
                <div class="flex-1 overflow-y-auto space-y-2 pb-4">
                    <div v-if="prendasDisponibles.length === 0" class="text-center py-10 text-slate-400 dark:text-slate-500">
                        No hay prendas disponibles que coincidan con los filtros.
                    </div>
                    
                    <button v-for="prenda in prendasDisponibles" :key="prenda.id" @click="registrarUso(prenda.id)" class="w-full text-left p-4 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl hover:bg-blue-50 dark:hover:bg-slate-700 transition-colors flex justify-between items-center group shadow-sm">
                        <div class="flex items-center gap-4">
                            <div class="w-4 h-4 rounded-full shadow-inner border border-slate-200 dark:border-slate-700" :style="{ backgroundColor: getMacroColor(getCategoria(prenda.categoria_id)?.macro_id) }"></div>
                            <div>
                                <p class="font-bold text-slate-800 dark:text-slate-200 group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors">{{ nombreMostrado(prenda.id) }}</p>
                                <p class="text-[11px] uppercase tracking-wider font-bold mt-1" :class="prenda.estado === 'limpia' ? 'text-slate-400' : 'text-amber-500'">
                                    {{ prenda.estado === 'limpia' ? 'Estaba limpia' : `Estaba en uso (${prenda.usos_desde_lavado})` }}
                                </p>
                            </div>
                        </div>
                        <CheckCircle class="w-6 h-6 text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                </div>
            </div>
            <div class="absolute inset-0 z-[-1]" @click="modalUsoAbierto = false"></div>
        </div>
    </div>
</template>

<style scoped>
/* Utilidad para ocultar la barra de scroll en los chips horizontales pero permitir el deslizamiento táctil */
.hide-scrollbar::-webkit-scrollbar {
    display: none;
}
.hide-scrollbar {
    -ms-overflow-style: none;
    scrollbar-width: none;
}
</style>