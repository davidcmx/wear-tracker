<script setup>
import { ref, defineAsyncComponent } from 'vue'
import { Sun, Moon, Calendar, Grid, Tag, SunMedium } from 'lucide-vue-next'

const views = {
    hoy: defineAsyncComponent(() => import('./views/HoyView.vue')),
    closet: defineAsyncComponent(() => import('./views/ClosetView.vue')),
    categorias: defineAsyncComponent(() => import('./views/CategoriasView.vue')),
    historial: defineAsyncComponent(() => import('./views/HistorialView.vue'))
}

const tabActual = ref('hoy')
const isDark = ref(false)

const toggleDark = () => {
    isDark.value = !isDark.value
    document.documentElement.classList.toggle('dark', isDark.value)
}

// Fecha actual visual para la cabecera
const fechaHoyVisual = new Date().toLocaleDateString('es-MX', { weekday: 'short', month: 'short', day: 'numeric' })
</script>

<template>
  <div class="max-w-md mx-auto h-[100dvh] bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 shadow-2xl flex flex-col relative overflow-hidden transition-colors duration-300">
    
    <!-- Header con fuente estilizada y fecha actual -->
    <header class="bg-slate-900 dark:bg-slate-900 text-white p-5 shadow-md z-10 flex justify-between items-center shrink-0">
        <div>
            <h1 class="text-2xl font-brand font-extrabold tracking-wider bg-gradient-to-r from-white via-slate-200 to-blue-400 bg-clip-text text-transparent">
                WEAR TRACKER
            </h1>
        </div>
        <div class="flex items-center gap-3">
            <span class="text-xs text-slate-300 bg-slate-800 dark:bg-slate-800/80 px-2.5 py-1 rounded-lg font-medium border border-slate-700/50 capitalize">
                {{ fechaHoyVisual }}
            </span>
            <button @click="toggleDark" class="p-2 rounded-full hover:bg-slate-800 transition-colors">
                <Sun v-if="!isDark" class="w-5 h-5 text-amber-300"/>
                <Moon v-else class="w-5 h-5 text-blue-300"/>
            </button>
        </div>
    </header>

    <!-- Main Content (Dynamic View) -->
    <main class="flex-1 overflow-y-auto pb-24 p-5 relative">
        <component :is="views[tabActual]" />
    </main>

    <!-- Bottom Navigation -->
    <nav class="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 shrink-0 w-full flex justify-around items-center pb-safe z-40 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] transition-colors duration-300">
        <button @click="tabActual = 'hoy'" :class="['flex flex-col items-center p-3 flex-1 transition-colors', tabActual === 'hoy' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300']">
            <SunMedium class="w-6 h-6 mb-1" />
            <span class="text-[10px] font-bold tracking-wide">Hoy</span>
        </button>
        <button @click="tabActual = 'closet'" :class="['flex flex-col items-center p-3 flex-1 transition-colors', tabActual === 'closet' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300']">
            <Grid class="w-6 h-6 mb-1" />
            <span class="text-[10px] font-bold tracking-wide">Clóset</span>
        </button>
        <button @click="tabActual = 'categorias'" :class="['flex flex-col items-center p-3 flex-1 transition-colors', tabActual === 'categorias' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300']">
            <Tag class="w-6 h-6 mb-1" />
            <span class="text-[10px] font-bold tracking-wide">Tipos</span>
        </button>
        <button @click="tabActual = 'historial'" :class="['flex flex-col items-center p-3 flex-1 transition-colors', tabActual === 'historial' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300']">
            <Calendar class="w-6 h-6 mb-1" />
            <span class="text-[10px] font-bold tracking-wide">Historial</span>
        </button>
    </nav>
  </div>
</template>