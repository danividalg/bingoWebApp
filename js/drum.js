/**
 * BINGO // AVNT-GRD
 * Module: Glass Sphere Drum Controller (Canvas 3D)
 * Description: High-fidelity 3D physics simulation of a bingo drum.
 */

class Vector3 {
    constructor(x = 0, y = 0, z = 0) { this.x = x; this.y = y; this.z = z; }
    add(v) { return new Vector3(this.x + v.x, this.y + v.y, this.z + v.z); }
    sub(v) { return new Vector3(this.x - v.x, this.y - v.y, this.z - v.z); }
    mult(s) { return new Vector3(this.x * s, this.y * s, this.z * s); }
    length() { return Math.hypot(this.x, this.y, this.z); }
    normalize() { const l = this.length(); return l === 0 ? new Vector3() : this.mult(1 / l); }
    dot(v) { return this.x * v.x + this.y * v.y + this.z * v.z; }
    cross(v) { return new Vector3(this.y * v.z - this.z * v.y, this.z * v.x - this.x * v.z, this.x * v.y - this.y * v.x); }
}



class PhysicsEngine {
    constructor(ctx, width, height) {
        this.ctx = ctx;
        this.width = width;
        this.height = height;
        this.cx = width / 2;
        this.cy = height / 2;
        this.sphereRadius = Math.min(width, height) / 2 - 10;
        
        this.balls = [];
        this.drumRotation = 0;
        this.drumSpeed = 0.05;
        this.isRunning = false;
        this.gravity = new Vector3(0, 0.4, 0); // Downward
        this.wallBounciness = 0.7;
        
        // Visual Style
        this.palette = ['#ff4d4d'];
        this.material = 'standard';
    }

    addBalls(count) {
        this.balls = [];
        for (let i = 0; i < count; i++) {
            this.balls.push({
                id: i,
                r: 8, 
                pos: new Vector3(
                    (Math.random() - 0.5) * 50,
                    (Math.random() - 0.5) * 50,
                    (Math.random() - 0.5) * 50
                ),
                vel: new Vector3(
                    (Math.random() - 0.5) * 10,
                    (Math.random() - 0.5) * 10,
                    (Math.random() - 0.5) * 10
                ),
                colorBase: this.palette[0]
            });
        }
        this.updateColors();
    }

    removeBall() {
        if (this.balls.length > 0) {
            const idx = Math.floor(Math.random() * this.balls.length);
            this.balls.splice(idx, 1);
        }
    }
    
    setBallCount(count) {
        this.addBalls(count);
    }

    setPalette(colors, material) {
        this.palette = colors?.length ? colors : ['#ff4d4d'];
        this.material = material || 'standard';
        this.updateColors();
    }

    updateColors() {
        this.balls.forEach((b) => {
            // Use only the first color in the palette for uniformity
            b.colorBase = this.palette[0];
        });
    }

