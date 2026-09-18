// Web Audio API & Speech Synthesis engine for in-cockpit ADAS audio alerts

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export class AudioAlertEngine {
  private static soundEnabled: boolean = true;
  private static voiceEnabled: boolean = true;
  private static volume: number = 0.6;
  private static lastSpokenTime: number = 0;

  static setSoundEnabled(enabled: boolean) {
    this.soundEnabled = enabled;
  }

  static setVoiceEnabled(enabled: boolean) {
    this.voiceEnabled = enabled;
  }

  static setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
  }

  // Speed violation alert: distinctive high-low pulsing beep
  static playSpeedViolationBeep() {
    if (!this.soundEnabled) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';

      const now = ctx.currentTime;
      osc.frequency.setValueAtTime(880, now); // A5
      osc.frequency.setValueAtTime(659.25, now + 0.12); // E5
      osc.frequency.setValueAtTime(880, now + 0.24);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.exponentialRampToValueAtTime(0.18 * this.volume, now + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.4);
    } catch {
      // Ignore audio context block if user hasn't interacted
    }
  }

  // Critical hazard warning: rapid double buzzer
  static playCriticalHazardAlarm() {
    if (!this.soundEnabled) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      [0, 0.15].forEach((offset) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(1046.5, now + offset); // C6

        gain.gain.setValueAtTime(0.001, now + offset);
        gain.gain.exponentialRampToValueAtTime(0.25 * this.volume, now + offset + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.1);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + offset);
        osc.stop(now + offset + 0.12);
      });
    } catch {
      // Ignore
    }
  }

  // Soft recognition chime
  static playSignDetectedChime() {
    if (!this.soundEnabled) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';

      const now = ctx.currentTime;
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.exponentialRampToValueAtTime(783.99, now + 0.15); // G5

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.exponentialRampToValueAtTime(0.12 * this.volume, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.28);
    } catch {
      // Ignore
    }
  }

  // Spoken voice guidance (throttled to avoid overlapping chatter)
  static speakVoiceAdvisory(phrase: string, minIntervalMs: number = 4000) {
    if (!this.voiceEnabled || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    
    const now = Date.now();
    if (now - this.lastSpokenTime < minIntervalMs) return;
    this.lastSpokenTime = now;

    try {
      window.speechSynthesis.cancel(); // clear queue
      const utterance = new SpeechSynthesisUtterance(phrase);
      utterance.rate = 1.05;
      utterance.pitch = 1.0;
      utterance.volume = this.volume;
      window.speechSynthesis.speak(utterance);
    } catch {
      // Gracefully fall back
    }
  }
}
