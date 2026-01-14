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
            voiceEnabled: true,
            performanceMode: 'low', // 'high', 'low', 'disabled'
            maxHeight: 100 // % height
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
        this._setupResizeListener();
    }

    loadSettings() {
        const stored = localStorage.getItem('bingo_settings');
        if (stored) {
            const parsed = JSON.parse(stored);
            this.state = { ...this.state, ...parsed };
            
            // Migration for performanceMode (boolean -> string)
            if (typeof this.state.performanceMode === 'boolean') {
                this.state.performanceMode = this.state.performanceMode ? 'low' : 'high';
            }
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
            voiceEnabled: true,
            performanceMode: 'high',
            maxHeight: 100
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

        // Update Pelect = document.getElementById('setting-performance');
        if (perfSelect) {
            perfSelect.value = this.state.performanceMode;
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
        updateRange('setting-max-height', this.state.maxHeight, '%');
    }

    // Getters
    get theme() { return this.state.theme; }
    get mode() { return this.state.mode; }
    get timerDuration() { return this.state.timerDuration; }
    get volume() { return this.state.volume; }
    get maxLines() { return this.state.maxLines; }
    get maxBingos() { return this.state.maxBingos; }
    get voiceEnabled() { return this.state.voiceEnabled; }
    get performanceMode() { return this.state.performanceMode; }
    get maxHeight() { return this.state.maxHeight; }

    setPerformanceMode(mode) {
        this.state.performanceMode = mode;
        this.saveSettings();
    }

    setMaxHeight(val) {
        this.state.maxHeight = val;
        this.applyMaxHeight();
        this.saveSettings();
    }

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

    applyMaxHeight() {
        const heightPercent = this.state.maxHeight;
        const appContainer = document.querySelector('.app-container');
        
        if (appContainer) {
            // Calculate actual pixel height based on viewport
            const viewportHeight = window.innerHeight;
            const appHeight = (viewportHeight * heightPercent) / 100;
            
            // Set app container height directly instead of using transform
            appContainer.style.height = `${appHeight}px`;
            appContainer.style.width = '100vw';
            
            // Remove any transform (cleanup from previous approach)
            appContainer.style.transform = 'none';
        }
        
        // Calculate UI scale for elements that need proportional sizing
        const scale = heightPercent / 100;
        document.documentElement.style.setProperty('--ui-scale', Math.max(0.6, scale));
        document.documentElement.style.setProperty('--app-height-limit', heightPercent + '%');
        document.documentElement.style.setProperty('--actual-app-height', `${(window.innerHeight * heightPercent) / 100}px`);
    }
    
    // Recalculate on window resize to maintain proportions
    _setupResizeListener() {
        if (this._resizeListenerAttached) return;
        this._resizeListenerAttached = true;
        
        window.addEventListener('resize', () => {
            // Debounce resize handling
            clearTimeout(this._resizeTimeout);
            this._resizeTimeout = setTimeout(() => {
                this.applyMaxHeight();
            }, 100);
        });
    }

    applySettings() {
        this.applyTheme();
        this.applyAudio();
        this.applyMaxHeight();
    }

    // UI Binding
    bindUI() {
        this._bindThemeSelection();
        this._bindModeSwitch();
        this._bindPerformanceSwitch();
        this._bindTimerSlider();
        this._bindVolumeControl();
        this._bindLimitsControls();
    }

    _bindPerformanceSwitch() {
        const perfSelect = document.getElementById('setting-performance');
        if (!perfSelect) return;

        // Reset any checkbox state if it was there
        if (perfSelect.type === 'checkbox') {
             // Should not happen if HTML is updated, but safe guard or re-binding
        } else {
             perfSelect.value = this.state.performanceMode;
        }

        perfSelect.addEventListener('change', (e) => {
            this.setPerformanceMode(e.target.value);
        });
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
        
        // Max Height binding
        const heightInput = document.getElementById('setting-max-height');
        const heightVal = document.getElementById('setting-max-height-val');
        if (heightInput) {
            heightInput.value = this.state.maxHeight;
            if(heightVal) heightVal.textContent = this.state.maxHeight + '%';
            
            heightInput.addEventListener('input', (e) => {
                const val = Number.parseInt(e.target.value, 10);
                this.setMaxHeight(val);
                if(heightVal) heightVal.textContent = val + '%';
            });
        }
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
