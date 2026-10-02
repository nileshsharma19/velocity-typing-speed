/**
 * VelocityType - Web Audio API Procedural Sound Synthesizer
 * Zero latency mechanical key switches & audio feedback
 */

class SoundEngine {
  constructor() {
    this.audioCtx = null;
    this.soundType = "clicky"; // 'clicky' | 'thocky' | 'typewriter' | 'bubble' | 'off'
    this.volume = 0.5;
    this.isMuted = false;
  }

  /**
   * Lazy initialize AudioContext on user gesture
   */
  init() {
    if (!this.audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.audioCtx = new AudioContext();
      }
    } else if (this.audioCtx.state === "suspended") {
      this.audioCtx.resume();
    }
  }

  setSoundType(type) {
    this.soundType = type;
  }

  setVolume(vol) {
    this.volume = Math.max(0, Math.min(1, vol));
  }

  setMuted(muted) {
    this.isMuted = muted;
  }

  /**
   * Play keypress sound based on active sound type
   * @param {string} key 
   */
  playKey(key = "a") {
    if (this.isMuted || this.soundType === "off") return;
    this.init();
    if (!this.audioCtx) return;

    try {
      const now = this.audioCtx.currentTime;

      // Slight pitch variation per key for realism
      const pitchOffset = (key.charCodeAt(0) % 7 - 3) * 12;

      switch (this.soundType) {
        case "clicky":
          this.playClickySound(now, pitchOffset);
          break;
        case "thocky":
          this.playThockySound(now, pitchOffset);
          break;
        case "typewriter":
          this.playTypewriterSound(now, key === " ");
          break;
        case "bubble":
          this.playBubbleSound(now, pitchOffset);
          break;
        default:
          break;
      }
    } catch (e) {
      console.warn("Audio playback issue:", e);
    }
  }

  /**
   * Clicky Switch (Cherry MX Blue snap + click)
   */
  playClickySound(now, pitchOffset) {
    // 1. High tactile snap click
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();
    const filter = this.audioCtx.createBiquadFilter();

    osc.type = "sine";
    osc.frequency.setValueAtTime(1800 + pitchOffset * 15, now);
    osc.frequency.exponentialRampToValueAtTime(320, now + 0.025);

    filter.type = "highpass";
    filter.frequency.setValueAtTime(800, now);

    gain.gain.setValueAtTime(0.35 * this.volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.audioCtx.destination);

    osc.start(now);
    osc.stop(now + 0.04);

    // 2. Bottom-out mechanical tap
    const osc2 = this.audioCtx.createOscillator();
    const gain2 = this.audioCtx.createGain();
    osc2.type = "triangle";
    osc2.frequency.setValueAtTime(220 + pitchOffset * 4, now + 0.008);
    osc2.frequency.exponentialRampToValueAtTime(80, now + 0.04);

    gain2.gain.setValueAtTime(0.2 * this.volume, now + 0.008);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

    osc2.connect(gain2);
    gain2.connect(this.audioCtx.destination);

    osc2.start(now + 0.008);
    osc2.stop(now + 0.055);
  }

  /**
   * Thocky Switch (Lubed tactile deep creamy pop)
   */
  playThockySound(now, pitchOffset) {
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();
    const filter = this.audioCtx.createBiquadFilter();

    osc.type = "triangle";
    osc.frequency.setValueAtTime(380 + pitchOffset * 8, now);
    osc.frequency.exponentialRampToValueAtTime(95, now + 0.045);

    filter.type = "lowpass";
    filter.frequency.setValueAtTime(650, now);
    filter.Q.setValueAtTime(3, now);

    gain.gain.setValueAtTime(0.55 * this.volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.audioCtx.destination);

    osc.start(now);
    osc.stop(now + 0.055);
  }

  /**
   * Vintage Typewriter Strike + Space Carriage Return
   */
  playTypewriterSound(now, isSpace) {
    if (isSpace) {
      // Space bar vintage bell ping
      const bell = this.audioCtx.createOscillator();
      const bellGain = this.audioCtx.createGain();
      bell.type = "sine";
      bell.frequency.setValueAtTime(1480, now);

      bellGain.gain.setValueAtTime(0.25 * this.volume, now);
      bellGain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      bell.connect(bellGain);
      bellGain.connect(this.audioCtx.destination);

      bell.start(now);
      bell.stop(now + 0.4);
    }

    // Heavy mechanical metal strike
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();
    const filter = this.audioCtx.createBiquadFilter();

    osc.type = "square";
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(120, now + 0.03);

    filter.type = "bandpass";
    filter.frequency.setValueAtTime(1200, now);
    filter.Q.setValueAtTime(1.5, now);

    gain.gain.setValueAtTime(0.3 * this.volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.audioCtx.destination);

    osc.start(now);
    osc.stop(now + 0.045);
  }

  /**
   * Bubble / Pop Sound
   */
  playBubbleSound(now, pitchOffset) {
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(320 + pitchOffset * 10, now);
    osc.frequency.exponentialRampToValueAtTime(920 + pitchOffset * 15, now + 0.035);

    gain.gain.setValueAtTime(0.4 * this.volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.045);

    osc.connect(gain);
    gain.connect(this.audioCtx.destination);

    osc.start(now);
    osc.stop(now + 0.05);
  }

  /**
   * Error sound feedback (gentle subtle buzzer)
   */
  playError() {
    if (this.isMuted || this.soundType === "off") return;
    this.init();
    if (!this.audioCtx) return;

    try {
      const now = this.audioCtx.currentTime;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.linearRampToValueAtTime(110, now + 0.06);

      gain.gain.setValueAtTime(0.25 * this.volume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start(now);
      osc.stop(now + 0.09);
    } catch (e) {
      console.warn("Audio error sound:", e);
    }
  }

  /**
   * Test completion victory fanfare
   */
  playSuccess() {
    if (this.isMuted || this.soundType === "off") return;
    this.init();
    if (!this.audioCtx) return;

    const chords = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    const now = this.audioCtx.currentTime;

    chords.forEach((freq, idx) => {
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now + idx * 0.07);

      gain.gain.setValueAtTime(0, now + idx * 0.07);
      gain.gain.linearRampToValueAtTime(0.2 * this.volume, now + idx * 0.07 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.07 + 0.35);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start(now + idx * 0.07);
      osc.stop(now + idx * 0.07 + 0.38);
    });
  }
}

export const soundEngine = new SoundEngine();