    update() {
        if (!this.isRunning) return;

        // Update Drum Rotation
        this.drumRotation += this.drumSpeed;
        
        // Tangential force vector from rotation (simplified)


        this.balls.forEach(ball => {
            // Gravity
            ball.vel = ball.vel.add(this.gravity);
            
            // Random Agitation (Air jets)
            if (Math.random() < 0.02) {
                ball.vel = ball.vel.add(new Vector3(
                    (Math.random()-0.5)*5, 
                    -(Math.random()*8), 
                    (Math.random()-0.5)*5
                ));
            }

            // Move
            ball.pos = ball.pos.add(ball.vel);

            // Constraint: Sphere Boundary
            const dist = ball.pos.length();
            if (dist + ball.r > this.sphereRadius) {
                // Collision Normal (pointing outward)
                const n = ball.pos.normalize();
                
                // Reflect velocity
                const vDotN = ball.vel.dot(n);
                // v_reflect = v - 2(v.n)n
                // Only reflect if moving outwards
                if (vDotN > 0) {
                    let reflected = ball.vel.sub(n.mult(2 * vDotN));
                    
                    // Add Wall Friction/Spin
                    // Force = Cross product of axis and position gives tangential direction
                    // But simplified: Add velocity in direction of drum rotation (X/Y plane rotation)
                    // If drum rotates Z, tangent is (-y, x, 0)
                    const tangent = new Vector3(-ball.pos.y, ball.pos.x, 0).normalize();
                    const wallSpeed = tangent.mult(this.drumSpeed * dist * 0.1);

                    ball.vel = reflected.mult(this.wallBounciness).add(wallSpeed);
                }
                
                // Push back inside
                ball.pos = n.mult(this.sphereRadius - ball.r - 0.1);
            }
        });

        // Simple Ball-Ball Collision (O(N^2) scales fine for < 20 balls)
        for (let i = 0; i < this.balls.length; i++) {
            for (let j = i + 1; j < this.balls.length; j++) {
                const b1 = this.balls[i];
                const b2 = this.balls[j];
                const diff = b1.pos.sub(b2.pos);
                let dist = diff.length();
                const minDist = b1.r + b2.r;
                
                if (dist < minDist && dist > 0) {
                    const n = diff.normalize();
                    const push = n.mult((minDist - dist) * 0.5);
                    
                    // Separate
                    b1.pos = b1.pos.add(push);
                    b2.pos = b2.pos.sub(push);
                    
                    // Exchange momentum (Elastic)
                    // v1' = v1 - dot(v1-v2, n) * n
                    // v2' = v2 - dot(v2-v1, n) * n
                    const v1 = b1.vel;
                    const v2 = b2.vel;
                    
                    const vRel = v1.sub(v2);
                    const impulse = vRel.dot(n);
                    
                    if (impulse < 0) { // Only collide if moving towards each other
                        b1.vel = b1.vel.sub(n.mult(impulse));
                        b2.vel = b2.vel.add(n.mult(impulse));
                    }
                }
            }
        }
    }

    draw() {
        if (!this.ctx) return;
        this.ctx.clearRect(0, 0, this.width, this.height);
        
        // 1. Sort balls by Z (painters algo)
        const D = 500; // Perspective distance
        const sortedBalls = [...this.balls].sort((a, b) => a.pos.z - b.pos.z);
        
        sortedBalls.forEach(ball => {
            const scale = D / (D - ball.pos.z);
            if (scale < 0) return;
            
            const x2d = this.cx + ball.pos.x * scale;
            const y2d = this.cy + ball.pos.y * scale;
            const r2d = ball.r * scale;
            
            this.ctx.beginPath();
            this.ctx.arc(x2d, y2d, Math.max(0, r2d), 0, Math.PI * 2);
            
            // Material Shader Logic
            let grad;
            const lightOffS = r2d * 0.3;
            
            // Note: Canvas gradients are cheap but creating them per frame per ball is standard
            grad = this.ctx.createRadialGradient(
                x2d - lightOffS, y2d - lightOffS, r2d * 0.1,
                x2d, y2d, r2d
            );

            if (this.material === 'neon') {
                // High contrast, emissive center
                grad.addColorStop(0, '#ffffff');
                grad.addColorStop(0.3, ball.colorBase);
                grad.addColorStop(0.6, ball.colorBase);
                grad.addColorStop(1, '#000000'); // Sharp dark edge
                
                // Emissive glow behind
                this.ctx.shadowBlur = 15;
                this.ctx.shadowColor = ball.colorBase;
            } else if (this.material === 'matte') {
                // Wood/felt style, soft light
                grad.addColorStop(0, '#ffffff'); // Less intense highlight needed typically, but white is ok
                grad.addColorStop(0.5, ball.colorBase);
                // Darker edge
                // Simple color darkening via mixing black is hard in pure hex
                // We rely on colorBase being correct from theme
                grad.addColorStop(1, 'rgba(0,0,0,0.5)'); // Artificial shadow
                
                this.ctx.shadowBlur = 0;
            } else {
                // Standard Glass/Plastic
                grad.addColorStop(0, '#ffffff');
                grad.addColorStop(0.2, ball.colorBase);
                grad.addColorStop(1, 'rgba(0,0,0,0.8)'); // Generic dark
                
                this.ctx.shadowBlur = 5 * scale;
                this.ctx.shadowColor = 'rgba(0,0,0,0.3)';
            }
            
            this.ctx.fillStyle = grad;
            this.ctx.fill();

            // Reset Shadows
            this.ctx.shadowColor = 'transparent';
            this.ctx.shadowBlur = 0;

            // Details (Band/Number)
            if (scale > 0.6) {
                this.ctx.save();
                this.ctx.clip(); 
                this.ctx.fillStyle = this.material === 'matte' 
                    ? 'rgba(0,0,0,0.3)' // Dark ink on wood
                    : 'rgba(255,255,255,0.7)'; // White on plastic
                
                this.ctx.beginPath();
                this.ctx.arc(x2d, y2d, r2d * 0.5, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.restore();
            }
        });
    }
}

export class DrumController {
    drum = null;
    stage = null;
    isSpinning = false;
    config = {
        numBalls: 90,
        diameter: 280
    };
    
