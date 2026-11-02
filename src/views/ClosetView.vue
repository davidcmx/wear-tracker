<script setup>
import { ref, computed } from 'vue'
import { Plus, ChevronDown, ChevronUp, Droplet, Trash2, X, Info } from 'lucide-vue-next'
import { store } from '../store.js'

// --- ESTADO Y UI ---
const modalAbierto = ref(false)
const modalStatsAbierto = ref(false)
const form = ref({ categoria_id: '', nombre: '' })

// Control de acordeones (Abiertos por defecto)
const macroAbiertos = ref(store.macroCategorias.map(m => m.id))
const catAbiertas = ref(store.categorias.map(c => c.id))

const toggleMacro = (id) => {
    if (macroAbiertos.value.includes(id)) macroAbiertos.value = macroAbiertos.value.filter(m => m !== id)
    else macroAbiertos.value.push(id)
}

const toggleCat = (id) => {
    if (catAbiertas.value.includes(id)) catAbiertas.value = catAbiertas.value.filter(c => c !== id)
    else catAbiertas.value.push(id)
}

// --- HELPERS ---
const getCategoria = (id) => store.categorias.find(c => c.id === id)
const nombreMostrado = (prenda) => {
    const cat = getCategoria(prenda.categoria_id)
    if (!cat) return prenda.nombre
    return cat.concatenar ? `${cat.nombre} ${prenda.nombre}` : prenda.nombre
}

// --- LÓGICA DE DATOS ---
const guardarPrenda = () => {
    if (!form.value.nombre.trim() || !form.value.categoria_id) return
    store.prendas.push({
        id: crypto.randomUUID(),
        categoria_id: form.value.categoria_id,
        nombre: form.value.nombre.trim(),
        estado: 'limpia',
        usos_desde_lavado: 0
    })
    modalAbierto.value = false
    form.value = { categoria_id: '', nombre: '' }
}

const mandarALavar = (prenda) => {
    prenda.estado = 'limpia'
    prenda.usos_desde_lavado = 0
}

const eliminarPrenda = (id) => {
    if(confirm('¿Eliminar esta prenda?')) store.prendas = store.prendas.filter(p => p.id !== id)
}

// Estructura anidada para los acordeones y stats
const inventarioAgrupado = computed(() => {
    return store.macroCategorias.map(macro => {
        // Filtrar categorías que pertenecen a esta macro
        const categoriasDeMacro = store.categorias.filter(c => c.macro_id === macro.id)
        
        // Mapear cada categoría con sus prendas
        const categoriasConPrendas = categoriasDeMacro.map(cat => {
            const prendasCat = store.prendas.filter(p => p.categoria_id === cat.id)
            return {
                ...cat,
                prendas: prendasCat,
                enUso: prendasCat.filter(p => p.estado === 'en_uso').length
            }
        }).filter(c => c.prendas.length > 0) // Quitar categorías vacías

        // Sumar totales para la macro
        const totalPrendas = categoriasConPrendas.reduce((acc, c) => acc + c.prendas.length, 0)
        const totalEnUso = categoriasConPrendas.reduce((acc, c) => acc + c.enUso, 0)

        return {
            ...macro,
            categorias: categoriasConPrendas,
            totalPrendas,
            enUso: totalEnUso
        }
    }).filter(m => m.totalPrendas > 0) // Quitar macros vacías
})
</script>

