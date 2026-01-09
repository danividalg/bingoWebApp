export class SettingsManager extends EventTarget {
    constructor() {
        super();
        this.state = {
            theme: 'metal',
            mode: 'manual',
            timerDuration: 3,
            volume: 50,
            maxLines: 1,      // Máximo líneas permitidas (0 = infinito)
            maxBingos: 1,     // Máximo bingos permitidos (0 = infinito)
            voiceEnabled: true
        };
        
        // Themes definition for reference/UI generation
        this.themes = [
            { id: 'light', name: 'Light', color: '#f5f5f7' },
            { id: 'dark', name: 'Dark', color: '#1a1a1a' },
            { id: 'glass', name: 'Glass', color: 'linear-gradient(135deg, rgba(255,255,255,0.3), rgba(200,200,200,0.1))' },
            { id: 'steampunk', name: 'Steampunk', color: '#8B4513' },
            { id: 'wood', name: 'Wood', color: '#5D4037' },
            { id: 'metal', name: 'Metal', color: '#1a1a2e' }
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

    resetToDefaults() {
        this.state = {
            theme: 'metal',
            mode: 'manual',
            timerDuration: 3,
            volume: 50,
            maxLines: 1,      
            maxBingos: 1,     
            voiceEnabled: true
        };
        this.saveSettings();
        this.applySettings();
        
        // Update UI elements manually since they are bound to state on init, 
        // but inputs need to reflect new state
        this._updateUIInputs();
    }

    _updateUIInputs() {
        // Update Theme
        const themeGrid = document.querySelector('.theme-grid');
        if (themeGrid) {
            themeGrid.querySelectorAll('.theme-thumbnail').forEach(t => {
                t.classList.toggle('active', t.dataset.theme === this.state.theme);
            });
        }
        
        // Update Mode
        const modeSwitch = document.getElementById('setting-mode');
        if (modeSwitch) {
            modeSwitch.checked = this.state.mode === 'auto';
            document.getElementById('timer-control')?.classList.toggle('disabled', !modeSwitch.checked);
        }

        // Update Ranges
        const updateRange = (id, val, displaySuffix = '') => {
            const el = document.getElementById(id);
            const disp = document.getElementById(id + '-val');
            if (el) el.value = val;
            if (disp) disp.textContent = val + displaySuffix;
        };

        updateRange('setting-timer', this.state.timerDuration, 's');
        updateRange('setting-volume', this.state.volume);
        updateRange('setting-max-lines', this.state.maxLines);
        updateRange('setting-max-bingos', this.state.maxBingos);
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

    // UI Binding - Refactored to reduce cognitive complexity
    bindUI() {
        this._bindThemeSelection();
        this._bindModeSwitch();
        this._bindTimerSlider();
        this._bindVolumeControl();
        this._bindLimitsControls();
    }

    _bindThemeSelection() {
        const themeGrid = document.querySelector('.theme-grid');
        if (!themeGrid) return;

        themeGrid.innerHTML = this.themes.map(t => `
            <div class="theme-thumbnail ${this.state.theme === t.id ? 'active' : ''}" 
                 data-theme="${t.id}" 
                 title="${t.name}">
                 <span class="theme-name">${t.name}</span>
            </div>
        `).join('');

        themeGrid.querySelectorAll('.theme-thumbnail').forEach(el => {
            el.addEventListener('click', () => {
                themeGrid.querySelectorAll('.theme-thumbnail').forEach(t => t.classList.remove('active'));
                el.classList.add('active');
                this.setTheme(el.dataset.theme);
            });
        });
    }

    _bindModeSwitch() {
        const modeSwitch = document.getElementById('setting-mode');
        if (!modeSwitch) return;

        modeSwitch.checked = this.state.mode === 'auto';
        modeSwitch.addEventListener('change', (e) => {
            this.setMode(e.target.checked ? 'auto' : 'manual');
            document.getElementById('timer-control')?.classList.toggle('disabled', !e.target.checked);
        });
    }

    _bindTimerSlider() {
        const timerInput = document.getElementById('setting-timer');
        const timerValue = document.getElementById('setting-timer-val');
        if (!timerInput) return;

        timerInput.value = this.state.timerDuration;
        if (timerValue) timerValue.textContent = `${this.state.timerDuration}s`;
        
        timerInput.addEventListener('input', (e) => {
            if (timerValue) timerValue.textContent = `${e.target.value}s`;
            this.setTimer(Number.parseInt(e.target.value, 10));
        });
    }

    _bindVolumeControl() {
        const volInput = document.getElementById('setting-volume');
        if (!volInput) return;

        volInput.value = this.state.volume;
        volInput.addEventListener('input', (e) => {
            this.setVolume(Number.parseInt(e.target.value, 10));
        });
    }

    _bindLimitsControls() {
        this._bindRangeControl('setting-max-lines', 'setting-max-lines-val', this.state.maxLines, (val) => this.setMaxLines(val));
        this._bindRangeControl('setting-max-bingos', 'setting-max-bingos-val', this.state.maxBingos, (val) => this.setMaxBingos(val));
    }

    _bindRangeControl(inputId, valueId, initialValue, setter) {
        const input = document.getElementById(inputId);
        const valueDisplay = document.getElementById(valueId);
        if (!input) return;

        input.value = initialValue;
        if (valueDisplay) valueDisplay.textContent = initialValue === 0 ? '∞' : initialValue;
        
        input.addEventListener('input', (e) => {
            const val = Number.parseInt(e.target.value, 10);
            if (valueDisplay) valueDisplay.textContent = val === 0 ? '∞' : val;
            setter(val);
        });
    }
}