    // Engine
    canvas = null;
    ctx = null;
    physics = null;
    animId = null;

    init() {
        console.log('[DrumController] Initializing 3D Canvas Drum (ULTRATHINK)...');
        
        this.drum = document.getElementById('drum');
        this.stage = document.getElementById('drum-stage');
        
        if (!this.drum) return;

        // Clear Old Content
        this.drum.innerHTML = '';
        
        // Setup Canvas
        this.canvas = document.createElement('canvas');
        this.drum.appendChild(this.canvas);
        
        // Auto-Size & Init Physics
        this._resize();
        window.addEventListener('resize', () => this._resize());
        
        // Theme Observer
        const themeLink = document.getElementById('theme-style');
        if (themeLink) {
             const observer = new MutationObserver(() => {
                 setTimeout(() => this._updateThemeColors(), 100); // Wait for CSS
             });
             observer.observe(themeLink, { attributes: true, attributeFilter: ['href'] });
        }

        // Init Physics Loop
        this.ctx = this.canvas.getContext('2d');
        this.physics = new PhysicsEngine(this.ctx, this.canvas.width, this.canvas.height);
        this.physics.addBalls(this.config.numBalls);
        this._updateThemeColors(); // Apply colors
        
        this.startSpin();
    }

    _resize() {
        if (!this.drum || !this.canvas) return;
        const rect = this.drum.getBoundingClientRect();
        // Handle high DPI
        const dpr = window.devicePixelRatio || 1;
        this.canvas.width = rect.width * dpr;
        this.canvas.height = rect.height * dpr;
        this.canvas.style.width = rect.width + 'px';
        this.canvas.style.height = rect.height + 'px';
        
        if(this.ctx) this.ctx.scale(dpr, dpr);

        if(this.physics) {
            this.physics.width = rect.width; // Logic coords usually match CSS pixels for simplicity
            this.physics.height = rect.height;
            this.physics.cx = rect.width / 2;
            this.physics.cy = rect.height / 2;
            this.physics.sphereRadius = Math.min(rect.width, rect.height) / 2 - 15;
            // Hack: reset ctx if scaled? 
            // Better: physics engine uses logical coords.
            // But we scaled the context. So draw calls use logical coords. Correct.
        }
    }
    
