## Plan: Bingo Web App - TV Display & Multi-Player (v3 - Final)

Aplicación web de Bingo con bombo 3D, audio generado (Web Audio API), TTS español, gestión inteligente de jugadores/cartones, múltiples temas y persistencia. **100% estático, sin dependencias externas de JS**.

---

### Arquitectura de Archivos

```
Bingo/
├── index.html
├── css/
│   ├── styles.css             # Layout y estilos base
│   ├── animations.css         # Animaciones bombo/bolas
│   ├── components.css         # Modales, botones, tarjetas, jugadores
│   └── themes/
│       ├── light.css
│       ├── dark.css
│       ├── wood.css
│       ├── metal.css
│       ├── cyberpunk.css
│       └── glass.css
├── js/
│   ├── app.js                 # Inicialización y orquestación
│   ├── bingo-engine.js        # Lógica del juego
│   ├── drum.js                # Bombo 3D y animaciones
│   ├── cards.js               # Generación cartones españoles
│   ├── players.js             # Gestión de jugadores
│   ├── audio.js               # Web Audio API (SFX sintéticos) + TTS
│   ├── storage.js             # Persistencia localStorage
│   ├── settings.js            # Configuración y modal
│   └── ui.js                  # Interacciones UI
├── assets/
│   ├── fonts/                 # Tipografías embebidas (woff2)
│   └── textures/              # Texturas para temas
└── favicon.ico
```

---

### Fases y Tareas Detalladas

---

## **FASE 1: Fundamentos (Estructura Base)**

| # | Tarea | Detalles |
|---|-------|----------|
| 1.1 | Crear `index.html` | Estructura semántica: `<header>`, `<main>` (grid tablero+bombo), `<section class="players-bar">`, modales. Meta viewport para TV. |
| 1.2 | Implementar layout CSS Grid en `css/styles.css` | `.game-container`: `grid-template-columns: 2fr 1fr`, `grid-template-rows: 1fr auto`. |
| 1.3 | Crear tablero de 90 números | Grid 9 filas × 10 columnas. `.number-cell[data-number]` con estados `.available`, `.drawn`, `.latest`. |
| 1.4 | Diseñar celdas como bolas de bingo | `border-radius: 50%`, gradiente radial para efecto esférico, sombra inset, transición al cambiar estado. |
| 1.5 | Integrar tipografías Google Fonts | `<link>` a Dela Gothic One (números grandes), Space Mono (tablero), Outfit (UI). Fallback system fonts. |
| 1.6 | Variables CSS root en `css/styles.css` | Colores, espaciados, tamaños de fuente, sombras. Base para sistema de temas. |

---

## **FASE 2: Motor del Bingo**

| # | Tarea | Detalles |
|---|-------|----------|
| 2.1 | Crear clase `BingoEngine` en `js/bingo-engine.js` | `availableNumbers[1-90]`, `drawnNumbers[]`, `currentNumber`, `gameState` (idle/playing/paused/finished). |
| 2.2 | Método `drawNumber()` | Random de `availableNumbers`, mover a `drawnNumbers`, emitir evento `bingo:draw`. |
| 2.3 | Método `reset()` | Reiniciar arrays y estado, emitir `bingo:reset`. |
| 2.4 | Método `checkLine(card, drawnNumbers)` | Retorna índice de fila completa o -1. |
| 2.5 | Método `checkBingo(card, drawnNumbers)` | Retorna true si los 15 números del cartón han salido. |
| 2.6 | Sistema de eventos `EventTarget` | Clase extiende `EventTarget` para `dispatchEvent()` con CustomEvent. |

---

## **FASE 3: Bombo 3D y Física Avanzada**

| # | Tarea | Detalles |
|---|-------|----------|
| 3.1 | Escena Canvas 3D | Renderizado de alta fidelidad mediante `<canvas>` con simulación de profundidad y perspectiva. |
| 3.2 | Motor de Física (PhysicsEngine) | Implementación de `Vector3` para posición, velocidad y aceleración. Gravedad y fricción realistas. |
| 3.3 | Simulación de Bolas | 15-20 bolas físicas con detección de colisiones contra las paredes de la esfera y rebote elástico. |
| 3.4 | Rotación Multi-eje | Bombo con rotación sobre eje arbitrario (Fórmula de Rodrigues) para un movimiento de "tumbado" dinámico. |
| 3.5 | Secuencia de Extracción Cinemática | Bola seleccionada viaja al centro -> Escalado -> Giro 720° -> Reveal con iluminación dinámica. |
| 3.6 | Zona número extraído | Superposición UI con tipografía Dela Gothic One y efectos de brillo según el tema activo. |
| 3.7 | Botón jugar/pausar | Estado reactivo: "JUGAR", "PAUSAR", "CONTINUAR" con iconos dinámicos. |
| 3.8 | Historial últimos números | Lista horizontal de bolas 3D estáticas mostrando la secuencia de salida reciente. |

