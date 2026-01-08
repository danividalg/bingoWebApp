export class UIManager {
    constructor() {
        this.boardGrid = document.getElementById('board-grid');
        this.playersDock = document.getElementById('players-bar');
        this.overlay = document.getElementById('celebration-overlay');
        this.overlayTitle = this.overlay ? this.overlay.querySelector('.celebration-title') : null;
        this.overlayDetails = this.overlay ? this.overlay.querySelector('.celebration-details') : null;
        
        this.initBoard();
        this.initSettingsModal();
        this.initPlayerCardsModal();
    }

    initSettingsModal() {
        const openBtn = document.getElementById('open-settings');
        const closeBtn = document.getElementById('close-settings');
        const modal = document.getElementById('settings-modal');

        if (openBtn && modal) {
            openBtn.addEventListener('click', () => {
                modal.classList.remove('hidden');
            });
        }

        if (closeBtn && modal) {
            closeBtn.addEventListener('click', () => {
                modal.classList.add('hidden');
            });
        }
    }

    initPlayerCardsModal() {
        // Create modal container if it doesn't exist
        let modal = document.getElementById('player-cards-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'player-cards-modal';
            modal.className = 'player-cards-modal';
            modal.innerHTML = `
                <div class="modal-inner">
                    <header class="modal-header">
                        <h2 class="modal-title"></h2>
                        <button class="btn-close-modal" aria-label="Cerrar">&times;</button>
                    </header>
                    <div class="cards-grid"></div>
                </div>
            `;
            document.body.appendChild(modal);
        }
        
        this.playerCardsModal = modal;
        
        // Close on backdrop click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.hidePlayerCardsModal();
            }
        });
        
        // Close button
        const closeBtn = modal.querySelector('.btn-close-modal');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.hidePlayerCardsModal());
        }
        
        // Close on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal.classList.contains('visible')) {
                this.hidePlayerCardsModal();
            }
        });
    }

    initBoard() {
        if (!this.boardGrid) return;
        // Avoid duplicates if already rendered by HTML or previous init
        if (this.boardGrid.children.length > 0) return;

        const fragment = document.createDocumentFragment();
        
        for (let i = 1; i <= 90; i++) {
            const cell = document.createElement('div');
            cell.classList.add('bingo-cell');
            cell.dataset.number = i;
            
            const content = document.createElement('span');
            content.textContent = i;
            cell.appendChild(content);
            
            fragment.appendChild(cell);
        }
        
        this.boardGrid.appendChild(fragment);
    }

    /**
     * Updates visual state of drawn numbers on the board
     * @param {Array|Set} drawnNumbers - Numbers that have been drawn
     */
    renderBoard(drawnNumbers) {
        if (!this.boardGrid) return;
        
        // Convert to Set for O(1) lookup
        const drawnSet = drawnNumbers instanceof Set ? drawnNumbers : new Set(drawnNumbers);
        
        // Iterate all cells and sync their drawn state
        const allCells = this.boardGrid.querySelectorAll('.bingo-cell');
        allCells.forEach(cell => {
            const num = Number.parseInt(cell.dataset.number, 10);
            if (drawnSet.has(num)) {
                cell.classList.add('drawn');
            } else {
                cell.classList.remove('drawn');
            }
        });
    }

    /**
     * Render player list diffing or optimized innerHTML
     * @param {Array} players - Array of Player objects
     */
    renderPlayers(players) {
        if (!this.playersDock) return;

        // Toggle players bar visibility based on player count
        const gameLayout = document.querySelector('.game-layout');
        if (players.length > 0) {
            this.playersDock.classList.add('has-players');
            gameLayout?.classList.remove('no-players');
        } else {
            this.playersDock.classList.remove('has-players');
            gameLayout?.classList.add('no-players');
        }

        // Simple strategy: Clear and rebuild is easiest, but "Diffing basic" requested.
        // We will key by player ID.
        
        const existingCards = Array.from(this.playersDock.children);
        const playerIds = new Set(players.map(p => p.id));

        // Remove old - including placeholders without data-player-id
        existingCards.forEach(card => {
            // Remove if: 1) it's a placeholder without playerId, OR 2) has old playerId not in new list
            if (!card.dataset.playerId || !playerIds.has(card.dataset.playerId)) {
                card.remove();
            }
        });

        // Add or Update
        players.forEach(player => {
            let card = this.playersDock.querySelector(`.player-card[data-player-id="${player.id}"]`);
            
            if (card) {
                this.updatePlayerCard(card, player);
            } else {
                card = this.createPlayerCard(player);
                this.playersDock.appendChild(card);
            }
        });
    }

    createPlayerCard(player) {
         const card = document.createElement('div');
         card.className = 'player-card';
         card.dataset.playerId = player.id;
         
         const playerCards = player.cards || [];
         const cardCount = playerCards.length;
         const badgeClass = cardCount > 1 ? '' : 'single';
         
         // Inner Structure with card count badge and delete button
         const header = `
            <div class="player-header">
                <span class="player-name" title="${player.name}">${player.name}</span>
                <span class="card-count-badge ${badgeClass}">${cardCount}</span>
                <button class="btn-delete-player" data-player-id="${player.id}" title="Eliminar jugador">&times;</button>
            </div>
            <div class="hit-flash"></div>
         `;
         
         // Container for ONLY the first card (preview)
         const cardsContainer = document.createElement('div');
         cardsContainer.className = 'player-cards-container';
         
         // Show only the first card as preview
         if (playerCards.length > 0) {
             const cardData = playerCards[0];
             const gridContainer = document.createElement('div');
             gridContainer.className = 'mini-grid';
             gridContainer.dataset.cardId = cardData.id;
             
             // Get matrix from card structure
             const matrix = cardData.matrix || [];
             const flatNumbers = matrix.flat();
             
             flatNumbers.forEach(num => {
                 const cell = document.createElement('div');
                 cell.className = 'mini-cell';
                 if (num === 0 || num === null) {
                     cell.classList.add('empty');
                     cell.innerHTML = '&nbsp;';
                 } else {
                     cell.textContent = num;
                     cell.dataset.num = num;
                     // Mark if already hit
                     if (cardData.hits?.has(num)) {
                         cell.classList.add('marked');
                     }
                 }
                 gridContainer.appendChild(cell);
             });
             
             cardsContainer.appendChild(gridContainer);
         }

         card.innerHTML = header;
         card.appendChild(cardsContainer);
         
         // Bind delete button event (stopPropagation to not trigger card click)
         const deleteBtn = card.querySelector('.btn-delete-player');
         if (deleteBtn) {
             deleteBtn.addEventListener('click', (e) => {
                 e.stopPropagation();
                 const playerId = deleteBtn.dataset.playerId;
                 // Access global app instance
                 if (globalThis.app) {
                     globalThis.app.removePlayer(playerId);
                 }
             });
         }
         
         // Bind card click to show all cards modal
         card.addEventListener('click', () => {
             // Get current player data from global app if available
             const currentPlayer = globalThis.app?.playerManager?.players.find(p => p.id === player.id);
             this.showPlayerCardsModal(currentPlayer || player);
         });
         
         return card;
    }

    updatePlayerCard(cardElement, player) {
        // Update card count badge
        const badge = cardElement.querySelector('.card-count-badge');
        if (badge) {
            const cardCount = player.cards?.length || 0;
            badge.textContent = cardCount;
            badge.classList.toggle('single', cardCount <= 1);
        }
        
        // Update marks for the first card only (preview card)
        const playerCards = player.cards || [];
        
        if (playerCards.length > 0) {
            const cardData = playerCards[0];
            const gridContainer = cardElement.querySelector(`.mini-grid[data-card-id="${cardData.id}"]`);
            if (gridContainer) {
                // Get all mini-cells and sync their marked state with hits
                const allCells = gridContainer.querySelectorAll('.mini-cell[data-num]');
                allCells.forEach(cell => {
                    const num = Number.parseInt(cell.dataset.num, 10);
                    if (cardData.hits?.has(num)) {
                        cell.classList.add('marked');
                    } else {
                        cell.classList.remove('marked');
                    }
                });
            }
        }
        
        // Update recent hit flash
        if (player.recentHit) {
            const flash = cardElement.querySelector('.hit-flash');
            if (flash) {
                flash.classList.remove('active');
                requestAnimationFrame(() => {
                    requestAnimationFrame(() => {
                        flash.classList.add('active');
                    });
                });
            }
        }
    }

    highlightRecentHit(playerId, number) {
        const card = this.playersDock?.querySelector(`.player-card[data-player-id="${playerId}"]`);
        if (card) {
            // Flash effect
            const flash = card.querySelector('.hit-flash');
            if (flash) {
                flash.classList.remove('active');
                // Trigger reflow to restart animation
                flash.dataset.reflow = flash.offsetWidth;
                flash.classList.add('active');
            }
            
            // Highlight specific number
            const cell = card.querySelector(`.mini-cell[data-num="${number}"]`);
            if (cell) {
                cell.classList.add('marked'); // Ensure it's marked
                // Maybe an extra pop animation on the cell itself
                cell.style.transform = 'scale(1.5)';
                setTimeout(() => cell.style.transform = '', 300);
            }
        }
    }

    showCelebration(text, details = '') {
        if (!this.overlay) return;
        
        if (this.overlayTitle) this.overlayTitle.textContent = text;
        if (this.overlayDetails) this.overlayDetails.textContent = details;
        
        this.overlay.classList.remove('hidden'); // Ensure access
        this.overlay.classList.add('visible');
        
        // Auto hide after some time? Or wait for click?
        // For a bingo win, usually manual reset or timeout.
        // We'll leave it visible until explicitly hidden by logic.
    }
    
    hideCelebration() {
        if (!this.overlay) return;
        this.overlay.classList.remove('visible');
    }

    /**
     * Shows modal with all cards of a player
     * @param {object} player - Player object with cards array
     */
    showPlayerCardsModal(player) {
        if (!this.playerCardsModal) return;
        
        const titleEl = this.playerCardsModal.querySelector('.modal-title');
        const gridEl = this.playerCardsModal.querySelector('.cards-grid');
        
        if (titleEl) {
            const cardCount = player.cards.length;
            titleEl.textContent = `${player.name}\u00A0\u00A0—\u00A0\u00A0${cardCount} ${cardCount > 1 ? 'cartones' : 'cartón'}`;
        }
        
        if (gridEl) {
            gridEl.innerHTML = '';
            
            player.cards.forEach((cardData, index) => {
                const cardEl = document.createElement('div');
                cardEl.className = 'full-card';
                
                const headerEl = document.createElement('div');
                headerEl.className = 'full-card-header';
                headerEl.textContent = `Cartón ${index + 1}`;
                cardEl.appendChild(headerEl);
                
                const gridContainer = document.createElement('div');
                gridContainer.className = 'full-grid';
                
                const matrix = cardData.matrix || [];
                const flatNumbers = matrix.flat();
                
                flatNumbers.forEach(num => {
                    const cell = document.createElement('div');
                    cell.className = 'full-cell';
                    if (num === 0 || num === null) {
                        cell.classList.add('empty');
                    } else {
                        cell.textContent = num;
                        if (cardData.hits?.has(num)) {
                            cell.classList.add('marked');
                        }
                    }
                    gridContainer.appendChild(cell);
                });
                
                cardEl.appendChild(gridContainer);
                gridEl.appendChild(cardEl);
            });
        }
        
        this.playerCardsModal.classList.add('visible');
    }
    
    /**
     * Hides the player cards modal
     */
    hidePlayerCardsModal() {
        if (!this.playerCardsModal) return;
        this.playerCardsModal.classList.remove('visible');
    }
}
