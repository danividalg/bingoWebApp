/**
 * @file bingo-engine.js
 * @description Core logic for the Bingo game (Phase 2).
 * Manages game state, number drawing, and win validation.
 * @version 1.0.0
 * @author Copilot (Senior Frontend Architect)
 */

export class BingoEngine extends EventTarget {
  constructor() {
    super();
    this.gameState = 'idle'; // 'idle' | 'playing' | 'paused' | 'finished'
    this.availableNumbers = [];
    this.drawnNumbers = [];
    this.currentNumber = null;
    
    // Test helper
    this.riggedQueue = [];

    // Initialize state
    this.reset();
  }

  /**
   * Resets the game state to initial values.
   * Emits 'bingo:reset'.
   */
  reset() {
    // 1-90 Array
    this.availableNumbers = Array.from({ length: 90 }, (_, i) => i + 1);
    this.drawnNumbers = [];
    this.currentNumber = null;
    this.riggedQueue = [];
    this.gameState = 'idle';

    this.dispatchEvent(new CustomEvent('bingo:reset', {
      detail: { 
        timestamp: Date.now(),
        availableCount: this.availableNumbers.length 
      }
    }));
  }

  /**
   * Returns copy of numbers remaining in the pool.
   * @returns {number[]}
   */
  getRemainingNumbers() {
    return [...this.availableNumbers];
  }

  /**
   * Starts or Resumes the game.
   */
  start() {
    if (this.gameState === 'finished') {
        console.warn('Game finished. Please reset.');
        return;
    }
    this.gameState = 'playing';
    this.dispatchEvent(new CustomEvent('bingo:start'));
  }

  pause() {
    if (this.gameState === 'playing') {
        this.gameState = 'paused';
        this.dispatchEvent(new CustomEvent('bingo:pause'));
    }
  }

  /**
   * Draws a random number from the available pool.
   * Moves number from available to drawn.
   * Emits 'bingo:draw'.
   * @returns {number|null} The drawn number or null if cannot draw.
   */
  drawNumber() {
    if (this.gameState !== 'playing') {
      console.warn(`Cannot draw. Game state is: ${this.gameState}`);
      return null;
    }

    if (this.availableNumbers.length === 0) {
      this.finishGame();
      return null;
    }

    // Random selection or Rigged
    let randomIndex;
    let drawn;

    if (this.riggedQueue.length > 0) {
        const nextRigged = this.riggedQueue.shift();
        randomIndex = this.availableNumbers.indexOf(nextRigged);
        if (randomIndex === -1) {
            // Number already drawn or invalid, fallback to random
            randomIndex = Math.floor(Math.random() * this.availableNumbers.length);
        }
    } else {
        randomIndex = Math.floor(Math.random() * this.availableNumbers.length);
    }

    drawn = this.availableNumbers.splice(randomIndex, 1)[0];

    // Update state
    this.drawnNumbers.push(drawn);
    this.currentNumber = drawn;

    // Emit event
    this.dispatchEvent(new CustomEvent('bingo:draw', {
      detail: {
        number: drawn,
        drawnNumbers: [...this.drawnNumbers], // immutable copy
        remainingCount: this.availableNumbers.length
      }
    }));

    // Auto-finish if empty
    if (this.availableNumbers.length === 0) {
      this.finishGame();
    }

    return drawn;
  }

  /**
   * Ends the game manually or automatically.
   */
  finishGame() {
    if (this.gameState !== 'finished') {
        this.gameState = 'finished';
        this.dispatchEvent(new CustomEvent('bingo:finished'));
    }
  }

  /**
   * Checks if the card has potential 'Line' win.
   * Assumes cardNumbers is an Array of rows (number[][]).
   * If cardNumbers is flat (number[]), verification is impossible without layout, returns false.
   * 
   * @param {number[][]} cardNumbers - The bingo card structure (rows).
   * @param {number[]} [drawnNumbers] - Optional override for drawn numbers.
   * @returns {boolean} True if ANY row is fully drawn.
   */
  checkLine(cardNumbers, drawnNumbers = this.drawnNumbers) {
    if (!Array.isArray(cardNumbers) || cardNumbers.length === 0) return false;

    // Handle flat array edge case - treat as single line? Or reject?
    // Standard Bingo 90 has structure. Reject flat if detected (generic safeguard).
    if (typeof cardNumbers[0] === 'number') {
        console.warn('BingoEngine: checkLine received flat array. Expecting array of rows (number[][]).');
        return false;
    }

    // Check if ANY row has every number in drawnNumbers
    return cardNumbers.some(row => {
        if (!Array.isArray(row)) return false;
        return row.every(num => drawnNumbers.includes(num));
    });
  }

  /**
   * Checks if the card has 'Bingo' (Full House).
   * Works with flat array or array of rows.
   * 
   * @param {number[] | number[][]} cardNumbers - The bingo card values.
   * @param {number[]} [drawnNumbers] - Optional override.
   * @returns {boolean} True if ALL numbers on the card are drawn.
   */
  checkBingo(cardNumbers, drawnNumbers = this.drawnNumbers) {
    if (!Array.isArray(cardNumbers)) return false;

    // Flatten in case of rows structure
    const allNumbers = cardNumbers.flat();

    return allNumbers.every(num => drawnNumbers.includes(num));
  }
}

// Global exposure for "Avant-Garde" easy access if needed, 
// though ES usage is preferred.
if (typeof globalThis !== 'undefined') {
    globalThis.BingoEngine = BingoEngine;
}
