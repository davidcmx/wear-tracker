<script setup>
import { ref } from 'vue'
import { Plus, Trash2, Tag, Check, Layers } from 'lucide-vue-next'
import { store } from '../store.js'

// --- PALETA DE COLORES PREDEFINIDA ---
const paletaColores = [
    '#3b82f6', // Azul
    '#10b981', // Esmeralda
    '#f59e0b', // Ámbar / Naranja claro
    '#f97316', // Naranja
    '#ef4444', // Rojo
    '#ec4899', // Rosa
    '#8b5cf6', // Morado
    '#6366f1', // Índigo
    '#14b8a6', // Teal
    '#84cc16', // Lima
    '#64748b', // Pizarra / Gris
    '#78716c'  // Piedra / Café
]

// --- ESTADO ---
const form = ref({
    nombre: '',
    macro_id: 'sup',
    color_hex: '#3b82f6',
    concatenar: true
})

// --- LÓGICA ---
const guardarCategoria = () => {
    if (!form.value.nombre.trim()) return

    store.categorias.push({
        id: crypto.randomUUID(),
        macro_id: form.value.macro_id,
        nombre: form.value.nombre.trim(),
        color_hex: form.value.color_hex,
        concatenar: form.value.concatenar
    })

    // Reset limpio manteniendo valores por defecto razonables
    form.value.nombre = ''
}

const contarPrendasEnCategoria = (catId) => {
    return store.prendas.filter(p => p.categoria_id === catId).length
}

const eliminarCategoria = (catId) => {
    const totalPrendas = contarPrendasEnCategoria(catId)
    if (totalPrendas > 0) {
        alert('No puedes eliminar una categoría que tiene prendas asignadas.')
        return
    }
    if (confirm('¿Estás seguro de eliminar esta categoría?')) {
        store.categorias = store.categorias.filter(c => c.id !== catId)
    }
}
</script>

<template>
    <div class="space-y-6">
        <!-- Formulario para Nueva Categoría -->
        <div class="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 transition-colors">
            <h2 class="font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
                <Tag class="w-4 h-4 text-blue-500" /> Nueva Categoría
            </h2>
            
            <form @submit.prevent="guardarCategoria" class="space-y-4">
                <!-- Nombre y Macro-categoría -->
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                        <label class="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Nombre</label>
                        <input v-model="form.nombre" type="text" placeholder="Ej. Sudadera, Vestido..." class="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm text-slate-800 dark:text-slate-100 outline-none focus:border-blue-500 transition-colors" required>
                    </div>
                    <div>
                        <label class="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Macro-categoría</label>
                        <select v-model="form.macro_id" class="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm text-slate-800 dark:text-slate-100 outline-none focus:border-blue-500 transition-colors">
                            <option v-for="macro in store.macroCategorias" :key="macro.id" :value="macro.id">
                                {{ macro.nombre }}
                            </option>
                        </select>
                    </div>
                </div>

                <!-- Selector de Paleta de Colores Predefinidos -->
                <div>
                    <label class="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">Color Identificador</label>
                    <div class="flex flex-wrap gap-2">
                        <button 
                            v-for="color in paletaColores" 
                            :key="color" 
                            type="button"
                            @click="form.color_hex = color"
                            class="w-8 h-8 rounded-full transition-transform flex items-center justify-center shadow-sm"
                            :class="form.color_hex === color ? 'scale-110 ring-2 ring-offset-2 ring-slate-400 dark:ring-offset-slate-900' : 'hover:scale-105'"
                            :style="{ backgroundColor: color }"
                        >
                            <Check v-if="form.color_hex === color" class="w-4 h-4 text-white" />
                        </button>
                    </div>
                </div>

                <!-- Check / Switch de Concatenación -->
                <div class="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                    <div>
                        <p class="text-sm font-bold text-slate-700 dark:text-slate-300">Concatenar nombre</p>
                        <p class="text-[11px] text-slate-400">Antepone la categoría (Ej. "Playera [Modelo]")</p>
                    </div>
                    <label class="relative inline-flex items-center cursor-pointer">
                        <input v-model="form.concatenar" type="checkbox" class="sr-only peer">
                        <div class="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                </div>

                <button type="submit" class="w-full bg-slate-900 dark:bg-blue-600 hover:bg-slate-800 dark:hover:bg-blue-700 text-white font-bold p-3.5 rounded-xl text-sm transition-colors shadow-md flex items-center justify-center gap-2">
                    <Plus class="w-4 h-4" /> Guardar Categoría
                </button>
            </form>
        </div>

        <!-- Listado de Categorías agrupadas por Macro -->
        <div class="space-y-4">
            <h3 class="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">Catálogo Actual</h3>
            
            <div v-for="macro in store.macroCategorias" :key="macro.id" class="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 space-y-3 transition-colors">
                <div class="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
                    <div class="w-3.5 h-3.5 rounded-full" :style="{ backgroundColor: macro.color }"></div>
                    <h4 class="font-bold text-slate-700 dark:text-slate-200 text-sm">{{ macro.nombre }}</h4>
                </div>

                <div class="space-y-2">
                    <div v-for="cat in store.categorias.filter(c => c.macro_id === macro.id)" :key="cat.id" class="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800">
                        <div class="flex items-center gap-3">
                            <Layers class="w-4 h-4 text-slate-400" />
                            <div>
                                <p class="font-bold text-slate-700 dark:text-slate-200 text-sm">{{ cat.nombre }}</p>
                                <p class="text-[10px] text-slate-400">
                                    {{ cat.concatenar ? 'Concatenable' : 'Nombre fijo' }} &bull; {{ contarPrendasEnCategoria(cat.id) }} prendas
                                </p>
                            </div>
                        </div>
                        <button @click="eliminarCategoria(cat.id)" class="text-slate-300 dark:text-slate-600 hover:text-red-500 p-1.5 transition-colors">
                            <Trash2 class="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>