<template>
    <div class="space-y-6">
        <!-- Encabezado -->
        <div class="flex justify-between items-center bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 transition-colors">
            <div>
                <h2 class="font-bold text-slate-800 dark:text-slate-100">Mi Clóset</h2>
                <!-- Botón que abre el modal de stats -->
                <button @click="modalStatsAbierto = true" class="text-xs text-blue-600 dark:text-blue-400 font-medium hover:underline flex items-center gap-1 mt-0.5">
                    {{ store.prendas.length }} prendas en total <Info class="w-3.5 h-3.5" />
                </button>
            </div>
            <button @click="modalAbierto = true" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors flex items-center gap-1 shadow-md">
                <Plus class="w-4 h-4" /> Nueva
            </button>
        </div>

        <!-- Empty State -->
        <div v-if="inventarioAgrupado.length === 0" class="text-center py-16 text-slate-400 dark:text-slate-500 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
            Tu clóset está vacío.<br>Haz clic en "Nueva" para empezar.
        </div>

        <!-- ACORDEÓN NIVEL 1: Macro-categorías -->
        <div class="space-y-4">
            <div v-for="macro in inventarioAgrupado" :key="macro.id" class="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden transition-colors">
                
                <button @click="toggleMacro(macro.id)" class="w-full p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors border-b border-transparent" :class="{'border-slate-100 dark:border-slate-800': macroAbiertos.includes(macro.id)}">
                    <div class="flex items-center gap-3">
                        <div class="w-4 h-4 rounded-full shadow-inner" :style="{ backgroundColor: macro.color }"></div>
                        <span class="font-bold text-slate-700 dark:text-slate-200">{{ macro.nombre }}</span>
                        <span class="text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded-full">
                            {{ macro.totalPrendas }}
                        </span>
                    </div>
                    <ChevronUp v-if="macroAbiertos.includes(macro.id)" class="w-5 h-5 text-slate-400" />
                    <ChevronDown v-else class="w-5 h-5 text-slate-400" />
                </button>

                <!-- Contenido Nivel 1 -->
                <div v-show="macroAbiertos.includes(macro.id)" class="bg-slate-50/50 dark:bg-slate-900/50">
                    
                    <!-- ACORDEÓN NIVEL 2: Categorías -->
                    <div v-for="cat in macro.categorias" :key="cat.id" class="border-t border-slate-100 dark:border-slate-800/50">
                        <button @click="toggleCat(cat.id)" class="w-full py-3 px-5 flex items-center justify-between hover:bg-slate-100 dark:hover:bg-slate-800/70 transition-colors">
                            <div class="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 font-semibold">
                                {{ cat.nombre }}
                                <span class="text-[10px] font-normal text-slate-400">({{ cat.prendas.length }})</span>
                            </div>
                            <ChevronUp v-if="catAbiertas.includes(cat.id)" class="w-4 h-4 text-slate-400" />
                            <ChevronDown v-else class="w-4 h-4 text-slate-400" />
                        </button>

                        <!-- Contenido Nivel 2: Lista de Prendas -->
                        <div v-show="catAbiertas.includes(cat.id)" class="p-2 space-y-1 bg-white/50 dark:bg-slate-950/50">
                            <div v-for="prenda in cat.prendas" :key="prenda.id" class="p-3 mx-2 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl flex justify-between items-center group transition-colors shadow-sm">
                                <div>
                                    <p class="font-medium text-slate-700 dark:text-slate-200 text-sm">{{ nombreMostrado(prenda) }}</p>
                                    <p class="text-[10px] uppercase tracking-wider font-bold mt-0.5" :class="prenda.estado === 'limpia' ? 'text-emerald-500' : 'text-amber-500'">
                                        {{ prenda.estado === 'limpia' ? 'Limpia' : `En Uso (${prenda.usos_desde_lavado})` }}
                                    </p>
                                </div>
                                <div class="flex gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                    <button v-if="prenda.estado !== 'limpia'" @click="mandarALavar(prenda)" class="p-2 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-colors" title="Mandar a lavar">
                                        <Droplet class="w-4 h-4" />
                                    </button>
                                    <button @click="eliminarPrenda(prenda.id)" class="p-2 text-slate-300 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors">
                                        <Trash2 class="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>

        <!-- MODAL: ESTADÍSTICAS DEL CLÓSET -->
        <div v-if="modalStatsAbierto" class="absolute inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex flex-col justify-end">
            <div class="bg-white dark:bg-slate-900 w-full rounded-t-3xl shadow-2xl p-6 pb-safe animate-slide-up transition-colors max-h-[85dvh] flex flex-col">
                <div class="flex justify-between items-center mb-6 shrink-0">
                    <div>
                        <h3 class="text-xl font-bold text-slate-800 dark:text-slate-100">Resumen del Clóset</h3>
                        <p class="text-sm text-slate-500 dark:text-slate-400">Total: {{ store.prendas.length }} prendas</p>
                    </div>
                    <button @click="modalStatsAbierto = false" class="bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                        <X class="w-5 h-5" />
                    </button>
                </div>
                
                <div class="overflow-y-auto flex-1 space-y-4">
                    <div v-for="macro in inventarioAgrupado" :key="macro.id" class="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                        <div class="flex items-center gap-2 mb-3">
                            <div class="w-3 h-3 rounded-full" :style="{ backgroundColor: macro.color }"></div>
                            <h4 class="font-bold text-slate-700 dark:text-slate-200">{{ macro.nombre }}</h4>
                            <span class="ml-auto text-sm font-bold text-slate-500">{{ macro.totalPrendas }}</span>
                        </div>
                        <ul class="space-y-1.5 pl-5 border-l-2 border-slate-200 dark:border-slate-700 ml-1.5">
                            <li v-for="cat in macro.categorias" :key="cat.id" class="flex justify-between text-sm text-slate-600 dark:text-slate-400">
                                <span>{{ cat.nombre }}</span>
                                <span class="font-medium bg-white dark:bg-slate-800 px-2 py-0.5 rounded-md text-xs border border-slate-100 dark:border-slate-700">{{ cat.prendas.length }}</span>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
            <div class="absolute inset-0 z-[-1]" @click="modalStatsAbierto = false"></div>
        </div>

        <!-- MODAL: NUEVA PRENDA (Se mantiene igual) -->
        <div v-if="modalAbierto" class="absolute inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex flex-col justify-end">
            <div class="bg-white dark:bg-slate-900 w-full rounded-t-3xl shadow-2xl p-6 pb-safe animate-slide-up transition-colors">
                <div class="flex justify-between items-center mb-6">
                    <h3 class="text-xl font-bold text-slate-800 dark:text-slate-100">Añadir al Clóset</h3>
                    <button @click="modalAbierto = false" class="bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                        <X class="w-5 h-5" />
                    </button>
                </div>
                
                <form @submit.prevent="guardarPrenda" class="space-y-5">
                    <div>
                        <label class="block text-sm font-bold text-slate-600 dark:text-slate-400 mb-2">Categoría</label>
                        <select v-model="form.categoria_id" class="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 p-4 outline-none appearance-none transition-colors" required>
                            <option value="" disabled>Selecciona un tipo...</option>
                            <optgroup v-for="macro in store.macroCategorias" :key="macro.id" :label="macro.nombre">
                                <option v-for="cat in store.categorias.filter(c => c.macro_id === macro.id)" :key="cat.id" :value="cat.id">
                                    {{ cat.nombre }}
                                </option>
                            </optgroup>
                        </select>
                    </div>

                    <div>
                        <label class="block text-sm font-bold text-slate-600 dark:text-slate-400 mb-2">Identificador / Modelo</label>
                        <input v-model="form.nombre" type="text" placeholder="Ej. Azul marino, Ravenclaw, Levi's 501..." class="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 p-4 outline-none transition-colors" required>
                        <p v-if="form.categoria_id && getCategoria(form.categoria_id)?.concatenar" class="mt-2 text-xs text-slate-500 dark:text-slate-400">
                            Se guardará como: <span class="font-bold text-blue-600 dark:text-blue-400">{{ getCategoria(form.categoria_id).nombre }} {{ form.nombre || '...' }}</span>
                        </p>
                    </div>
                    
                    <button type="submit" class="w-full text-white bg-slate-900 dark:bg-blue-600 hover:bg-slate-800 dark:hover:bg-blue-700 font-bold rounded-xl text-lg px-5 py-4 mt-4 transition-colors">
                        Guardar Prenda
                    </button>
                </form>
            </div>
            <div class="absolute inset-0 z-[-1]" @click="modalAbierto = false"></div>
        </div>
    </div>
</template>