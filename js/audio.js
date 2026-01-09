/**
 * AudioManager
 * Handles synthetic sound effects and Text-to-Speech (TTS) for the Bingo game.
 * Philosophically aligned with "Intentional Minimalism" - sounds are generated in real-time.
 */
export class AudioManager {
    ctx = null;
    masterGain = null;
    volume = 0.5;
    isMuted = false;
    initialized = false;
    voices = [];
    synth = globalThis.speechSynthesis;

    constructor() {
        // Bind for safe passing
        this._loadVoices = this._loadVoices.bind(this);
        
        if (this.synth.onvoiceschanged === undefined) {
             this._loadVoices();
        } else {
             this.synth.onvoiceschanged = this._loadVoices;
        }
    }

    /**
     * Initializes the AudioContext on first user interaction.
     * Browsers block audio until a gesture occurs.
     */
    init() {
        if (this.initialized) return;

        // Cross-browser support
        const AudioContext = globalThis.AudioContext || globalThis.webkitAudioContext;
        this.ctx = new AudioContext();
        
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = this.isMuted ? 0 : this.volume;
        this.masterGain.connect(this.ctx.destination);

        this._loadVoices();
        this.initialized = true;
        console.log('AudioManager: Initialized Web Audio API');
    }

    _loadVoices() {
        this.voices = this.synth.getVoices();
    }

    setVolume(val) {
        this.volume = Math.max(0, Math.min(1, val));
        if (this.masterGain && !this.isMuted && this.initialized) {
            // Smooth transition to avoid clicking
            this.masterGain.gain.setTargetAtTime(this.volume, this.ctx.currentTime, 0.1);
        }
    }

    /**
     * Sets the mute state explicitly
     * @param {boolean} muted - Whether to mute
     */
    setMuted(muted) {
        this.isMuted = muted;
        if (this.masterGain && this.initialized) {
            const target = this.isMuted ? 0 : this.volume;
            this.masterGain.gain.setTargetAtTime(target, this.ctx.currentTime, 0.1);
        }
    }

    toggleMute() {
        this.isMuted = !this.isMuted;
        if (this.masterGain && this.initialized) {
            const target = this.isMuted ? 0 : this.volume;
            this.masterGain.gain.setTargetAtTime(target, this.ctx.currentTime, 0.1);
        }
        return this.isMuted;
    }

    /**
     * Generators: Synthetic Audio
     */

    playBallPop() {
        if (!this.initialized || this.isMuted) return;

        const t = this.ctx.currentTime;
        
        // 1. Body (The hollow thud of plastic) - Improved
        const osc1 = this.ctx.createOscillator();
        const gain1 = this.ctx.createGain();
        osc1.type = 'sine'; // Sine is rounder for the body
        osc1.frequency.setValueAtTime(300, t);
        osc1.frequency.exponentialRampToValueAtTime(60, t + 0.15);
        gain1.gain.setValueAtTime(0, t);
        gain1.gain.linearRampToValueAtTime(0.8, t + 0.005);
        gain1.gain.exponentialRampToValueAtTime(0.01, t + 0.2);
        osc1.connect(gain1);
        gain1.connect(this.masterGain);

        // 2. Click (The hard surface contact)
        const osc2 = this.ctx.createOscillator();
        const gain2 = this.ctx.createGain();
        osc2.type = 'square';
        osc2.frequency.setValueAtTime(2000, t);
        osc2.frequency.exponentialRampToValueAtTime(500, t + 0.05);
        gain2.gain.setValueAtTime(0, t);
        gain2.gain.linearRampToValueAtTime(0.15, t + 0.002);
        gain2.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
        osc2.connect(gain2);
        gain2.connect(this.masterGain);

        osc1.start(t);
        osc1.stop(t + 0.25);
        osc2.start(t);
        osc2.stop(t + 0.1);
    }

    playDrumRoll() {
        if (!this.initialized || this.isMuted) return;
        
        const duration = 2;
        const bufferSize = this.ctx.sampleRate * duration;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);

        // White noise generation
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;

