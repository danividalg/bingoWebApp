export class SettingsManager extends EventTarget {
    constructor() {
        super();
        this.state = {
            theme: 'light',
            mode: 'manual',
            timerDuration: 3,
            volume: 50,
            maxLines: 1,      // Máximo líneas permitidas (0 = infinito)
            maxBingos: 1,     // Máximo bingos permitidos (0 = infinito)
            voiceEnabled: true
        };
        
        // Themes definition for reference/UI generation
        this.themes = [
            { id: 'light', name: 'Light', color: '#ffffff' },
            { id: 'dark', name: 'Dark', color: '#1a1a1a' },
            { id: 'glass', name: 'Glass', color: 'rgba(255,255,255,0.2)' },
            { id: 'cyberpunk', name: 'Cyberpunk', color: '#fcee0a' },
            { id: 'wood', name: 'Wood', color: '#8b4513' },
            { id: 'metal', name: 'Metal', color: '#708090' }
        ];

        this.init();
    }

    init() {
        this.loadSettings();
        this.applySettings();
    }

    loadSettings() {
        const stored = localStorage.getItem('bingo_settings');
        if (stored) {
            this.state = { ...this.state, ...JSON.parse(stored) };
        }
    }

    saveSettings() {
        localStorage.setItem('bingo_settings', JSON.stringify(this.state));
        this.dispatchEvent(new CustomEvent('settings:changed', { detail: this.state }));
    }

    // Getters
    get theme() { return this.state.theme; }
    get mode() { return this.state.mode; }
    get timerDuration() { return this.state.timerDuration; }
    get volume() { return this.state.volume; }
    get maxLines() { return this.state.maxLines; }
    get maxBingos() { return this.state.maxBingos; }
    get voiceEnabled() { return this.state.voiceEnabled; }

    // Setters
    setTheme(id) {
        if (this.state.theme === id) return;
        this.state.theme = id;
        this.applyTheme();
        this.saveSettings();
    }

    setMode(mode) {
        this.state.mode = mode;
        this.saveSettings();
    }

    setTimer(seconds) {
        this.state.timerDuration = seconds;
        this.saveSettings();
    }

    setMaxLines(val) {
        this.state.maxLines = val;
        this.saveSettings();
    }

    setMaxBingos(val) {
        this.state.maxBingos = val;
        this.saveSettings();
    }

    setVolume(val) {
        this.state.volume = val;
        this.applyAudio();
        this.saveSettings();
    }

    applyTheme() {
        const themeLink = document.getElementById('theme-style');
        if (themeLink) {
            themeLink.href = `css/themes/${this.state.theme}.css`;
        }
        // Also update any specialized UI classes if needed
        document.body.dataset.theme = this.state.theme;
    }

    applyAudio() {
        // Dispatch specific audio event or let Audio manager listen to settings:changed
        // For now, just save.
    }

    applySettings() {
        this.applyTheme();
        this.applyAudio();
    }

    // UI Binding
    bindUI() {
        // Theme Selection
        const themeGrid = document.querySelector('.theme-grid');
        if (themeGrid) {
            themeGrid.innerHTML = this.themes.map(t => `
                <div class="theme-thumbnail ${this.state.theme === t.id ? 'active' : ''}" 
                     data-theme="${t.id}" 
                     style="background: ${t.color};"
                     title="${t.name}">
                     <span class="theme-name">${t.name}</span>
                </div>
            `).join('');

            themeGrid.querySelectorAll('.theme-thumbnail').forEach(el => {
                el.addEventListener('click', () => {
                    // Update UI state immediately
                    themeGrid.querySelectorAll('.theme-thumbnail').forEach(t => t.classList.remove('active'));
                    el.classList.add('active');
                    this.setTheme(el.dataset.theme);
                });
            });
        }

        // Mode Slider
        const modeSwitch = document.getElementById('setting-mode');
        if (modeSwitch) {
            modeSwitch.checked = this.state.mode === 'auto';
            modeSwitch.addEventListener('change', (e) => {
                this.setMode(e.target.checked ? 'auto' : 'manual');
                // Toggle slider visibility
                document.getElementById('timer-control').classList.toggle('disabled', !e.target.checked);
            });
        }

        // Timer Slider
        const timerInput = document.getElementById('setting-timer');
        const timerValue = document.getElementById('setting-timer-val');
        if (timerInput) {
            timerInput.value = this.state.timerDuration;
            if(timerValue) timerValue.textContent = `${this.state.timerDuration}s`;
            
            timerInput.addEventListener('input', (e) => {
                if(timerValue) timerValue.textContent = `${e.target.value}s`;
                this.setTimer(Number.parseInt(e.target.value, 10));
            });
        }

        // Volume
        const volInput = document.getElementById('setting-volume');
        if (volInput) {
            volInput.value = this.state.volume;
            volInput.addEventListener('input', (e) => {
                this.setVolume(Number.parseInt(e.target.value, 10));
            });
        }

        // Limits: Max Lines
        const maxLinesInput = document.getElementById('setting-max-lines');
        const maxLinesValue = document.getElementById('setting-max-lines-val');
        if (maxLinesInput) {
            maxLinesInput.value = this.state.maxLines;
            if (maxLinesValue) maxLinesValue.textContent = this.state.maxLines === 0 ? '∞' : this.state.maxLines;
            
            maxLinesInput.addEventListener('input', (e) => {
                const val = Number.parseInt(e.target.value, 10);
                if (maxLinesValue) maxLinesValue.textContent = val === 0 ? '∞' : val;
                this.setMaxLines(val);
            });
        }

        // Limits: Max Bingos
        const maxBingosInput = document.getElementById('setting-max-bingos');
        const maxBingosValue = document.getElementById('setting-max-bingos-val');
        if (maxBingosInput) {
            maxBingosInput.value = this.state.maxBingos;
            if (maxBingosValue) maxBingosValue.textContent = this.state.maxBingos === 0 ? '∞' : this.state.maxBingos;
            
            maxBingosInput.addEventListener('input', (e) => {
                const val = Number.parseInt(e.target.value, 10);
                if (maxBingosValue) maxBingosValue.textContent = val === 0 ? '∞' : val;
                this.setMaxBingos(val);
            });
        }
    }
}
