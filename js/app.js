/**
 * BINGO // AVNT-GRD
 * App Orchestrator (Phase 11)
 * Integrates all modules and manages global game loop.
 */

import { BingoEngine } from './bingo-engine.js';
import { PlayerManager } from './players.js';
import { SettingsManager } from './settings.js';
import { UIManager } from './ui.js';
import { audioManager } from './audio.js';
import { drumController } from './drum.js';
import { storageManager } from './storage.js';

class App {
    // State
    isAnimating = false;
    autoTimer = null;
    confirmResolve = null;
    totalLines = 0;   // Total lines across all players
    totalBingos = 0;  // Total bingos across all players
    pendingGameEnd = null;

    constructor() {
        // Modules
        this.engine = new BingoEngine();
        this.players = new PlayerManager();
        this.settings = new SettingsManager(); // Loads settings on instantiation
        this.ui = new UIManager();
        this.audio = audioManager;
        this.drum = drumController;
        this.storage = storageManager;
    }

    /**
     * Show styled confirm modal (replacement for browser confirm)
     * @param {string} title - Modal title
     * @param {string} message - Modal message
     * @param {string} icon - Emoji icon (optional)
     * @returns {Promise<boolean>} - True if confirmed, false if cancelled
     */
    showConfirm(title, message, icon = '⚠️') {
        return new Promise((resolve) => {
            const modal = document.getElementById('confirm-modal');
            const titleEl = document.getElementById('confirm-title');
            const messageEl = document.getElementById('confirm-message');
            const iconEl = modal?.querySelector('.confirm-icon');
            const yesBtn = document.getElementById('confirm-yes');
            const noBtn = document.getElementById('confirm-no');
            
            if (!modal) {
                // Fallback to browser confirm if modal not found
                resolve(confirm(message));
                return;
            }
            
            if (titleEl) titleEl.textContent = title;
            if (messageEl) messageEl.textContent = message;
            if (iconEl) iconEl.textContent = icon;
            
            modal.classList.add('visible');
            
            const cleanup = () => {
                modal.classList.remove('visible');
                yesBtn?.removeEventListener('click', handleYes);
                noBtn?.removeEventListener('click', handleNo);
            };
            
            const handleYes = () => {
                cleanup();
                resolve(true);
            };
            
            const handleNo = () => {
                cleanup();
                resolve(false);
            };
            
            yesBtn?.addEventListener('click', handleYes);
            noBtn?.addEventListener('click', handleNo);
        });
    }

    async init() {
        
        // 1. Initialize Subsystems
        // Drum init happens on DOMContentLoaded in its own file? No, we refactored it to be manual if needed.
        // But drum.js might trigger implicit init if we didn't fully clean it. 
        // We removed auto-init, so we call it here.
        this.drum.performanceMode = this.settings.performanceMode;
        this.drum.init();
        
        // Initialize Settings UI bindings (must be after DOM is ready)
        this.settings.bindUI();

        // Audio: Initialize on first user interaction (browser policy)
        const initAudioOnce = () => {
            this.audio.init();
            document.removeEventListener('click', initAudioOnce);
            document.removeEventListener('keydown', initAudioOnce);
        };
        document.addEventListener('click', initAudioOnce, { once: true });
        document.addEventListener('keydown', initAudioOnce, { once: true });
        
        // 2. Load Game State (Phase 4 requirement)
        this.loadState();

        // 3. Bind Events
        this.bindEvents();
        this.bindKeys();

        // 4. Initial Render
        this.updateUI();
        this.updatePlayButton();
    }

