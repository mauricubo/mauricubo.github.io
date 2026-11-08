/* pitch.js — listens to the guitar through the microphone and reports single notes.
 * Uses the McLeod Pitch Method (normalized square difference), which avoids most octave errors.
 * Events: GT.pitch.on(fn) → fn({ type: 'note', midi, freq, cents, rms, time }) on every new note (onset),
 *                          and fn({ type: 'level', rms, midi|null }) on every analysis frame.
 */
(function () {
  'use strict';
  const GT = window.GT;
  const A = GT.audio;

  const MIN_HZ = 70; // just below low D (drop tuning)
  const MAX_HZ = 1300; // ~ fret 20 on the high E string
  const WIN = 1024;
  const SILENCE = 0.008; // RMS below this = no note
  const CLARITY = 0.82; // how periodic the signal must be

  let stream = null;
  let src = null;
  let analyser = null;
  let buf = null;
  let raf = 0;
  const listeners = new Set();
  let s = {};

  function mpm(x, sr) {
    const minLag = Math.floor(sr / MAX_HZ);
    const maxLag = Math.min(Math.ceil(sr / MIN_HZ), x.length - WIN - 1);
    const nsdf = new Float32Array(maxLag + 2);
    for (let tau = 0; tau <= maxLag + 1; tau++) {
      let r = 0;
      let m = 0;
      for (let j = 0; j < WIN; j++) {
        const a = x[j];
        const b = x[j + tau];
        r += a * b;
        m += a * a + b * b;
      }
      nsdf[tau] = m ? (2 * r) / m : 0;
    }
    // key maxima: highest point of every positive region after the first negative dip
    const peaks = [];
    let tau = 0;
    while (tau < maxLag && nsdf[tau] > 0) tau++; // skip the zero-lag lobe
    while (tau < maxLag) {
      while (tau < maxLag && nsdf[tau] <= 0) tau++;
      let best = tau;
      while (tau < maxLag && nsdf[tau] > 0) {
        if (nsdf[tau] > nsdf[best]) best = tau;
        tau++;
      }
      if (nsdf[best] > 0 && best >= minLag) peaks.push(best);
    }
    if (!peaks.length) return null;
    const top = Math.max(...peaks.map((p) => nsdf[p]));
    const pick = peaks.find((p) => nsdf[p] >= 0.9 * top);
    const clarity = nsdf[pick];
    if (clarity < CLARITY) return null;
    // parabolic interpolation around the peak
    const a = nsdf[pick - 1];
    const b = nsdf[pick];
    const c = nsdf[pick + 1];
    const den = a - 2 * b + c;
    const shift = den ? (0.5 * (a - c)) / den : 0;
    return { freq: sr / (pick + shift), clarity };
  }

  function emit(ev) {
    listeners.forEach((fn) => fn(ev));
  }

  let frame = 0;
  function loop() {
    raf = requestAnimationFrame(loop);
    if (++frame % 2) return; // ~30 analyses per second is plenty
    analyser.getFloatTimeDomainData(buf);
    let sum = 0;
    for (let i = 0; i < buf.length; i++) sum += buf[i] * buf[i];
    const rms = Math.sqrt(sum / buf.length);
    let midi = null;
    let det = null;
    if (rms > SILENCE) {
      det = mpm(buf, analyser.context.sampleRate);
      if (det) midi = 69 + 12 * Math.log2(det.freq / 440);
    }
    const note = midi === null ? null : Math.round(midi);
    emit({ type: 'level', rms, midi: note });

    // onset: same note seen twice in a row, and either a new pitch or a fresh pick attack
    if (note === null) {
      s.cand = null;
      s.held = null;
      s.peak = Math.max(0, (s.peak || 0) * 0.8);
      return;
    }
    if (note === s.cand) s.count++;
    else {
      s.cand = note;
      s.count = 1;
    }
    const attack = rms > (s.peak || 0) * 1.8 && rms > SILENCE * 2;
    if (s.count >= 2 && (note !== s.held || attack)) {
      s.held = note;
      s.peak = rms;
      emit({ type: 'note', midi: note, freq: det.freq, cents: Math.round((midi - note) * 100), rms, time: analyser.context.currentTime - 0.05 });
    } else s.peak = Math.max((s.peak || 0) * 0.97, rms);
  }

  GT.pitch = {
    get active() {
      return !!stream;
    },
    supported: () => !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia),
    async start() {
      if (stream) return true;
      const ctx = A.ensure();
      stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } });
      src = ctx.createMediaStreamSource(stream);
      analyser = ctx.createAnalyser();
      analyser.fftSize = 2048;
      src.connect(analyser); // analysis only: never routed to the speakers
      buf = new Float32Array(analyser.fftSize);
      s = {};
      loop();
      if (GT.game) GT.game.unlock('mic');
      return true;
    },
    stop() {
      cancelAnimationFrame(raf);
      if (stream) stream.getTracks().forEach((t) => t.stop());
      if (src) src.disconnect();
      stream = src = analyser = null;
      emit({ type: 'level', rms: 0, midi: null });
    },
    /** Subscribe to events; returns an unsubscribe function */
    on(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    /** Exposed for tests */
    _mpm: mpm,
  };
})();