---

## **FASE 4: Sistema de Audio (Web Audio API + TTS)**

| # | Tarea | Detalles |
|---|-------|----------|
| 4.1 | Crear clase `AudioManager` en `js/audio.js` | `AudioContext`, `GainNode` para volumen master, estado mute. |
| 4.2 | Sintetizar sonido bombo girando | Oscilador de baja frecuencia (40-60Hz) + ruido blanco filtrado. Fade in/out. |
| 4.3 | Sintetizar sonido bola cayendo | "Pop" con oscilador decreciente (800Hz→200Hz, 100ms) + envelope ADSR. |
| 4.4 | Sintetizar sonido línea | Secuencia de 3 tonos ascendentes (Do-Mi-Sol) con reverb. |
| 4.5 | Sintetizar sonido bingo | Fanfarria: secuencia más larga (5-6 notas) con armonía, más volumen. |
| 4.6 | Implementar TTS `SpeechSynthesis` | `lang: 'es-ES'`, buscar voz española disponible, fallback a default. |
| 4.7 | Método `announceNumber(n)` | Locutar "¡El [número]!" — números especiales: "¡El uno!", "¡El noventa!". |
| 4.8 | Métodos `announceLine(player)` / `announceBingo(player)` | Con nombre del jugador o genérico si no hay jugadores registrados. |
| 4.9 | Control de volumen y mute | `GainNode.gain.value` para volumen (0-1). TTS usa `utterance.volume`. |
| 4.10 | Sincronización con animaciones | Promesas para esperar fin de audio antes de continuar secuencia. |

---

## **FASE 5: Sistema de Temas (Aesthetics)**