    bindEvents() {
        // --- Engine Events ---
        this.engine.addEventListener('bingo:draw', (e) => this.handleDrawEvent(e.detail));
        this.engine.addEventListener('bingo:reset', () => this.handleResetEvent());
        this.engine.addEventListener('bingo:finished', () => this.handleGameFinished());
        
        // --- Player Events ---
        this.players.addEventListener('player:line', (e) => this.handleWin('LINE', e.detail));
        this.players.addEventListener('player:bingo', (e) => this.handleWin('BINGO', e.detail));
        this.players.addEventListener('players:updated', () => this.updateUI());

        // --- Settings Events ---
        this.settings.addEventListener('settings:changed', (e) => this.applySettings(e.detail));

        // --- UI Interactions ---
        // Play/Pause Button
        const playBtn = document.getElementById('btn-play-pause');
        if (playBtn) {
            playBtn.addEventListener('click', () => this.togglePlay());
        }
        
        // Add Player Button
        const addPlayerBtn = document.getElementById('btn-add-player');
        const addPlayerModal = document.getElementById('add-player-modal');
        const closeAddPlayerBtn = document.getElementById('close-add-player');
        const confirmAddPlayerBtn = document.getElementById('btn-confirm-add-player');
        
        if (addPlayerBtn && addPlayerModal) {
            addPlayerBtn.addEventListener('click', () => {
                addPlayerModal.classList.remove('hidden');
                document.getElementById('player-name')?.focus();
            });
        }
        
        if (closeAddPlayerBtn && addPlayerModal) {
            closeAddPlayerBtn.addEventListener('click', () => {
                addPlayerModal.classList.add('hidden');
            });
        }
        
        if (confirmAddPlayerBtn) {
            confirmAddPlayerBtn.addEventListener('click', () => this.addPlayerFromModal());
        }
        
        // Reset Button (quick reset in controls bar)
        const resetBtn = document.getElementById('btn-reset');
        if (resetBtn) {
            resetBtn.addEventListener('click', async () => {
                const confirmed = await this.showConfirm(
                    'Reiniciar Juego',
                    '¿Estás seguro de que quieres reiniciar el juego? Se perderá el progreso actual.',
                    '🔄'
                );
                if (confirmed) {
                    this.engine.reset();
                }
            });
        }

        // Reset System Button (in settings modal)
        const resetSystemBtn = document.getElementById('btn-reset-system');
        if (resetSystemBtn) {
            resetSystemBtn.addEventListener('click', async () => {
                const confirmed = await this.showConfirm(
                    'RESET TOTAL',
                    '¿REINICIAR TODO? Se borrarán jugadores, progreso y configuración.',
                    '☢️'
                );
                if (confirmed) {
                    // 1. Reset Game Engine
                    this.engine.reset();
                    
                    // 2. Clear All Players
                    this.players.clearAll();
                    
                    // 3. Reset Settings
                    this.settings.resetToDefaults();

                    // 4. Reset Local Counters in App
                    this.totalLines = 0;
                    this.totalBingos = 0;

                    // Close settings modal
                    const settingsModal = document.getElementById('settings-modal');
                    if (settingsModal) settingsModal.classList.add('hidden');
                    
                    this.ui.showToast('SISTEMA REINICIADO', 'system');
                }
            });
        }

        // Print Cards Button (in settings modal)
        const printBtn = document.getElementById('btn-print');
        if (printBtn) {
            printBtn.addEventListener('click', () => {
                if (this.players.players.length === 0) {
                    alert('No hay jugadores con cartones para imprimir.');
                    return;
                }
                // Use the new printPlayerCards that groups by player
                this.players.cardGenerator.printPlayerCards(this.players.players);
            });
        }
    }