        // Bandpass filter to make it sound more like a snare/drumroll
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 1000;
        filter.Q.value = 1;

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.2, this.ctx.currentTime + 0.5);
        gain.gain.linearRampToValueAtTime(0.2, this.ctx.currentTime + 1.5);
        gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + duration);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);

        noise.start();
        noise.stop(this.ctx.currentTime + duration);
    }

    playWinSound(type) {
        if (!this.initialized || this.isMuted) return;
        const now = this.ctx.currentTime;
        
        // Settings based on type
        const isBingo = type === 'BINGO';
        const baseVol = 0.3; // Base volume for victory sounds

        // 1. Fanfare / Melody
        // Major arpeggio for Line, Grand fanfare for Bingo
        const notes = isBingo 
            ? [523.25, 659.25, 783.99, 1046.5, 783.99, 1046.5, 1318.51, 1567.98] // C4, E4, G4, C5, G4, C5, E5, G5
            : [659.25, 783.99, 987.77, 1046.5]; // E4, G4, B4, C5

        const noteDuration = isBingo ? 0.12 : 0.15;

        notes.forEach((freq, i) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            
            // Mix types for richer sound
            osc.type = i % 2 === 0 ? 'triangle' : 'sine';
            osc.frequency.value = freq;
            
            const time = now + (i * noteDuration);
            
            gain.gain.setValueAtTime(0, time);
            gain.gain.linearRampToValueAtTime(baseVol, time + 0.05);
            gain.gain.exponentialRampToValueAtTime(0.01, time + 0.4);

            osc.connect(gain);
            gain.connect(this.masterGain);

            osc.start(time);
            osc.stop(time + 0.5);
        });

        // 2. Fireworks / Applause (Synthetic Noise)
        // More intense for Bingo
        const duration = isBingo ? 4 : 1.5;
        const particleCount = isBingo ? 15 : 5;

        for (let i = 0; i < particleCount; i++) {
            const timeOffset = Math.random() * duration;
            this.playExplosion(now + timeOffset, isBingo ? 1 : 0.5);
        }
    }

    playExplosion(startTime, intensity = 1) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();

        // White noise approximate via random frequency modulation
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(100, startTime);
        osc.frequency.exponentialRampToValueAtTime(1, startTime + 0.5); // Pitch drop for "boom"

        // Filter to muffle it into an explosion
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1000, startTime);
        filter.frequency.linearRampToValueAtTime(100, startTime + 0.5);

        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.3 * intensity, startTime + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.5);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);

        osc.start(startTime);
        osc.stop(startTime + 0.6);
    }

    /**
     * TTS: Speech Synthesis
     */
    speakNumber(number) {
        if (this.isMuted) return;
        
        this.synth.cancel(); // Interrupt previous speech

        // Special nicknames map
        const specialNames = {
            1: "El pequeñito",
            2: "El patito",
            11: "Las banderillas",
            13: "La mala suerte",
            15: "La niña bonita",
            22: "Los dos patitos",
            33: "La edad de Cristo",
            44: "Las sillitas",
            48: "El de los pollos",
            55: "Los dos cincos",
            69: "La vuelta al mundo",
            77: "Las dos muletas",
            88: "Las dos calabazas",
            90: "El abuelo"
        };
        
        let text;
        
        if (specialNames[number]) {
            // "Number, Nickname"
            text = `${number}, ${specialNames[number]}`;
        } else if (number >= 70 && number <= 79) {
            // The 70s special rule: "Setenta y cuatro" -> "74: Siete Cuatro"
            // Except 77 which is handled above by specialNames check
            const digitNames = ['cero', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve'];
            const digits = number.toString().split('').map(d => Number.parseInt(d, 10));
            
            // "74, siete cuatro"
            text = `${number}, siete ${digitNames[digits[1]]}`;
        } else {
             text = `${number}`;
        }

        const utterance = new SpeechSynthesisUtterance(text);
        
        // Priority: Spanish (Spain) -> Spanish (Any) -> Default
        const voice = this.voices.find(v => v.lang === 'es-ES') || 
                      this.voices.find(v => v.lang.startsWith('es'));
        
        if (voice) {
            utterance.voice = voice;
        }

        utterance.rate = 1; 
        utterance.pitch = 1;
        // Amplify vocals 1.5x relative to effects (clamped at 1.0)
        utterance.volume = Math.min(1, this.volume * 2);

        this.synth.speak(utterance);
    }
}

// Global Singleton
export const audioManager = new AudioManager();