| # | Tarea | Detalles |
|---|-------|----------|
| 5.1 | Variables CSS Unificadas | `--color-bg`, `--color-panel`, `--color-border`, `--color-accent`, `--color-secondary`, `--font-heading`, `--font-ui`. |
| 5.2 | Tema Light (Apple) | Diseño Apple-inspired: Blanco/Gris claro, acento Azul Apple (#007aff), minimalismo extremo. |
| 5.3 | Tema Dark (Material) | Android Material Dark: Superficies elevadas (#1e1e1e), acento Neon Rose (#ff2a6d). |
| 5.4 | Tema Wood (Classic) | Estilo Club Profesional: Caoba (#1c1410), fieltro verde oliva (#2d5a27), detalles en bronce. |
| 5.5 | Tema Metal (Cybernetic) | Futurista: Fondo ultra-oscuro (#0a0a12), neones Cian/Magenta, texturas de circuitos. |
| 5.6 | Tema Steampunk (Victorian) | Industrial: Bronce (#cd7f32), cobre, texturas de cuero y metal remachado. |
| 5.7 | Tema Glass (Crystal) | Crystalline: Fondo azul profundo, glassmorphism con desenfoque, reflejos de joya. |
| 5.8 | Transiciones de Estado | Animaciones fluidas al cambiar entre temas mediante inyección de variables dinámicas. |

---

## **FASE 6: Generación de Cartones Españoles**

| # | Tarea | Detalles |
|---|-------|----------|
| 6.1 | Crear clase `CardGenerator` en `js/cards.js` | Algoritmo para cartones válidos según reglas españolas. |
| 6.2 | Distribución por columnas | `getColumnNumbers(colIndex)`: Col 0→1-9, Col 1→10-19, ..., Col 8→80-90. |
| 6.3 | Algoritmo de 5 números por fila | Para cada fila, seleccionar 5 columnas. Asegurar que cada columna tenga 1-3 números en total. |
| 6.4 | Validación completa | 15 números totales, 5 por fila, máximo 3 por columna, números en rango correcto. |
| 6.5 | Método `generateCard()` | Retorna `{ id, numbers: [[...], [...], [...]] }` donde null = casilla vacía. |
| 6.6 | Método `generateUniqueCards(n)` | Set de IDs de cartón (hash de números) para evitar duplicados. |
| 6.7 | Método `printCards(cards)` | Genera HTML para impresión con CSS `@media print`. Abre ventana de impresión. |

---

## **FASE 7: Gestión Inteligente de Jugadores**

| # | Tarea | Detalles |
|---|-------|----------|
| 7.1 | Crear clase `PlayerManager` en `js/players.js` | Lista de jugadores `{ id, name, cards[], visibleCards[], recentHit }`. |
| 7.2 | Método `addPlayer(name, numCards)` | Crear jugador, generar cartones únicos, añadir a lista. |
| 7.3 | Método `removePlayer(id)` | Eliminar jugador y sus cartones. |
| 7.4 | Método `markNumber(number)` | Recorrer todos los cartones, marcar número, detectar líneas/bingos, actualizar `recentHit`. |
| 7.5 | Método `getVisiblePlayers(max=10)` | Retornar hasta 10 jugadores. Priorizar los que tienen `recentHit: true`. |
| 7.6 | Algoritmo de reordenación inteligente | Si jugador fuera del top 10 acierta: intercambiar con jugador visible sin acierto reciente. Mantener posiciones estables. |
| 7.7 | Método `getVisibleCards(playerId, max=2)` | Retornar hasta 2 cartones. Priorizar los que tienen acierto reciente. |
| 7.8 | Tracking de líneas/bingos por jugador | `player.lines[]`, `player.bingos[]` con timestamp y cartón. |

---

## **FASE 8: UI de Jugadores (Franja Inferior)**

| # | Tarea | Detalles |
|---|-------|----------|
| 8.1 | Layout franja en `css/components.css` | `.players-bar`: altura fija (~25vh), flex horizontal, scroll-x si >10 jugadores. |
| 8.2 | Componente jugador | `.player-card`: nombre, indicador de cartones (ej: "3 cartones"), mini-cartones visibles (máx 2). |
| 8.3 | Mini-cartón visual | Grid 3×9 miniatura, números marcados con punto/color diferente, números pendientes en gris. |
| 8.4 | Indicador de acierto reciente | Highlight/pulse en jugador y cartón cuando el número recién extraído coincide. |
| 8.5 | Expandir jugador (modal/overlay) | Click en jugador → modal con todos sus cartones en tamaño legible. |
| 8.6 | Scroll suave para +10 jugadores | `overflow-x: auto`, `scroll-snap-type`, indicadores de "más jugadores" a los lados. |
| 8.7 | Animación de reordenación | Transición suave cuando un jugador entra/sale del viewport visible. |
| 8.8 | Celebración línea/bingo | Overlay fullscreen: nombre ganador, cartón ampliado con línea/bingo resaltado, botón continuar. |

---

## **FASE 9: Panel de Configuración**

| # | Tarea | Detalles |
|---|-------|----------|
| 9.1 | Modal configuración en `index.html` + `js/settings.js` | `.settings-modal` con backdrop, secciones organizadas. |
| 9.2 | Sección Tema | Grid de previews visuales (mini thumbnails), selección con borde activo. |
| 9.3 | Sección Modo de Juego | Toggle "Manual / Automático". Si auto: slider segundos (1-30, default 5). |
| 9.4 | Sección Audio | Slider volumen (0-100%), botón mute (icono speaker), label "Silencio" cuando muted. |
| 9.5 | Sección Límites | Inputs numéricos para líneas y bingos. Valor 0 → mostrar "∞", sin límite. |
| 9.6 | Sección Jugadores | Lista de jugadores con botón eliminar. Botón "+ Añadir jugador" → mini-form (nombre + nº cartones). |
| 9.7 | Botón Imprimir Cartones | Solo visible si hay jugadores. Llama a `CardGenerator.printCards()`. |
| 9.8 | Botón Reiniciar Juego | Confirmación "¿Seguro?", opción "Solo juego" vs "Todo (incluye jugadores)". |
| 9.9 | Clase `SettingsManager` | Centraliza getters/setters, emite eventos `settings:changed`. |

---

## **FASE 10: Persistencia (localStorage)**

| # | Tarea | Detalles |
|---|-------|----------|
| 10.1 | Crear clase `StorageManager` en `js/storage.js` | Keys: `bingo_settings`, `bingo_game`, `bingo_players`. |
| 10.2 | Guardar configuración | Tema, modo, volumen, timer, límites. Auto-save con debounce en cada cambio. |
| 10.3 | Guardar estado del juego | `{ drawnNumbers, currentNumber, gameState, linesCount, bingosCount }`. |
| 10.4 | Guardar jugadores | Array con `{ id, name, cards, markedNumbers, lines, bingos }`. |
| 10.5 | Restaurar al cargar | Detectar datos existentes, aplicar configuración, si hay partida → modal "¿Continuar partida anterior?". |
| 10.6 | Método `clearGame()` | Limpiar solo estado de juego (mantiene jugadores y config). |
| 10.7 | Método `clearAll()` | Limpiar todo localStorage del bingo. |

---

## **FASE 11: Controles e Interacción**

| # | Tarea | Detalles |
|---|-------|----------|
| 11.1 | Event listener tecla Espacio en `js/app.js` | `document.addEventListener('keydown')`. Prevenir scroll (`e.preventDefault()`). |
| 11.2 | Lógica Espacio modo manual | Si `gameState !== 'finished'`: llamar `drawNumber()`. |
| 11.3 | Lógica Espacio modo automático | Toggle `gameState` entre 'playing' y 'paused'. Iniciar/detener timer. |
| 11.4 | Timer automático | `setInterval` con segundos configurados. Llamar `drawNumber()` en cada tick. |
| 11.5 | Auto-pausa en línea/bingo | Detectar evento `bingo:line` o `bingo:bingo` → pausar timer, mostrar celebración. |
| 11.6 | Continuar tras celebración | Botón o Espacio para cerrar overlay y reanudar (si modo auto). |
| 11.7 | Fin de juego | Cuando `availableNumbers.length === 0` o límite de bingos alcanzado → `gameState = 'finished'`. |

---

## **FASE 12: Pulido Final**

| # | Tarea | Detalles |
|---|-------|----------|
| 12.1 | Optimizar animaciones | `will-change` en elementos animados, usar `transform` y `opacity` preferentemente. |
| 12.2 | Accesibilidad | `role="button"`, `aria-label`, `aria-live` para anuncios, focus ring visible. |
| 12.3 | Responsive TV/Monitor | Testear 1080p, 1440p, 4K. Usar `clamp()` para font-sizes, `vh/vw` para layout. |
| 12.4 | Estados edge case | Sin jugadores (ocultar franja), 90 números extraídos (deshabilitar botón), TTS no disponible (fallback silencioso). |
| 12.5 | Loading inicial | Spinner o animación mientras carga AudioContext (requiere interacción usuario). |
| 12.6 | Favicon y meta tags | Favicon bola de bingo, `<title>`, Open Graph tags. |
| 12.7 | Testing manual E2E | Flujo completo: config → jugadores → juego manual → auto → línea → bingo → imprimir → reset. |

---

### Diagrama de Clases Principal

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   BingoEngine   │────▶│  PlayerManager  │────▶│  CardGenerator  │
│  - drawNumber() │     │  - markNumber() │     │  - generateCard │
│  - checkLine()  │     │  - getVisible() │     │  - printCards() │
│  - checkBingo() │     │  - reorder()    │     └─────────────────┘
└────────┬────────┘     └─────────────────┘
         │ events
         ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   AudioManager  │     │ SettingsManager │     │ StorageManager  │
│  - playSFX()    │◀───▶│  - get/set()    │◀───▶│  - save/load()  │
│  - announce()   │     │  - onChange()   │     │  - clear()      │
└─────────────────┘     └─────────────────┘     └─────────────────┘
         ▲                      ▲
         │                      │
         ▼                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                           App (app.js)                          │
│  - Inicializa todos los módulos                                 │
│  - Conecta eventos entre clases                                 │
│  - Gestiona UI global (drum.js, ui.js)                         │
│  - Event listeners (Espacio, clicks)                            │
└─────────────────────────────────────────────────────────────────┘
```

---

### Resumen de Interacción Tecla Espacio

| Estado del Juego | Modo Manual | Modo Automático |
|------------------|-------------|-----------------|
| `idle` | Extrae la **primera bola** para comenzar. | Inicia el **temporizador** y extrae la primera bola. |
| `playing` | Extrae la **siguiente bola**. | **Pausa** el temporizador (detiene el flujo). |
| `paused` | Extrae la **siguiente bola** (vuelve a `playing`). | **Reanuda** el temporizador (continúa el flujo). |
| `celebrating` | Cierra la celebración y permite extraer la siguiente. | Cierra la celebración y **reanuda el flujo** automático. |
| `finished` | El juego ha terminado (90 bolas o límite de bingos). | — |

---

### Notas Técnicas

- **Web Audio API**: Requiere interacción del usuario antes de crear `AudioContext`. El primer click/espacio inicializa el audio.
- **TTS**: `speechSynthesis.getVoices()` puede estar vacío inicialmente. Usar evento `voiceschanged`.
- **CSS 3D Bombo**: Performance crítica. Limitar número de elementos, usar `backface-visibility: hidden`.
- **localStorage**: Límite ~5MB. Los cartones son compactos, no debería haber problema.
