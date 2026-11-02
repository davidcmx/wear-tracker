# Wear Tracker 🧥✨

> Un gestor y rastreador de frescura para tu ropa, diseñado mediante **vibecoding** e implementado con arquitectura moderna en el cliente.

## ¿Qué es esto?
**Wear Tracker** nació de una necesidad muy simple: reusar ropa por un par de días, perder la cuenta de cuántas puestas lleva cada prenda, y no saber si toca mandarla a lavar o si puede aguantar un día más en la "silla virtual". 

Todo vive 100% en tu navegador utilizando `localStorage`, lo que lo hace completamente privado, rápido y funcional sin necesidad de bases de datos externas ni servidores complejos.

---

## 🚀 Filosofía de Desarrollo: Vibecoding
Este proyecto no fue escrito línea por línea de forma tradicional. Nació bajo la metodología de **vibecoding**, donde la arquitectura, la lógica de negocio, la separación por componentes (`Vue 3 SFC`) y la interfaz visual (`Tailwind CSS`) fueron co-creadas mediante iteración rápida con inteligencia artificial, enfocándose puramente en resolver la experiencia de usuario (UX) del día a día.

---

## 🛠️ Stack Tecnológico
* **Frontend:** Vue 3 (Composition API)
* **Build Tool:** Vite
* **Estilos:** Tailwind CSS (con soporte completo para *Modo Oscuro*)
* **Iconos:** Lucide Icons
* **Persistencia:** LocalStorage (con funciones de importación/exportación de respaldos en `.json`)

---

## ✨ Características Principales
1. **Acordeones Anidados:** Organización del clóset por Macro-categorías (Superior, Inferior, Calzado, Ropa Interior, Abrigos) y sus respectivas categorías específicas.
2. **Nombres Inteligentes (Concatenación):** Configura qué categorías anteponen automáticamente su nombre (Ej. *"Playera"* + *"Ravenclaw"* = *"Playera Ravenclaw"*).
3. **Filtros Rápidos:** Chips interactivos para filtrar tu ropa por categoría al momento de registrar el outfit diario.
4. **Historial y Calendario Interactivo:** Visualización mensual con indicadores de color según el tipo de prenda usada.
5. **Edición Retroactiva:** ¿Olvidaste anotar qué te pusiste ayer? Toca cualquier día pasado en el calendario y ajusta tu bitácora.