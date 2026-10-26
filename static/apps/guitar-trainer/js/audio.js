/* audio.js — Web Audio engine: plucked-string synth (Karplus–Strong), bass, drums, drone, clock */
(function () {
  'use strict';
  const GT = (window.GT = window.GT || {});
  const { mtof } = GT.theory;

  let ctx = null;
  let master, session, guitarBus, compBus, verbSend, noiseBuf, impulse;
  const ksCache = new Map();
  const A = (GT.audio = { volume: 0.8 });

  function makeImpulse(seconds, decay) {
    const rate = ctx.sampleRate;
    const len = Math.floor(rate * seconds);
    const buf = ctx.createBuffer(2, len, rate);
    for (let c = 0; c < 2; c++) {
      const d = buf.getChannelData(c);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
    }
    return buf;
  }

  /**
   * Every sound is routed through a disposable "session" bus (with its own reverb and filters).
   * hush() fades and disconnects it, which silences everything already scheduled — including notes
   * queued seconds ahead — then builds a fresh one for new sounds.
   */
  function buildSession() {
    session = ctx.createGain();
    session.connect(master);

    const conv = ctx.createConvolver();
    conv.buffer = impulse;
    verbSend = ctx.createGain();
    verbSend.gain.value = 0.16;
    verbSend.connect(conv);
    conv.connect(session);

    guitarBus = ctx.createBiquadFilter();
    guitarBus.type = 'lowpass';
    guitarBus.frequency.value = 4800;
    guitarBus.Q.value = 0.4;
    guitarBus.connect(session);
    guitarBus.connect(verbSend);

    compBus = ctx.createBiquadFilter();
    compBus.type = 'lowpass';
    compBus.frequency.value = 2600;
    const compGain = ctx.createGain();
    compGain.gain.value = 0.55;
    compBus.connect(compGain);
    compGain.connect(session);
    compGain.connect(verbSend);
  }

  A.ensure = function () {
    if (!ctx) {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      const comp = ctx.createDynamicsCompressor();
      comp.threshold.value = -16;
      comp.ratio.value = 3;
      comp.attack.value = 0.004;
      comp.release.value = 0.2;
      master = ctx.createGain();
      master.gain.value = A.volume;
      master.connect(comp);
      comp.connect(ctx.destination);
      impulse = makeImpulse(2.2, 3);
      buildSession();

      noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
      const nd = noiseBuf.getChannelData(0);
      for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  };
  A.now = () => A.ensure().currentTime;
  A.setVolume = (v) => {
    A.volume = v;
    if (master) master.gain.setTargetAtTime(v, ctx.currentTime, 0.02);
  };
  /** Run fn when audio time t is reached (for visual sync) */
  A.at = (t, fn) => {
    const d = (t - (ctx ? ctx.currentTime : 0)) * 1000;
    return setTimeout(fn, Math.max(0, d));
  };

  /* -------- Karplus–Strong plucked string -------- */
  function ksBuffer(midi) {
    if (ksCache.has(midi)) return ksCache.get(midi);
    const sr = ctx.sampleRate;
    const f = mtof(midi);
    const N = Math.max(2, Math.floor(sr / f - 0.5));
    const t60 = Math.max(1.1, 4.2 - (midi - 40) * 0.075);
    const dur = Math.min(3.2, t60);
    const len = Math.floor(sr * dur);
    const buffer = ctx.createBuffer(1, len, sr);
    const out = buffer.getChannelData(0);
    const ring = new Float32Array(N);
    let prev = 0;
    let mean = 0;
    for (let i = 0; i < N; i++) {
      prev = prev * 0.45 + (Math.random() * 2 - 1) * 0.55; // soften pick attack
      ring[i] = prev;
      mean += prev;
    }
    mean /= N;
    for (let i = 0; i < N; i++) ring[i] -= mean;
    const decay = Math.pow(10, -3 / (f * t60));
    let idx = 0;
    let peak = 0;
    for (let i = 0; i < len; i++) {
      const a = ring[idx];
      const nIdx = idx + 1 === N ? 0 : idx + 1;
      out[i] = a;
      ring[idx] = decay * 0.5 * (a + ring[nIdx]);
      idx = nIdx;
      if (i < N * 4) peak = Math.max(peak, Math.abs(a));
    }
    const norm = peak > 0 ? 0.9 / peak : 1;
    const fade = Math.floor(sr * 0.08);
    for (let i = 0; i < len; i++) {
      out[i] *= norm;
      if (i > len - fade) out[i] *= (len - i) / fade;
    }
    // period of averaged KS loop is N + 0.5 samples → correct pitch with playbackRate
    const rec = { buffer, rate: (f * (N + 0.5)) / sr };
    ksCache.set(midi, rec);
    return rec;
  }

  A.pluck = function (midi, t, opt = {}) {
    A.ensure();
    t = t ?? ctx.currentTime;
    const { buffer, rate } = ksBuffer(Math.round(midi));
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    src.playbackRate.value = rate;
    const g = ctx.createGain();
    const v = (opt.vel ?? 0.8) * 0.42;
    g.gain.setValueAtTime(v, t);
    src.connect(g);
    g.connect(opt.comp ? compBus : guitarBus);
    src.start(t);
    if (opt.dur) {
      g.gain.setValueAtTime(v, t + opt.dur);
      g.gain.exponentialRampToValueAtTime(0.0008, t + opt.dur + 0.09);
      src.stop(t + opt.dur + 0.12);
    }
  };

  A.strum = function (midis, t, opt = {}) {
    A.ensure();
    t = t ?? ctx.currentTime;
    const sorted = midis.slice().sort((a, b) => a - b);
    if (opt.up) sorted.reverse();
    const spread = opt.spread ?? 0.014;
    sorted.forEach((m, i) => A.pluck(m, t + i * spread, { vel: (opt.vel ?? 0.7) * (1 - i * 0.04), dur: opt.dur, comp: opt.comp }));
  };

  /* -------- Bass -------- */
  A.bass = function (midi, t, dur, vel = 0.8) {
    A.ensure();
    const o1 = ctx.createOscillator();
    const o2 = ctx.createOscillator();
    o1.type = 'sawtooth';
    o2.type = 'sine';
    o1.frequency.value = mtof(midi);
    o2.frequency.value = mtof(midi);
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.Q.value = 2;
    lp.frequency.setValueAtTime(1400, t);
    lp.frequency.exponentialRampToValueAtTime(380, t + 0.18);
    const g = ctx.createGain();
    const peak = vel * 0.32;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + 0.008);
    g.gain.exponentialRampToValueAtTime(peak * 0.55, t + 0.25);
    const end = t + Math.max(0.08, dur);
    g.gain.setValueAtTime(peak * 0.5, end - 0.04);
    g.gain.exponentialRampToValueAtTime(0.0001, end + 0.05);
    const g2 = ctx.createGain();
    g2.gain.value = 0.9;
    o1.connect(lp);
    o2.connect(g2);
    g2.connect(lp);
    lp.connect(g);
    g.connect(session);
    o1.start(t);
    o2.start(t);
    o1.stop(end + 0.1);
    o2.stop(end + 0.1);
  };

  /* -------- Drums -------- */
  function noise(t, dur, type, freq, vel, q = 0.7) {
    const src = ctx.createBufferSource();
    src.buffer = noiseBuf;
    const f = ctx.createBiquadFilter();
    f.type = type;
    f.frequency.value = freq;
    f.Q.value = q;
    const g = ctx.createGain();
    g.gain.setValueAtTime(vel, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f);
    f.connect(g);
    g.connect(session);
    src.start(t, Math.random() * 0.5);
    src.stop(t + dur + 0.02);
  }
  A.kick = function (t, vel = 1) {
    A.ensure();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.frequency.setValueAtTime(140, t);
    o.frequency.exponentialRampToValueAtTime(44, t + 0.12);
    g.gain.setValueAtTime(vel * 0.9, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.38);
    o.connect(g);
    g.connect(session);
    o.start(t);
    o.stop(t + 0.4);
  };
  A.snare = function (t, vel = 1) {
    A.ensure();
    noise(t, 0.17, 'highpass', 1400, vel * 0.45);
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'triangle';
    o.frequency.setValueAtTime(210, t);
    o.frequency.exponentialRampToValueAtTime(150, t + 0.08);
    g.gain.setValueAtTime(vel * 0.35, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.1);
    o.connect(g);
    g.connect(session);
    o.start(t);
    o.stop(t + 0.12);
  };
  A.hat = function (t, vel = 1, open = false) {
    A.ensure();
    noise(t, open ? 0.28 : 0.045, 'highpass', 7500, vel * 0.22);
  };
  A.ride = function (t, vel = 1) {
    A.ensure();
    noise(t, 0.45, 'bandpass', 6200, vel * 0.16, 1.2);
    noise(t, 0.08, 'highpass', 9000, vel * 0.1);
  };
  A.rim = function (t, vel = 1) {
    A.ensure();
    noise(t, 0.04, 'bandpass', 1800, vel * 0.5, 3);
  };
  A.click = function (t, accent = false, vel = 1) {
    A.ensure();
    t = t ?? ctx.currentTime;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'square';
    o.frequency.value = accent ? 1680 : 1120;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.16 * vel, t + 0.002);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.045);
    o.connect(g);
    g.connect(session);
    o.start(t);
    o.stop(t + 0.06);
  };
  A.bell = function () {
    A.ensure();
    const t = ctx.currentTime;
    [880, 1320].forEach((fr, i) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.frequency.value = fr;
      g.gain.setValueAtTime(0.0001, t + i * 0.18);
      g.gain.exponentialRampToValueAtTime(0.25, t + i * 0.18 + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t + i * 0.18 + 1.2);
      o.connect(g);
      g.connect(session);
      o.start(t + i * 0.18);
      o.stop(t + i * 0.18 + 1.3);
    });
  };

  /* -------- Drone (root + fifth pad) -------- */
  let drone = null;
  A.droneStart = function (midi) {
    A.ensure();
    A.droneStop();
    const t = ctx.currentTime;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.09, t + 0.8);
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 900;
    lp.connect(g);
    g.connect(session);
    g.connect(verbSend);
    const oscs = [
      [midi, 'sawtooth', 0], [midi, 'sawtooth', 7], [midi + 7, 'sawtooth', -5], [midi - 12, 'sine', 0], [midi + 12, 'triangle', 3],
    ].map(([m, type, det]) => {
      const o = ctx.createOscillator();
      o.type = type;
      o.frequency.value = mtof(m);
      o.detune.value = det;
      o.connect(lp);
      o.start(t);
      return o;
    });
    drone = { g, oscs };
  };
  A.droneStop = function () {
    if (!drone) return;
    const t = ctx.currentTime;
    const d = drone;
    d.g.gain.cancelScheduledValues(t);
    d.g.gain.setValueAtTime(Math.max(0.0001, d.g.gain.value), t);
    d.g.gain.exponentialRampToValueAtTime(0.0001, t + 0.4);
    d.oscs.forEach((o) => o.stop(t + 0.45));
    drone = null;
  };
  A.droneOn = () => !!drone;

  /** Cut every sound that is playing or already scheduled */
  A.hush = function () {
    if (!ctx) return;
    const old = session;
    const t = ctx.currentTime;
    old.gain.setValueAtTime(old.gain.value, t);
    old.gain.linearRampToValueAtTime(0, t + 0.03);
    setTimeout(() => old.disconnect(), 120);
    buildSession();
  };

  /** Stop all clocks (except persistent ones like the global metronome), the drone and every queued note */
  const clocks = new Set();
  A.stopAll = function () {
    if (!ctx) return;
    [...clocks].forEach((c) => {
      if (!c.persistent) c.stop();
    });
    A.droneStop();
    A.hush();
  };
  A.anyPlaying = () => [...clocks].some((c) => !c.persistent && (c.running || c.paused));

  /* -------- Look-ahead clock -------- */
  class Clock {
    constructor() {
      this.timer = null;
      this.bpm = 90;
      this.swing = 0;
      this.stepsPerBeat = 4;
    }
    get running() {
      return !!this.timer;
    }
    start(bpm, onStep, opts = {}) {
      A.ensure();
      this.stop();
      clocks.add(this);
      this.bpm = bpm;
      this.onStep = onStep;
      this.step = 0;
      this.stepsPerBeat = opts.stepsPerBeat || 4;
      this.swing = opts.swing || 0;
      this.next = ctx.currentTime + 0.1;
      this.timer = setInterval(() => this._tick(), 25);
      this._tick();
    }
    _tick() {
      const ahead = ctx.currentTime + 0.12;
      while (this.timer && this.next < ahead) {
        const stepDur = 60 / this.bpm / this.stepsPerBeat;
        let t = this.next;
        if (this.swing && this.stepsPerBeat === 4 && this.step % 4 === 2) t += this.swing * 0.667 * stepDur;
        const r = this.onStep(this.step, t, stepDur);
        if (r === false) {
          this.stop();
          return;
        }
        this.step++;
        this.next += stepDur;
      }
    }
    /** Freeze at the current position and silence ringing notes */
    pause() {
      if (!this.timer) return;
      clearInterval(this.timer);
      this.timer = null;
      this.paused = true;
      A.hush();
      if (this.onPause) this.onPause();
    }
    /** Continue from the exact step where it was paused */
    resume() {
      if (!this.paused) return;
      A.ensure();
      this.paused = false;
      this.next = ctx.currentTime + 0.08;
      this.timer = setInterval(() => this._tick(), 25);
      if (this.onResume) this.onResume();
      this._tick();
    }
    stop() {
      const wasActive = !!this.timer || this.paused;
      if (this.timer) clearInterval(this.timer);
      this.timer = null;
      this.paused = false;
      clocks.delete(this);
      // only notify when something was actually playing (start() calls stop() to reset)
      if (wasActive && this.onStop) this.onStop();
    }
  }
  A.Clock = Clock;
})();
