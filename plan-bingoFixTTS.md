## Plan: Modal de Diagnóstico TTS para Android TVBox

**TL;DR:** Crear un modal de error persistente con información diagnóstica completa sobre fallos de TTS, botón para copiar al portapapeles, y control de sesión para mostrarlo solo una vez. Sin fallback visual adicional para el número cantado.

---

### Steps

1. **Añadir HTML del modal de diagnóstico** en [index.html](index.html): Crear `#diagnostic-modal` después del confirm modal, con `.modal-header` (icono warning + título + botón cerrar), `.modal-body` scrollable con `<div id="diagnostic-content">` para contenido dinámico, y `.modal-footer` con botón "Copiar información" y botón "Cerrar".

2. **Crear método `showDiagnosticModal(config)`** en [ui.js](js/ui.js): Función que recibe `{ title, errorMessage, diagnosticData }`, verifica `sessionStorage.getItem('tts-error-shown')`, si ya se mostró retorna sin hacer nada, renderiza datos en HTML estructurado, muestra modal, y guarda `sessionStorage.setItem('tts-error-shown', 'true')`.

3. **Implementar función `copyDiagnosticInfo()`** en [ui.js](js/ui.js): Usar `navigator.clipboard.writeText()` con fallback a `document.execCommand('copy')` para compatibilidad con Android 9, formatear datos como texto plano legible, mostrar toast de confirmación "Información copiada" o error si falla.

4. **Añadir método `getTTSDiagnostics()`** en [audio.js](js/audio.js): Retorna objeto con: `{ speechSynthesisAvailable, voicesCount, voicesList, selectedVoice, initTimestamp, lastError, userAgent: navigator.userAgent, platform: navigator.platform }`.

5. **Envolver `speakNumber()` en try/catch** en [audio.js](js/audio.js#L260-L285): Capturar excepciones, llamar a `this.onTTSError(error)` callback que UI registrará para mostrar el modal diagnóstico con datos completos.

6. **Añadir detección proactiva en `loadVoices()`** en [audio.js](js/audio.js#L19-L50): Implementar timeout de 3 segundos, si `getVoices().length === 0` después del timeout, invocar callback `onTTSError` con mensaje "No hay voces TTS disponibles en este dispositivo".

7. **Registrar callback de error TTS en inicialización** en [app.js](js/app.js): Conectar `audioManager.onTTSError` con `ui.showDiagnosticModal()` pasando los diagnósticos formateados.

8. **Añadir estilos del modal diagnóstico** en [components.css](css/components.css): Crear `.diagnostic-modal` con borde izquierdo naranja/rojo como indicador de warning, `.diagnostic-section` con fondo sutil para cada bloque, `.diagnostic-label` en bold, `.diagnostic-value` en `monospace`, `.btn-copy` con icono de portapapeles, y `user-select: text` en `.diagnostic-content` para permitir selección manual.

---

### Estructura del Modal de Diagnóstico

```
┌─────────────────────────────────────────┐
│ ⚠️ Error de Voz (TTS)              [X] │
├─────────────────────────────────────────┤
│ No se pudo reproducir la voz que       │
│ anuncia los números del bingo.         │
│                                         │
│ ─── Información de diagnóstico ───     │
│                                         │
│ Estado TTS:     No disponible          │
│ Voces encontradas: 0                   │
│ Navegador:      Chrome 89.0.4389.90    │
│ Plataforma:     Linux armv7l           │
│ Timestamp:      2026-01-14T15:30:00Z   │
│ Error:          No voices available    │
│                                         │
├─────────────────────────────────────────┤
│  [📋 Copiar información]    [Cerrar]   │
└─────────────────────────────────────────┘
```
