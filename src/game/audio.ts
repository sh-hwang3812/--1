/**
 * Web Audio API Algorithmic Sound Synthesizer
 * 100% self-contained, 0 external audio assets, works completely offline.
 */

class SoundEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private engineGain: GainNode | null = null;
  private engineOsc1: OscillatorNode | null = null;
  private engineOsc2: OscillatorNode | null = null;
  private engineFilter: BiquadFilterNode | null = null;
  private isEngineRunning: boolean = false;

  constructor() {
    // Check saved muted state
    try {
      const saved = localStorage.getItem('turbo_racer_muted');
      if (saved !== null) {
        this.isMuted = saved === 'true';
      }
    } catch {
      // LocalStorage error fallback
    }
  }

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    try {
      localStorage.setItem('turbo_racer_muted', String(muted));
    } catch {
      // Ignore
    }
    if (this.engineGain) {
      this.engineGain.gain.setValueAtTime(muted ? 0 : 0.08, this.ctx ? this.ctx.currentTime : 0);
    }
  }

  public toggleMute(): boolean {
    this.setMuted(!this.isMuted);
    return this.isMuted;
  }

  /**
   * Start procedural continuous engine rumble
   */
  public startEngine() {
    if (this.isEngineRunning || typeof window === 'undefined') return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;

      // Master engine gain
      this.engineGain = this.ctx.createGain();
      this.engineGain.gain.setValueAtTime(this.isMuted ? 0 : 0.08, now);

      // Low pass filter to simulate engine rumble body
      this.engineFilter = this.ctx.createBiquadFilter();
      this.engineFilter.type = 'lowpass';
      this.engineFilter.frequency.setValueAtTime(280, now);

      // Dual sawtooth / triangle oscillators for thick revving tone
      this.engineOsc1 = this.ctx.createOscillator();
      this.engineOsc1.type = 'sawtooth';
      this.engineOsc1.frequency.setValueAtTime(45, now);

      this.engineOsc2 = this.ctx.createOscillator();
      this.engineOsc2.type = 'triangle';
      this.engineOsc2.frequency.setValueAtTime(68, now);

      this.engineOsc1.connect(this.engineFilter);
      this.engineOsc2.connect(this.engineFilter);
      this.engineFilter.connect(this.engineGain);
      this.engineGain.connect(this.ctx.destination);

      this.engineOsc1.start();
      this.engineOsc2.start();
      this.isEngineRunning = true;
    } catch {
      // Audio context failure safeguard
    }
  }

  /**
   * Modulate engine pitch and roar based on normalized speed (0 to 1) and nitro
   */
  public updateEngine(speedRatio: number, isBoosting: boolean) {
    if (!this.ctx || !this.isEngineRunning) return;
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    try {
      const now = this.ctx.currentTime;
      const clamped = Math.max(0, Math.min(1.2, speedRatio));

      // Calculate target frequency
      const baseFreq = 40 + clamped * 130 + (isBoosting ? 40 : 0);
      const filterFreq = 220 + clamped * 500 + (isBoosting ? 300 : 0);

      if (this.engineOsc1) {
        this.engineOsc1.frequency.setTargetAtTime(baseFreq, now, 0.08);
      }
      if (this.engineOsc2) {
        this.engineOsc2.frequency.setTargetAtTime(baseFreq * 1.5, now, 0.08);
      }
      if (this.engineFilter) {
        this.engineFilter.frequency.setTargetAtTime(filterFreq, now, 0.08);
      }
      if (this.engineGain && !this.isMuted) {
        const targetVol = 0.06 + clamped * 0.08 + (isBoosting ? 0.06 : 0);
        this.engineGain.gain.setTargetAtTime(targetVol, now, 0.05);
      }
    } catch {
      // Audio modulation fallback
    }
  }

  public stopEngine() {
    if (!this.isEngineRunning) return;
    try {
      if (this.engineOsc1) {
        this.engineOsc1.stop();
        this.engineOsc1.disconnect();
      }
      if (this.engineOsc2) {
        this.engineOsc2.stop();
        this.engineOsc2.disconnect();
      }
      if (this.engineGain) {
        this.engineGain.disconnect();
      }
    } catch {
      // Ignore
    }
    this.engineOsc1 = null;
    this.engineOsc2 = null;
    this.engineGain = null;
    this.engineFilter = null;
    this.isEngineRunning = false;
  }

  /**
   * Play crystal coin pickup chime
   */
  public playCoin() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(987.77, now); // B5
      osc.frequency.exponentialRampToValueAtTime(1318.51, now + 0.08); // E6

      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.26);
    } catch {
      // Audio fallback
    }
  }

  /**
   * Play high-energy nitro whoosh
   */
  public playNitro() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(200, now);
      osc.frequency.exponentialRampToValueAtTime(800, now + 0.3);

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.42);
    } catch {
      // Audio fallback
    }
  }

  /**
   * Play powerup collection fanfare
   */
  public playPowerup() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      const now = this.ctx.currentTime;

      notes.forEach((freq, i) => {
        if (!this.ctx) return;
        const noteTime = now + i * 0.06;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, noteTime);

        gain.gain.setValueAtTime(0.15, noteTime);
        gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.18);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(noteTime);
        osc.stop(noteTime + 0.2);
      });
    } catch {
      // Audio fallback
    }
  }

  /**
   * Play crash impact explosion
   */
  public playCrash() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;

      // Heavy sub bass thud
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(120, now);
      osc.frequency.exponentialRampToValueAtTime(28, now + 0.45);

      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.52);

      // Noise generator for crunch/impact
      const bufferSize = this.ctx.sampleRate * 0.35;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const noiseFilter = this.ctx.createBiquadFilter();
      noiseFilter.type = 'lowpass';
      noiseFilter.frequency.setValueAtTime(800, now);
      noiseFilter.frequency.linearRampToValueAtTime(200, now + 0.35);

      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.3, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      noise.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(this.ctx.destination);

      noise.start(now);
      noise.stop(now + 0.36);
    } catch {
      // Audio fallback
    }
  }

  /**
   * Near miss close-call whoosh
   */
  public playNearMiss() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(450, now);
      osc.frequency.exponentialRampToValueAtTime(180, now + 0.2);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.22);
    } catch {
      // Audio fallback
    }
  }

  /**
   * Shield absorb sound
   */
  public playShieldDeflect() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(300, now);
      osc.frequency.linearRampToValueAtTime(900, now + 0.15);
      osc.frequency.linearRampToValueAtTime(400, now + 0.3);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.36);
    } catch {
      // Audio fallback
    }
  }
}

export const sound = new SoundEngine();
