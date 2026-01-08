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
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        // Pluck sound (sine wave dropping fast in pitch)
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, t);
        osc.frequency.exponentialRampToValueAtTime(100, t + 0.15);

        // Envelope
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.4, t + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(t);
        osc.stop(t + 0.2);
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
        
        // Frequencies for C Major 7 chord (C, E, G, B)
        const chord = type === 'BINGO' 
            ? [523.25, 659.25, 783.99, 987.77, 1046.5] 
            : [659.25, 783.99]; // Simpler for Line

        chord.forEach((freq, i) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            
            // Triangle wave for a slightly 8-bit/game-like pleasant tone
            osc.type = 'triangle';
            osc.frequency.value = freq;
            
            const time = now + (i * 0.08); // Arpeggiated
            
            gain.gain.setValueAtTime(0, time);
            gain.gain.linearRampToValueAtTime(0.15, time + 0.05);
            gain.gain.exponentialRampToValueAtTime(0.001, time + 0.6);

            osc.connect(gain);
            gain.connect(this.masterGain);

            osc.start(time);
            osc.stop(time + 0.6);
        });
    }

    /**
     * TTS: Speech Synthesis
     */
    speakNumber(number) {
        if (this.isMuted) return;
        
        this.synth.cancel(); // Interrupt previous speech

        // Basic nickname logic (optional but adds zest)
        let text;
        if (number === 15) {
            text = "La niña bonita, 15";
        } else if (number === 22) {
             text = "Los dos patitos, 22";
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
        utterance.volume = this.volume;

        this.synth.speak(utterance);
    }
}

// Global Singleton
export const audioManager = new AudioManager();