    bindKeys() {
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space') {
                e.preventDefault(); // Prevent scrolling
                
                // If Overlay Open -> Close it
                if (!this.ui.overlay.classList.contains('hidden')) {
                    this.closeOverlay();
                    return;
                }

                this.togglePlay();
            }
        });
    }

    togglePlay() {
        if (this.engine.gameState === 'finished') return;

        // Ensure Audio Context
        this.audio.init();

        if (this.settings.mode === 'manual') {
            this.triggerDraw();
        } else if (this.engine.gameState === 'playing') {
            // Auto Mode - pause
            this.pauseAuto();
        } else {
            // Auto Mode - start
            this.startAuto();
        }
        
        // Update button state after action
        this.updatePlayButton();
    }

    updatePlayButton() {
        const playBtn = document.getElementById('btn-play-pause');
        if (!playBtn) return;
        
        const iconSpan = playBtn.querySelector('.btn-icon-play');
        const textSpan = playBtn.querySelector('.btn-text');
        
        // Determine if auto mode is actively playing
        const isAutoPlaying = this.engine.gameState === 'playing' && this.settings.mode === 'auto';
        
        // Always show the button
        playBtn.classList.remove('hidden');
        
        if (isAutoPlaying) {
            // Auto mode playing: show PAUSAR
            if (iconSpan) iconSpan.textContent = '⏸';
            if (textSpan) textSpan.textContent = 'PAUSAR';
        } else {
            // All other states: show JUGAR (manual mode, paused, idle, etc.)
            if (iconSpan) iconSpan.textContent = '▶';
            if (textSpan) textSpan.textContent = 'JUGAR';
        }
        
        // Also update add player button state
        this.updateAddPlayerButton();
    }
    
    updateAddPlayerButton() {
        const addPlayerBtn = document.getElementById('btn-add-player');
        if (!addPlayerBtn) return;
        
        // Hide add player button once the game has started (at least one ball drawn)
        const gameHasStarted = this.engine.drawnNumbers.length > 0;
        if (gameHasStarted) {
            addPlayerBtn.style.display = 'none';
        } else {
            addPlayerBtn.style.display = '';
        }
    }

    addPlayerFromModal() {
        const nameInput = document.getElementById('player-name');
        const cardsInput = document.getElementById('player-cards');
        const modal = document.getElementById('add-player-modal');
        
        const name = nameInput?.value.trim() || `Jugador ${this.players.players.length + 1}`;
        const numCards = Number.parseInt(cardsInput?.value, 10) || 1;
        
        if (name) {
            this.players.addPlayer(name, numCards);
            this.updateUI();
            this.saveState();
            
            // Reset and close modal
            if (nameInput) nameInput.value = '';
            if (cardsInput) cardsInput.value = '1';
            if (modal) {
                modal.classList.add('hidden');
            }
        }
    }

    triggerDraw() {
        if (this.isAnimating) return;
        
        // Check if game is playable
        // If idle or paused, we must start/resume before drawing
        if (this.engine.gameState === 'idle' || this.engine.gameState === 'paused') {
            this.engine.start();
        }

        this.engine.drawNumber();
    }

    startAuto() {
        this.engine.start(); // Set state to playing
        // If not animating, trigger immediate or wait?
        // Let's trigger one immediately if we are just starting
        if (!this.isAnimating) {
            this.triggerDraw();
        }
        // The Timer logic is handled in `onDrawComplete` to schedule the NEXT one.
        // We don't use setInterval to avoid overlapping animations.
    }

    pauseAuto() {
        this.engine.pause();
        if (this.autoTimer) {
            clearTimeout(this.autoTimer);
            this.autoTimer = null;
        }
    }

    /**
     * Orchestrates the draw sequence (Phase 3)
     */
    async handleDrawEvent(detail) {
        this.isAnimating = true;
        const { number } = detail;

        // 1. Audio DrumRoll (Wait for it?)
        // Requirement: "Audio DrumRoll -> Animación Bombo -> Audio Pop"
        // DrumRoll is 2s (hardcoded in audio.js).
        // Let's play it, wait 2s, then extract.
        
        this.audio.playDrumRoll();
        
        // Wait 1.8s (slightly less than 2s to overlap the pop nicely)
        await new Promise(r => setTimeout(r, 1800));

        // 2. Drum Animation
        const remaining = this.engine.getRemainingNumbers().length;
        this.drum.animateExtraction(number, remaining, async () => {
             // 3. Post-Animation Sequence
             this.audio.playBallPop();
             this.audio.speakNumber(number);

             // Update Data
             this.players.markNumber(number);
             this.ui.renderBoard(this.engine.drawnNumbers);
             this.ui.renderPlayers(this.players.getVisiblePlayers());

             // Save State
             this.saveState();

             this.isAnimating = false;

             // Schedule Next (Auto Mode)
             if (this.settings.mode === 'auto' && this.engine.gameState === 'playing') {
                 this.scheduleNextDraw();
             }
        });
    }

    scheduleNextDraw() {
        if (this.autoTimer) clearTimeout(this.autoTimer);
        const delay = this.settings.timerDuration * 1000;
        this.autoTimer = setTimeout(() => {
            if (this.engine.gameState === 'playing') {
                this.triggerDraw();
            }
        }, delay);
    }

    handleWin(type, detail) {
        // Track totals
        if (type === 'LINE') {
            this.totalLines++;
            
            // Fix: Respect max lines limit
            // If we have exceeded the max lines, we do NOT announce it.
            if (this.settings.maxLines > 0 && this.totalLines > this.settings.maxLines) {
                 console.log(`Line win ignored. Limit (${this.settings.maxLines}) reached.`);
                 return;
            }
        } else if (type === 'BINGO') {
            this.totalBingos++;
        }

        // Pausar juego automático
        if (this.settings.mode === 'auto') {
            this.pauseAuto();
            this.updatePlayButton();
        }

        // Tocar fanfarria
        this.audio.playWinSound(type);

        // Find the card index that won
        const cardIndex = detail.player.cards.findIndex(c => c.id === detail.card.id) + 1;
        const cardInfo = detail.player.cards.length > 1 ? ` (Cartón ${cardIndex})` : '';

        // Mostrar overlay con nombre del jugador y cartón
        const title = type === 'BINGO' ? '¡BINGO!' : '¡LÍNEA!';
        const message = `${detail.player.name}${cardInfo}`;
        this.showOverlay(title, message);

        // Check if limits are reached
        this.checkLimits();
    }

    /**
     * Check if game should end due to limits being reached
     */
    checkLimits() {
        const maxBingos = this.settings.maxBingos;
        // User requested removing LINE limit as Game Ender.
        // Game ends ONLY on Bingos limit, All Cards Full, or No Balls.

        let shouldEnd = false;
        let endReason = '';

        // 1. Check bingo limit
        if (maxBingos > 0 && this.totalBingos >= maxBingos) {
            shouldEnd = true;
            endReason = `¡Se alcanzó el límite de ${maxBingos} bingo${maxBingos > 1 ? 's' : ''}!`;
        }
        
        // 2. Check All Cards Completed
        // Are there players? And are ALL cards of ALL players finished?
        if (!shouldEnd && this.players.players.length > 0) {
            const allCompleted = this.players.players.every(p => 
                p.cards.every(c => c.hasBingo)
            );
            if (allCompleted) {
                shouldEnd = true;
                endReason = '¡Todos los cartones han sido completados!';
            }
        }

        if (shouldEnd) {
            // End the game
            // Store reason temporarily if needed, 
            // but engine.finishGame() doesn't pass params in our simple event system.
            // We can dispatch or UI show directly.
            this.engine.finishGame();
            this.endReasonCache = endReason; // Hacky pass to event handler
        }
    }

    handleGameFinished() {
        const reason = this.endReasonCache || (this.engine.availableNumbers.length === 0 ? '¡No quedan más bolas!' : '');
        this.endReasonCache = null;

        const isOverlayVisible = this.ui.overlay && !this.ui.overlay.classList.contains('hidden');

        if (isOverlayVisible) {
            this.pendingGameEnd = { title: '🎉 FIN DEL JUEGO', message: reason };
        } else {
            // Show end game message after a short delay
            setTimeout(() => {
                this.showOverlay('🎉 FIN DEL JUEGO', reason);
            }, 1000);
        }
    }

    showOverlay(title, details) {
        if (this.ui.overlay) {
            this.ui.overlayTitle.textContent = title;
            this.ui.overlayDetails.textContent = details;
            
            this.ui.overlay.classList.remove('hidden');
            this.ui.overlay.classList.add('visible');
            this.ui.overlay.setAttribute('aria-hidden', 'false');

            // Trigger confetti
            this.ui.triggerConfetti();
        }
    }

    /**
     * DEBUG ONLY: Rig the game for a specific player to win soon.
     * @param {string} playerId 
     */
    rigGameForPlayer(playerId) {
        const player = this.players.players.find(p => p.id === playerId);
        if (!player) {
            console.error('Player not found');
            return;
        }

        // Get needed numbers from first card
        const card = player.cards[0];
        if (!card) return;

        // Find numbers in card NOT in drawnNumbers
        const needed = card.numbers.filter(n => !this.engine.drawnNumbers.includes(n));
        
        console.log(`Rigging game for ${player.name}. Enqueueing ${needed.length} numbers.`);
        
        // Push to engine priority queue
        this.engine.riggedQueue = [...needed];
        
        this.ui.showToast('JUEGO TRUCADO 😈', 'system');
    }

    closeOverlay() {
        if (this.ui.overlay) {
            this.ui.overlay.classList.remove('visible');
            this.ui.overlay.classList.add('hidden');
            this.ui.overlay.setAttribute('aria-hidden', 'true');
        }

        if (this.pendingGameEnd) {
            const { title, message } = this.pendingGameEnd;
            this.pendingGameEnd = null;
            setTimeout(() => {
                this.showOverlay(title, message);
            }, 500); // Small delay for better UX
        }
    }

    handleResetEvent() {
        // Stop any auto timer
        if (this.autoTimer) {
            clearTimeout(this.autoTimer);
            this.autoTimer = null;
        }
        
        // Reset win counters
        this.totalLines = 0;
        this.totalBingos = 0;
        
        // Reset player game data (keeps players but clears hits/wins)
        this.players.resetGame();
        
        // Reset Drum (Visuals)
        this.drum.setBallCount(90); // Full drum
        document.getElementById('current-ball').textContent = '--';
        document.getElementById('current-ball').classList.remove('hidden');
        document.getElementById('history-track').innerHTML = '';

        // Clear game storage
        this.storage.clearGame();
        
        // Clear board visuals - reset all cells
        if (this.ui.boardGrid) {
            const cells = this.ui.boardGrid.querySelectorAll('.bingo-cell');
            cells.forEach(cell => cell.classList.remove('drawn'));
        }
        
        // Clear drum history visual
        const historyTrack = document.querySelector('.history-track');
        if (historyTrack) historyTrack.innerHTML = '';
        
        // Reset current ball display
        const currentBall = document.getElementById('current-ball');
        if (currentBall) currentBall.textContent = '--';
        
        // Re-render players with cleared state
        this.ui.renderPlayers(this.players.getVisiblePlayers());
        
        // Update buttons state
        this.updatePlayButton();
        
        // Reset animation state
        this.isAnimating = false;

        // Force save of the reset state (Clean players, clean game)
        this.saveState();
    }

    /**
     * Removes a player by ID
     * @param {string} playerId 
     */
    async removePlayer(playerId) {
        const confirmed = await this.showConfirm(
            'Eliminar Jugador',
            '¿Estás seguro de que quieres eliminar este jugador?',
            '🗑️'
        );
        if (!confirmed) return false;
        
        const result = this.players.removePlayer(playerId);
        if (result) {
            this.ui.renderPlayers(this.players.getVisiblePlayers());
            this.saveState();
        }
        
        return result;
    }

    // --- Persistence ---

    saveState() {
        const gameState = {
            drawnNumbers: this.engine.drawnNumbers,
            availableNumbers: this.engine.availableNumbers,
            gameState: this.engine.gameState
        };
        const playersData = this.players.serialize();

        this.storage.saveGame(gameState);
        this.storage.savePlayers(playersData);
    }

    loadState() {
        // Load Settings
        const savedSettings = this.storage.loadSettings();
        if (savedSettings) this.settings.state = { ...this.settings.state, ...savedSettings };
        this.applySettings(this.settings.state);

        // Load Game Logic
        const savedGame = this.storage.loadGame();
        const savedPlayers = this.storage.loadPlayers();

        if (savedPlayers) {
            this.players.deserialize(savedPlayers);
        } else {
            // Demo players if none
            // this.players.addPlayer('Test Player 1', 1);
        }

        if (savedGame) {
            // Restore Engine
            this.engine.drawnNumbers = savedGame.drawnNumbers || [];
            this.engine.availableNumbers = savedGame.availableNumbers || [];
            
            // Sync Players Drawn Set (Visual fix for late joins/reloads)
            if (this.players) {
                this.players.syncDrawnNumbers(this.engine.drawnNumbers);
            }

            // Restore Internal Sets if needed or engine is simple array based
            // BingoEngine keeps state in Arrays, so direct assignment is mostly fine 
            // BUT we should verify currentNumber
            if (this.engine.drawnNumbers.length > 0) {
                this.engine.currentNumber = this.engine.drawnNumbers.at(-1);
            }
            
            // SYNC DRUM STATE
            // Ensure visual balls match available numbers
            this.drum.setBallCount(this.engine.availableNumbers.length);


            // Restore history track visual (last 10 balls in reverse order)
            this.restoreHistoryTrack();
            
            // Important: We need to ensure PlayerManager 'hits' are synced.
            // When we loaded players via deserialize, we restored their HITs directly from storage.
            // So we don't need to re-run markNumber.
            
            // Re-render
            this.updateUI();
        }
    }

    /**
     * Restores the history track visual from saved drawn numbers
     */
    restoreHistoryTrack() {
        const historyTrack = document.getElementById('history-track');
        if (!historyTrack) return;
        
        // Clear existing
        historyTrack.innerHTML = '';
        
        // Get last 10 numbers (most recent first)
        const lastTen = this.engine.drawnNumbers.slice(-10).reverse();
        
        lastTen.forEach((number, index) => {
            const ball = document.createElement('div');
            ball.className = 'history-ball';
            ball.textContent = number;
            // Skip animation on restore
            ball.style.animation = 'none';
            historyTrack.appendChild(ball);
        });
    }

    // --- Helpers ---

    applySettings(state) {
        this.audio.setVolume(state.volume / 100);
        this.audio.setMuted(state.volume === 0);
        
        this.settings.applyTheme();
        
        // Performance Mode sync
        if (this.drum) {
            this.drum.performanceMode = state.performanceMode;
            this.drum.setBallCount(this.engine.getRemainingNumbers().length);
        }

        // Handle mode change
        if (state.mode === 'manual') {
            this.pauseAuto();
        }
    }

    updateUI() {
        this.ui.renderBoard(this.engine.drawnNumbers);
        this.ui.renderPlayers(this.players.getVisiblePlayers());
        
        // Recover last ball visual
        const last = this.engine.currentNumber;
        const currentBall = document.getElementById('current-ball');
        if (currentBall && last) {
            currentBall.textContent = last;
        }
    }
}

// Start App
const app = new App();
globalThis.app = app;
await app.init();