import { reactive, watch } from 'vue'

// Helper para cargar de LocalStorage o usar default
const loadData = (key, defaultData) => {
    const saved = localStorage.getItem(key)
    return saved ? JSON.parse(saved) : defaultData
}

export const store = reactive({
    // Macro-categorías fijas en código (dictan el color)
    macroCategorias: [
        { id: 'sup', nombre: 'Superior (Torso)', color: '#3b82f6' }, // Azul
        { id: 'inf', nombre: 'Inferior (Piernas)', color: '#f97316' }, // Naranja
        { id: 'cal', nombre: 'Calzado', color: '#eab308' }, // Amarillo
        { id: 'int', nombre: 'Ropa Interior', color: '#8b5cf6' }, // Morado
        { id: 'ext', nombre: 'Abrigos / Exterior', color: '#64748b' } // Gris
    ],
    
    // Categorías editables por ti, con datos iniciales robustos
    categorias: loadData('wt2_categorias', [
        { id: crypto.randomUUID(), macro_id: 'sup', nombre: 'Playera', concatenar: true },
        { id: crypto.randomUUID(), macro_id: 'sup', nombre: 'Camisa', concatenar: true },
        { id: crypto.randomUUID(), macro_id: 'inf', nombre: 'Jeans', concatenar: true },
        { id: crypto.randomUUID(), macro_id: 'inf', nombre: 'Joggers', concatenar: true },
        { id: crypto.randomUUID(), macro_id: 'inf', nombre: 'Shorts', concatenar: true },
        { id: crypto.randomUUID(), macro_id: 'int', nombre: 'Boxers', concatenar: true },
        { id: crypto.randomUUID(), macro_id: 'int', nombre: 'Calcetines', concatenar: true },
        { id: crypto.randomUUID(), macro_id: 'cal', nombre: 'Tenis', concatenar: true },
        { id: crypto.randomUUID(), macro_id: 'cal', nombre: 'Zapatos', concatenar: true },
        { id: crypto.randomUUID(), macro_id: 'ext', nombre: 'Chamarra', concatenar: true }
    ]),
    
    prendas: loadData('wt2_prendas', []),
    bitacora: loadData('wt2_bitacora', [])
})

// Persistencia automática: cualquier cambio en store se guarda en LocalStorage
watch(() => store.categorias, (val) => localStorage.setItem('wt2_categorias', JSON.stringify(val)), { deep: true })
watch(() => store.prendas, (val) => localStorage.setItem('wt2_prendas', JSON.stringify(val)), { deep: true })
watch(() => store.bitacora, (val) => localStorage.setItem('wt2_bitacora', JSON.stringify(val)), { deep: true })