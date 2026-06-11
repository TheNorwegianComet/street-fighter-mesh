// ============================================
// Street Fighter Mesh - Retro Audio System
// 90s Arcade Fighting Game Sound Engine
// ============================================

const AudioSystem = {
  ctx: null,
  musicGain: null,
  sfxGain: null,
  voiceGain: null,
  currentMusic: null,
  musicVolume: 0.35,
  sfxVolume: 0.5,
  voiceVolume: 1.0,
  initialized: false,

  init() {
    if (this.initialized) return;
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = this.musicVolume;
      this.musicGain.connect(this.ctx.destination);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.value = this.sfxVolume;
      this.sfxGain.connect(this.ctx.destination);

      // Voice chain: gain -> compressor -> destination for loud punchy announcements
      this.voiceCompressor = this.ctx.createDynamicsCompressor();
      this.voiceCompressor.threshold.value = -20;
      this.voiceCompressor.knee.value = 5;
      this.voiceCompressor.ratio.value = 12;
      this.voiceCompressor.attack.value = 0.003;
      this.voiceCompressor.release.value = 0.1;
      this.voiceCompressor.connect(this.ctx.destination);

      this.voiceGain = this.ctx.createGain();
      this.voiceGain.gain.value = this.voiceVolume;
      this.voiceGain.connect(this.voiceCompressor);

      this.initialized = true;
    } catch (e) {
      console.warn("AudioSystem init failed:", e);
    }
  },

  resume() {
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  },

  // ---- SOUND EFFECT GENERATORS ----

  playHit() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;

    // Impact noise burst
    const bufferSize = this.ctx.sampleRate * 0.08;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 3);
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(2000, t);
    filter.frequency.exponentialRampToValueAtTime(200, t + 0.08);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.8, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);
    noise.start(t);
    noise.stop(t + 0.12);

    // Low thud
    const osc = this.ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(120, t);
    osc.frequency.exponentialRampToValueAtTime(40, t + 0.1);
    const oscGain = this.ctx.createGain();
    oscGain.gain.setValueAtTime(0.6, t);
    oscGain.gain.exponentialRampToValueAtTime(0.01, t + 0.12);
    osc.connect(oscGain);
    oscGain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.15);
  },

  playBlock() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;

    // Metallic clang
    const osc1 = this.ctx.createOscillator();
    osc1.type = "square";
    osc1.frequency.setValueAtTime(800, t);
    osc1.frequency.exponentialRampToValueAtTime(400, t + 0.05);

    const osc2 = this.ctx.createOscillator();
    osc2.type = "square";
    osc2.frequency.setValueAtTime(1200, t);
    osc2.frequency.exponentialRampToValueAtTime(600, t + 0.05);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.08);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.sfxGain);
    osc1.start(t);
    osc2.start(t);
    osc1.stop(t + 0.1);
    osc2.stop(t + 0.1);
  },

  playKO() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;

    // Big explosion impact
    const bufferSize = this.ctx.sampleRate * 0.4;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 2);
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(3000, t);
    filter.frequency.exponentialRampToValueAtTime(100, t + 0.4);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.9, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.5);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);
    noise.start(t);
    noise.stop(t + 0.5);

    // Deep boom
    const osc = this.ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(80, t);
    osc.frequency.exponentialRampToValueAtTime(20, t + 0.5);
    const oscGain = this.ctx.createGain();
    oscGain.gain.setValueAtTime(0.8, t);
    oscGain.gain.exponentialRampToValueAtTime(0.01, t + 0.6);
    osc.connect(oscGain);
    oscGain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.6);
  },

  playSelect() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;

    // Arcade confirm beep
    const osc = this.ctx.createOscillator();
    osc.type = "square";
    osc.frequency.setValueAtTime(600, t);
    osc.frequency.setValueAtTime(800, t + 0.06);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.3, t);
    gain.gain.setValueAtTime(0.35, t + 0.06);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.15);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.18);
  },

  playElectric() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;

    // Electric buzzing/crackling sound
    const bufferSize = this.ctx.sampleRate * 0.5;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      const env = i < bufferSize * 0.1 ? i / (bufferSize * 0.1) : Math.pow(1 - (i - bufferSize * 0.1) / (bufferSize * 0.9), 0.5);
      // Crackling noise with electrical buzz
      data[i] = ((Math.random() * 2 - 1) * 0.3 + Math.sin(i * 0.15) * 0.4 + Math.sin(i * 0.4) * 0.3) * env;
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(2000, t);
    filter.Q.value = 2;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.4, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.5);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);
    noise.start(t);
    noise.stop(t + 0.55);

    // High pitched zap
    const osc = this.ctx.createOscillator();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(1200, t);
    osc.frequency.exponentialRampToValueAtTime(200, t + 0.3);
    const oscGain = this.ctx.createGain();
    oscGain.gain.setValueAtTime(0.2, t);
    oscGain.gain.exponentialRampToValueAtTime(0.01, t + 0.35);
    osc.connect(oscGain);
    oscGain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.4);
  },

  // Knuselyd for bonusbanen — glass/plate-knus med splinter
  playCrash() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;

    // Skarp knus-smell (highpass-filtrert støy)
    const bufferSize = this.ctx.sampleRate * 0.25;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      // Knitrende avtagende støy med tilfeldige splint-topper
      const env = Math.pow(1 - i / bufferSize, 2.2);
      const splinter = Math.random() < 0.015 ? (Math.random() * 2 - 1) * 0.9 : 0;
      data[i] = ((Math.random() * 2 - 1) * 0.6 + splinter) * env;
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const hp = this.ctx.createBiquadFilter();
    hp.type = "highpass";
    hp.frequency.setValueAtTime(1200, t);
    hp.frequency.exponentialRampToValueAtTime(400, t + 0.2);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.7, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.28);

    noise.connect(hp);
    hp.connect(gain);
    gain.connect(this.sfxGain);
    noise.start(t);
    noise.stop(t + 0.3);

    // Dypt smell i bunn
    const osc = this.ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(140, t);
    osc.frequency.exponentialRampToValueAtTime(45, t + 0.12);
    const oGain = this.ctx.createGain();
    oGain.gain.setValueAtTime(0.5, t);
    oGain.gain.exponentialRampToValueAtTime(0.01, t + 0.15);
    osc.connect(oGain);
    oGain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.18);

    // Klirrende glass-ringer (tilfeldige høyfrekvente pling)
    for (let i = 0; i < 4; i++) {
      const dt = 0.03 + Math.random() * 0.15;
      const ping = this.ctx.createOscillator();
      ping.type = "triangle";
      ping.frequency.setValueAtTime(2200 + Math.random() * 2800, t + dt);
      const pGain = this.ctx.createGain();
      pGain.gain.setValueAtTime(0.12, t + dt);
      pGain.gain.exponentialRampToValueAtTime(0.005, t + dt + 0.18);
      ping.connect(pGain);
      pGain.connect(this.sfxGain);
      ping.start(t + dt);
      ping.stop(t + dt + 0.2);
    }
  },

  // Stor kollaps-lyd når hele logoen er knust
  playDestruction() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;

    // Lang rumlende kollaps
    const bufferSize = this.ctx.sampleRate * 1.2;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      const env = Math.pow(1 - i / bufferSize, 1.6);
      const splinter = Math.random() < 0.01 ? (Math.random() * 2 - 1) * 0.8 : 0;
      data[i] = ((Math.random() * 2 - 1) * 0.7 + splinter) * env;
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const lp = this.ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.setValueAtTime(4000, t);
    lp.frequency.exponentialRampToValueAtTime(150, t + 1.1);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.9, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 1.2);

    noise.connect(lp);
    lp.connect(gain);
    gain.connect(this.sfxGain);
    noise.start(t);
    noise.stop(t + 1.25);

    // Dypt boom
    const osc = this.ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(90, t);
    osc.frequency.exponentialRampToValueAtTime(25, t + 0.7);
    const oGain = this.ctx.createGain();
    oGain.gain.setValueAtTime(0.9, t);
    oGain.gain.exponentialRampToValueAtTime(0.01, t + 0.8);
    osc.connect(oGain);
    oGain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.85);

    // Kaskade av glassklirr mens bitene lander
    for (let i = 0; i < 10; i++) {
      const dt = 0.1 + Math.random() * 0.9;
      const ping = this.ctx.createOscillator();
      ping.type = "triangle";
      ping.frequency.setValueAtTime(1800 + Math.random() * 3500, t + dt);
      const pGain = this.ctx.createGain();
      pGain.gain.setValueAtTime(0.1, t + dt);
      pGain.gain.exponentialRampToValueAtTime(0.005, t + dt + 0.25);
      ping.connect(pGain);
      pGain.connect(this.sfxGain);
      ping.start(t + dt);
      ping.stop(t + dt + 0.3);
    }
  },

  // Spiller karakter-spesifikk jubel-lyd (ElevenLabs-generert mp3)
  _cheerCache: {},
  playCheer(charId) {
    const src = "audio/cheer_" + charId + ".mp3";
    let audio = this._cheerCache[charId];
    if (audio === undefined) {
      audio = new Audio(src);
      audio.volume = 0.9;
      audio.onerror = () => { this._cheerCache[charId] = null; };
      this._cheerCache[charId] = audio;
    }
    if (audio) {
      audio.currentTime = 0;
      audio.play().catch(() => {});
    }
  },

  playCursorMove() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    osc.type = "square";
    osc.frequency.setValueAtTime(400, t);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.15, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.05);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.06);
  },

  // ---- VOICE ANNOUNCER (Retro synth voice) ----

  speakAnnouncement(text) {
    if (!this.ctx) return;
    // Use SpeechSynthesis for announcer voice
    if ("speechSynthesis" in window) {
      const utter = new SpeechSynthesisUtterance(text);
      utter.rate = 0.9;
      utter.pitch = 0.7;
      utter.volume = this.voiceVolume;

      // Try to find a deep male voice
      const voices = speechSynthesis.getVoices();
      const preferred = voices.find(v => v.name.includes("Male") || v.name.includes("David") || v.name.includes("Mark"));
      if (preferred) utter.voice = preferred;

      speechSynthesis.speak(utter);
    }
  },

  announceRoundOne() {
    this.announceRound(1);
  },

  announceRound(n) {
    const words = { 1: "Round One", 2: "Round Two", 3: "Final Round" };
    this.speakAnnouncement(words[n] || "Round " + n);
    // Also play a dramatic synth sting
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    this._playDramaticSting(t);
  },

  announceFight() {
    setTimeout(() => {
      this.speakAnnouncement("Fight!");
      this._playFightSting();
    }, 800);
  },

  announceWinner(name) {
    this.speakAnnouncement(name + " Wins!");
    if (!this.ctx) return;
    this._playVictoryFanfare();
  },

  _playDramaticSting(t) {
    // Rising chord
    const notes = [130.81, 164.81, 196.00, 261.63]; // C3, E3, G3, C4
    notes.forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(freq, t + i * 0.1);
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0, t + i * 0.1);
      gain.gain.linearRampToValueAtTime(0.15, t + i * 0.1 + 0.05);
      gain.gain.linearRampToValueAtTime(0.1, t + 0.6);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 1.0);
      osc.connect(gain);
      gain.connect(this.voiceGain);
      osc.start(t + i * 0.1);
      osc.stop(t + 1.2);
    });
  },

  _playFightSting() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;

    // Aggressive power chord
    const notes = [196.00, 246.94, 293.66, 392.00]; // G3, B3, D4, G4
    notes.forEach((freq) => {
      const osc = this.ctx.createOscillator();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(freq, t);
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.2, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.5);
      osc.connect(gain);
      gain.connect(this.voiceGain);
      osc.start(t);
      osc.stop(t + 0.6);
    });

    // Crash cymbal noise
    const bufferSize = this.ctx.sampleRate * 0.3;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 1.5);
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    const nGain = this.ctx.createGain();
    nGain.gain.setValueAtTime(0.15, t);
    nGain.gain.exponentialRampToValueAtTime(0.01, t + 0.4);
    const hpf = this.ctx.createBiquadFilter();
    hpf.type = "highpass";
    hpf.frequency.value = 4000;
    noise.connect(hpf);
    hpf.connect(nGain);
    nGain.connect(this.voiceGain);
    noise.start(t);
    noise.stop(t + 0.5);
  },

  _playVictoryFanfare() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;

    // Classic victory melody (C E G C' E' G' C'')
    const melody = [
      { freq: 523.25, time: 0,    dur: 0.15 },  // C5
      { freq: 659.25, time: 0.15, dur: 0.15 },  // E5
      { freq: 783.99, time: 0.30, dur: 0.15 },  // G5
      { freq: 1046.5, time: 0.50, dur: 0.4  },  // C6 (held)
      { freq: 783.99, time: 0.95, dur: 0.12 },  // G5
      { freq: 1046.5, time: 1.1,  dur: 0.6  },  // C6 (finale)
    ];

    melody.forEach(note => {
      const osc = this.ctx.createOscillator();
      osc.type = "square";
      osc.frequency.setValueAtTime(note.freq, t + note.time);
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.2, t + note.time);
      gain.gain.setValueAtTime(0.2, t + note.time + note.dur * 0.7);
      gain.gain.exponentialRampToValueAtTime(0.01, t + note.time + note.dur);
      osc.connect(gain);
      gain.connect(this.voiceGain);
      osc.start(t + note.time);
      osc.stop(t + note.time + note.dur + 0.05);
    });

    // Bass accompaniment
    const bass = [
      { freq: 130.81, time: 0, dur: 0.45 },
      { freq: 196.00, time: 0.5, dur: 0.45 },
      { freq: 130.81, time: 1.1, dur: 0.6 },
    ];
    bass.forEach(note => {
      const osc = this.ctx.createOscillator();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(note.freq, t + note.time);
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.12, t + note.time);
      gain.gain.exponentialRampToValueAtTime(0.01, t + note.time + note.dur);
      osc.connect(gain);
      gain.connect(this.voiceGain);
      osc.start(t + note.time);
      osc.stop(t + note.time + note.dur + 0.05);
    });
  },

  // ---- BACKGROUND MUSIC (Procedural 90s chiptune) ----

  startBattleMusic() {
    this.stopMusic();
    if (!this.ctx) return;

    this._battlePlaying = true;
    this._playBattleLoop();
  },

  startSelectMusic() {
    this.stopMusic();
    if (!this.ctx) return;

    this._selectPlaying = true;
    this._playSelectLoop();
  },

  stopMusic() {
    this._battlePlaying = false;
    this._selectPlaying = false;
    if (this._musicTimeout) {
      clearTimeout(this._musicTimeout);
      this._musicTimeout = null;
    }
  },

  _playBattleLoop() {
    if (!this._battlePlaying || !this.ctx) return;

    const t = this.ctx.currentTime;
    const bpm = 150;
    const beat = 60 / bpm;
    const bar = beat * 4;

    // Bass line pattern (E minor pentatonic)
    const bassNotes = [
      82.41, 0, 110.00, 0,  82.41, 82.41, 123.47, 0,
      98.00, 0, 110.00, 0,  82.41, 0,     123.47, 98.00,
      82.41, 0, 110.00, 0,  130.81, 0,    110.00, 0,
      98.00, 0, 82.41,  0,  110.00, 82.41, 0,     123.47,
    ];

    bassNotes.forEach((freq, i) => {
      if (freq === 0) return;
      const osc = this.ctx.createOscillator();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(freq, t + i * (beat / 2));

      const filter = this.ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = 800;

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.18, t + i * (beat / 2));
      gain.gain.exponentialRampToValueAtTime(0.01, t + i * (beat / 2) + beat / 2 - 0.02);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.musicGain);
      osc.start(t + i * (beat / 2));
      osc.stop(t + i * (beat / 2) + beat / 2);
    });

    // Lead melody (pentatonic riff)
    const leadNotes = [
      { f: 329.63, t: 0,          d: beat },        // E4
      { f: 392.00, t: beat,       d: beat / 2 },     // G4
      { f: 440.00, t: beat * 1.5, d: beat / 2 },     // A4
      { f: 493.88, t: beat * 2,   d: beat },          // B4
      { f: 440.00, t: beat * 3,   d: beat / 2 },     // A4
      { f: 392.00, t: beat * 3.5, d: beat / 2 },     // G4
      { f: 329.63, t: beat * 4,   d: beat * 1.5 },    // E4
      { f: 293.66, t: beat * 5.5, d: beat / 2 },     // D4
      { f: 329.63, t: beat * 6,   d: beat },          // E4
      { f: 440.00, t: beat * 7,   d: beat / 2 },     // A4
      { f: 329.63, t: beat * 8,   d: beat },          // E4
      { f: 392.00, t: beat * 9,   d: beat / 2 },     // G4
      { f: 493.88, t: beat * 9.5, d: beat },          // B4
      { f: 659.25, t: beat * 10.5,d: beat },          // E5
      { f: 493.88, t: beat * 11.5,d: beat / 2 },     // B4
      { f: 440.00, t: beat * 12,  d: beat },          // A4
      { f: 392.00, t: beat * 13,  d: beat / 2 },     // G4
      { f: 329.63, t: beat * 13.5,d: beat * 1.5 },   // E4
      { f: 293.66, t: beat * 15,  d: beat / 2 },     // D4
      { f: 329.63, t: beat * 15.5,d: beat / 2 },     // E4
    ];

    leadNotes.forEach(note => {
      const osc = this.ctx.createOscillator();
      osc.type = "square";
      osc.frequency.setValueAtTime(note.f, t + note.t);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.1, t + note.t);
      gain.gain.setValueAtTime(0.1, t + note.t + note.d * 0.7);
      gain.gain.exponentialRampToValueAtTime(0.01, t + note.t + note.d);

      osc.connect(gain);
      gain.connect(this.musicGain);
      osc.start(t + note.t);
      osc.stop(t + note.t + note.d + 0.02);
    });

    // Drums
    for (let i = 0; i < 16; i++) {
      const time = t + i * beat;

      // Kick on 1 and 3
      if (i % 4 === 0 || i % 4 === 2) {
        const kick = this.ctx.createOscillator();
        kick.type = "sine";
        kick.frequency.setValueAtTime(150, time);
        kick.frequency.exponentialRampToValueAtTime(30, time + 0.1);
        const kGain = this.ctx.createGain();
        kGain.gain.setValueAtTime(0.25, time);
        kGain.gain.exponentialRampToValueAtTime(0.01, time + 0.12);
        kick.connect(kGain);
        kGain.connect(this.musicGain);
        kick.start(time);
        kick.stop(time + 0.15);
      }

      // Snare on 2 and 4
      if (i % 4 === 1 || i % 4 === 3) {
        const snBuf = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.06, this.ctx.sampleRate);
        const snData = snBuf.getChannelData(0);
        for (let s = 0; s < snBuf.length; s++) {
          snData[s] = (Math.random() * 2 - 1) * Math.pow(1 - s / snBuf.length, 2);
        }
        const snare = this.ctx.createBufferSource();
        snare.buffer = snBuf;
        const snGain = this.ctx.createGain();
        snGain.gain.setValueAtTime(0.15, time);
        snGain.gain.exponentialRampToValueAtTime(0.01, time + 0.08);
        const snFilter = this.ctx.createBiquadFilter();
        snFilter.type = "highpass";
        snFilter.frequency.value = 2000;
        snare.connect(snFilter);
        snFilter.connect(snGain);
        snGain.connect(this.musicGain);
        snare.start(time);
        snare.stop(time + 0.1);
      }

      // Hi-hat on every 8th note
      if (i % 2 === 0) {
        const hhBuf = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.02, this.ctx.sampleRate);
        const hhData = hhBuf.getChannelData(0);
        for (let s = 0; s < hhBuf.length; s++) {
          hhData[s] = (Math.random() * 2 - 1) * Math.pow(1 - s / hhBuf.length, 4);
        }
        const hh = this.ctx.createBufferSource();
        hh.buffer = hhBuf;
        const hhGain = this.ctx.createGain();
        hhGain.gain.setValueAtTime(0.08, time);
        hhGain.gain.exponentialRampToValueAtTime(0.01, time + 0.03);
        const hhFilter = this.ctx.createBiquadFilter();
        hhFilter.type = "highpass";
        hhFilter.frequency.value = 8000;
        hh.connect(hhFilter);
        hhFilter.connect(hhGain);
        hhGain.connect(this.musicGain);
        hh.start(time);
        hh.stop(time + 0.04);
      }
    }

    // Loop after 4 bars
    const loopDuration = bar * 4;
    this._musicTimeout = setTimeout(() => this._playBattleLoop(), loopDuration * 1000 - 50);
  },

  _playSelectLoop() {
    if (!this._selectPlaying || !this.ctx) return;

    const t = this.ctx.currentTime;
    const bpm = 110;
    const beat = 60 / bpm;

    // Mysterious arpeggio pattern (Am - Em - F - G)
    const arps = [
      // Am arp
      220.00, 261.63, 329.63, 440.00, 329.63, 261.63,
      // Em arp
      164.81, 196.00, 246.94, 329.63, 246.94, 196.00,
      // F arp
      174.61, 220.00, 261.63, 349.23, 261.63, 220.00,
      // G arp
      196.00, 246.94, 293.66, 392.00, 293.66, 246.94,
    ];

    arps.forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, t + i * (beat / 3));

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.12, t + i * (beat / 3));
      gain.gain.exponentialRampToValueAtTime(0.01, t + i * (beat / 3) + beat / 3 - 0.01);

      osc.connect(gain);
      gain.connect(this.musicGain);
      osc.start(t + i * (beat / 3));
      osc.stop(t + i * (beat / 3) + beat / 3);
    });

    // Pad chords underneath
    const chords = [
      { notes: [220.00, 261.63, 329.63], time: 0 },
      { notes: [164.81, 196.00, 246.94], time: beat * 2 },
      { notes: [174.61, 220.00, 261.63], time: beat * 4 },
      { notes: [196.00, 246.94, 293.66], time: beat * 6 },
    ];

    chords.forEach(chord => {
      chord.notes.forEach(freq => {
        const osc = this.ctx.createOscillator();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, t + chord.time);
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0, t + chord.time);
        gain.gain.linearRampToValueAtTime(0.06, t + chord.time + 0.2);
        gain.gain.linearRampToValueAtTime(0.04, t + chord.time + beat * 1.8);
        gain.gain.exponentialRampToValueAtTime(0.01, t + chord.time + beat * 2);
        osc.connect(gain);
        gain.connect(this.musicGain);
        osc.start(t + chord.time);
        osc.stop(t + chord.time + beat * 2 + 0.05);
      });
    });

    // Slow kick drum
    for (let i = 0; i < 4; i++) {
      const time = t + i * beat * 2;
      const kick = this.ctx.createOscillator();
      kick.type = "sine";
      kick.frequency.setValueAtTime(100, time);
      kick.frequency.exponentialRampToValueAtTime(30, time + 0.15);
      const kGain = this.ctx.createGain();
      kGain.gain.setValueAtTime(0.2, time);
      kGain.gain.exponentialRampToValueAtTime(0.01, time + 0.2);
      kick.connect(kGain);
      kGain.connect(this.musicGain);
      kick.start(time);
      kick.stop(time + 0.25);
    }

    const loopDuration = beat * 8;
    this._musicTimeout = setTimeout(() => this._playSelectLoop(), loopDuration * 1000 - 50);
  }
};

// Auto-init on first user interaction
document.addEventListener("keydown", function initAudio() {
  AudioSystem.init();
  AudioSystem.resume();
  document.removeEventListener("keydown", initAudio);
}, { once: false });