    _updateThemeColors() {
        if (!this.physics) return;

        const computed = getComputedStyle(document.body);
        
        // Read Palette (try up to 8 colors)
        const palette = [];
        for (let i=1; i<=8; i++) {
            const c = computed.getPropertyValue(`--ball-color-${i}`).trim();
            if (c) palette.push(c);
        }

        // If no palette, fallbacks
        if (palette.length === 0) {
            palette.push(
                computed.getPropertyValue('--color-accent').trim() || '#e91e63',
                computed.getPropertyValue('--color-secondary').trim() || '#c2185b'
            );
        }

        // Detect Material Hint
        // Easiest is checking theme name via href
        const themeHref = document.getElementById('theme-style')?.getAttribute('href') || '';
        let material = 'standard';
        if (themeHref.includes('wood') || themeHref.includes('steam')) material = 'matte';
        if (themeHref.includes('metal') || themeHref.includes('cyber')) material = 'neon';

        this.physics.setPalette(palette, material);
    }

    startSpin() {
         if (this.animId) cancelAnimationFrame(this.animId);
         this.isSpinning = true;
         if (this.physics) this.physics.isRunning = true;
         this._loop();
    }
    
    stopSpin() {
        this.isSpinning = false;
        // Don't stop physics, just visual flag if needed
    }

    _loop() {
        if (this.physics) {
            this.physics.update();
            this.physics.draw();
        }
        this.animId = requestAnimationFrame(() => this._loop());
    }

    animateExtraction(number, onComplete) {
        // High Speed Phase
        if(this.physics) {
             this.physics.drumSpeed = 0.25;
             // Add upward impulse to all balls
             this.physics.balls.forEach(b => b.vel.y -= 15);
        }

        const targetEl = document.getElementById('current-ball');

        // Create Flying Element for visual continuity
        const rect = this.canvas.getBoundingClientRect();
        const flyBall = document.createElement('div');
        flyBall.className = 'ball sphere'; // Re-use standard ball styles
        flyBall.textContent = number;
        flyBall.style.position = 'fixed';
        flyBall.style.left = (rect.left + rect.width/2 - 25) + 'px';
        flyBall.style.top = (rect.top + rect.height/2 - 25) + 'px';
        flyBall.style.width = '50px';
        flyBall.style.height = '50px';
        flyBall.style.zIndex = 1000;
        flyBall.style.transition = 'all 0.8s cubic-bezier(0.16, 1, 0.3, 1)';
        flyBall.style.transform = 'scale(0.1)';
        flyBall.style.opacity = '0';
        
        document.body.appendChild(flyBall);
        
        // Target position
        let targetRect = { left: window.innerWidth/2, top: window.innerHeight/2, width: 50, height: 50 };
        if (targetEl) targetRect = targetEl.getBoundingClientRect();
        
        // Trigger Animation
        requestAnimationFrame(() => {
            flyBall.style.opacity = '1';
            flyBall.style.transform = 'scale(1)';
            flyBall.style.left = (targetRect.left) + 'px';
            flyBall.style.top = (targetRect.top) + 'px';
            flyBall.style.width = targetRect.width + 'px';
            flyBall.style.height = targetRect.height + 'px';
        });

        setTimeout(() => {
            if(targetEl) {
                targetEl.textContent = number;
                targetEl.classList.remove('hidden');
                // Trigger pop animation
                targetEl.animate([
                    { transform: 'scale(1.2)' },
                    { transform: 'scale(1)' }
                ], { duration: 300 });
            }
            
            this._addToHistory(number);
            flyBall.remove();
            
            // Remove one ball from physics engine simulation
            if (this.physics) { 
                this.physics.removeBall();
                this.physics.drumSpeed = 0.05; // Calm down
            }

            if (onComplete) onComplete();
        }, 800);
    }
    
    _addToHistory(number) {
        const historyTrack = document.getElementById('history-track');
        if (!historyTrack) return;

        const ball = document.createElement('div');
        ball.className = 'history-ball';
        ball.textContent = number;
        historyTrack.insertBefore(ball, historyTrack.firstChild);
        while (historyTrack.children.length > 10) {
            historyTrack.lastChild.remove();
        }
    }

    setBallCount(count) {
        if (this.physics) {
            this.physics.setBallCount(count);
            this._updateThemeColors();
        }
    }
}

// Global Instance
export const drumController = new DrumController();
