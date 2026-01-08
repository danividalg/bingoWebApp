# 🎱 BINGO // AVNT-GRD

<div align="center">

![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![Web Audio API](https://img.shields.io/badge/Web_Audio_API-FF6B6B?style=for-the-badge&logo=audio&logoColor=white)
![AI Generated](https://img.shields.io/badge/100%25_AI_Generated-8A2BE2?style=for-the-badge&logo=githubcopilot&logoColor=white)

**Aplicación web de Bingo estilo TV con estética Avant-Garde anti-genérica**

[Demo](#-demo--cómo-ejecutar) • [Características](#-características-principales) • [Desarrollo con IA](#-desarrollo-100-con-ia) • [Tecnologías](#️-tecnologías)

</div>

---

## 📖 Descripción

**BINGO // AVNT-GRD** es una aplicación web de Bingo diseñada para pantallas grandes (TV/Monitor) que combina:

- 🎰 **Bombo 3D animado** renderizado con CSS puro (sin Three.js)
- 🔊 **Audio generativo** mediante Web Audio API con sonidos sintetizados
- 🗣️ **Locución en español** usando Speech Synthesis (TTS)
- 🎨 **6 temas visuales únicos** intercambiables en tiempo real
- 👥 **Gestión inteligente de jugadores** con cartones españoles oficiales (9x3)
- 💾 **Persistencia completa** en LocalStorage

El diseño sigue la filosofía **"Intentional Minimalism"** — rechazando estéticas genéricas de templates en favor de direcciones tonales audaces y distintivas.

---

## 🚀 Demo / Cómo Ejecutar

```bash
# No requiere instalación, servidor, ni dependencias externas
# Simplemente abre el archivo en tu navegador:

index.html
```

### Requisitos
- 🌐 Navegador moderno (Chrome recomendado para mejor compatibilidad con TTS)
- 🔊 Speakers/Audio habilitado para la experiencia completa

### Controles
| Tecla | Acción |
|-------|--------|
| `Espacio` | Extraer bola (manual) / Play-Pause (automático) |
| `Click` en bombo | Misma función que Espacio |

---

## ✨ Características Principales

### 🎰 Bombo 3D CSS Puro
Cilindro 3D modelado con 12 caras CSS, rotación continua animada, y bolas decorativas flotantes con delays aleatorios. La extracción incluye una secuencia cinematográfica: aparición → salida → giro 720° → escalado → reveal del número.

### 🔊 Audio Sintético + TTS
- **SFX generados**: Bombo girando (oscilador 40-60Hz), pop de bola (sweep 800→200Hz), fanfarrias de línea/bingo
- **Locución española**: "¡El treinta y tres!" con voces nativas del sistema
- **Sincronización**: Promesas que esperan fin de audio antes de continuar

### 🎨 6 Temas Visuales

| Tema | Estética |
|------|----------|
| ☀️ **Light** | Elegante crema con acentos dorado/azul marino |
| 🌙 **Dark** | Alto contraste con neones cyan/magenta |
| 🪵 **Wood** | Texturas tierra, bolas clásicas rojo/blanco |
| ⚙️ **Metal** | Gradientes metálicos, aspecto industrial |
| 💜 **Cyberpunk** | Scanlines, glitch, neones saturados |
| 🔮 **Glass** | Glassmorphism con blur y transparencias |

### 🎫 Cartones Españoles Oficiales
- Grid **9 columnas × 3 filas**
- **5 números por fila** (15 totales)
- Distribución por columnas: 1-9, 10-19, ..., 80-90
- Generación con validación de reglas oficiales

### 👥 Gestión de Jugadores
- Hasta 10 jugadores visibles con scroll inteligente
- Reordenación automática basada en aciertos recientes
- Mini-cartones con estado visual de números marcados
- Celebraciones fullscreen para líneas y bingos

### 💾 Persistencia Completa
- Configuración (tema, modo, volumen)
- Estado del juego (números extraídos, puntuación)
- Jugadores y sus cartones
- Modal "¿Continuar partida anterior?" al recargar

---

## 🤖 Desarrollo 100% con IA

> **TODO el código de este proyecto fue generado por Inteligencia Artificial**
> 
> Utilizando GitHub Copilot (Claude) siguiendo un plan maestro estructurado en 12 fases, también creado por IA.

### 📋 El Plan Maestro

El archivo [`plan-bingoWebApp.md`](plan-bingoWebApp.md) contiene:
- Arquitectura completa de archivos
- 12 fases con tareas detalladas numeradas
- Diagrama de clases y relaciones
- Especificaciones técnicas (Web Audio, TTS, CSS 3D)
- Tabla de estados e interacciones

### 🤖 Sistema de Agentes y Prompts

La carpeta `.github/` contiene la infraestructura de prompts que permite la generación consistente:

```
.github/
├── copilot-instructions.md      # Instrucciones base del sistema
├── agents/
│   ├── orquestador.agent.md     # Agente gestor (NO escribe código)
│   └── front-developer.agent.md # Agente implementador
└── prompts/
    └── develop-front.prompt.md  # Template de invocación
```

#### 📄 `copilot-instructions.md`
Define el **rol base**: "Senior Frontend Architect & Avant-Garde UI Designer" con 15+ años de experiencia. Establece:
- Directivas operacionales (Zero Fluff, Output First)
- Uso de herramientas MCP (SonarQube, Chrome DevTools)
- Filosofía de diseño "Intentional Minimalism"
- Protocolo "ULTRATHINK" para análisis profundo

#### 🎭 `orquestador.agent.md`
Agente **gestor** que:
- Lee y comprende el plan maestro
- Desglosa las fases en tareas individuales
- Delega cada tarea al front-developer
- Trackea progreso con marcadores `#todo` / `#done`
- **NUNCA** escribe código directamente

#### 👨‍💻 `front-developer.agent.md`
Agente **implementador** que:
- Recibe tareas aisladas del orquestador
- Escribe código production-ready
- Valida con SonarQube MCP (quality/security)
- Verifica con Chrome DevTools (functional)
- Reporta estado al orquestador

#### 📝 `develop-front.prompt.md`
Template para invocar al front-developer con contexto aislado y estructura consistente.

### 🔄 Flujo de Trabajo

```
┌─────────────────────────────────────────────────────────────────┐
│                         FLUJO DE DESARROLLO                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   👤 Usuario                                                     │
│      │                                                           │
│      ▼ proporciona                                               │
│   📋 Plan Maestro (.md)                                         │
│      │                                                           │
│      ▼ lee y desglosa                                           │
│   🎭 ORQUESTADOR                                                │
│      │ crea tareas #todo                                        │
│      │                                                           │
│      ▼ delega                                                    │
│   👨‍💻 FRONT-DEVELOPER                                           │
│      │                                                           │
│      ├──▶ Implementa código                                     │
│      ├──▶ Valida con SonarQube                                  │
│      ├──▶ Verifica con DevTools                                 │
│      │                                                           │
│      ▼ reporta                                                   │
│   🎭 ORQUESTADOR                                                │
│      │ marca #done                                               │
│      │                                                           │
│      ▼ siguiente tarea...                                       │
│   🔁 Repite hasta completar fase                                │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📁 Estructura del Proyecto

```
Bingo/
├── index.html                  # Estructura semántica principal
├── plan-bingoWebApp.md         # Plan maestro del desarrollo
├── README.md                   # Este archivo
│
├── css/
│   ├── styles.css              # Layout y estilos base + variables
│   ├── animations.css          # Animaciones bombo/bolas 3D
│   ├── components.css          # Modales, botones, tarjetas, jugadores
│   └── themes/
│       ├── light.css           # ☀️ Tema claro elegante
│       ├── dark.css            # 🌙 Tema oscuro neón
│       ├── wood.css            # 🪵 Tema madera clásico
│       ├── metal.css           # ⚙️ Tema metálico industrial
│       ├── cyberpunk.css       # 💜 Tema cyberpunk glitch
│       └── glass.css           # 🔮 Tema glassmorphism
│
├── js/
│   ├── app.js                  # Inicialización y orquestación
│   ├── bingo-engine.js         # Lógica del juego (EventTarget)
│   ├── drum.js                 # Bombo 3D y animaciones
│   ├── cards.js                # Generación cartones españoles
│   ├── players.js              # Gestión de jugadores
│   ├── audio.js                # Web Audio API + TTS
│   ├── storage.js              # Persistencia localStorage
│   ├── settings.js             # Configuración y modal
│   └── ui.js                   # Interacciones UI
│
└── .github/
    ├── copilot-instructions.md # Instrucciones base IA
    ├── agents/
    │   ├── orquestador.agent.md
    │   └── front-developer.agent.md
    └── prompts/
        └── develop-front.prompt.md
```

---

## 🛠️ Tecnologías

### Core
- **HTML5** — Estructura semántica con `<header>`, `<main>`, `<section>`, modales
- **CSS3** — Grid, Flexbox, 3D Transforms, Custom Properties, Keyframes
- **JavaScript ES6+** — Modules, Classes, EventTarget, async/await

### APIs del Navegador
- **Web Audio API** — AudioContext, OscillatorNode, GainNode para SFX sintéticos
- **SpeechSynthesis API** — Locución TTS en español
- **LocalStorage API** — Persistencia de estado

### Sin Dependencias Externas
- ❌ No jQuery
- ❌ No React/Vue/Angular
- ❌ No Three.js
- ❌ No librerías de audio
- ✅ 100% Vanilla

---

## 🎮 Estados del Juego

| Estado | Modo Manual | Modo Automático |
|--------|-------------|-----------------|
| `idle` | Extrae primera bola | Inicia timer + primera bola |
| `playing` | Extrae siguiente bola | Pausa timer |
| `paused` | — | Reanuda timer |
| `celebrating` | Cierra overlay | Cierra + reanuda |
| `finished` | Deshabilitado | Deshabilitado |

---

## 📜 Licencia

MIT License

```
Copyright (c) 2026

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software...
```

---

<div align="center">

**Hecho con 🤖 por IA, para humanos**

*"Every element must have a purpose. If it has no purpose, delete it."*

</div>
