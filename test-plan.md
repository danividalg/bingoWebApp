# 🧪 BINGO // AVNT-GRD — Plan de Tests Funcionales

<div align="center">

**Documento de Especificación de Tests Funcionales**

Versión 1.0.0 | Fecha: 2026-01-08

</div>

---

## 📋 Índice

1. [Alcance y Objetivos](#-alcance-y-objetivos)
2. [Prerrequisitos de Testing](#-prerrequisitos-de-testing)
3. [Matriz de Cobertura](#-matriz-de-cobertura)
4. [Tests por Módulo](#-tests-por-módulo)
   - [M1: Motor del Bingo (BingoEngine)](#m1-motor-del-bingo-bingoengine)
   - [M2: Generación de Cartones (CardGenerator)](#m2-generación-de-cartones-cardgenerator)
   - [M3: Gestión de Jugadores (PlayerManager)](#m3-gestión-de-jugadores-playermanager)
   - [M4: Bombo 3D y Animaciones (DrumController)](#m4-bombo-3d-y-animaciones-drumcontroller)
   - [M5: Sistema de Audio (AudioManager)](#m5-sistema-de-audio-audiomanager)
   - [M6: Configuración (SettingsManager)](#m6-configuración-settingsmanager)
   - [M7: Persistencia (StorageManager)](#m7-persistencia-storagemanager)
   - [M8: Interfaz de Usuario (UIManager)](#m8-interfaz-de-usuario-uimanager)
5. [Tests de Integración](#-tests-de-integración)
6. [Tests de Temas Visuales](#-tests-de-temas-visuales)
7. [Tests End-to-End (E2E)](#-tests-end-to-end-e2e)
8. [Tests de Edge Cases y Resiliencia](#-tests-de-edge-cases-y-resiliencia)
9. [Tests de Accesibilidad](#-tests-de-accesibilidad)
10. [Tests de Rendimiento](#-tests-de-rendimiento)
11. [Checklist de Regresión](#-checklist-de-regresión)

---

## 🎯 Alcance y Objetivos

### Objetivo Principal
Verificar que **todas las funcionalidades** de la aplicación BINGO // AVNT-GRD operan correctamente en **escenarios normales y extremos**, garantizando una experiencia libre de errores para uso en eventos en vivo.

### Alcance Funcional

| Área | Cobertura |
|------|-----------|
| Motor del juego | Sorteo, validación de premios, estados |
| Cartones | Generación, validación reglas españolas, impresión |
| Jugadores | CRUD, marcado de números, detección de victorias |
| Audio | SFX sintéticos, TTS en español, control de volumen |
| Temas | 6 temas visuales, transiciones, consistencia |
| Persistencia | Guardar/cargar configuración, estado, jugadores |
| UI | Tablero, bombo, modales, celebraciones, responsividad |

### Fuera de Alcance
- Tests unitarios de código (se usan tests funcionales manuales/browser)
- Pruebas de carga con miles de usuarios concurrentes
- Compatibilidad con navegadores legacy (IE, Safari < 14)

---

## 🔧 Prerrequisitos de Testing

### Entorno
- **Navegador:** Chrome 90+ (recomendado), Firefox 88+, Edge 90+
- **Resolución mínima:** 1920×1080 (Full HD)
- **Audio:** Speakers/auriculares habilitados
- **JavaScript:** Habilitado, sin extensiones bloqueadoras

### Preparación Inicial
1. Limpiar localStorage del dominio antes de cada suite de tests
2. Cerrar todas las pestañas del navegador excepto la de testing
3. Desactivar extensiones de ad-block y audio-block
4. Verificar que `speechSynthesis.getVoices()` retorna voces en español

### Datos de Prueba
- **Nombres de jugadores:** "Jugador 1", "María García", "José Martínez", "Ana López"
- **Cantidad de cartones por jugador:** 1, 2, 3, 5
- **Números específicos a forzar:** (cuando sea posible vía consola)

---

## 📊 Matriz de Cobertura

| Módulo | Tests Unitarios | Tests Integración | Tests E2E |
|--------|:---------------:|:-----------------:|:---------:|
| BingoEngine | 12 | 4 | 2 |
| CardGenerator | 8 | 2 | 1 |
| PlayerManager | 10 | 5 | 2 |
| DrumController | 6 | 2 | 2 |
| AudioManager | 9 | 3 | 1 |
| SettingsManager | 7 | 3 | 2 |
| StorageManager | 8 | 4 | 2 |
| UIManager | 11 | 4 | 3 |
| **TOTAL** | **71** | **27** | **15** |

---

## 🧩 Tests por Módulo

---

### M1: Motor del Bingo (BingoEngine)

#### M1.1 — Inicialización

| ID | Test | Pasos | Resultado Esperado |
|----|------|-------|-------------------|
| M1.1.1 | Estado inicial al cargar | 1. Abrir la aplicación limpia | `gameState === 'idle'`, `availableNumbers.length === 90`, `drawnNumbers.length === 0` |
| M1.1.2 | Reset del motor | 1. Extraer 10 bolas 2. Ejecutar `reset()` | Vuelve al estado inicial, evento `bingo:reset` emitido |

#### M1.2 — Extracción de Números

| ID | Test | Pasos | Resultado Esperado |
|----|------|-------|-------------------|
| M1.2.1 | Extracción válida | 1. Estado `playing` 2. Llamar `drawNumber()` | Retorna número 1-90, `drawnNumbers` incrementa, `availableNumbers` decrementa |
| M1.2.2 | No extrae si no está jugando | 1. Estado `idle` 2. Llamar `drawNumber()` | Retorna `null`, arrays sin cambios |
| M1.2.3 | No extrae si está pausado | 1. Estado `paused` 2. Llamar `drawNumber()` | Retorna `null` |
| M1.2.4 | No extrae si está finished | 1. Estado `finished` 2. Llamar `drawNumber()` | Retorna `null` |
| M1.2.5 | Números no se repiten | 1. Extraer 90 bolas 2. Verificar `drawnNumbers` | Array con 90 valores únicos, sin duplicados |
| M1.2.6 | Evento bingo:draw emitido | 1. Agregar listener 2. Extraer bola | Evento disparado con `detail: { number, drawnNumbers, remainingCount }` |

#### M1.3 — Validación de Premios

| ID | Test | Pasos | Resultado Esperado |
|----|------|-------|-------------------|
| M1.3.1 | checkLine detecta línea | 1. Pasar cartón con fila [5,12,23,34,45] 2. drawnNumbers incluye esos 5 | Retorna `true` o índice de fila |
| M1.3.2 | checkLine no detecta línea incompleta | 1. Fila [5,12,23,34,45] 2. drawnNumbers solo tiene 4 de ellos | Retorna `false` o `-1` |
| M1.3.3 | checkBingo detecta bingo | 1. Cartón con 15 números 2. Todos extraídos | Retorna `true` |
| M1.3.4 | checkBingo no detecta bingo incompleto | 1. Cartón con 15 números 2. Solo 14 extraídos | Retorna `false` |

#### M1.4 — Transiciones de Estado

| ID | Test | Pasos | Resultado Esperado |
|----|------|-------|-------------------|
| M1.4.1 | idle → playing | 1. `start()` en estado idle | `gameState === 'playing'`, evento `bingo:start` |
| M1.4.2 | playing → paused | 1. `pause()` en estado playing | `gameState === 'paused'`, evento `bingo:pause` |
| M1.4.3 | paused → playing | 1. `start()` en estado paused | `gameState === 'playing'` |
| M1.4.4 | Fin automático al agotar bolas | 1. Extraer las 90 bolas | `gameState === 'finished'` tras la última |

---

### M2: Generación de Cartones (CardGenerator)

#### M2.1 — Estructura del Cartón

| ID | Test | Pasos | Resultado Esperado |
|----|------|-------|-------------------|
| M2.1.1 | Matriz 3×9 | 1. Generar cartón | `matrix.length === 3`, cada fila `length === 9` |
| M2.1.2 | 15 números totales | 1. Contar números no-nulos en matrix | Exactamente 15 números |
| M2.1.3 | 5 números por fila | 1. Contar números por fila | Cada fila tiene exactamente 5 números (no 0/null) |

#### M2.2 — Reglas de Distribución por Columnas

| ID | Test | Pasos | Resultado Esperado |
|----|------|-------|-------------------|
| M2.2.1 | Columna 0: rango 1-9 | 1. Verificar números en `matrix[*][0]` | Todos entre 1 y 9 |
| M2.2.2 | Columna 1: rango 10-19 | 1. Verificar números en `matrix[*][1]` | Todos entre 10 y 19 |
| M2.2.3 | Columna 8: rango 80-90 | 1. Verificar números en `matrix[*][8]` | Todos entre 80 y 90 |
| M2.2.4 | Máximo 3 números por columna | 1. Contar números por columna | Ninguna columna tiene más de 3 |
| M2.2.5 | Mínimo 1 número por columna válida | 1. Verificar distribución | Al menos columnas cubiertas según reglas |

#### M2.3 — Generación Batch

| ID | Test | Pasos | Resultado Esperado |
|----|------|-------|-------------------|
| M2.3.1 | Generar N cartones únicos | 1. `generateBatch(10)` | 10 cartones, todos con IDs distintos |
| M2.3.2 | No hay cartones duplicados | 1. Generar 50 cartones 2. Comparar IDs | Todos los IDs únicos |

#### M2.4 — Impresión

| ID | Test | Pasos | Resultado Esperado |
|----|------|-------|-------------------|
| M2.4.1 | printCards abre ventana | 1. Tener jugadores con cartones 2. Click "PRINT CARDS" | Se abre nueva ventana/pestaña con HTML de impresión |
| M2.4.2 | Formato de impresión correcto | 1. Verificar HTML generado | Cartones con grid 3×9, números visibles, celdas vacías marcadas |

---

### M3: Gestión de Jugadores (PlayerManager)

#### M3.1 — CRUD de Jugadores

| ID | Test | Pasos | Resultado Esperado |
|----|------|-------|-------------------|
| M3.1.1 | Añadir jugador | 1. `addPlayer("Test", 2)` | Jugador creado con id, name, 2 cartones |
| M3.1.2 | Añadir múltiples jugadores | 1. Añadir 5 jugadores | `players.length === 5` |
| M3.1.3 | Eliminar jugador | 1. Añadir jugador 2. `removePlayer(id)` | Jugador eliminado del array |
| M3.1.4 | Jugador no encontrado | 1. `removePlayer("id-inexistente")` | No error, array sin cambios |

#### M3.2 — Marcado de Números

| ID | Test | Pasos | Resultado Esperado |
|----|------|-------|-------------------|
| M3.2.1 | Marcar número existente | 1. Jugador con cartón [5,12,...] 2. `markNumber(5)` | `card.hits.has(5) === true` |
| M3.2.2 | Marcar número no existente | 1. Cartón sin el número 7 2. `markNumber(7)` | `hits` sin cambios para ese cartón |
| M3.2.3 | Flag recentHit activado | 1. Marcar número que está en cartón | `player.recentHit === true` |
| M3.2.4 | Indexación eficiente | 1. Verificar `numberIndex` después de añadir jugador | Map contiene los 15 números del cartón con referencias |

#### M3.3 — Detección de Victorias

| ID | Test | Pasos | Resultado Esperado |
|----|------|-------|-------------------|
| M3.3.1 | Evento player:line emitido | 1. Completar una fila del cartón | Evento disparado con `{ player, card, number }` |
| M3.3.2 | No duplicar evento de línea | 1. Completar fila 2. Marcar más números | Evento solo una vez (verificar `card.hasLine`) |
| M3.3.3 | Evento player:bingo emitido | 1. Marcar los 15 números del cartón | Evento disparado |
| M3.3.4 | Estadísticas actualizadas | 1. Conseguir línea y bingo | `player.stats.lines === 1`, `player.stats.bingos === 1` |

#### M3.4 — Ordenamiento Inteligente

| ID | Test | Pasos | Resultado Esperado |
|----|------|-------|-------------------|
| M3.4.1 | getVisiblePlayers retorna máximo N | 1. Añadir 15 jugadores 2. `getVisiblePlayers(10)` | Retorna exactamente 10 |
| M3.4.2 | Prioriza hits recientes | 1. Jugador 11 acierta 2. `getVisiblePlayers(10)` | Jugador 11 está en el resultado |
| M3.4.3 | Score calculado correctamente | 1. Verificar score de jugadores | Score refleja cercanía a ganar (hits/total) |

---

### M4: Bombo 3D y Animaciones (DrumController)

#### M4.1 — Renderizado 3D

| ID | Test | Pasos | Resultado Esperado |
|----|------|-------|-------------------|
| M4.1.1 | Cilindro visible | 1. Cargar página | Elemento `.drum` visible con perspectiva 3D |
| M4.1.2 | 12 caras renderizadas | 1. Inspeccionar DOM | `.drum-face` × 12 con `rotateY` correcto |
| M4.1.3 | Bolas decorativas presentes | 1. Verificar `.drum-balls` | Bolas flotantes con animación |

#### M4.2 — Animaciones

| ID | Test | Pasos | Resultado Esperado |
|----|------|-------|-------------------|
| M4.2.1 | Rotación continua | 1. Observar bombo | Rotación Y suave y constante |
| M4.2.2 | Animación de extracción | 1. Extraer bola | Secuencia: aparición → salida → giro → reveal |
| M4.2.3 | Ball reveal con número | 1. Extraer bola | `#current-ball` muestra número extraído |

#### M4.3 — Historial Visual

| ID | Test | Pasos | Resultado Esperado |
|----|------|-------|-------------------|
| M4.3.1 | Últimos números visibles | 1. Extraer 5 bolas | `.history-track` muestra las 5 bolas |
| M4.3.2 | Máximo de historial | 1. Extraer 10 bolas | Solo los últimos N (5-8) visibles |

---

### M5: Sistema de Audio (AudioManager)

#### M5.1 — Inicialización

| ID | Test | Pasos | Resultado Esperado |
|----|------|-------|-------------------|
| M5.1.1 | AudioContext requiere interacción | 1. Cargar página sin interactuar | `audio.initialized === false` |
| M5.1.2 | AudioContext se crea tras click | 1. Click en cualquier parte | `audio.ctx` existe, `initialized === true` |
| M5.1.3 | Voces TTS cargadas | 1. Verificar `audio.voices` | Array con al menos una voz española |

#### M5.2 — Efectos de Sonido

| ID | Test | Pasos | Resultado Esperado |
|----|------|-------|-------------------|
| M5.2.1 | playBallPop suena | 1. Extraer bola | Sonido "pop" audible (600→100Hz) |
| M5.2.2 | playDrumRoll suena | 1. Antes de extracción | Sonido de ruido blanco filtrado (~2s) |
| M5.2.3 | playWinSound LINE | 1. Conseguir línea | Secuencia de 2 tonos ascendentes |
| M5.2.4 | playWinSound BINGO | 1. Conseguir bingo | Fanfarria más larga (5 notas arpegiadas) |

#### M5.3 — Text-to-Speech

| ID | Test | Pasos | Resultado Esperado |
|----|------|-------|-------------------|
| M5.3.1 | announceNumber básico | 1. Extraer número 42 | TTS dice "¡El cuarenta y dos!" |
| M5.3.2 | Números especiales | 1. Extraer 1, 90 | "¡El uno!", "¡El noventa!" |
| M5.3.3 | announceLine con nombre | 1. Línea de "María" | TTS dice "¡Línea para María!" |
| M5.3.4 | announceBingo con nombre | 1. Bingo de "José" | TTS dice "¡Bingo para José!" |

#### M5.4 — Controles de Volumen

| ID | Test | Pasos | Resultado Esperado |
|----|------|-------|-------------------|
| M5.4.1 | setVolume funciona | 1. `setVolume(0.2)` 2. Reproducir sonido | Volumen reducido perceptiblemente |
| M5.4.2 | toggleMute silencia | 1. `toggleMute()` 2. Reproducir sonido | Sin audio |
| M5.4.3 | toggleMute restaura | 1. Mute activo 2. `toggleMute()` | Audio restaurado al volumen anterior |

---

### M6: Configuración (SettingsManager)

#### M6.1 — Valores por Defecto

| ID | Test | Pasos | Resultado Esperado |
|----|------|-------|-------------------|
| M6.1.1 | Tema inicial | 1. Cargar sin localStorage | `theme === 'light'` |
| M6.1.2 | Modo inicial | 1. Cargar limpio | `mode === 'manual'` |
| M6.1.3 | Volumen inicial | 1. Cargar limpio | `volume === 50` |
| M6.1.4 | Timer inicial | 1. Cargar limpio | `timerDuration === 3` |

#### M6.2 — Cambio de Configuración

| ID | Test | Pasos | Resultado Esperado |
|----|------|-------|-------------------|
| M6.2.1 | setTheme cambia tema | 1. `setTheme('dark')` | CSS cargado de `themes/dark.css` |
| M6.2.2 | setMode cambia modo | 1. Toggle manual→auto | `mode === 'auto'`, timer habilitado |
| M6.2.3 | setVolume actualiza audio | 1. Slider a 80% | `volume === 80`, audio más fuerte |
| M6.2.4 | setTimer actualiza duración | 1. Slider a 5s | `timerDuration === 5` |

#### M6.3 — Eventos

| ID | Test | Pasos | Resultado Esperado |
|----|------|-------|-------------------|
| M6.3.1 | settings:changed emitido | 1. Cambiar cualquier setting | Evento disparado con `detail: state` |

---

### M7: Persistencia (StorageManager)

#### M7.1 — Guardar Datos

| ID | Test | Pasos | Resultado Esperado |
|----|------|-------|-------------------|
| M7.1.1 | saveSettings persiste | 1. Cambiar tema 2. Verificar localStorage | `bingo_settings` contiene nuevo tema |
| M7.1.2 | saveGame persiste | 1. Extraer 5 bolas 2. Verificar storage | `bingo_game` con drawnNumbers |
| M7.1.3 | savePlayers persiste | 1. Añadir jugador 2. Verificar storage | `bingo_players` con array de jugadores |
| M7.1.4 | Debounce funciona | 1. Cambiar setting 3 veces rápido | Solo una escritura final (ver logs) |

#### M7.2 — Cargar Datos

| ID | Test | Pasos | Resultado Esperado |
|----|------|-------|-------------------|
| M7.2.1 | loadSettings restaura | 1. Guardar config 2. Recargar página | Tema y modo restaurados |
| M7.2.2 | loadGame restaura partida | 1. Jugar 10 bolas 2. Recargar | Modal "¿Continuar?" aparece |
| M7.2.3 | loadPlayers restaura jugadores | 1. Añadir jugadores 2. Recargar | Jugadores visibles en UI |

#### M7.3 — Limpiar Datos

| ID | Test | Pasos | Resultado Esperado |
|----|------|-------|-------------------|
| M7.3.1 | clearGame solo borra juego | 1. `clearGame()` | `bingo_game` eliminado, settings y players intactos |
| M7.3.2 | clearAll borra todo | 1. `clearAll()` | Las 3 keys eliminadas del localStorage |

#### M7.4 — Manejo de Errores

| ID | Test | Pasos | Resultado Esperado |
|----|------|-------|-------------------|
| M7.4.1 | JSON corrupto manejado | 1. Poner string inválido en localStorage 2. Cargar | No crash, valores por defecto usados |
| M7.4.2 | Storage lleno manejado | 1. Simular QuotaExceededError | Console.error, aplicación sigue funcionando |

---

### M8: Interfaz de Usuario (UIManager)

#### M8.1 — Tablero de Números

| ID | Test | Pasos | Resultado Esperado |
|----|------|-------|-------------------|
| M8.1.1 | 90 celdas renderizadas | 1. Cargar página | `.bingo-cell` × 90 en grid |
| M8.1.2 | Números 1-90 visibles | 1. Verificar contenido de celdas | Números secuenciales 1 a 90 |
| M8.1.3 | Celda marcada al extraer | 1. Extraer número 42 | Celda 42 tiene clase `.drawn` |
| M8.1.4 | Estilo visual de bola | 1. Verificar CSS de celda | `border-radius: 50%`, gradiente radial |

#### M8.2 — Barra de Jugadores

| ID | Test | Pasos | Resultado Esperado |
|----|------|-------|-------------------|
| M8.2.1 | Jugadores renderizados | 1. Añadir 3 jugadores | 3 `.player-card` visibles |
| M8.2.2 | Mini-cartón visible | 1. Ver tarjeta de jugador | Grid 3×9 miniatura con números |
| M8.2.3 | Indicador de acierto | 1. Marcar número en cartón | Player card con highlight/pulse |
| M8.2.4 | Scroll horizontal | 1. Añadir 15 jugadores | Scroll-x funcional, snap suave |

#### M8.3 — Modales

| ID | Test | Pasos | Resultado Esperado |
|----|------|-------|-------------------|
| M8.3.1 | Modal settings abre | 1. Click icono engranaje | `.settings-modal` visible, `aria-hidden=false` |
| M8.3.2 | Modal settings cierra | 1. Click botón × | Modal oculto, `aria-hidden=true` |
| M8.3.3 | Backdrop cierra modal | 1. Click fuera del contenido | Modal se cierra (si implementado) |

#### M8.4 — Celebraciones

| ID | Test | Pasos | Resultado Esperado |
|----|------|-------|-------------------|
| M8.4.1 | Overlay línea aparece | 1. Conseguir línea | `#celebration-overlay` visible con "¡LÍNEA!" |
| M8.4.2 | Overlay bingo aparece | 1. Conseguir bingo | Overlay con "¡BINGO!" y nombre ganador |
| M8.4.3 | Cerrar overlay con click | 1. Click en overlay | Overlay se oculta |
| M8.4.4 | Cerrar overlay con Espacio | 1. Presionar Espacio | Overlay se oculta |

#### M8.5 — Controles

| ID | Test | Pasos | Resultado Esperado |
|----|------|-------|-------------------|
| M8.5.1 | Botón Play/Pause visible | 1. Verificar `#btn-play-pause` | Botón presente con texto correcto |
| M8.5.2 | Click en bombo extrae | 1. Click en `.drum-stage` | Misma acción que botón play (si implementado) |

---

## 🔗 Tests de Integración

### I1: Motor ↔ UI

| ID | Test | Pasos | Resultado Esperado |
|----|------|-------|-------------------|
| I1.1 | Extracción actualiza tablero | 1. Extraer número 2. Verificar UI | Celda marcada, bola actual mostrada |
| I1.2 | Reset limpia tablero | 1. Jugar varias bolas 2. Reset | Todas las celdas sin `.drawn` |

### I2: Motor ↔ Jugadores

| ID | Test | Pasos | Resultado Esperado |
|----|------|-------|-------------------|
| I2.1 | Número extraído marca cartones | 1. Jugador con número 5 2. Extraer 5 | Cartón marcado automáticamente |
| I2.2 | Línea pausea juego (auto) | 1. Modo auto 2. Conseguir línea | Timer pausado, celebración activa |

### I3: Motor ↔ Audio

| ID | Test | Pasos | Resultado Esperado |
|----|------|-------|-------------------|
| I3.1 | Extracción → Pop + TTS | 1. Extraer número | Sonido pop, luego locución del número |
| I3.2 | Línea → Fanfarria + TTS | 1. Conseguir línea | Sonido victoria + "¡Línea para X!" |

### I4: Settings ↔ Toda la App

| ID | Test | Pasos | Resultado Esperado |
|----|------|-------|-------------------|
| I4.1 | Cambio tema afecta todo | 1. Cambiar a cyberpunk | Tablero, bombo, modales, players bar cambian |
| I4.2 | Cambio modo afecta gameplay | 1. Switch manual→auto | Timer aparece, comportamiento Espacio cambia |

### I5: Storage ↔ Estado Completo

| ID | Test | Pasos | Resultado Esperado |
|----|------|-------|-------------------|
| I5.1 | Recargar mantiene todo | 1. Config + jugadores + juego 2. F5 | Todo restaurado, modal de continuar |
| I5.2 | Continuar partida funciona | 1. Aceptar "Continuar" | Números ya extraídos marcados, jugadores con hits |

---

## 🎨 Tests de Temas Visuales

Para CADA uno de los 6 temas (Light, Dark, Wood, Metal, Cyberpunk, Glass):

### T1: Consistencia Visual

| ID | Test | Resultado Esperado |
|----|------|-------------------|
| T1.1 | Variables CSS cargadas | Colores y fuentes del tema aplicados |
| T1.2 | Tablero legible | Números claramente visibles, contraste suficiente |
| T1.3 | Bombo renderizado | 3D visible con colores del tema |
| T1.4 | Celdas extraídas diferenciadas | Estado `.drawn` claramente visible |
| T1.5 | Modal coherente | Mismo estilo que resto de la app |
| T1.6 | Transición suave | Cambio de tema con animación (0.3s) |

### T2: Características Específicas por Tema

| Tema | Tests Específicos |
|------|-------------------|
| **Light** | Fondo crema visible, acentos dorado/azul marino |
| **Dark** | Alto contraste, efectos glow en acentos cyan/magenta |
| **Wood** | Textura de madera perceptible (si hay), tonos tierra |
| **Metal** | Gradientes metálicos en bombo, aspecto industrial |
| **Cyberpunk** | Scanlines CSS visibles, efecto glitch en animaciones |
| **Glass** | Glassmorphism: blur visible, transparencias, bordes difusos |

---

## 🚀 Tests End-to-End (E2E)

### E2E-1: Flujo Completo — Partida Manual

| Paso | Acción | Verificación |
|------|--------|--------------|
| 1 | Abrir app en limpio | Estado idle, 0 bolas extraídas |
| 2 | Abrir settings | Modal visible |
| 3 | Seleccionar tema Dark | Tema aplicado |
| 4 | Añadir 3 jugadores (2 cartones c/u) | Players bar con 3 tarjetas |
| 5 | Cerrar modal | Modal oculto |
| 6 | Presionar Espacio | Primera bola extraída, audio, TTS |
| 7 | Repetir Espacio 20 veces | Tablero con 21 marcadas |
| 8 | Simular línea (consola si es necesario) | Celebración visible, audio, pausa |
| 9 | Cerrar celebración | Juego continúa |
| 10 | Recargar página | Modal "¿Continuar?" |
| 11 | Aceptar continuar | Estado restaurado perfectamente |
| 12 | Completar hasta bingo | Celebración de bingo |
| 13 | Reset sistema | Todo limpio |

### E2E-2: Flujo Completo — Partida Automática

| Paso | Acción | Verificación |
|------|--------|--------------|
| 1 | Configurar modo AUTO, 2s | Timer visible en UI |
| 2 | Añadir 5 jugadores | Players bar llena |
| 3 | Presionar Espacio | Timer inicia, bolas se extraen cada 2s |
| 4 | Esperar 10 segundos | 5 bolas extraídas automáticamente |
| 5 | Presionar Espacio | Timer pausado |
| 6 | Presionar Espacio | Timer reanudado |
| 7 | Línea detectada | Timer pausa automáticamente |
| 8 | Cerrar celebración | Timer reanuda |
| 9 | Mutear audio | SFX y TTS silenciados |
| 10 | Continuar hasta fin | 90 bolas, estado finished |

### E2E-3: Gestión de Jugadores Avanzada

| Paso | Acción | Verificación |
|------|--------|--------------|
| 1 | Añadir 15 jugadores | Solo 10 visibles, scroll disponible |
| 2 | Extraer número del jugador 12 | Jugador 12 entra al viewport visible |
| 3 | Verificar reordenamiento | Transición suave |
| 4 | Expandir un jugador | Modal/overlay con todos sus cartones |
| 5 | Eliminar jugador | Desaparece de la lista |
| 6 | Imprimir cartones | Ventana de impresión abierta |

---

## ⚠️ Tests de Edge Cases y Resiliencia

### EC1: Estados Límite

| ID | Escenario | Pasos | Resultado Esperado |
|----|-----------|-------|-------------------|
| EC1.1 | 0 jugadores | 1. No añadir jugadores 2. Jugar | App funciona, sin detección de premios |
| EC1.2 | 100+ jugadores | 1. Añadir 100 jugadores | Scroll funciona, no lag significativo |
| EC1.3 | 90 bolas extraídas | 1. Extraer todas | Estado finished, botón deshabilitado |
| EC1.4 | Límite de bingos = 1 | 1. Configurar límite 2. Conseguir 1 bingo | Juego termina tras primer bingo |
| EC1.5 | Límite de líneas = 0 (∞) | 1. Configurar 0 2. Múltiples líneas | Todas celebradas, sin límite |

### EC2: Datos Corruptos

| ID | Escenario | Pasos | Resultado Esperado |
|----|-----------|-------|-------------------|
| EC2.1 | localStorage corrupto | 1. Inyectar JSON inválido | App inicia con defaults, sin crash |
| EC2.2 | Partida inconsistente | 1. drawnNumbers tiene 91 2. Cargar | Manejo graceful, reset sugerido |

### EC3: APIs No Disponibles

| ID | Escenario | Pasos | Resultado Esperado |
|----|-----------|-------|-------------------|
| EC3.1 | TTS sin voces | 1. `speechSynthesis.getVoices() = []` | Fallback silencioso, sin error |
| EC3.2 | AudioContext bloqueado | 1. No interactuar con página | Juego funciona sin audio |

### EC4: Interacciones Rápidas

| ID | Escenario | Pasos | Resultado Esperado |
|----|-----------|-------|-------------------|
| EC4.1 | Spam Espacio | 1. Presionar Espacio 20 veces rápido | Sin duplicados, animaciones no se rompen |
| EC4.2 | Cambiar tema durante animación | 1. Extraer bola 2. Cambiar tema | Transición suave, sin glitch visual |
| EC4.3 | Abrir settings durante celebración | 1. Conseguir línea 2. Click settings | Modal no abre (celebración tiene prioridad) |

---

## ♿ Tests de Accesibilidad

### A11Y-1: ARIA y Semántica

| ID | Test | Verificación |
|----|------|--------------|
| A1.1 | Roles definidos | Botones tienen `role="button"` implícito o explícito |
| A1.2 | aria-label en iconos | Botón settings tiene `aria-label="Settings"` |
| A1.3 | aria-hidden en modales | Modal cerrado tiene `aria-hidden="true"` |
| A1.4 | aria-live para anuncios | Número extraído anunciado a lectores de pantalla |

### A11Y-2: Navegación por Teclado

| ID | Test | Verificación |
|----|------|--------------|
| A2.1 | Tab navega controles | Focus se mueve entre botones, sliders |
| A2.2 | Focus ring visible | Anillo de enfoque claramente visible |
| A2.3 | Escape cierra modal | Modal se cierra con tecla Escape |
| A2.4 | Enter activa botones | Botones focuseados responden a Enter |

### A11Y-3: Contraste y Legibilidad

| ID | Test | Tema | Verificación |
|----|------|------|--------------|
| A3.1 | Contraste mínimo 4.5:1 | Todos | Texto principal vs fondo |
| A3.2 | Contraste en celdas | Dark | Números visibles sobre fondo oscuro |
| A3.3 | Tamaño de fuente mínimo | Todos | Mínimo 14px en texto importante |

---

## ⚡ Tests de Rendimiento

### P1: Métricas de Carga

| ID | Métrica | Umbral Aceptable |
|----|---------|------------------|
| P1.1 | First Contentful Paint | < 1.5s |
| P1.2 | Time to Interactive | < 3s |
| P1.3 | Total Blocking Time | < 300ms |

### P2: Rendimiento en Ejecución

| ID | Escenario | Métrica | Umbral |
|----|-----------|---------|--------|
| P2.1 | Animación bombo 3D | FPS | > 30 FPS constantes |
| P2.2 | Extracción de bola | Latencia | < 100ms hasta UI update |
| P2.3 | Renderizado 100 jugadores | Scroll FPS | > 30 FPS |
| P2.4 | Cambio de tema | Transición | < 500ms completa |

### P3: Memoria

| ID | Escenario | Métrica | Umbral |
|----|-----------|---------|--------|
| P3.1 | Uso base | Heap | < 50MB |
| P3.2 | Después de 90 bolas | Heap | < 70MB |
| P3.3 | Memory leaks | Delta tras 1 hora | < 10MB growth |

---

## ✅ Checklist de Regresión

Ejecutar antes de cada release:

### Funcionalidad Core

- [ ] Extracción de bola funciona (manual)
- [ ] Extracción de bola funciona (auto)
- [ ] Detección de línea correcta
- [ ] Detección de bingo correcta
- [ ] Audio pop suena
- [ ] TTS anuncia número
- [ ] Celebración aparece y cierra
- [ ] Reset limpia todo

### Persistencia

- [ ] Configuración se guarda
- [ ] Partida se restaura
- [ ] Jugadores persisten
- [ ] Modal "¿Continuar?" aparece

### UI

- [ ] Tablero renderiza 90 celdas
- [ ] Bombo 3D visible
- [ ] Modal settings funciona
- [ ] Barra de jugadores scroll funciona

### Temas

- [ ] Light aplicado correctamente
- [ ] Dark aplicado correctamente
- [ ] Wood aplicado correctamente
- [ ] Metal aplicado correctamente
- [ ] Cyberpunk aplicado correctamente
- [ ] Glass aplicado correctamente

### Edge Cases

- [ ] 0 jugadores no crashea
- [ ] 90 bolas termina juego
- [ ] LocalStorage corrupto manejado
- [ ] TTS no disponible manejado

---

## 📝 Notas para Ejecutores de Tests

1. **Prioridad de ejecución:** E2E > Integración > Módulos > Edge Cases
2. **Reportar:** ID del test, resultado (PASS/FAIL), screenshot si FAIL
3. **Ambiente:** Limpiar localStorage entre suites independientes
4. **Timing:** Dar tiempo a animaciones (esperar 2-3s después de acciones)
5. **Audio:** Verificar que speakers no están muteados a nivel OS

---

<div align="center">

**Documento generado con 🧠 ULTRATHINK Protocol**

*"Quality is not an act, it is a habit." — Aristotle*

</div>
