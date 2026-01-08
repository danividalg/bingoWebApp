import { CardGenerator } from './cards.js';
import { BingoEngine } from './bingo-engine.js';

/**
 * Gestor de jugadores para Bingo.
 * Maneja la creación, estado y verificación de victorias de los jugadores.
 * Optimizado para alto rendimiento mediante indexación inversa.
 */
export class PlayerManager extends EventTarget {
    constructor() {
        super();
        this.players = [];
        this.cardGenerator = new CardGenerator();
        this.drawnNumbers = new Set(); // O(1) lookups
        this.drawnNumbersArray = []; // Para pasar a BingoEngine
        
        // Indice invertido (Número -> Ubicaciones) para búsqueda O(1)
        this.numberIndex = new Map();
        
        // Instancia para acceder lógica de validación
        this.engineValidator = new BingoEngine();
    }

    /**
     * Añade un nuevo jugador al juego.
     * @param {string} name - Nombre del jugador.
     * @param {number} numCards - Número de cartones solicitados.
     * @returns {object} El objeto jugador creado.
     */
    addPlayer(name, numCards = 1) {
        const newCards = [];
        
        for (let i = 0; i < numCards; i++) {
            const rawCard = this.cardGenerator.generateCard();
            
            // Preprocesar el cartón para optimización y limpieza
            // Eliminamos los 0s/nulls de la matriz para tener filas limpias de números
            const cleanRows = rawCard.matrix.map(row => row.filter(n => n !== 0 && n !== null));
            
            const cardObj = {
                id: rawCard.id,
                matrix: rawCard.matrix, // Visualización original
                numbers: rawCard.numbers, // array plano
                cleanRows: cleanRows, // Para checkLine
                hits: new Set(), // Números marcados en este cartón
                
                // Estados de victoria local para evitar eventos duplicados
                hasLine: false,
                hasBingo: false
            };

            newCards.push(cardObj);
        }

        const player = {
            id: `P-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            name: name,
            cards: newCards,
            stats: { lines: 0, bingos: 0 },
            recentHit: false, // Flag para la UI
            score: 0 // Puntuación calculada para ordenamiento (cercanía a ganar)
        };

        // Indexar los números de los cartones de este jugador
        this._indexPlayerCards(player);

        this.players.push(player);
        return player;
    }

    /**
     * Marca un número sorteado en todos los cartones que lo contengan.
     * Verifica Línea y Bingo.
     * @param {number} number - El número sorteado.
     */
    markNumber(number) {
        // Actualizar estado global de sorteo
        this.drawnNumbers.add(number);
        this.drawnNumbersArray.push(number);

        // La UI prioriza hits recientes basándose en 'lastHitTurn'.
        // No reseteamos 'recentHit' globalmente para evitar bucles O(N).
        
        // Recuperar ubicaciones afectadas desde el índice
        const locations = this.numberIndex.get(number);

        if (!locations || locations.length === 0) return;

        const affectedPlayers = new Set();

        locations.forEach(loc => {
            const player = this.players.find(p => p.id === loc.playerId);
            if (!player) return;

            const card = player.cards[loc.cardIdx];
            
            // Marcar acierto
            card.hits.add(number);
            player.recentHit = true;
            affectedPlayers.add(player);

            // Verificar condiciones de victoria usando la lógica de BingoEngine
            // Pasamos this.drawnNumbersArray explícitamente
            
            // 1. Verificar Línea (si no la tiene ya)
            if (!card.hasLine) {
                const isLine = this.engineValidator.checkLine(card.cleanRows, this.drawnNumbersArray);
                if (isLine) {
                    card.hasLine = true;
                    player.stats.lines++;
                    this.dispatchEvent(new CustomEvent('player:line', {
                        detail: { player, card, number }
                    }));
                }
            }

            // 2. Verificar Bingo (si no lo tiene ya)
            if (!card.hasBingo) {
                // checkBingo puede trabajar con cleanRows (array de arrays) o números planos
                // Usamos cleanRows por consistencia
                const isBingo = this.engineValidator.checkBingo(card.cleanRows, this.drawnNumbersArray);
                if (isBingo) {
                    card.hasBingo = true;
                    player.stats.bingos++;
                    this.dispatchEvent(new CustomEvent('player:bingo', {
                        detail: { player, card, number }
                    }));
                }
            }
            
            // Actualizar "cercanía" para el sort (heurística simple)
            // Score = (Hits / TotalNumbers)
            // O mejor: Cuadros marcados.
            player.score = this._calculateScore(player);
        });
        
        // Desactivar recentHit de los NO afectados?
        // Si queremos que `getVisiblePlayers` solo muestre los del último turno como destacados,
        // deberíamos saber quiénes NO golpearon.
        // Compromiso: En `getVisiblePlayers` filtramos/ordenamos.
        // Para no iterar todos aquí poniendo `recentHit = false`:
        // Usamos un 'turnIdentifier' en el jugador.
        const currentTurn = this.drawnNumbersArray.length;
        affectedPlayers.forEach(p => p.lastHitTurn = currentTurn);
    }

    /**
     * Retorna un subconjunto de jugadores para la UI.
     * Prioriza: Ganadores > Recent Hit > Más cercanos a ganar.
     * @param {number} limit - Máximo de jugadores a retornar.
     */
    getVisiblePlayers(limit = 12) {
        const currentTurn = this.drawnNumbersArray.length;
        
        // Copia superficial para ordenar
        return [...this.players]
            .sort((a, b) => {
                // 1. Prioridad: ¿Ganó Bingo?
                if (b.stats.bingos !== a.stats.bingos) return b.stats.bingos - a.stats.bingos;
                
                // 2. Prioridad: ¿Ganó Línea?
                if (b.stats.lines !== a.stats.lines) return b.stats.lines - a.stats.lines;

                // 3. Prioridad: ¿Golpeó este turno?
                const aHit = a.lastHitTurn === currentTurn;
                const bHit = b.lastHitTurn === currentTurn;
                if (bHit && !aHit) return 1;
                if (!bHit && aHit) return -1;

                // 4. Prioridad: Score (Porcentaje completado)
                return b.score - a.score;
            })
            .slice(0, limit);
    }

    /**
     * Resetea el estado de todos los jugadores y del juego.
     * (Manteniendo los jugadores, pero limpiando sus cartones)
     */
    resetGame() {
        this.drawnNumbers.clear();
        this.drawnNumbersArray = [];
        this.players.forEach(p => {
            p.stats = { lines: 0, bingos: 0 };
            p.score = 0;
            p.lastHitTurn = -1;
            p.cards.forEach(c => {
                c.hits.clear();
                c.hasLine = false;
                c.hasBingo = false;
            });
        });
    }

    // --- Helpers Privados ---

    _indexPlayerCards(player) {
        player.cards.forEach((card, cardIdx) => {
            card.numbers.forEach(num => {
                if (!this.numberIndex.has(num)) {
                    this.numberIndex.set(num, []);
                }
                this.numberIndex.get(num).push({ playerId: player.id, cardIdx });
            });
        });
    }

    _calculateScore(player) {
        // Heurística simple: Máximo progreso en cualquier cartón
        let maxProgress = 0;
        player.cards.forEach(c => {
            const progress = c.hits.size; // Total aciertos
            if (progress > maxProgress) maxProgress = progress;
        });
        return maxProgress;
    }

    /**
     * Removes a player by ID
     * @param {string} playerId - The ID of the player to remove
     * @returns {boolean} True if player was removed
     */
    removePlayer(playerId) {
        const playerIndex = this.players.findIndex(p => p.id === playerId);
        if (playerIndex === -1) return false;
        
        const removedPlayer = this.players.splice(playerIndex, 1)[0];
        
        // Remove player's numbers from index
        if (removedPlayer?.cards) {
            removedPlayer.cards.forEach(card => {
                card.numbers.forEach(num => {
                    const locations = this.numberIndex.get(num);
                    if (locations) {
                        const filtered = locations.filter(loc => loc.playerId !== playerId);
                        if (filtered.length > 0) {
                            this.numberIndex.set(num, filtered);
                        } else {
                            this.numberIndex.delete(num);
                        }
                    }
                });
            });
        }
        
        // Dispatch update
        this.dispatchEvent(new CustomEvent('players:updated'));
        return true;
    }

    /**
     * Serializes player data for storage (converts Sets to Arrays)
     */
    serialize() {
        return this.players.map(p => ({
            ...p,
            cards: p.cards.map(c => ({
                ...c,
                hits: Array.from(c.hits)
            }))
        }));
    }

    /**
     * Restores player data from storage (converts Arrays to Sets and Re-indexes)
     */
    deserialize(data) {
        if (!Array.isArray(data)) return;
        
        this.players = data.map(p => ({
            ...p,
            cards: p.cards.map(c => ({
                ...c,
                hits: new Set(c.hits)
            }))
        }));

        // Re-build index
        this.numberIndex.clear();
        this.players.forEach(p => this._indexPlayerCards(p));
        
        // Dispatch update
        this.dispatchEvent(new CustomEvent('players:updated'));
    }
}
