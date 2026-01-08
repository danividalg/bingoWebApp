/**
 * BINGO // AVNT-GRD
 * Module: Glass Sphere Drum Controller
 * Description: Manages the 3D glass sphere rendering and ball extraction animations.
 * Style: Crystalline Glass with realistic bingo balls
 */

export class DrumController {
    drum = null;
    stage = null;
    isSpinning = false;
    config = {
        numBalls: 8,
        diameter: 220
    };

    init() {
        console.log('[DrumController] Initializing Glass Sphere Drum...');
        
        this.drum = document.getElementById('drum');
        this.stage = document.getElementById('drum-stage');
        
        if (!this.drum || !this.stage) {
            console.error('[DrumController] Elements not found. Ensure HTML geometry exists.');
            return;
        }

        this._buildGlassSphere();
        this.startSpin();
    }

    /**
     * Creates a glass sphere with decorative balls inside
     */
    _buildGlassSphere() {
        const { numBalls, diameter } = this.config;
        const radius = diameter / 2;

        // Clear existing content
        this.drum.innerHTML = '';

        // Create decorative balls inside the sphere
        for (let i = 0; i < numBalls; i++) {
            const ball = document.createElement('div');
            ball.className = 'deco-ball';
            
            // Random size between 18-28px
            const size = 18 + Math.random() * 10;
            ball.style.width = `${size}px`;
            ball.style.height = `${size}px`;
            
            // Position balls within sphere bounds
            const maxOffset = radius - size - 10;
            const x = (Math.random() - 0.5) * maxOffset;
            const y = (Math.random() - 0.5) * maxOffset;
            
            // Center the balls within the sphere
            ball.style.left = `calc(50% + ${x}px - ${size/2}px)`;
            ball.style.top = `calc(50% + ${y}px - ${size/2}px)`;
            
            // Random animation parameters
            ball.style.setProperty('--tumble-duration', `${2 + Math.random() * 2}s`);
            ball.style.setProperty('--delay', `${Math.random() * 2}s`);
            ball.style.setProperty('--x1', `${(Math.random() - 0.5) * 30}px`);
            ball.style.setProperty('--y1', `${(Math.random() - 0.5) * 30}px`);
            ball.style.setProperty('--x2', `${(Math.random() - 0.5) * 30}px`);
            ball.style.setProperty('--y2', `${(Math.random() - 0.5) * 30}px`);
            ball.style.setProperty('--x3', `${(Math.random() - 0.5) * 30}px`);
            ball.style.setProperty('--y3', `${(Math.random() - 0.5) * 30}px`);
            ball.style.setProperty('--x4', `${(Math.random() - 0.5) * 30}px`);
            ball.style.setProperty('--y4', `${(Math.random() - 0.5) * 30}px`);
            
            this.drum.appendChild(ball);
        }
    }

    _addToHistory(number) {
        const historyTrack = document.getElementById('history-track');
        if (!historyTrack) return;

        const ball = document.createElement('div');
        ball.className = 'history-ball';
        ball.textContent = number;

        // Prepend to show latest first
        historyTrack.insertBefore(ball, historyTrack.firstChild);

        // Limit to 10 balls maximum (2 rows of 5)
        while (historyTrack.children.length > 10) {
            historyTrack.lastChild.remove();
        }
    }

    startSpin() {
        if (this.drum) {
            this.drum.classList.remove('is-spinning', 'paused');
            this.isSpinning = false;
        }
    }

    stopSpin() {
        if (this.drum) {
            this.drum.classList.add('paused');
            this.isSpinning = false;
        }
    }

    /**
     * Trigger shake animation when extracting
     */
    shake() {
        if (this.drum) {
            this.drum.classList.add('is-spinning');
            this.isSpinning = true;
        }
    }

    /**
     * Coordinates the complex animation of extracting a ball.
     * @param {number|string} number - The bingo number drawn.
     * @param {Function} onComplete - Callback when visual transition finishes.
     */
    animateExtraction(number, onComplete) {
        // 1. Shake the drum
        this.shake();

        // 2. Identify Target (The UI "current ball" display)
        const targetEl = document.getElementById('current-ball');
        if (!targetEl) {
            if (onComplete) onComplete();
            return;
        }

        // 3. Create Flying Ball
        const flier = document.createElement('div');
        flier.className = 'flying-ball';
        flier.textContent = number;
        flier.style.left = '50%';
        flier.style.top = '50%';
        flier.style.transform = 'translate(-50%, -50%)';
        
        // Append to stage
        this.stage.appendChild(flier);

        // 4. Run Animation
        setTimeout(() => {
            // Update the target ball display
            targetEl.textContent = number;
            targetEl.style.transform = 'scale(1.2)';
            setTimeout(() => {
                targetEl.style.transform = 'scale(1)';
            }, 200);
            
            // Add to history
            this._addToHistory(number);

            // Remove flier
            flier.remove();

            // Stop shake
            this.drum.classList.remove('is-spinning');
            this.isSpinning = false;

            // Callback
            if (onComplete) onComplete();
        }, 1500);
    }
}

// Global Instance
export const drumController = new DrumController();
