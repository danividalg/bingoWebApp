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
    
    // Euler rotation around X axis
    rotateX(angle) {
        const c = Math.cos(angle);
        const s = Math.sin(angle);
        return new Vector3(
            this.x,
            this.y * c - this.z * s,
            this.y * s + this.z * c
        );
    }

    // Euler rotation around Y axis
    rotateY(angle) {
        const c = Math.cos(angle);
        const s = Math.sin(angle);
        return new Vector3(
            this.x * c + this.z * s,
            this.y,
            -this.x * s + this.z * c
        );
    }

    // Rotate vector around arbitrary axis (Rodrigues' rotation formula)
    rotateAxis(axis, angle) {
        const k = axis.normalize(); // Ensure axis is unit vector
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        
        // v * cos(theta)
        const term1 = this.mult(cos);
        
        // (k x v) * sin(theta)
        const term2 = k.cross(this).mult(sin);
        
        // k * (k . v) * (1 - cos(theta))
        const term3 = k.mult(k.dot(this) * (1 - cos));
        
        return term1.add(term2).add(term3);
    }
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
        
        // ULTRATHINK: Random Rotation Axis for more dynamic "Tumble"
        // Avoid purely vertical (Y) or horizontal X/Z axes to prevent boring poles.
        // We initialize with a diagonal axis.
        this.rotationAxis = new Vector3(1, 0.5, 0.2).normalize();
        
        this.drumAngle = 0; // Accumulated angle
        this.drumSpeed = 0.015; 
        
        this.isRunning = false;
        this.gravity = new Vector3(0, 0.8, 0); // Increased Gravity to Fix Equator Clustering
        this.wallBounciness = 0.5; // Reduce bounce to keep them inside/rolling
        
        // Visual Style
        this.palette = ['#ff4d4d'];
        this.material = 'standard';

        // Cage Geometry Cache
        this.ribs = [];
        this.rings = [];
        this._initCageGeometry();
        
        // Time constant for axis wandering
        this.time = 0;
    }

    _initCageGeometry() {
        // Vertical Ribs (Meridians)
        const numRibs = 12; // More detailed
        for (let i = 0; i < numRibs; i++) {
            this.ribs.push((Math.PI * 2 * i) / numRibs);
        }
        
        // Horizontal Rings (Parallels)
        const numRings = 7; 
        for (let i = 0; i < numRings; i++) {
            // -1 to 1 range
            const yFactor = -0.9 + (i * 1.8) / (numRings - 1);
            const radiusFactor = Math.sqrt(1 - yFactor * yFactor);
            this.rings.push({ y: yFactor, r: radiusFactor }); // Storing as normalized Y and R
        }
    }

    addBalls(count) {
        this.balls = [];
        // Spawn spread out but prefer top half to let them fall
        const spread = this.sphereRadius * 0.5;
        
        for (let i = 0; i < count; i++) {
            this.balls.push({
                id: i + 1, 
                r: 8, 
                pos: new Vector3(
                    (Math.random() - 0.5) * spread,
                    (Math.random() - 0.5) * spread - 20, // Start slightly higher
                    (Math.random() - 0.5) * spread
                ),
                vel: new Vector3(
                    (Math.random() - 0.5) * 2,
                    (Math.random() - 0.5) * 2,
                    (Math.random() - 0.5) * 2
                ),
                angle: Math.random() * Math.PI * 2, 
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
        const current = this.balls.length;
        if (count < current) {
            for (let i = 0; i < current - count; i++) {
                this.removeBall();
            }
        } else if (count > current) {
            // If massive difference (like starting new game or toggling perf mode), just reset
            if (count - current > 10) {
                this.addBalls(count);
                return;
            }
            
            const spread = this.sphereRadius * 0.5;
            for (let i = 0; i < count - current; i++) {
                this.balls.push({
                    id: Math.floor(Math.random() * 90) + 1, 
                    r: 8, 
                    pos: new Vector3((Math.random()-0.5)*spread, (Math.random()-0.5)*spread, (Math.random()-0.5)*spread),
                    vel: new Vector3((Math.random()-0.5)*2, (Math.random()-0.5)*2, (Math.random()-0.5)*2),
                    angle: Math.random() * Math.PI * 2, 
                    colorBase: this.palette[0]
                });
            }
        }
    }

    setPalette(colors, material) {
        this.palette = colors?.length ? colors : ['#ff4d4d'];
        this.material = material || 'standard';
        this.updateColors();
    }

    updateColors() {
        this.balls.forEach((b, i) => {
            b.colorBase = this.palette[i % this.palette.length];
        });
    }

    update() {
        if (!this.isRunning) return;

        const STEPS = 4; 
        const dt = 1 / STEPS;

        // Evolve Rotation Axis slowly (Wumble/Precession effect)
        this.time += 0.01;
        // Perturb axis slightly
        this.rotationAxis = new Vector3(
            Math.cos(this.time * 0.1),
            Math.sin(this.time * 0.15) * 0.5, // Less vertical variation
            Math.sin(this.time * 0.1)
        ).normalize();

        for (let s = 0; s < STEPS; s++) {
            this.step(dt);
        }
    }

    step(dt) {
        this.drumAngle += this.drumSpeed * dt;
        
        // Correct Friction Calculation:
        // The wall is moving. Local velocity of wall at point P is: v = omega x r
        // Omega vector is aligned with rotation axis.
        const omega = this.rotationAxis.mult(this.drumSpeed * 50); // Scale for angular velocity magnitude

        this.balls.forEach(ball => {
             // 1. Gravity (Always down in world space)
             ball.vel = ball.vel.add(this.gravity.mult(dt));

             // 2. Air Drag / Damping
             ball.vel = ball.vel.mult(0.995);

             // Chaotic Turbulence
             if (Math.random() < 0.05) { 
                ball.vel = ball.vel.add(new Vector3(
                     (Math.random()-0.5)*8, 
                     (Math.random()-0.5)*8, 
                     (Math.random()-0.5)*8
                 ));
             }

             // 3. Movement
             ball.pos = ball.pos.add(ball.vel.mult(dt));
             
             // 4. Tumbling Visualization
             ball.angle += ball.vel.length() * 0.1 * dt;

             this.handleWallCollision(ball, omega);
        });

        this.resolveCollisions();
    }

    handleWallCollision(ball, omega) {
        const dist = ball.pos.length();
        
        // Constraint: Keep inside sphere
        if (dist + ball.r > this.sphereRadius) {
            const n = ball.pos.normalize(); // Normal pointing OUT
            const penetration = (dist + ball.r) - this.sphereRadius;
            
            // Hard Positional Fix
            ball.pos = ball.pos.sub(n.mult(penetration));

            // Velocity Reflection
            const vDotN = ball.vel.dot(n);
            if (vDotN > 0) { // Moving outwards
                // Elastic Bounce
                const restitution = this.wallBounciness;
                
                // Pure reflection part
                let reflected = ball.vel.sub(n.mult(2 * vDotN)); // * restitution done later
                
                // Friction/Drag Application:
                // Wall Velocity at this contact point:
                // V_wall = Omega x R_ball
                const vWall = omega.cross(ball.pos);

                // Blend ball velocity towards wall velocity (Friction)
                // Tangential component should match wall
                const friction = 0.05; // Reduced from 0.2 - Slippery glass

                // Add random deflection to reflection (uneven surface)
                const jitter = new Vector3(Math.random()-0.5, Math.random()-0.5, Math.random()-0.5).mult(2); 
                
                // Result: Reflect normal component, blend tangential component
                ball.vel = reflected.add(jitter).mult(restitution).add(vWall.mult(friction));
            }
        }
    }

    resolveCollisions() {
        const restitution = 0.7; // Softer collisions
        
        // Spatial hash or just brute force for 90 balls is fine (approx 4000 pairs, fast in JS)
        for (let i = 0; i < this.balls.length; i++) {
            for (let j = i + 1; j < this.balls.length; j++) {
                const b1 = this.balls[i];
                const b2 = this.balls[j];
                
                const dx = b1.pos.x - b2.pos.x;
                const dy = b1.pos.y - b2.pos.y;
                const dz = b1.pos.z - b2.pos.z;
                const distSq = dx*dx + dy*dy + dz*dz;
                const minDist = b1.r + b2.r;
                
                if (distSq < minDist * minDist) {
                    const dist = Math.sqrt(distSq);
                    const n = new Vector3(dx/dist, dy/dist, dz/dist);
                    
                    const overlap = minDist - dist;
                    const sep = n.mult(overlap * 0.5);
                    
                    b1.pos = b1.pos.add(sep);
                    b2.pos = b2.pos.sub(sep);
                    
                    const vRel = b1.vel.sub(b2.vel);
                    const vN = vRel.dot(n);
                    
                    if (vN < 0) {
                        const impulse = n.mult(-(1 + restitution) * vN * 0.5);
                        b1.vel = b1.vel.add(impulse);
                        b2.vel = b2.vel.sub(impulse);
                    }
                }
            }
        }
    }

    draw() {
        if (!this.ctx) return;
        
        // Clear & Set Context
        this.ctx.clearRect(0, 0, this.width, this.height);
        
        // Draw Glass Background (The Body of the Drum)
        const grad = this.ctx.createRadialGradient(this.cx, this.cy, this.sphereRadius * 0.2, this.cx, this.cy, this.sphereRadius);
        grad.addColorStop(0, 'rgba(255, 255, 255, 0.05)');
        grad.addColorStop(0.8, 'rgba(255, 255, 255, 0.1)');
        grad.addColorStop(1, 'rgba(255, 255, 255, 0.2)');
        
        this.ctx.fillStyle = grad;
        this.ctx.beginPath();
        this.ctx.arc(this.cx, this.cy, this.sphereRadius, 0, Math.PI * 2);
        this.ctx.fill();

        // 3D Rendering Pipeline
        // We draw in layers: Back Cage -> Balls (Sorted) -> Front Cage
        
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';

        // 1. Draw BACK Cage (Ribs & Rings where Z < 0)
        this.drawCage('back');

        // 2. Draw Balls (Sorted from Back to Front)
        const D = 800; // Perspective depth
        const sorted = [...this.balls].sort((a, b) => a.pos.z - b.pos.z);
        
        sorted.forEach(ball => {
            const scale = D / (D - ball.pos.z);
            const x = this.cx + ball.pos.x * scale;
            const y = this.cy + ball.pos.y * scale;
            const r = ball.r * scale;
            
            if (scale < 0) return; // Behind camera
            
            // Ball Shadow (Projected on 'floor' of drum? Hard. Standard drop shadow)
            // this.ctx.shadowColor = 'rgba(0,0,0,0.3)';
            // this.ctx.shadowBlur = 5;

            // Gradient Material
            const bGrad = this.ctx.createRadialGradient(
                x - r*0.3, y - r*0.3, r * 0.1,
                x, y, r
            );
            
            // Sophisticated Material
            if (this.material === 'neon') {
                bGrad.addColorStop(0, '#fff');
                bGrad.addColorStop(0.5, ball.colorBase);
                bGrad.addColorStop(1, '#000');
            } else {
                bGrad.addColorStop(0, '#ffffff');
                bGrad.addColorStop(0.3, ball.colorBase);
                bGrad.addColorStop(0.9, '#000000'); // Deep shadow at edge
            }

            this.ctx.fillStyle = bGrad;
            this.ctx.beginPath();
            this.ctx.arc(x, y, r, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Specular Shine
            this.ctx.fillStyle = 'rgba(255,255,255,0.4)';
            this.ctx.beginPath();
            this.ctx.arc(x - r*0.3, y - r*0.3, r*0.25, 0, Math.PI*2);
            this.ctx.fill();
            
            // Text Number
            // Only draw if large enough
            if (scale > 0.8) {
                // Use configured text color
                this.ctx.fillStyle = this.textColor || (this.material === 'neon' ? '#000' : '#fff');
                this.ctx.font = `bold ${Math.max(8, r)}px "Outfit", sans-serif`;
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'middle';
                
                // Slight rotation of number based on ball angle
                this.ctx.save();
                this.ctx.translate(x, y);
                this.ctx.rotate(ball.angle);
                this.ctx.fillText(ball.id, 0, 0);
                this.ctx.restore();
            }
        });

        // 3. Draw FRONT Cage (Ribs & Rings where Z > 0)
        this.ctx.shadowBlur = 10;
        this.ctx.shadowColor = this.palette[0]; // Glow using theme color
        this.drawCage('front');
        this.ctx.shadowBlur = 0;
    }

    drawCage(layer) {
        const D = 800;
        
        this.ctx.strokeStyle = layer === 'back' 
            ? 'rgba(255, 255, 255, 0.1)' 
            : 'rgba(255, 255, 255, 0.6)';
        this.ctx.lineWidth = layer === 'back' ? 1 : 2;

        const rot = this.drumAngle;

        // Draw Ribs (Vertical Circles)
        const res = 32;
        
        // Use Rotation Matrix for the whole cage
        // We rotate points: P' = rotateAxis(P, rotTotal)
        // Actually, we rotate points around rotationAxis by drumAngle
        // But ribs are defined in canonical frame. So we rotate ( Canonical -> Rotated )
        
        this.ribs.forEach(baseAngle => {
            this.ctx.beginPath();
            let first = true;
            
            for (let i = 0; i <= res; i++) {
                const theta = (i / res) * Math.PI * 2;
                
                // Rib local coords (Circle in XY plane, rotated around Y by baseAngle)
                // x0 = R * sin(theta)
                // y0 = R * cos(theta)
                // z0 = 0
                // Rotate by baseAngle around Y axis:
                // x = x0 cos(base) + z0 sin(base) -> x0 cos(base)
                // y = y0
                // z = -x0 sin(base) + z0 cos(base) -> -x0 sin(base)
                
                // Simplified:
                // Canonical Rib i (Meridian): arc passing through poles.
                // Standard Param: P = (R sin(theta) cos(phi), R cos(theta), R sin(theta) sin(phi))
                // Theta: 0 to 2PI (full circle through poles)
                // Phi: baseAngle
                
                let p = new Vector3(
                     this.sphereRadius * Math.sin(theta) * Math.cos(baseAngle),
                     this.sphereRadius * Math.cos(theta),
                     this.sphereRadius * Math.sin(theta) * Math.sin(baseAngle)
                );
                
                // Apply Global Rotation
                p = p.rotateAxis(this.rotationAxis, rot); 
                
                const show = layer === 'back' ? p.z < 0 : p.z >= -20;
                
                if (show) {
                    const scale = D / (D - p.z);
                    const drawX = this.cx + p.x * scale;
                    const drawY = this.cy + p.y * scale;
                    
                    if (first) {
                        this.ctx.moveTo(drawX, drawY);
                        first = false;
                    } else {
                        this.ctx.lineTo(drawX, drawY);
                    }
                } else {
                    first = true;
                }
            }
            this.ctx.stroke();
        });

        // Draw Rings (Parallels)
        this.rings.forEach(ring => {
            const yStart = ring.y * this.sphereRadius;
            const rStart = ring.r * this.sphereRadius;
            
            this.ctx.beginPath();
            let first = true;
            
            for (let i = 0; i <= res; i++) {
                const theta = (i / res) * Math.PI * 2;
                
                // Canonical points: (r cos(theta), y, r sin(theta))
                let p = new Vector3(
                    rStart * Math.cos(theta),
                    yStart,
                    rStart * Math.sin(theta)
                );
                
                // Apply Global Rotation
                p = p.rotateAxis(this.rotationAxis, rot);
                
                const show = layer === 'back' ? p.z < 0 : p.z >= -20;
                
                if (show) {
                    const scale = D / (D - p.z);
                    const drawX = this.cx + p.x * scale;
                    const drawY = this.cy + p.y * scale;

                    if (first) {
                        this.ctx.moveTo(drawX, drawY);
                        first = false;
                    } else {
                        this.ctx.lineTo(drawX, drawY);
                    }
                } else {
                    first = true;
                }
            }
            this.ctx.stroke();
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
    physics = null;
    animId = null;
    performanceMode = 'high';

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
        
        // Ensure drum wrapper styles
        this.drum.className = 'drum-wrapper'; // Apply the 3D wrapper class
        
        // Auto-Size & Init Physics
        // ULTRATHINK: Use ResizeObserver instead of window resize to catch flexbox/grid changes
        // This prevents the "distorted/flattened" sphere bug on wide screens where layout shifts 
        // happen independently of window resize events.
        if (this.resizeObserver) this.resizeObserver.disconnect();
        
        this.resizeObserver = new ResizeObserver((entries) => {
             // We don't rely on entries dimensions because DPR scaling needs careful handling.
             // Just trigger the internal resize logic.
             // Use requestAnimationFrame to sync with paint cycle.
             globalThis.requestAnimationFrame(() => this._resize());
        });
        this.resizeObserver.observe(this.drum);
        
        // Theme Observer
        const themeLink = document.getElementById('theme-style');
        if (themeLink) {
             const observer = new MutationObserver(() => {
                 setTimeout(() => this._updateThemeColors(), 100); 
             });
             observer.observe(themeLink, { attributes: true, attributeFilter: ['href'] });
        }

        // Init Physics Loop
        this.ctx = this.canvas.getContext('2d');
        this.physics = new PhysicsEngine(this.ctx, 100, 100); // Initial dummy size
        this.physics.addBalls(this.config.numBalls);
        
        // ULTRATHINK: Forced Calibration
        // We call _resize immediately after physics creation to sync,
        // and again after a short delay to ensure the layout has settled.
        this._resize();
        setTimeout(() => this._resize(), 50);
        setTimeout(() => this._resize(), 500); // Fail-safe for slow layout shifts

        this._updateThemeColors(); // Apply colors
        
        this.syncBallCount(this.config.numBalls); // Apply Performance settings initially
        
        this.startSpin();
    }

    syncBallCount(totalRemaining) {
        if (!this.physics) return;
        this.setBallCount(totalRemaining);
    }

    _resize() {
        if (!this.drum || !this.canvas) return;
        const rect = this.drum.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        
        this.canvas.width = rect.width * dpr;
        this.canvas.height = rect.height * dpr;
        
        // CSS display size matches parent
        this.canvas.style.width = '100%';
        this.canvas.style.height = '100%';
        
        if(this.ctx) this.ctx.scale(dpr, dpr);

        if(this.physics) {
            this.physics.width = rect.width; 
            this.physics.height = rect.height;
            this.physics.cx = rect.width / 2;
            this.physics.cy = rect.height / 2;
            this.physics.sphereRadius = Math.min(rect.width, rect.height) / 2 - 10;
        }
    }
    
    _updateThemeColors() {
        if (!this.physics) return;

        const computed = getComputedStyle(document.body);
        
        // ULTRATHINK: Precise Color Matching
        // Use drum specific variables if available, otherwise accent
        const ballBase = computed.getPropertyValue('--drum-ball-base').trim();
        const textColor = computed.getPropertyValue('--drum-text-color').trim();
        const accent = computed.getPropertyValue('--color-accent').trim() || '#e91e63';
        
        // Palette uses base color
        const palette = [ballBase || accent];
        
        // Store text color for rendering
        this.physics.textColor = textColor || '#ffffff';

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
         
         if (this.performanceMode === 'disabled') {
             this.physics.draw();
             return;
         }
         
         this._loop();
    }
    
    stopSpin() {
        this.isSpinning = false;
        if (this.animId) cancelAnimationFrame(this.animId);
    }

    _loop() {
        if (this.performanceMode === 'disabled') return;

        if (this.physics) {
            this.physics.update();
            this.physics.draw();
        }
        this.animId = requestAnimationFrame(() => this._loop());
    }

    animateExtraction(number, totalRemaining, onComplete) {
        if(this.physics) {
            if (this.performanceMode !== 'disabled') {
                this.physics.drumSpeed = 0.25;
                this.physics.balls.forEach(b => b.vel.y -= 15);
            }
        }

        const targetEl = document.getElementById('current-ball');

        // Create Flying Element for visual continuity
        const rect = this.canvas.getBoundingClientRect();
        const flyBall = document.createElement('div');
        flyBall.className = 'ball sphere'; // Keep existing CSS class
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
        
        // Match style to theme
        const computed = getComputedStyle(document.body);
        flyBall.style.background = computed.getPropertyValue('--ball-color-1') || '#fff';
        flyBall.style.color = '#000';
        
        document.body.appendChild(flyBall);
        
        let targetRect = { left: window.innerWidth/2, top: window.innerHeight/2, width: 50, height: 50 };
        if (targetEl) targetRect = targetEl.getBoundingClientRect();
        
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
                targetEl.animate([
                    { transform: 'scale(1.2)' },
                    { transform: 'scale(1)' }
                ], { duration: 300 });
            }
            
            this._addToHistory(number);
            flyBall.remove();
            
            if (this.physics) { 
                const isLimited = this.performanceMode === 'low' || this.performanceMode === 'disabled';
                const target = isLimited ? Math.ceil(totalRemaining / 10) : totalRemaining;
                if (this.physics.balls.length > target) {
                    this.physics.removeBall();
                }
                if (this.performanceMode === 'disabled') {
                    this.physics.draw(); // Force redraw to show removed ball
                } else {
                    this.physics.drumSpeed = 0.02;
                }
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
        while (historyTrack.children.length > 10) { // Limit history
            historyTrack.lastChild.remove();
        }
    }

    setBallCount(count) {
        if (this.physics) {
            let actualCount = count;
            if (this.performanceMode === 'low' || this.performanceMode === 'disabled') {
                actualCount = Math.ceil(count / 10);
            }
            this.physics.setBallCount(actualCount);
            this._updateThemeColors();
            
           if (this.performanceMode === 'disabled') {
               this.physics.draw();
           }
        }
    }
}

export const drumController = new DrumController();
