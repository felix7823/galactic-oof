/**
 * Procedural audio — SFX + hype background music.
 * No audio files required; everything is synthesised via Web Audio API.
 *
 * Usage:
 *   import { SFX } from '../systems/SoundManager';
 *   SFX.laser();
 *   SFX.startMusic();
 */

class SoundManagerClass {

  // ── Audio context + buses ─────────────────────────────────────────────────

  private ctx:    AudioContext | null = null;
  private sfxBus: GainNode    | null = null;
  private musBus: GainNode    | null = null;

  private getCtx(): AudioContext {
    if (!this.ctx) {
      this.ctx = new AudioContext();

      this.sfxBus = this.ctx.createGain();
      this.sfxBus.gain.value = 0.65;
      this.sfxBus.connect(this.ctx.destination);

      this.musBus = this.ctx.createGain();
      this.musBus.gain.value = 0.50;
      this.musBus.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
    return this.ctx;
  }

  // ── SFX primitives ────────────────────────────────────────────────────────

  private osc(
    freq:     number | [number, number],
    type:     OscillatorType,
    duration: number,
    volume  = 0.3,
    delay   = 0,
  ): void {
    try {
      const ctx = this.getCtx();
      const t   = ctx.currentTime + delay;
      const o   = ctx.createOscillator();
      const env = ctx.createGain();
      o.connect(env); env.connect(this.sfxBus!);
      o.type = type;
      if (Array.isArray(freq)) {
        o.frequency.setValueAtTime(freq[0], t);
        o.frequency.exponentialRampToValueAtTime(freq[1], t + duration);
      } else {
        o.frequency.setValueAtTime(freq, t);
      }
      env.gain.setValueAtTime(0.001, t);
      env.gain.linearRampToValueAtTime(volume, t + 0.008);
      env.gain.exponentialRampToValueAtTime(0.001, t + duration);
      o.start(t); o.stop(t + duration + 0.02);
    } catch (_) {}
  }

  private noise(duration: number, volume = 0.2, cutoff = 400, delay = 0): void {
    try {
      const ctx    = this.getCtx();
      const t      = ctx.currentTime + delay;
      const frames = Math.ceil(ctx.sampleRate * duration);
      const buf    = ctx.createBuffer(1, frames, ctx.sampleRate);
      const data   = buf.getChannelData(0);
      for (let i = 0; i < frames; i++) data[i] = Math.random() * 2 - 1;
      const src  = ctx.createBufferSource(); src.buffer = buf;
      const filt = ctx.createBiquadFilter();
      filt.type  = 'lowpass'; filt.frequency.value = cutoff;
      const env  = ctx.createGain();
      env.gain.setValueAtTime(volume, t);
      env.gain.exponentialRampToValueAtTime(0.001, t + duration);
      src.connect(filt); filt.connect(env); env.connect(this.sfxBus!);
      src.start(t); src.stop(t + duration + 0.02);
    } catch (_) {}
  }

  // ── SFX ───────────────────────────────────────────────────────────────────

  laser():        void { this.osc([880, 330], 'square',   0.07, 0.10); }
  beamFire():     void { this.osc([300, 700], 'sawtooth', 0.18, 0.07); this.osc([200,500],'sawtooth',0.18,0.04,0.04); }
  enemyPop():     void { this.osc([280, 55],  'sawtooth', 0.18, 0.18); this.noise(0.10, 0.10, 500); }
  playerHurt():   void { this.osc([350, 90],  'sine',     0.22, 0.40); this.noise(0.12, 0.15, 300); }
  nextWave():     void { this.osc(440,'sine',0.14,0.22); this.osc(660,'sine',0.14,0.22,0.12); }
  zoltBolt():     void { this.osc([2400,80],'sawtooth',0.10,0.28); this.noise(0.09,0.25,3000); }
  pickupApple():      void { this.osc([660, 1320], 'sine', 0.18, 0.28); }
  pickupSuperApple(): void { [523,659,784,1047].forEach((f,i)=>this.osc(f,'sine',0.20,0.32,i*0.09)); }
  menuMove():    void { this.osc(440,'sine',0.07,0.09); }
  menuConfirm(): void { this.osc(523,'sine',0.11,0.18); this.osc(784,'sine',0.11,0.14,0.09); }
  colorPick():   void { this.osc(523,'sine',0.08,0.11); }
  gameOver():    void { [440,330,220,165].forEach((f,i)=>this.osc(f,'sine',0.45,0.28,i*0.24)); }

  abilitySonicWave():      void { this.osc([120,900],'sine',0.55,0.14); this.osc([120,900],'sine',0.55,0.09,0.16); this.osc([120,900],'sine',0.55,0.06,0.32); }
  abilityBlackHole():      void { this.osc([90,25],'sine',1.40,0.30); this.noise(1.4,0.08,80); }
  abilityMeteor():         void { this.osc([1000,180],'sawtooth',0.28,0.24); this.noise(0.18,0.18,900,0.05); }
  abilityLightningStorm(): void { this.osc([2200,110],'sawtooth',0.12,0.22); this.noise(0.09,0.22,2500); }
  abilityTornado():        void { this.osc([70,240],'sawtooth',0.90,0.12); this.noise(0.90,0.09,180,0.1); }
  abilitySalmon():         void { this.osc(660,'triangle',0.11,0.18); this.osc(880,'triangle',0.11,0.14,0.10); }
  abilityInfection():      void { this.osc([180,480],'sawtooth',0.38,0.10); this.osc([180,480],'sawtooth',0.38,0.06,0.19); }
  abilityMissile():        void { this.osc([700,320],'square',0.20,0.16); this.noise(0.09,0.12,1200,0.20); }
  abilityTsunami():        void { this.osc([45,280],'sine',1.00,0.16); this.noise(0.80,0.12,280,0.2); }

  // ── Hype background music ─────────────────────────────────────────────────
  //
  //  150 BPM, A-minor, 8-beat (2-bar) cycle.
  //  Scheduled with sample-accurate AudioContext timing — no drift, no gaps.
  //
  //  Layers:
  //   • Kick    — sine sweep 200→35 Hz on beats 1 & 3 (steps 0, 2, 4, 6)
  //   • Snare   — hi-pass noise + pitched body on beats 2 & 4
  //   • Hi-hat  — 8th-note closed hats every half-beat
  //   • Bass    — filtered sawtooth, 8-note pattern per cycle
  //   • Lead    — fast square-wave arpeggio (8 notes, 16th-note grid)
  //   • Stab    — Am7 chord hit at the start of each bar (steps 0 & 4)

  private musicPlaying   = false;
  private schedulerId:   ReturnType<typeof setInterval> | null = null;
  private nextBeatTime   = 0;
  private beatIndex      = 0;

  private readonly BEAT = 60 / 150;        // 0.4 s per beat  (150 BPM)
  private readonly STEP = 60 / 150 / 4;   // 0.1 s per 16th note

  // Bass line — one note per beat over the 8-beat cycle
  private readonly BASS: number[] = [
    110.00,  // A2  beat 0
     82.41,  // E2  beat 1
    110.00,  // A2  beat 2
     98.00,  // G2  beat 3
    130.81,  // C3  beat 4
     98.00,  // G2  beat 5
    110.00,  // A2  beat 6
     82.41,  // E2  beat 7
  ];

  // Lead arp — 8 notes cycling on a 16th-note grid
  // (repeats every 2 beats → 4 times per 2-bar cycle)
  private readonly ARP: number[] = [
    440.00,  // A4
    523.25,  // C5
    329.63,  // E4
    440.00,  // A4
    392.00,  // G4
    329.63,  // E4
    261.63,  // C4
    329.63,  // E4
  ];

  startMusic(): void {
    if (this.musicPlaying) return;
    this.musicPlaying = true;
    const ctx = this.getCtx();
    this.nextBeatTime = ctx.currentTime + 0.05;
    this.beatIndex    = 0;
    // Check every 25 ms, schedule 120 ms ahead
    this.schedulerId = setInterval(() => this.runScheduler(), 25);
  }

  stopMusic(): void {
    if (!this.musicPlaying) return;
    this.musicPlaying = false;
    if (this.schedulerId !== null) { clearInterval(this.schedulerId); this.schedulerId = null; }
    // Fade out music bus
    if (this.musBus && this.ctx) {
      const t = this.ctx.currentTime;
      this.musBus.gain.setValueAtTime(this.musBus.gain.value, t);
      this.musBus.gain.linearRampToValueAtTime(0.001, t + 1.2);
      setTimeout(() => { if (this.musBus) this.musBus.gain.value = 0.50; }, 1300);
    }
  }

  private runScheduler(): void {
    if (!this.musicPlaying || !this.ctx) return;
    while (this.nextBeatTime < this.ctx.currentTime + 0.12) {
      this.scheduleBeat(this.beatIndex % 8, this.nextBeatTime);
      this.beatIndex++;
      this.nextBeatTime += this.BEAT;
    }
  }

  private scheduleBeat(step: number, t: number): void {
    // Kick on 0, 2, 4, 6  (beats 1 & 3 of each bar)
    if (step % 2 === 0) this.mKick(t);
    // Snare on 1, 3, 5, 7 (beats 2 & 4)
    else                 this.mSnare(t);

    // 8th-note hi-hats: one on the beat, one halfway through
    this.mHihat(t,                  0.32);
    this.mHihat(t + this.BEAT / 2, 0.16);

    // Bass note for this beat
    this.mBass(this.BASS[step], t);

    // Four 16th-note arp notes per beat
    for (let i = 0; i < 4; i++) {
      const noteIdx = (step * 4 + i) % this.ARP.length;
      this.mArp(this.ARP[noteIdx], t + i * this.STEP);
    }

    // Am7 chord stab at the top of each bar (step 0 and 4)
    if (step === 0 || step === 4) this.mStab(t);
  }

  // ── Drum / percussion ─────────────────────────────────────────────────────

  private mKick(t: number): void {
    try {
      const ctx = this.getCtx();
      const osc = ctx.createOscillator();
      const env = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(200, t);
      osc.frequency.exponentialRampToValueAtTime(35, t + 0.08);
      env.gain.setValueAtTime(0.001, t);
      env.gain.linearRampToValueAtTime(1.15, t + 0.004);
      env.gain.exponentialRampToValueAtTime(0.001, t + 0.26);
      osc.connect(env); env.connect(this.musBus!);
      osc.start(t); osc.stop(t + 0.30);
    } catch (_) {}
  }

  private mSnare(t: number): void {
    try {
      const ctx = this.getCtx();

      // Noise burst (high-pass filtered)
      const frames = Math.ceil(ctx.sampleRate * 0.13);
      const buf    = ctx.createBuffer(1, frames, ctx.sampleRate);
      const data   = buf.getChannelData(0);
      for (let i = 0; i < frames; i++) data[i] = Math.random() * 2 - 1;
      const src  = ctx.createBufferSource(); src.buffer = buf;
      const hpf  = ctx.createBiquadFilter(); hpf.type = 'highpass'; hpf.frequency.value = 1800;
      const nEnv = ctx.createGain();
      nEnv.gain.setValueAtTime(0.75, t);
      nEnv.gain.exponentialRampToValueAtTime(0.001, t + 0.13);
      src.connect(hpf); hpf.connect(nEnv); nEnv.connect(this.musBus!);
      src.start(t); src.stop(t + 0.16);

      // Pitched body thump
      const body  = ctx.createOscillator();
      const bEnv  = ctx.createGain();
      body.type   = 'triangle'; body.frequency.value = 190;
      bEnv.gain.setValueAtTime(0.40, t);
      bEnv.gain.exponentialRampToValueAtTime(0.001, t + 0.07);
      body.connect(bEnv); bEnv.connect(this.musBus!);
      body.start(t); body.stop(t + 0.09);
    } catch (_) {}
  }

  private mHihat(t: number, vol: number): void {
    try {
      const ctx    = this.getCtx();
      const frames = Math.ceil(ctx.sampleRate * 0.032);
      const buf    = ctx.createBuffer(1, frames, ctx.sampleRate);
      const data   = buf.getChannelData(0);
      for (let i = 0; i < frames; i++) data[i] = Math.random() * 2 - 1;
      const src  = ctx.createBufferSource(); src.buffer = buf;
      const hpf  = ctx.createBiquadFilter(); hpf.type = 'highpass'; hpf.frequency.value = 9500;
      const env  = ctx.createGain();
      env.gain.setValueAtTime(vol, t);
      env.gain.exponentialRampToValueAtTime(0.001, t + 0.032);
      src.connect(hpf); hpf.connect(env); env.connect(this.musBus!);
      src.start(t); src.stop(t + 0.05);
    } catch (_) {}
  }

  // ── Melodic layers ────────────────────────────────────────────────────────

  private mBass(freq: number, t: number): void {
    try {
      const ctx = this.getCtx();
      const osc = ctx.createOscillator();
      const lpf = ctx.createBiquadFilter();
      const env = ctx.createGain();
      osc.type  = 'sawtooth'; osc.frequency.value = freq;
      lpf.type  = 'lowpass';  lpf.frequency.value = 650; lpf.Q.value = 3.5;
      env.gain.setValueAtTime(0.001, t);
      env.gain.linearRampToValueAtTime(0.52, t + 0.012);
      env.gain.exponentialRampToValueAtTime(0.001, t + this.BEAT * 0.86);
      osc.connect(lpf); lpf.connect(env); env.connect(this.musBus!);
      osc.start(t); osc.stop(t + this.BEAT + 0.04);
    } catch (_) {}
  }

  private mArp(freq: number, t: number): void {
    try {
      const ctx = this.getCtx();
      const osc = ctx.createOscillator();
      const env = ctx.createGain();
      osc.type  = 'square'; osc.frequency.value = freq;
      osc.detune.value = 10; // slight edge
      const dur = this.STEP * 0.62;
      env.gain.setValueAtTime(0.001, t);
      env.gain.linearRampToValueAtTime(0.14, t + 0.005);
      env.gain.exponentialRampToValueAtTime(0.001, t + dur);
      osc.connect(env); env.connect(this.musBus!);
      osc.start(t); osc.stop(t + dur + 0.02);
    } catch (_) {}
  }

  private mStab(t: number): void {
    try {
      const ctx   = this.getCtx();
      const notes = [220.00, 261.63, 329.63, 392.00]; // Am7: A3 C4 E4 G4
      notes.forEach(freq => {
        const osc = ctx.createOscillator();
        const env = ctx.createGain();
        osc.type  = 'sawtooth'; osc.frequency.value = freq;
        env.gain.setValueAtTime(0.001, t);
        env.gain.linearRampToValueAtTime(0.20, t + 0.010);
        env.gain.exponentialRampToValueAtTime(0.001, t + 0.28);
        osc.connect(env); env.connect(this.musBus!);
        osc.start(t); osc.stop(t + 0.32);
      });
    } catch (_) {}
  }
}

/** Singleton — import and call from anywhere. */
export const SFX = new SoundManagerClass();
