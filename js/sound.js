/* ==========================================================================
   Web Audio API Sound Synthesizer (Zero external dependencies)
   ========================================================================== */

class SoundFX {
  constructor() {
    this.ctx = null;
    this.enabled = true;
  }

  _init() {
    if (!this.ctx && (window.AudioContext || window.webkitAudioContext)) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // Subtle tap / click sound
  click() {
    if (!this.enabled) return;
    try {
      this._init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(300, this.ctx.currentTime + 0.04);
      
      gain.gain.setValueAtTime(0.04, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.04);
      
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      
      osc.start();
      osc.stop(this.ctx.currentTime + 0.04);
    } catch (_) {}
  }

  // Joyful dual chime when an expense or income is added
  success() {
    if (!this.enabled) return;
    try {
      this._init();
      if (!this.ctx) return;
      
      const now = this.ctx.currentTime;
      [
        { freq: 523.25, time: 0 },    // C5
        { freq: 659.25, time: 0.08 }, // E5
        { freq: 783.99, time: 0.16 }  // G5
      ].forEach(note => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(note.freq, now + note.time);
        
        gain.gain.setValueAtTime(0.08, now + note.time);
        gain.gain.exponentialRampToValueAtTime(0.001, now + note.time + 0.22);
        
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        
        osc.start(now + note.time);
        osc.stop(now + note.time + 0.22);
      });
    } catch (_) {}
  }

  // Pleasant sync bell
  sync() {
    if (!this.enabled) return;
    try {
      this._init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.exponentialRampToValueAtTime(1320, now + 0.15);
      
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      
      osc.start(now);
      osc.stop(now + 0.25);
    } catch (_) {}
  }
}

window.soundFX = new SoundFX();
