/**
 * @class StorageManager
 * @description Manages local storage persistence with debounce and error handling.
 * Implements Phase 10: Persistencia.
 */
export class StorageManager {
    constructor() {
        this.KEYS = {
            SETTINGS: 'bingo_settings',
            GAME: 'bingo_game',
            PLAYERS: 'bingo_players'
        };
        
        // Debounce timers
        this._timers = {
            settings: null,
            game: null,
            players: null
        };

        this.DEBOUNCE_DELAY = 1000; // 1 second
    }

    /**
     * Generic debounce handler
     * @param {string} type - 'settings', 'game', or 'players'
     * @param {Function} fn - Function to execute
     */
    _debounce(type, fn) {
        if (this._timers[type]) {
            clearTimeout(this._timers[type]);
        }
        this._timers[type] = setTimeout(() => {
            fn();
            this._timers[type] = null;
        }, this.DEBOUNCE_DELAY);
    }

    /**
     * Safely saves data to localStorage
     * @param {string} key - Storage key
     * @param {Object} data - Data to serialize
     */
    _persist(key, data) {
        try {
            const serialized = JSON.stringify(data);
            localStorage.setItem(key, serialized);
            console.log(`[Storage] Saved ${key}`);
        } catch (error) {
            console.error(`[Storage] Failed to save ${key}:`, error);
        }
    }

    /**
     * Safely loads data from localStorage
     * @param {string} key - Storage key
     * @returns {Object|null} Parsed data or null
     */
    _retrieve(key) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : null;
        } catch (error) {
            console.error(`[Storage] Failed to load ${key}. Data might be corrupt.`, error);
            return null;
        }
    }

    // --- Settings ---

    /**
     * Saves settings with debounce
     * @param {Object} data 
     */
    saveSettings(data) {
        this._debounce('settings', () => {
            this._persist(this.KEYS.SETTINGS, data);
        });
    }

    loadSettings() {
        return this._retrieve(this.KEYS.SETTINGS);
    }

    // --- Game State ---

    /**
     * Saves game state with debounce
     * @param {Object} state 
     */
    saveGame(state) {
        this._debounce('game', () => {
            this._persist(this.KEYS.GAME, state);
        });
    }

    loadGame() {
        return this._retrieve(this.KEYS.GAME);
    }

    /**
     * Clears only current game state (e.g., for new game)
     */
    clearGame() {
        try {
            localStorage.removeItem(this.KEYS.GAME);
            console.log('[Storage] Game state cleared');
        } catch (e) {
            console.error('[Storage] Error clearing game state', e);
        }
    }

    // --- Players ---

    /**
     * Saves players list with debounce
     * @param {Array} players 
     */
    savePlayers(players) {
        this._debounce('players', () => {
            this._persist(this.KEYS.PLAYERS, players);
        });
    }

    loadPlayers() {
        return this._retrieve(this.KEYS.PLAYERS);
    }

    // --- System ---

    /**
     * Factory reset: clears all bingo related data
     */
    clearAll() {
        try {
            Object.values(this.KEYS).forEach(key => localStorage.removeItem(key));
            console.warn('[Storage] All data cleared (Factory Reset)');
        } catch (e) {
            console.error('[Storage] Error clearing all data', e);
        }
    }
}

// Global instance for convenience
export const storageManager = new StorageManager();
