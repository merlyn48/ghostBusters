// Programmatic Audio Engine using Web Audio API
// Self-contained, does not require external assets.

export class AudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  
  // Ambient Sound Nodes
  private windNode: AudioBufferSourceNode | null = null;
  private windFilter: BiquadFilterNode | null = null;
  private windGain: GainNode | null = null;
  private windLfo: OscillatorNode | null = null;
  
  // Heartbeat state
  private heartbeatIntervalId: any = null;
  private heartbeatRate = 1.0; // Seconds between beats
  private heartbeatVolume = 0.3;
  private suspenseFactor = 0; // 0 to 1

  // Clock state
  private clockIntervalId: any = null;

  // Music state
  private musicIntervalId: any = null;
  private isMuted = false;
  private isInitialized = false;

  constructor() {}

  init() {
    if (this.isInitialized || typeof window === "undefined") return;

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.connect(this.ctx.destination);
      this.masterGain.gain.value = this.isMuted ? 0 : 0.6;
      
      this.setupWind();
      this.setupClock();
      this.setupHeartbeat();
      
      this.isInitialized = true;
    } catch (e) {
      console.error("Failed to initialize Web Audio API", e);
    }
  }

  async start() {
    this.init();
    if (this.ctx && this.ctx.state === "suspended") {
      await this.ctx.resume();
    }
  }

  setMute(mute: boolean) {
    this.isMuted = mute;
    if (this.masterGain) {
      this.masterGain.gain.setValueAtTime(mute ? 0 : 0.6, this.ctx?.currentTime || 0);
    }
  }

  getMuted() {
    return this.isMuted;
  }

  private setupWind() {
    if (!this.ctx || !this.masterGain) return;

    // Create White Noise Buffer
    const bufferSize = 2 * this.ctx.sampleRate;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    this.windNode = this.ctx.createBufferSource();
    this.windNode.buffer = noiseBuffer;
    this.windNode.loop = true;

    // Create Filter for Wind Howl
    this.windFilter = this.ctx.createBiquadFilter();
    this.windFilter.type = "bandpass";
    this.windFilter.Q.value = 3.0;
    this.windFilter.frequency.value = 350;

    // Modulate filter frequency with LFO to simulate gusts
    this.windLfo = this.ctx.createOscillator();
    this.windLfo.type = "sine";
    this.windLfo.frequency.value = 0.08; // Super slow oscillation (80mHz)
    
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.value = 180; // Sweeps +/- 180Hz

    this.windLfo.connect(lfoGain);
    lfoGain.connect(this.windFilter.frequency);
    this.windLfo.start();

    // Wind Gain node
    this.windGain = this.ctx.createGain();
    this.windGain.gain.value = 0.08; // Quiet start

    this.windNode.connect(this.windFilter);
    this.windFilter.connect(this.windGain);
    this.windGain.connect(this.masterGain);

    this.windNode.start();
  }

  private setupHeartbeat() {
    const playBeat = () => {
      if (!this.ctx || !this.masterGain || this.suspenseFactor < 0.05) return;

      const now = this.ctx.currentTime;
      // Synthesize "Lub"
      const osc1 = this.ctx.createOscillator();
      const gain1 = this.ctx.createGain();
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(55, now);
      osc1.frequency.exponentialRampToValueAtTime(30, now + 0.12);

      gain1.gain.setValueAtTime(0.01, now);
      gain1.gain.linearRampToValueAtTime(this.heartbeatVolume, now + 0.02);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

      osc1.connect(gain1);
      gain1.connect(this.masterGain);
      osc1.start(now);
      osc1.stop(now + 0.15);

      // Synthesize "Dub" (slightly softer, 0.15s later)
      const osc2 = this.ctx.createOscillator();
      const gain2 = this.ctx.createGain();
      osc2.type = "sine";
      osc2.frequency.setValueAtTime(50, now + 0.16);
      osc2.frequency.exponentialRampToValueAtTime(25, now + 0.28);

      gain2.gain.setValueAtTime(0.01, now + 0.16);
      gain2.gain.linearRampToValueAtTime(this.heartbeatVolume * 0.7, now + 0.18);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

      osc2.connect(gain2);
      gain2.connect(this.masterGain);
      osc2.start(now + 0.16);
      osc2.stop(now + 0.3);
    };

    // Dynamic scheduler loop for variable BPM
    const runScheduler = () => {
      playBeat();
      const delay = this.heartbeatRate * 1000;
      this.heartbeatIntervalId = setTimeout(runScheduler, delay);
    };

    runScheduler();
  }

  private setupClock() {
    this.clockIntervalId = setInterval(() => {
      if (!this.ctx || !this.masterGain || this.suspenseFactor < 0.1) return;

      const now = this.ctx.currentTime;
      // High-pitched tick click
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.type = "sine";
      osc.frequency.setValueAtTime(1600, now);
      
      gain.gain.setValueAtTime(0.02 * this.suspenseFactor, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.01);
      
      osc.connect(gain);
      gain.connect(this.masterGain);
      
      osc.start(now);
      osc.stop(now + 0.02);
    }, 1000);
  }

  // Factor ranges from 0 to 1
  setSuspense(factor: number) {
    this.suspenseFactor = factor;
    if (!this.ctx) return;

    const now = this.ctx.currentTime;

    // 1. Wind howl intensity
    if (this.windGain && this.windFilter) {
      // Wind volume goes from 0.08 to 0.45
      const windVol = 0.08 + factor * 0.37;
      this.windGain.gain.linearRampToValueAtTime(windVol, now + 0.5);
      
      // Wind speed (LFO frequency) goes from 0.08Hz to 0.3Hz
      if (this.windLfo) {
        this.windLfo.frequency.linearRampToValueAtTime(0.08 + factor * 0.22, now + 0.5);
      }
    }

    // 2. Heartbeat rate
    // 0.0 factor: beat rate = 1.3s (approx 46 BPM)
    // 1.0 factor: beat rate = 0.45s (approx 133 BPM)
    this.heartbeatRate = 1.3 - factor * 0.85;

    // Heartbeat volume goes from 0.1 to 0.85
    this.heartbeatVolume = 0.1 + factor * 0.75;
  }

  triggerGlitch() {
    if (!this.ctx || !this.masterGain) return;

    const now = this.ctx.currentTime;
    const duration = 0.05 + Math.random() * 0.15; // 50ms - 200ms

    // Create a metallic glitch burst
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = Math.random() > 0.5 ? "sawtooth" : "square";
    osc.frequency.setValueAtTime(100 + Math.random() * 300, now);
    osc.frequency.linearRampToValueAtTime(30 + Math.random() * 50, now + duration);

    // Add noise modulation
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.setValueAtTime(0.04, now + duration * 0.5);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + duration);
  }

  triggerScream() {
    // 1. Stop background ambient noises
    this.stopSuspenseSounds();

    if (!this.ctx || !this.masterGain) return;

    const now = this.ctx.currentTime;

    // Master volume to maximum during scream (respecting mute)
    this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.9, now);

    // Scream Synth: Synthesize multi-oscillator creepy shriek
    const duration = 3.0; // 3 seconds scream

    // Main screeching oscillator (sawtooth)
    const osc1 = this.ctx.createOscillator();
    const gain1 = this.ctx.createGain();
    osc1.type = "sawtooth";
    osc1.frequency.setValueAtTime(700, now);
    // Exponential sweep upwards and then erratic falls
    osc1.frequency.exponentialRampToValueAtTime(2800, now + 0.3);
    osc1.frequency.linearRampToValueAtTime(1200, now + 1.2);
    osc1.frequency.exponentialRampToValueAtTime(100, now + duration);

    // FM Modulator for harsh roughness
    const fm = this.ctx.createOscillator();
    const fmGain = this.ctx.createGain();
    fm.type = "square";
    fm.frequency.value = 65; // Rapid modulation frequency
    fmGain.gain.value = 500; // Modulate pitch heavily

    fm.connect(fmGain);
    fmGain.connect(osc1.frequency);

    gain1.gain.setValueAtTime(0.3, now);
    gain1.gain.linearRampToValueAtTime(0.65, now + 0.1);
    gain1.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc1.connect(gain1);
    gain1.connect(this.masterGain);

    // Second oscillator (square, offset pitch)
    const osc2 = this.ctx.createOscillator();
    const gain2 = this.ctx.createGain();
    osc2.type = "square";
    osc2.frequency.setValueAtTime(680, now);
    osc2.frequency.exponentialRampToValueAtTime(2600, now + 0.4);
    osc2.frequency.exponentialRampToValueAtTime(80, now + duration);

    gain2.gain.setValueAtTime(0.2, now);
    gain2.gain.linearRampToValueAtTime(0.5, now + 0.15);
    gain2.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc2.connect(gain2);
    gain2.connect(this.masterGain);

    // White noise shriek component
    const noiseBuffer = this.ctx.createBuffer(1, this.ctx.sampleRate * duration, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < noiseBuffer.length; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const noiseNode = this.ctx.createBufferSource();
    noiseNode.buffer = noiseBuffer;

    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = "highpass";
    noiseFilter.frequency.setValueAtTime(1000, now);
    noiseFilter.frequency.linearRampToValueAtTime(2000, now + 1.0);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.25, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    noiseNode.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.masterGain);

    // Start everything
    fm.start(now);
    osc1.start(now);
    osc2.start(now);
    noiseNode.start(now);

    fm.stop(now + duration);
    osc1.stop(now + duration);
    osc2.stop(now + duration);
    noiseNode.stop(now + duration);
  }

  private stopSuspenseSounds() {
    if (this.windNode) {
      try { this.windNode.stop(); } catch (e) {}
      this.windNode = null;
    }
    if (this.windLfo) {
      try { this.windLfo.stop(); } catch (e) {}
      this.windLfo = null;
    }
    if (this.heartbeatIntervalId) {
      clearTimeout(this.heartbeatIntervalId);
      this.heartbeatIntervalId = null;
    }
    if (this.clockIntervalId) {
      clearInterval(this.clockIntervalId);
      this.clockIntervalId = null;
    }
  }

  startCelebration() {
    this.stopSuspenseSounds();
    if (this.musicIntervalId) clearInterval(this.musicIntervalId);
    
    if (!this.ctx || !this.masterGain) return;
    
    // Play an upbeat happy chiptune loop
    const now = this.ctx.currentTime;
    
    // Melody notes (frequencies) for an upbeat happy song:
    // C4(261.63), E4(329.63), G4(392.00), C5(523.25), A4(440.00), F4(349.23), G4(392.00)
    const melody = [
      261.63, 329.63, 392.00, 523.25, 
      440.00, 349.23, 392.00, 523.25,
      329.63, 392.00, 440.00, 523.25,
      587.33, 493.88, 523.25, 0 // last rests
    ];
    
    // Bass note frequencies
    const bass = [
      130.81, 130.81, 164.81, 164.81,
      174.61, 174.61, 196.00, 196.00,
      130.81, 130.81, 174.61, 174.61,
      196.00, 196.00, 130.81, 0
    ];

    let step = 0;
    const tempo = 0.22; // BPM ~136 (0.22s per eighth note)

    const playNote = () => {
      if (!this.ctx || !this.masterGain) return;
      const playTime = this.ctx.currentTime;

      // 1. Lead voice
      const mFreq = melody[step % melody.length];
      if (mFreq > 0) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        // Square wave for retro game vibe
        osc.type = "triangle";
        osc.frequency.setValueAtTime(mFreq, playTime);

        gain.gain.setValueAtTime(0.12, playTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, playTime + tempo * 0.95);

        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(playTime);
        osc.stop(playTime + tempo);
      }

      // 2. Bass voice (sub-bass)
      const bFreq = bass[step % bass.length];
      if (bFreq > 0) {
        const bOsc = this.ctx.createOscillator();
        const bGain = this.ctx.createGain();
        bOsc.type = "sine";
        bOsc.frequency.setValueAtTime(bFreq, playTime);

        bGain.gain.setValueAtTime(0.15, playTime);
        bGain.gain.exponentialRampToValueAtTime(0.0001, playTime + tempo * 0.9);

        bOsc.connect(bGain);
        bGain.connect(this.masterGain);
        bOsc.start(playTime);
        bOsc.stop(playTime + tempo);
      }

      // 3. Programmatic retro percussion (snare crack on step 2 & 6, kick on 0 & 4)
      const subStep = step % 8;
      if (subStep === 0 || subStep === 4) {
        // Bass Drum
        const kOsc = this.ctx.createOscillator();
        const kGain = this.ctx.createGain();
        kOsc.frequency.setValueAtTime(120, playTime);
        kOsc.frequency.exponentialRampToValueAtTime(40, playTime + 0.1);
        
        kGain.gain.setValueAtTime(0.25, playTime);
        kGain.gain.exponentialRampToValueAtTime(0.0001, playTime + 0.12);
        
        kOsc.connect(kGain);
        kGain.connect(this.masterGain);
        kOsc.start(playTime);
        kOsc.stop(playTime + 0.15);
      } else if (subStep === 2 || subStep === 6) {
        // Retro Snare (noisy burst)
        const sBuffer = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.08, this.ctx.sampleRate);
        const data = sBuffer.getChannelData(0);
        for (let i = 0; i < sBuffer.length; i++) {
          data[i] = Math.random() * 2 - 1;
        }
        const sNode = this.ctx.createBufferSource();
        sNode.buffer = sBuffer;
        
        const sFilter = this.ctx.createBiquadFilter();
        sFilter.type = "bandpass";
        sFilter.frequency.value = 1000;
        
        const sGain = this.ctx.createGain();
        sGain.gain.setValueAtTime(0.08, playTime);
        sGain.gain.exponentialRampToValueAtTime(0.0001, playTime + 0.08);
        
        sNode.connect(sFilter);
        sFilter.connect(sGain);
        sGain.connect(this.masterGain);
        sNode.start(playTime);
      }

      step++;
    };

    this.musicIntervalId = setInterval(playNote, tempo * 1000);
  }

  stopAll() {
    this.stopSuspenseSounds();
    if (this.musicIntervalId) {
      clearInterval(this.musicIntervalId);
      this.musicIntervalId = null;
    }
  }
}

// Export a single instance to be used globally
export const audioEngine = new AudioEngine();
