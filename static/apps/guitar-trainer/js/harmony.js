/* harmony.js — Harmony course: guided units (learn → check → play), demos, quizzes and practice games.
 * Course content lives in harmony-course.js (GT.HARMONY.UNITS). */
(function () {
  'use strict';
  const GT = window.GT;
  const T = GT.theory;
  const A = GT.audio;
  const { $, $$, ui, store, esc, rand } = GT;
  const { UNITS } = GT.HARMONY;

  const PASS = 0.75; // share of quiz questions needed to unlock the next unit
  const QUIZ_LEN = 8;
  const DEMO_BPM = 84;

  /* ================================================================== */
  /* Progress                                                            */
  /* ================================================================== */
  const prog = Object.assign({ units: {}, unlockAll: false, last: null }, store.get('harmony', {}));
  const save = () => store.set('harmony', prog);
  const U = (id) => (prog.units[id] = prog.units[id] || { learn: false, quiz: 0, practice: false, ticks: [] });
  const isUnlocked = (i) => prog.unlockAll || i === 0 || U(UNITS[i - 1].id).quiz >= PASS;
  const isComplete = (id) => U(id).quiz >= PASS && U(id).practice;

  /* ================================================================== */
  /* Theory helpers                                                      */
  /* ================================================================== */
  const IONIAN = T.SCALE_BY_ID.ionian.deg;
  const AEOLIAN = T.SCALE_BY_ID.aeolian.deg;
  const MAJ_KEYS = [0, 7, 2, 9, 4, 5, 10, 3, 8];
  const MIN_KEYS = [9, 4, 11, 2, 7, 0, 5];
  // secondary dominants in E/B/F♯ major would need double sharps (D♯7 → F𝄪), so those keys are left out
  const SEC_KEYS = [0, 7, 2, 9, 5, 10, 3, 8];
  // borrowed ♭VI/♭III in A♭ or E♭ major would be F♭ / C♭ major
  const BOR_KEYS = [0, 7, 2, 9, 4, 5, 10];
  const DEGS = ['1', '2', '3', '4', '5', '6', '7'];
  const DIA_TRI = ['maj', 'm', 'm', 'maj', 'maj', 'm', 'dim'];
  const DIA_SEV = ['maj7', 'm7', 'm7', 'maj7', '7', 'm7', 'm7b5'];
  const MODES = ['ionian', 'dorian', 'phrygian', 'lydian', 'mixolydian', 'aeolian', 'locrian'];
  const MIN_DEGS = ['1', '2', 'b3', '4', '5', 'b6', 'b7'];
  const MIN_TRI = ['m', 'dim', 'maj', 'm', 'm', 'maj', 'maj'];
  const MIN_SEV = ['m7', 'm7b5', 'maj7', 'm7', 'm7', 'maj7', '7'];
  const ORD = ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th'];
  const QNAME = {
    maj: 'Major', m: 'Minor', dim: 'Diminished', aug: 'Augmented',
    maj7: 'Major 7 (maj7)', m7: 'Minor 7 (m7)', 7: 'Dominant 7 (7)', m7b5: 'Half-diminished (m7♭5)', dim7: 'Diminished 7 (°7)',
  };
  const MINOR_Q = new Set(['m', 'm7', 'm6', 'm9', 'm11', 'mMaj7', 'dim', 'dim7', 'm7b5']);
  const RN_SYM = { maj: '', m: '', dim: '°', aug: '+', maj7: 'maj7', m7: '7', 7: '7', m7b5: 'ø7', dim7: '°7', m6: '6', '7b9': '7♭9', '7alt': '7alt', 9: '9', mMaj7: '(maj7)' };

  const shuffle = (arr) => {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };
  const P = (name) => T.pretty(name);
  const keyRoot = (pc, minor) => T.spell(pc, minor ? AEOLIAN : IONIAN).root;
  const keyLabel = (pc, minor) => P(keyRoot(pc, minor)) + (minor ? ' minor' : ' major');
  const fmtDegs = (degs) => degs.map(T.prettyDeg).join(' ');

  function roman(d, q) {
    let r = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'][T.degNum(d) - 1];
    if (MINOR_Q.has(q)) r = r.toLowerCase();
    return T.prettyDeg(d.replace(/[0-9]/g, '')) + r + (RN_SYM[q] ?? T.CHORDS[q].sym);
  }

  /** A chord as a degree + quality inside a key → names, pitch classes, numeral */
  function chordIn(key, minor, d, q) {
    const rootName = T.spellFrom(keyRoot(key, minor), [d])[0];
    return chordFrom(rootName, q, { d, roman: roman(d, q) });
  }
  /** A chord from a spelled root name */
  function chordFrom(rootName, q, extra = {}) {
    const rootPc = T.nameToPc(rootName);
    const degs = T.CHORDS[q].deg;
    return Object.assign(
      { q, rootName, rootPc, degs, name: T.chordName(rootName, q), names: T.spellFrom(rootName, degs), pcs: degs.map((x) => T.mod12(rootPc + T.DEG_SEMI[x])) },
      extra
    );
  }
  /** Random root; symmetric/diminished qualities stay on natural roots to avoid double accidentals */
  function randRoot(q) {
    if (q === 'dim7') return rand(['C#', 'E', 'F#', 'G#', 'A', 'B']); // no 𝄫7 or C♭/F♭ spellings
    if (['dim', 'm7b5'].includes(q)) return rand(['C', 'D', 'E', 'G', 'A', 'B']); // F° would need C♭
    if (q === 'aug') return rand(['C', 'D', 'F', 'G', 'Bb', 'Eb']); // no E♯/B♯/F𝄪
    if (MINOR_Q.has(q)) return rand(['C', 'D', 'E', 'F', 'G', 'A', 'B', 'Bb', 'Eb']); // A♭m would need C♭
    return rand(['C', 'D', 'E', 'F', 'G', 'A', 'B', 'Bb', 'Eb', 'Ab']);
  }
  const listNames = (chords) => chords.map((c) => c.name).join(' – ');

  /* ================================================================== */
  /* Audio                                                               */
  /* ================================================================== */
  const bassMidi = (pc) => 36 + T.mod12(pc - 36);
  function playChordAt(rootPc, q, t, dur = 1.5, vel = 0.72) {
    A.strum(ui.voicing(rootPc, q), t, { vel, dur });
    A.bass(bassMidi(rootPc), t, dur * 0.9, 0.5);
  }
  const playChord = (c) => {
    silence();
    playChordAt(c.rootPc, c.q, A.now() + 0.05);
  };

  let seqTimers = [];
  function stopSeq() {
    seqTimers.forEach(clearTimeout);
    seqTimers = [];
  }
  /** steps: chord objects ({rootPc, q}) or {notes: [midi]} — played one after another */
  function playSteps(steps, { beatsEach = 2, bpm = DEMO_BPM, onStep, onEnd } = {}) {
    silence();
    const dur = (60 / bpm) * beatsEach;
    const t0 = A.now() + 0.08;
    steps.forEach((s, i) => {
      const t = t0 + i * dur;
      if (s.notes) s.notes.forEach((m) => A.pluck(m, t, { dur: dur * 0.95, vel: 0.85 }));
      else playChordAt(s.rootPc, s.q, t, dur * 0.95);
      if (onStep) seqTimers.push(A.at(t, () => onStep(i)));
    });
    seqTimers.push(A.at(t0 + steps.length * dur, () => onEnd && onEnd()));
  }

  const loops = new Set();
  let activeLoop = null;
  function silence(except) {
    stopSeq();
    loops.forEach((l) => l !== except && l.stop());
    A.hush();
  }

  /* ================================================================== */
  /* Demo: clickable chords                                              */
  /* ================================================================== */
  function chordInfoHTML(c, opts = {}) {
    const guide = opts.guide;
    const pills = c.degs
      .map((d, i) => {
        const isGuide = [3, 7].includes(T.degNum(d)) || d === '6';
        const cls = guide && !isGuide ? 'hm-dim' : '';
        return `<span class="hm-tone ${ui.degCls(d)} ${cls}"><b>${P(c.names[i])}</b><i>${T.prettyDeg(d)}</i></span>`;
      })
      .join('');
    let scaleLine = '';
    if (opts.scale) {
      const sc = T.SCALE_BY_ID[opts.scale];
      const names = T.spellFrom(c.rootName, sc.deg);
      const charIdx = sc.deg.findIndex((d) => sc.char.includes(d));
      scaleLine = `<p class="hm-scale-line"><strong>${P(c.rootName)} ${sc.name}</strong>: ${names
        .map((nm, i) => `<span class="${c.pcs.includes(T.nameToPc(nm)) ? 'hm-ct' : ''}">${P(nm)}</span>`)
        .join(' ')}${charIdx >= 0 ? ` · colour note <strong>${P(names[charIdx])}</strong> (${T.prettyDeg(sc.deg[charIdx])})` : ''}</p>`;
    }
    return `<div class="hm-ci-head"><span class="hm-ci-name">${c.name}</span>${c.roman ? `<span class="hm-ci-rn">${c.roman}</span>` : ''}${
      opts.fn ? `<span class="tag">${opts.fn}</span>` : ''
    }<span class="muted small">${fmtDegs(c.degs)}</span></div>
      <div class="hm-tones">${pills}</div>${guide ? `<p class="hm-scale-line">Guide tones: <strong>${guideNames(c)}</strong></p>` : ''}${scaleLine}`;
  }
  function guideNames(c) {
    return c.degs
      .map((d, i) => ([3, 7].includes(T.degNum(d)) || d === '6' ? P(c.names[i]) : null))
      .filter(Boolean)
      .join(' + ');
  }

  function demoChords(el, cfg) {
    const chords = cfg.items.map(([d, q]) => chordIn(cfg.key, cfg.minor, d, q));
    el.innerHTML = `
      <div class="hm-demo-bar"><span class="muted small">Key of ${keyLabel(cfg.key, cfg.minor)} · click a chord</span><button class="btn sm" data-all>▶ Play all</button></div>
      <div class="chord-grid hm-chord-grid">${chords
        .map((c, i) => `<button class="chord-btn" data-i="${i}"><span class="rn">${c.roman}${cfg.fn ? ` · ${cfg.fn[i]}` : ''}</span><span class="cn">${c.name}</span></button>`)
        .join('')}</div>
      <div class="hm-ci" aria-live="polite"></div>`;
    const info = $('.hm-ci', el);
    const select = (i, sound = true) => {
      $$('.chord-btn', el).forEach((b, k) => b.classList.toggle('on', k === i));
      info.innerHTML = chordInfoHTML(chords[i], { guide: cfg.guide, scale: cfg.scales && cfg.scales[i], fn: cfg.fn && cfg.fn[i] });
      if (sound) playChord(chords[i]);
    };
    el.addEventListener('click', (e) => {
      const b = e.target.closest('[data-i]');
      if (b) select(+b.dataset.i);
      if (e.target.closest('[data-all]')) playSteps(chords, { onStep: (i) => select(i, false) });
    });
    select(0, false);
  }

  /* ================================================================== */
  /* Demo: compare short sequences                                       */
  /* ================================================================== */
  function demoCompare(el, cfg) {
    const items = cfg.items.map((it) => ({
      ...it,
      steps: it.steps.map((s) => (Array.isArray(s) ? chordIn(cfg.key || 0, cfg.minor, s[0], s[1]) : { notes: s.n, name: s.n.map((m) => P(T.FLATS[m % 12])).join('+') })),
    }));
    el.innerHTML = `<div class="hm-compare">${items
      .map(
        (it, i) => `<div class="hm-cmp-row" data-row="${i}">
          <button class="btn sm hm-play" data-play="${i}" aria-label="Play ${esc(it.label)}">▶</button>
          <div class="hm-cmp-label"><strong>${it.label}</strong>${it.sub ? `<span class="muted small">${it.sub}</span>` : ''}</div>
          <div class="hm-cmp-steps">${it.steps.map((s) => `<span class="hm-step">${s.name}</span>`).join('')}</div>
        </div>`
      )
      .join('')}</div>`;
    el.addEventListener('click', (e) => {
      const b = e.target.closest('[data-play]');
      if (!b) return;
      const i = +b.dataset.play;
      const row = $(`[data-row="${i}"]`, el);
      const steps = $$('.hm-step', row);
      $$('.hm-step', el).forEach((s) => s.classList.remove('on'));
      playSteps(items[i].steps, {
        beatsEach: cfg.beats || 2,
        onStep: (k) => steps.forEach((s, j) => s.classList.toggle('on', j === k)),
        onEnd: () => steps.forEach((s) => s.classList.remove('on')),
      });
    });
  }

  /* ================================================================== */
  /* Demo: harmonize a scale by stacking thirds                          */
  /* ================================================================== */
  function demoStack(el, cfg) {
    const st = { key: cfg.key || 0, sev: !!cfg.sevenths, deg: 0 };
    const sc = T.SCALE_BY_ID[cfg.scale || 'ionian'];
    el.innerHTML = `
      <div class="hm-demo-bar">
        <label class="hm-inline">Key <select data-key>${T.KEY_CHIPS.map((k, i) => `<option value="${i}">${k}</option>`).join('')}</select></label>
        <div data-size></div>
      </div>
      <div class="hm-stack-row" data-row></div>
      <div class="hm-stack-degs" data-degs></div>
      <div class="hm-ci" data-info aria-live="polite"></div>`;
    $('[data-key]', el).value = st.key;
    ui.seg($('[data-size]', el), [{ v: 'tri', label: 'Triads' }, { v: 'sev', label: '7th chords' }], st.sev ? 'sev' : 'tri', (v) => {
      st.sev = v === 'sev';
      render(true);
    });
    $('[data-key]', el).addEventListener('change', (e) => {
      st.key = +e.target.value;
      render(true);
    });
    el.addEventListener('click', (e) => {
      const b = e.target.closest('[data-deg]');
      if (!b) return;
      st.deg = +b.dataset.deg;
      render(true, true);
    });
    function chordAt(i) {
      const q = (st.sev ? DIA_SEV : DIA_TRI)[i];
      return chordIn(st.key, false, DEGS[i], q);
    }
    function render(sound, arp) {
      const names = T.spell(st.key, sc.deg).notes;
      const picks = (st.sev ? [0, 2, 4, 6] : [0, 2, 4]).map((k) => st.deg + k);
      const roles = ['role-root', 'role-third', 'role-fifth', 'role-seventh'];
      $('[data-row]', el).innerHTML = Array.from({ length: 14 }, (_, k) => {
        const p = picks.indexOf(k);
        return `<span class="hm-cell ${p >= 0 ? 'on ' + roles[p] : ''}"><b>${P(names[k % 7])}</b><i>${k % 7 + 1}</i></span>`;
      }).join('');
      $('[data-degs]', el).innerHTML = DEGS.map((d, i) => {
        const c = chordAt(i);
        return `<button class="chord-btn ${i === st.deg ? 'on' : ''}" data-deg="${i}"><span class="rn">${c.roman}</span><span class="cn">${c.name}</span></button>`;
      }).join('');
      const c = chordAt(st.deg);
      $('[data-info]', el).innerHTML = chordInfoHTML(c) + `<p class="hint">Built from scale degrees ${picks.map((k) => (k % 7) + 1).join(' – ')} of ${keyLabel(st.key)}: no note outside the scale.</p>`;
      if (!sound) return;
      if (arp) {
        silence();
        const t0 = A.now() + 0.05;
        const v = ui.voicing(c.rootPc, c.q).slice().sort((a, b) => a - b);
        v.forEach((m, i) => A.pluck(m, t0 + i * 0.16, { dur: 0.5 }));
        playChordAt(c.rootPc, c.q, t0 + v.length * 0.16 + 0.1);
      } else playChord(c);
    }
    render(false);
  }

  /* ================================================================== */
  /* Progression loop (demos, guide game and jam)                        */
  /* ================================================================== */
  const VIEWS = [
    { v: 'tones', label: 'Chord tones' },
    { v: 'scale', label: 'Scale' },
    { v: 'guide', label: 'Guide tones' },
  ];

  class Loop {
    /**
     * cfg: {key, minor, bpm, chords:[{d,q,beats,sc,fn}], view, link}
     * opts.game: {target:'chord'|'guide', goal, onScore(hits), onDone()}
     */
    constructor(el, cfg, opts = {}) {
      this.el = el;
      this.cfg = cfg;
      this.game = opts.game || null;
      this.key = cfg.key || 0;
      this.minor = !!cfg.minor;
      this.bpm = cfg.bpm || 88;
      this.view = cfg.view || 'tones';
      this.drums = true;
      this.hints = !this.game;
      this.cur = 0;
      this.clock = null;
      this.hits = 0;
      this.misses = 0;
      this.scored = new Set();
      loops.add(this);
      this.render();
    }
    get chords() {
      return this.cfg.chords.map((x) => Object.assign(chordIn(this.key, this.minor, x.d, x.q), { beats: x.beats, sc: x.sc, fn: x.fn }));
    }
    render() {
      const el = this.el;
      const g = this.game;
      el.classList.add('hm-lab');
      el.innerHTML = `
        <div class="hm-lab-bar">
          <button class="btn primary" data-tp>▶ Play</button>
          <label class="hm-inline">Key <select data-key>${T.KEY_CHIPS.map((k, i) => `<option value="${i}">${k}${this.minor ? 'm' : ''}</option>`).join('')}</select></label>
          <label class="hm-inline">Tempo <input type="range" min="50" max="160" step="2" data-bpm><output data-bpm-out></output></label>
          <label class="hm-check"><input type="checkbox" data-drums checked> Drums</label>
          ${g ? '<label class="hm-check"><input type="checkbox" data-hints> Show targets</label>' : '<div data-view></div>'}
        </div>
        <div class="hm-strip" data-strip></div>
        <div class="hm-now" data-now aria-live="polite"></div>
        <div class="fb-scroll"><div data-fb></div></div>
        ${g ? '<div class="hm-game" data-game></div>' : ''}
        ${this.cfg.link ? `<p class="hm-link"><button class="btn sm link" data-go="${this.cfg.link}">Take it further in the Improvise lab →</button></p>` : ''}`;
      $('[data-key]', el).value = this.key;
      const bpmEl = $('[data-bpm]', el);
      bpmEl.value = this.bpm;
      $('[data-bpm-out]', el).textContent = this.bpm + ' bpm';
      bpmEl.addEventListener('input', () => {
        this.bpm = +bpmEl.value;
        $('[data-bpm-out]', el).textContent = this.bpm + ' bpm';
        if (this.clock) this.clock.bpm = this.bpm;
      });
      $('[data-key]', el).addEventListener('change', (e) => {
        this.key = +e.target.value;
        const wasRunning = this.running;
        if (wasRunning) this.stop();
        this.renderStrip();
        this.select(this.cur);
        if (wasRunning) this.start();
      });
      $('[data-drums]', el).addEventListener('change', (e) => (this.drums = e.target.checked));
      $('[data-tp]', el).addEventListener('click', () => this.toggle());
      if (g) {
        $('[data-hints]', el).addEventListener('change', (e) => {
          this.hints = e.target.checked;
          this.draw();
        });
      } else {
        ui.seg($('[data-view]', el), VIEWS, this.view, (v) => {
          this.view = v;
          this.draw();
        });
      }
      $('[data-strip]', el).addEventListener('click', (e) => {
        const b = e.target.closest('[data-i]');
        if (!b) return;
        this.select(+b.dataset.i);
        if (!this.running) playChord(this.chords[this.cur]);
      });
      this.fb = new GT.Fretboard($('[data-fb]', el), Object.assign(GT.fbOpts(), { onClick: (s, f) => this.click(s, f) }));
      this.renderStrip();
      this.select(0);
      this.renderGame();
    }
    renderStrip() {
      const chords = this.chords;
      $('[data-strip]', this.el).innerHTML = chords
        .map(
          (c, i) => `<button class="pchord" data-i="${i}" style="flex-grow:${c.beats}"><span class="pc-name">${c.name}</span><span class="pc-rn">${c.roman}</span></button>`
        )
        .join('');
    }
    select(i) {
      this.cur = i;
      const c = this.chords[i];
      $$('.pchord', this.el).forEach((b, k) => b.classList.toggle('on', k === i));
      const sc = c.sc ? T.SCALE_BY_ID[c.sc] : null;
      let line = '';
      if (this.game) {
        line = `<p class="hm-target">Click ${this.game.target === 'guide' ? 'a <strong>3rd</strong> or <strong>7th</strong>' : 'any <strong>chord tone</strong>'} of <strong>${c.name}</strong>: ${
          this.game.target === 'guide' ? guideNames(c) : c.names.map(P).join(', ')
        }</p>`;
      } else {
        line = `<div class="hm-now-grid">
          <div><span class="hm-k">Chord tones</span><span class="hm-v">${c.names.map((nm, k) => `<span class="${ui.degCls(c.degs[k])}">${P(nm)}</span>`).join(' ')}</span></div>
          <div><span class="hm-k">Guide tones</span><span class="hm-v">${guideNames(c)}</span></div>
          ${sc ? `<div><span class="hm-k">Scale</span><span class="hm-v">${P(c.rootName)} ${sc.name}</span></div>` : ''}
          ${c.fn ? `<div><span class="hm-k">Function</span><span class="hm-v">${{ T: 'Tonic', S: 'Subdominant', D: 'Dominant' }[c.fn] || c.fn}</span></div>` : ''}
        </div>`;
      }
      $('[data-now]', this.el).innerHTML = `<div class="hm-now-head"><span class="hm-now-name">${c.name}</span><span class="hm-now-rn">${c.roman}</span></div>${line}`;
      this.draw();
    }
    draw() {
      const c = this.chords[this.cur];
      const opts = this.fb.opts;
      const chordDeg = new Map(c.degs.map((d) => [T.mod12(c.rootPc + T.DEG_SEMI[d]), d]));
      let notes = [];
      if (this.game) {
        if (this.hints) {
          const want = this.targets(c);
          notes = T.neckNotes(opts.tuning, c.rootPc, c.degs, opts.frets)
            .filter((x) => want.has(x.m % 12))
            .map((x) => ({ s: x.s, f: x.f, label: T.prettyDeg(x.deg), cls: ui.degCls(x.deg) }));
        }
      } else if (this.view === 'scale' && c.sc) {
        const sc = T.SCALE_BY_ID[c.sc];
        notes = T.neckNotes(opts.tuning, c.rootPc, sc.deg, opts.frets).map((x) => {
          const cd = chordDeg.get(x.m % 12);
          return { s: x.s, f: x.f, label: T.prettyDeg(cd || x.deg), cls: cd ? ui.degCls(cd) : sc.char.includes(x.deg) ? 'char' : '' };
        });
      } else {
        const guide = this.view === 'guide';
        notes = T.neckNotes(opts.tuning, c.rootPc, c.degs, opts.frets).map((x) => {
          const isGuide = [3, 7].includes(T.degNum(x.deg)) || x.deg === '6';
          return { s: x.s, f: x.f, label: T.prettyDeg(x.deg), cls: guide && !isGuide ? 'ghost' : ui.degCls(x.deg) };
        });
      }
      this.fb.draw(notes);
    }
    targets(c) {
      if (this.game.target === 'guide') return new Set(c.degs.filter((d) => [3, 7].includes(T.degNum(d)) || d === '6').map((d) => T.mod12(c.rootPc + T.DEG_SEMI[d])));
      return new Set(c.pcs);
    }
    get running() {
      return !!(this.clock && this.clock.running);
    }
    toggle() {
      if (this.running) this.stop();
      else this.start();
    }
    start() {
      silence(this);
      activeLoop = this;
      const chords = this.chords;
      const starts = [];
      let total = 0;
      chords.forEach((c) => {
        starts.push(total);
        total += c.beats;
      });
      this.clock = new A.Clock();
      this.occurrence = 0;
      this.clock.start(
        this.bpm,
        (step, t, sd) => {
          const beat = Math.floor(step / 2) % total;
          const off = step % 2;
          const bar = beat % 4;
          if (this.drums) {
            A.hat(t, off ? 0.5 : 0.8);
            if (!off && (bar === 0 || bar === 2)) A.kick(t, 0.8);
            if (!off && (bar === 1 || bar === 3)) A.snare(t, 0.45);
          }
          if (off) return;
          const i = starts.findIndex((s, k) => beat >= s && beat < s + chords[k].beats);
          const c = chords[i];
          const beatDur = sd * 2;
          if (beat === starts[i]) {
            playChordAt(c.rootPc, c.q, t, beatDur * Math.min(c.beats, 2) * 0.95, 0.6);
            const occ = ++this.occurrence;
            A.at(t, () => {
              this.chordOcc = occ;
              this.select(i);
            });
          } else if ((beat - starts[i]) % 2 === 0) {
            A.strum(ui.voicing(c.rootPc, c.q), t, { vel: 0.35, dur: beatDur * 0.9, up: true });
            A.bass(bassMidi(c.rootPc), t, beatDur * 0.9, 0.4);
          }
        },
        { stepsPerBeat: 2 }
      );
      this.clock.onStop = () => this.syncButton();
      this.syncButton();
    }
    stop() {
      if (this.clock) {
        this.clock.stop();
        this.clock = null;
        A.hush();
      }
      this.syncButton();
    }
    syncButton() {
      const b = $('[data-tp]', this.el);
      if (!b) return;
      b.innerHTML = this.running ? '■ Stop' : '▶ Play';
      b.classList.toggle('active', this.running);
    }
    click(s, f) {
      const midi = this.fb.midiAt(s, f);
      A.pluck(midi, undefined, { vel: 0.9, dur: 0.8 });
      if (!this.game) {
        this.fb.flash(s, f, 'playing', 300, T.pretty(T.FLATS[midi % 12]));
        return;
      }
      const c = this.chords[this.cur];
      if (!this.running) {
        this.fb.flash(s, f, 'playing', 300, P(T.FLATS[midi % 12]));
        this.renderGame('Start the loop to score: notes only count in time.');
        return;
      }
      const ok = this.targets(c).has(midi % 12);
      const deg = c.degs.find((d) => T.mod12(c.rootPc + T.DEG_SEMI[d]) === midi % 12);
      this.fb.flash(s, f, ok ? 'hit' : 'miss', 420, deg ? T.prettyDeg(deg) : P(T.FLATS[midi % 12]));
      if (ok) {
        const k = this.chordOcc + ':' + (midi % 12);
        if (!this.scored.has(k)) {
          this.scored.add(k);
          this.hits++;
        }
      } else this.misses++;
      this.renderGame();
      if (ok && this.hits >= this.game.goal && !this.done) {
        this.done = true;
        this.game.onDone();
      }
    }
    renderGame(msg) {
      if (!this.game) return;
      const total = this.hits + this.misses;
      $('[data-game]', this.el).innerHTML = `
        <div class="stats">
          <div class="stat"><span class="v">${Math.min(this.hits, this.game.goal)}/${this.game.goal}</span><span class="k">Score</span></div>
          <div class="stat"><span class="v">${total ? Math.round((this.hits / total) * 100) + '%' : '—'}</span><span class="k">Accuracy</span></div>
        </div>
        <div class="hm-meter"><i style="width:${Math.min(100, (this.hits / this.game.goal) * 100)}%"></i></div>
        ${msg ? `<p class="hint hm-center">${msg}</p>` : '<p class="hint hm-center">Each target note counts once per chord. Different notes of the same chord all count.</p>'}`;
    }
    destroy() {
      this.stop();
      loops.delete(this);
      if (activeLoop === this) activeLoop = null;
    }
  }

  const DEMOS = { chords: demoChords, compare: demoCompare, stack: demoStack, loop: (el, cfg) => new Loop(el, cfg) };

  /* ================================================================== */
  /* Question generators                                                 */
  /* ================================================================== */
  /** Multiple choice: shuffles the correct answer in with up to `limit` distractors */
  function mcq(prompt, correct, distractors, why, extra = {}) {
    const ds = [...new Set(distractors)].filter((d) => d !== correct).slice(0, extra.limit || 3);
    const opts = shuffle([correct, ...ds]);
    return Object.assign({ prompt, opts, a: opts.indexOf(correct), why }, extra);
  }
  const ear = (play) => ({ play, ear: true });
  const playSeqFn = (chords, beatsEach = 2) => () => playSteps(chords, { beatsEach });

  const TRIADS = ['maj', 'm', 'dim', 'aug'];
  const SEVENTHS = ['maj7', 'm7', '7', 'm7b5', 'dim7'];
  const FN = ['Tonic', 'Subdominant', 'Tonic', 'Subdominant', 'Dominant', 'Tonic', 'Dominant'];
  const FN_WHY = {
    Tonic: 'Tonic chords (I, iii, vi) share the notes of the home chord. They feel at rest.',
    Subdominant: 'Subdominant chords (IV, ii) contain the 4th degree of the key. They move away from home and prepare the dominant.',
    Dominant: 'Dominant chords (V, vii°) contain the leading tone (7th degree), which pulls up to the tonic.',
  };
  const PROGS = [
    { name: 'I – V – vi – IV', ch: [['1', 'maj'], ['5', 'maj'], ['6', 'm'], ['4', 'maj']] },
    { name: 'vi – IV – I – V', ch: [['6', 'm'], ['4', 'maj'], ['1', 'maj'], ['5', 'maj']] },
    { name: 'I – vi – IV – V', ch: [['1', 'maj'], ['6', 'm'], ['4', 'maj'], ['5', 'maj']] },
    { name: 'I – IV – V – I', ch: [['1', 'maj'], ['4', 'maj'], ['5', 'maj'], ['1', 'maj']] },
    { name: 'ii – V – I – I', ch: [['2', 'm'], ['5', 'maj'], ['1', 'maj'], ['1', 'maj']] },
  ];
  const CADENCES = [
    { name: 'Authentic (V → I)', ch: [['1', 'maj'], ['2', 'm'], ['5', 'maj'], ['1', 'maj']], why: 'It ends V → I: the full stop.' },
    { name: 'Plagal (IV → I)', ch: [['1', 'maj'], ['5', 'maj'], ['4', 'maj'], ['1', 'maj']], why: 'It ends IV → I: the soft “Amen” ending.' },
    { name: 'Half (ends on V)', ch: [['1', 'maj'], ['6', 'm'], ['2', 'm'], ['5', 'maj']], why: 'It stops on V and leaves you hanging, like a question.' },
    { name: 'Deceptive (V → vi)', ch: [['1', 'maj'], ['2', 'm'], ['5', 'maj'], ['6', 'm']], why: 'V should go to I, but it lands on vi: a surprise.' },
  ];

  const GENS = {
    triadNotes() {
      const q = rand(TRIADS);
      const c = chordFrom(randRoot(q), q);
      return mcq(
        `Which triad is <span class="big">${c.names.map(P).join(' – ')}</span>?`,
        QNAME[q],
        TRIADS.map((x) => QNAME[x]),
        `${c.names.map(P).join(' – ')} = <strong>${fmtDegs(c.degs)}</strong>, a ${QNAME[q].toLowerCase()} triad (${c.name}).`,
        { play: () => playChord(c) }
      );
    },
    triadEar() {
      const q = rand(TRIADS);
      const c = chordFrom(randRoot(q), q);
      return mcq('Listen. What quality is this chord?', QNAME[q], TRIADS.map((x) => QNAME[x]), `It was <strong>${c.name}</strong> (${fmtDegs(c.degs)}).`, ear(() => playChord(c)));
    },
    diatonicName() {
      const key = rand(MAJ_KEYS);
      const i = Math.floor(Math.random() * 7);
      const all = DEGS.map((d, k) => chordIn(key, false, d, DIA_TRI[k]));
      const c = all[i];
      const wrongQ = chordIn(key, false, DEGS[i], DIA_TRI[i] === 'maj' ? 'm' : 'maj');
      return mcq(
        `In <strong>${keyLabel(key)}</strong>, which chord is <span class="big">${c.roman}</span>?`,
        c.name,
        [wrongQ.name, ...shuffle(all.filter((x) => x !== c)).map((x) => x.name)],
        `The chords of ${keyLabel(key)} are ${all.map((x) => `${x.name} (${x.roman})`).join(', ')}.`,
        { play: playSeqFn([all[0], c]) }
      );
    },
    diatonicRoman() {
      const key = rand(MAJ_KEYS);
      const i = Math.floor(Math.random() * 7);
      const all = DEGS.map((d, k) => chordIn(key, false, d, DIA_TRI[k]));
      const c = all[i];
      return mcq(
        `In <strong>${keyLabel(key)}</strong>, what is the Roman numeral of <span class="big">${c.name}</span>?`,
        c.roman,
        shuffle(all.filter((x) => x !== c)).map((x) => x.roman),
        `${P(c.rootName)} is the ${ORD[i]} note of ${keyLabel(key)}, and the chord there is ${DIA_TRI[i] === 'maj' ? 'major' : DIA_TRI[i] === 'm' ? 'minor' : 'diminished'}: <strong>${c.roman}</strong>.`,
        { play: playSeqFn([all[0], c]) }
      );
    },
    diatonicQuality() {
      const i = Math.floor(Math.random() * 7);
      const q = DIA_TRI[i];
      return mcq(
        `In any major key, the triad built on the <strong>${ORD[i]} degree</strong> is…`,
        QNAME[q],
        ['Major', 'Minor', 'Diminished'],
        `The pattern is major – minor – minor – major – major – minor – diminished, so degree ${i + 1} is <strong>${QNAME[q].toLowerCase()}</strong> (${roman(DEGS[i], q)}).`
      );
    },
    functionGroup() {
      const i = Math.floor(Math.random() * 7);
      const f = FN[i];
      return mcq(`What is the function of <span class="big">${roman(DEGS[i], DIA_TRI[i])}</span> in a major key?`, f, ['Tonic', 'Subdominant', 'Dominant'], FN_WHY[f]);
    },
    cadenceEar() {
      const key = rand(MAJ_KEYS);
      const cad = rand(CADENCES);
      const chords = cad.ch.map(([d, q]) => chordIn(key, false, d, q));
      return mcq(
        'Listen to the phrase. Which cadence ends it?',
        cad.name,
        CADENCES.map((x) => x.name),
        `${cad.why} (${chords.map((c) => c.roman).join(' – ')} in ${keyLabel(key)}: ${listNames(chords)}.)`,
        ear(playSeqFn(chords))
      );
    },
    functionEar() {
      const key = rand(MAJ_KEYS);
      const i = 1 + Math.floor(Math.random() * 5); // ii … vi
      const tonic = chordIn(key, false, '1', 'maj');
      const c = chordIn(key, false, DEGS[i], DIA_TRI[i]);
      return mcq(
        'You hear the tonic, then another chord of the key. Which one?',
        c.roman,
        ['ii', 'iii', 'IV', 'V', 'vi'],
        `It was <strong>${c.roman}</strong> (${tonic.name} → ${c.name} in ${keyLabel(key)}). ${FN_WHY[FN[i]]}`,
        Object.assign(ear(playSeqFn([tonic, c])), { limit: 4 })
      );
    },
    seventhFormula() {
      const q = rand(SEVENTHS);
      const c = chordFrom(randRoot(q), q);
      const byNotes = Math.random() < 0.5;
      return mcq(
        byNotes ? `Which chord is spelled <span class="big">${c.names.map(P).join(' – ')}</span>?` : `Which chord has the formula <span class="big">${fmtDegs(c.degs)}</span>?`,
        byNotes ? c.name : QNAME[q],
        byNotes ? SEVENTHS.map((x) => chordFrom(c.rootName, x).name) : SEVENTHS.map((x) => QNAME[x]),
        `${QNAME[q]} = <strong>${fmtDegs(c.degs)}</strong>${byNotes ? `: ${c.names.map(P).join(' ')} is ${c.name}` : ''}.`,
        { play: () => playChord(c) }
      );
    },
    seventhDiatonic() {
      const i = Math.floor(Math.random() * 7);
      const q = DIA_SEV[i];
      return mcq(
        `In a major key, the 7th chord built on degree <strong>${i + 1}</strong> is…`,
        QNAME[q],
        ['maj7', 'm7', '7', 'm7b5'].map((x) => QNAME[x]),
        `Diatonic sevenths: Imaj7 ii7 iii7 IVmaj7 V7 vi7 viiø7. Degree ${i + 1} gives <strong>${roman(DEGS[i], q)}</strong>.`
      );
    },
    tritone() {
      const c = chordFrom(randRoot(), '7');
      const [r, third, fifth, sev] = c.names.map(P);
      return mcq(
        `Which two notes form the tritone in <span class="big">${c.name}</span>?`,
        `${third} and ${sev}`,
        [`${r} and ${fifth}`, `${r} and ${sev}`, `${fifth} and ${sev}`, `${r} and ${third}`],
        `The 3rd (${third}) and ♭7 (${sev}) are 6 semitones apart. They resolve inward by half steps into the I chord.`,
        { play: () => playChord(c) }
      );
    },
    seventhEar() {
      const q = rand(SEVENTHS);
      const c = chordFrom(randRoot(q), q);
      return mcq('Listen. Which seventh chord is this?', QNAME[q], SEVENTHS.map((x) => QNAME[x]), `It was <strong>${c.name}</strong> (${fmtDegs(c.degs)}).`, Object.assign(ear(() => playChord(c)), { limit: 4 }));
    },
    progEar() {
      const key = rand(MAJ_KEYS);
      const p = rand(PROGS.slice(0, 4));
      const chords = p.ch.map(([d, q]) => chordIn(key, false, d, q));
      return mcq('Listen. Which progression is this?', p.name, PROGS.map((x) => x.name), `It was <strong>${p.name}</strong>: ${listNames(chords)} in ${keyLabel(key)}.`, ear(playSeqFn(chords)));
    },
    progNames() {
      const key = rand(MAJ_KEYS);
      const [p, ...others] = shuffle(PROGS.slice(0, 4));
      const names = (pr) => pr.ch.map(([d, q]) => chordIn(key, false, d, q));
      const chords = names(p);
      const wrongQ = chords.map((c, i) => (i === chords.findIndex((x) => x.q === 'm') ? chordIn(key, false, p.ch[i][0], 'maj') : c));
      return mcq(
        `In <strong>${keyLabel(key)}</strong>, <span class="big">${p.name}</span> is…`,
        listNames(chords),
        [listNames(wrongQ), ...others.map((o) => listNames(names(o)))],
        `${p.name} → ${chords.map((c) => `${c.roman} = ${c.name}`).join(', ')}.`,
        { play: playSeqFn(chords) }
      );
    },
    chordScale() {
      const key = rand(MAJ_KEYS);
      const i = Math.floor(Math.random() * 7);
      const c = chordIn(key, false, DEGS[i], DIA_SEV[i]);
      const opt = (id) => `${P(c.rootName)} ${T.SCALE_BY_ID[id].name.replace(/ \(.*\)/, '')}`;
      return mcq(
        `In <strong>${keyLabel(key)}</strong>, which mode fits <span class="big">${c.name}</span> (${c.roman})?`,
        opt(MODES[i]),
        shuffle(MODES.filter((m) => m !== MODES[i])).map(opt),
        `The ${ORD[i]} chord of the key takes the ${ORD[i]} mode: <strong>${opt(MODES[i])}</strong>, the notes of ${keyLabel(key)} centred on ${P(c.rootName)}.`,
        { play: () => playChord(c) }
      );
    },
    avoidNote() {
      const key = rand(MAJ_KEYS);
      const cases = [
        { d: '1', q: 'maj7', sc: 'ionian', avoid: '4', over: '3' },
        { d: '5', q: '7', sc: 'mixolydian', avoid: '4', over: '3' },
        { d: '6', q: 'm7', sc: 'aeolian', avoid: 'b6', over: '5' },
        { d: '3', q: 'm7', sc: 'phrygian', avoid: 'b2', over: '1' },
      ];
      const k = rand(cases);
      const c = chordIn(key, false, k.d, k.q);
      const sc = T.SCALE_BY_ID[k.sc];
      const names = T.spellFrom(c.rootName, sc.deg);
      const avoid = P(names[sc.deg.indexOf(k.avoid)]);
      const below = P(names[sc.deg.indexOf(k.over)]);
      return mcq(
        `Playing <strong>${P(c.rootName)} ${sc.name.replace(/ \(.*\)/, '')}</strong> over <span class="big">${c.name}</span>, which note is the avoid note?`,
        avoid,
        shuffle(names.map(P).filter((nm) => nm !== avoid)),
        `<strong>${avoid}</strong> (${T.prettyDeg(k.avoid)}) sits a half step above ${below}, a chord tone. Sustained, it clashes; use it as a passing note.`
      );
    },
    toneRole() {
      const tq = rand(['maj7', 'm7', '7', 'm7b5']);
      const c = chordFrom(randRoot(tq), tq);
      const i = Math.floor(Math.random() * 4);
      const roles = ['Root', '3rd', '5th', '7th'];
      return mcq(
        `In <span class="big">${c.name}</span>, the note <strong>${P(c.names[i])}</strong> is the…`,
        roles[i],
        roles,
        `${c.name} = ${c.names.map((nm, k) => `${P(nm)} (${T.prettyDeg(c.degs[k])})`).join(', ')}.`,
        { play: () => playChord(c) }
      );
    },
    guideTones() {
      const q = rand(['maj7', 'm7', '7', 'm7b5']);
      const c = chordFrom(randRoot(q), q);
      const [r, third, fifth, sev] = c.names.map(P);
      const alt = chordFrom(c.rootName, q === '7' ? 'm7' : '7');
      return mcq(
        `What are the guide tones of <span class="big">${c.name}</span>?`,
        `${third} and ${sev}`,
        [`${r} and ${fifth}`, `${third} and ${fifth}`, `${r} and ${sev}`, `${P(alt.names[1])} and ${P(alt.names[3])}`],
        `Guide tones = 3rd + 7th: <strong>${third}</strong> (${T.prettyDeg(c.degs[1])}) and <strong>${sev}</strong> (${T.prettyDeg(c.degs[3])}). They define ${c.name} as ${QNAME[q].toLowerCase()}.`,
        { play: () => playChord(c) }
      );
    },
    twoFiveOne() {
      const key = rand(MAJ_KEYS);
      const seq = (k) => [chordIn(k, false, '2', 'm7'), chordIn(k, false, '5', '7'), chordIn(k, false, '1', 'maj7')];
      const ok = seq(key);
      return mcq(
        `What is the ii–V–I in <strong>${keyLabel(key)}</strong>?`,
        listNames(ok),
        [
          listNames([chordIn(key, false, '2', '7'), ok[1], ok[2]]),
          listNames([ok[0], chordIn(key, false, '5', 'm7'), ok[2]]),
          listNames(seq(T.mod12(key + 7))),
          listNames([ok[0], ok[1], chordIn(key, false, '1', '7')]),
        ],
        `ii7 – V7 – Imaj7 in ${keyLabel(key)}: <strong>${listNames(ok)}</strong>. Roots move up a 4th: ${ok.map((c) => P(c.rootName)).join(' → ')}.`,
        { play: playSeqFn(ok) }
      );
    },
    twoFiveOneMinor() {
      const key = rand(MIN_KEYS);
      const ok = [chordIn(key, true, '2', 'm7b5'), chordIn(key, true, '5', '7'), chordIn(key, true, '1', 'm7')];
      return mcq(
        `What is the minor ii–V–i in <strong>${keyLabel(key, true)}</strong>?`,
        listNames(ok),
        [
          listNames([chordIn(key, true, '2', 'm7'), ok[1], ok[2]]),
          listNames([ok[0], chordIn(key, true, '5', 'm7'), ok[2]]),
          listNames([ok[0], ok[1], chordIn(key, true, '1', 'maj7')]),
        ],
        `iiø7 – V7 – i7: <strong>${listNames(ok)}</strong>. The ii is half-diminished, and the V is major (harmonic minor) so it can resolve with a leading tone.`,
        { play: playSeqFn(ok) }
      );
    },
    minorDiatonic() {
      const key = rand(MIN_KEYS);
      const i = Math.floor(Math.random() * 7);
      const all = MIN_DEGS.map((d, k) => chordIn(key, true, d, MIN_TRI[k]));
      const c = all[i];
      return mcq(
        `In <strong>${keyLabel(key, true)}</strong> (natural minor), which chord is <span class="big">${c.roman}</span>?`,
        c.name,
        [chordIn(key, true, MIN_DEGS[i], MIN_TRI[i] === 'maj' ? 'm' : 'maj').name, ...shuffle(all.filter((x) => x !== c)).map((x) => x.name)],
        `Natural minor chords in ${keyLabel(key, true)}: ${all.map((x) => `${x.name} (${x.roman})`).join(', ')}.`,
        { play: playSeqFn([all[0], c]) }
      );
    },
    minorV() {
      const key = rand(MIN_KEYS);
      const V = chordIn(key, true, '5', '7');
      const leading = P(V.names[1]);
      return mcq(
        `In <strong>${keyLabel(key, true)}</strong>, which dominant chord comes from harmonic minor?`,
        V.name,
        [chordIn(key, true, '5', 'm7').name, chordIn(key, true, '5', 'maj7').name, chordIn(key, true, 'b7', '7').name],
        `Raising the 7th degree gives <strong>${V.name}</strong>: its 3rd (${leading}) is the leading tone, a half step below ${P(keyRoot(key, true))}.`,
        { play: playSeqFn([V, chordIn(key, true, '1', 'm')]) }
      );
    },
    majorMinorEar() {
      const minor = Math.random() < 0.5;
      const key = rand(minor ? MIN_KEYS : MAJ_KEYS);
      const chords = minor
        ? [chordIn(key, true, '1', 'm'), chordIn(key, true, '4', 'm'), chordIn(key, true, '5', '7'), chordIn(key, true, '1', 'm')]
        : [chordIn(key, false, '1', 'maj'), chordIn(key, false, '4', 'maj'), chordIn(key, false, '5', '7'), chordIn(key, false, '1', 'maj')];
      return mcq(
        'Listen. Is this progression in a major or a minor key?',
        minor ? 'Minor key' : 'Major key',
        ['Major key', 'Minor key'],
        `${minor ? 'Minor' : 'Major'}: ${listNames(chords)}. Both use a major V7; the tonic and iv/IV chords decide the mode.`,
        ear(playSeqFn(chords))
      );
    },
    secondaryDom() {
      const key = rand(SEC_KEYS);
      const i = rand([1, 2, 3, 4, 5]);
      const target = chordIn(key, false, DEGS[i], DIA_TRI[i]);
      const dom = chordFrom(T.spellFrom(target.rootName, ['5'])[0], '7');
      const lt = P(dom.names[1]);
      return mcq(
        `In <strong>${keyLabel(key)}</strong>, what is <span class="big">V/${target.roman}</span>, the secondary dominant of ${target.name}?`,
        dom.name,
        [chordIn(key, false, '5', '7').name, chordFrom(target.rootName, '7').name, chordFrom(T.spellFrom(target.rootName, ['4'])[0], '7').name, chordFrom(dom.rootName, 'm7').name],
        `${P(dom.rootName)} is a 5th above ${P(target.rootName)}, so V/${target.roman} = <strong>${dom.name}</strong>. Its 3rd, ${lt}, is the leading tone of ${P(target.rootName)}.`,
        { play: playSeqFn([chordIn(key, false, '1', 'maj'), dom, target]) }
      );
    },
    secondaryTarget() {
      const key = rand(SEC_KEYS);
      const i = rand([1, 2, 3, 4, 5]);
      const all = DEGS.map((d, k) => chordIn(key, false, d, DIA_TRI[k]));
      const target = all[i];
      const dom = chordFrom(T.spellFrom(target.rootName, ['5'])[0], '7');
      return mcq(
        `In <strong>${keyLabel(key)}</strong>, <span class="big">${dom.name}</span> usually resolves to…`,
        target.name,
        shuffle(all.filter((x) => x !== target && x.q !== 'dim')).map((x) => x.name),
        `${dom.name} is V/${target.roman}: ${P(dom.rootName)} is a 5th above ${P(target.rootName)}, and ${P(dom.names[1])} pulls up a half step to ${P(target.rootName)}.`,
        { play: playSeqFn([dom, target]) }
      );
    },
    borrowed() {
      const key = rand(BOR_KEYS);
      const b = rand([['4', 'm'], ['b6', 'maj'], ['b7', 'maj'], ['b3', 'maj']]);
      const c = chordIn(key, false, b[0], b[1]);
      const dia = shuffle([1, 2, 3, 4, 5].map((i) => chordIn(key, false, DEGS[i], DIA_TRI[i])));
      return mcq(
        `Which chord in <strong>${keyLabel(key)}</strong> is borrowed from <strong>${keyLabel(key, true)}</strong>?`,
        c.name,
        dia.map((x) => x.name),
        `<strong>${c.name}</strong> (${c.roman}) is not in ${keyLabel(key)}; it comes from the parallel minor. The others are diatonic.`,
        { play: playSeqFn([chordIn(key, false, '1', 'maj'), c, chordIn(key, false, '1', 'maj')]) }
      );
    },
    borrowedScale() {
      const key = rand(BOR_KEYS);
      const b = rand([
        { d: '4', q: 'm', sc: 'dorian' },
        { d: 'b6', q: 'maj', sc: 'lydian' },
        { d: 'b7', q: 'maj', sc: 'mixolydian' },
        { d: 'b3', q: 'maj', sc: 'ionian' },
      ]);
      const c = chordIn(key, false, b.d, b.q);
      const nm = (id) => `${P(c.rootName)} ${T.SCALE_BY_ID[id].name.replace(/ \(.*\)/, '')}`;
      return mcq(
        `In <strong>${keyLabel(key)}</strong>, which scale fits the borrowed <span class="big">${c.name}</span> (${c.roman})?`,
        nm(b.sc),
        shuffle(['dorian', 'lydian', 'mixolydian', 'ionian', 'aeolian', 'phrygian'].filter((x) => x !== b.sc)).map(nm),
        `Over borrowed chords, play the parallel minor (${keyLabel(key, true)}). From ${P(c.rootName)} that is <strong>${nm(b.sc)}</strong>.`
      );
    },
    borrowedEar() {
      const key = rand(BOR_KEYS);
      const opts = [['4', 'maj'], ['4', 'm'], ['b6', 'maj'], ['b7', 'maj'], ['5', 'maj']];
      const pick = rand(opts);
      const I = chordIn(key, false, '1', 'maj');
      const c = chordIn(key, false, pick[0], pick[1]);
      return mcq(
        'You hear I – ? – I. What is the middle chord?',
        c.roman,
        opts.map(([d, q]) => roman(d, q)),
        `It was <strong>${c.roman}</strong>: ${I.name} – ${c.name} – ${I.name}. ${['4m', 'b6maj', 'b7maj'].includes(pick.join('')) ? 'A borrowed chord from the parallel minor.' : 'A diatonic chord of the key.'}`,
        Object.assign(ear(playSeqFn([I, c, I])), { limit: 4 })
      );
    },
    tritoneSub() {
      const c = chordFrom(rand(['G', 'D', 'A', 'E', 'C', 'F', 'Bb']), '7');
      const subName = T.FLATS[T.mod12(c.rootPc + 6)];
      const sub = chordFrom(subName, '7');
      return mcq(
        `What is the tritone substitute of <span class="big">${c.name}</span>?`,
        sub.name,
        [chordFrom(T.FLATS[T.mod12(c.rootPc + 5)], '7').name, chordFrom(T.FLATS[T.mod12(c.rootPc + 1)], '7').name, chordFrom(T.FLATS[T.mod12(c.rootPc + 7)], '7').name],
        `${sub.name} is a tritone (6 frets) from ${c.name}. They share the same 3rd/♭7 pair: ${P(c.names[1])} + ${P(c.names[3])} and ${P(sub.names[3])} + ${P(sub.names[1])} (same pitches).`,
        { play: playSeqFn([c, sub]) }
      );
    },
  };

  /* ================================================================== */
  /* Quiz runner (used by "Check" and by ear-training practice)          */
  /* ================================================================== */
  function runQuiz(el, { next, total, goal, title, onDone }) {
    let i = 0;
    let score = 0;
    let combo = 0;
    let q = null;
    function render() {
      if (i >= total) return finish();
      q = next(i);
      el.innerHTML = `
        <div class="card prompt-card hm-quiz">
          <div class="hm-quiz-top"><span class="muted small">${title} · ${i + 1} / ${total}</span><span class="muted small">${combo >= 2 ? `<span class="hm-combo">🔥 ${combo} in a row</span> · ` : ''}Score ${score}</span></div>
          <div class="hm-meter"><i style="width:${(i / total) * 100}%"></i></div>
          <div class="prompt">${q.prompt}</div>
          ${q.play ? `<div class="btn-row center"><button class="btn sm" data-hear>${q.ear ? '🔊 Hear again' : '🔊 Hear it'}</button></div>` : ''}
          <div class="answers hm-answers">${q.opts.map((o, k) => `<button class="btn ans" data-k="${k}">${o}</button>`).join('')}</div>
          <div class="feedback" data-fb></div>
        </div>`;
      if (q.ear) q.play();
    }
    function answer(k) {
      if (q.done) return;
      q.done = true;
      const ok = k === q.a;
      if (ok) {
        score++;
        combo++;
        GT.game.award(5 + (combo >= 3 ? 5 : 0), combo >= 3 ? `combo ×${combo}` : 'correct');
      } else combo = 0;
      $$('.btn.ans', el).forEach((b, j) => {
        b.disabled = true;
        if (j === q.a) b.classList.add('good');
        else if (j === k) b.classList.add('bad');
      });
      $('[data-fb]', el).innerHTML = `<div class="hm-why ${ok ? 'ok' : 'no'}"><strong>${ok ? 'Correct.' : 'Not quite.'}</strong> ${q.why}</div>
        <div class="btn-row center"><button class="btn primary" data-next>${i + 1 < total ? 'Next →' : 'See result'}</button></div>`;
      $('[data-next]', el).focus();
    }
    function finish() {
      silence();
      const passed = score >= goal;
      el.innerHTML = `<div class="card prompt-card hm-result ${passed ? 'pass' : ''}">
        <p class="eyebrow">${title}</p>
        <div class="hm-score">${score}<span>/${total}</span></div>
        <p>${passed ? 'Well done, you passed.' : `You need ${goal} to pass. Review and try again: every attempt has new questions.`}</p>
        <div class="btn-row center" data-actions></div>
      </div>`;
      onDone(score, passed, $('[data-actions]', el));
    }
    el.onclick = (e) => {
      if (e.target.closest('[data-hear]') && q && q.play) q.play();
      const b = e.target.closest('[data-k]');
      if (b) answer(+b.dataset.k);
      if (e.target.closest('[data-next]')) {
        i++;
        render();
      }
    };
    render();
    return { restart: () => ((i = 0), (score = 0), render()) };
  }

  /* ================================================================== */
  /* Build exercise                                                      */
  /* ================================================================== */
  const BUILD = {
    diatonic() {
      const key = rand(MAJ_KEYS);
      const pats = [
        ['1', '4', '5', '1'],
        ['1', '5', '6', '4'],
        ['1', '6', '4', '5'],
        ['6', '4', '1', '5'],
        ['1', '3', '4', '5'],
        ['2', '5', '1', '1'],
        ['1', '4', '2', '5'],
      ];
      const pat = rand(pats);
      const tri = (d) => chordIn(key, false, d, DIA_TRI[DEGS.indexOf(d)]);
      const target = pat.map(tri);
      const palette = DEGS.map(tri).concat([chordIn(key, false, '2', 'maj'), chordIn(key, false, '6', 'maj')]);
      return { key, minor: false, ask: target.map((c) => c.roman).join(' – '), target, palette };
    },
    twoFive() {
      const minor = Math.random() < 0.4;
      const key = rand(minor ? MIN_KEYS : MAJ_KEYS);
      if (!minor) {
        const target = [chordIn(key, false, '2', 'm7'), chordIn(key, false, '5', '7'), chordIn(key, false, '1', 'maj7')];
        const palette = DEGS.map((d, i) => chordIn(key, false, d, DIA_SEV[i])).concat([chordIn(key, false, '2', '7'), chordIn(key, false, '5', 'maj7')]);
        return { key, minor, ask: 'ii7 – V7 – Imaj7', target, palette };
      }
      const target = [chordIn(key, true, '2', 'm7b5'), chordIn(key, true, '5', '7'), chordIn(key, true, '1', 'm7')];
      const palette = MIN_DEGS.map((d, i) => chordIn(key, true, d, MIN_SEV[i])).concat([chordIn(key, true, '5', '7'), chordIn(key, true, '2', 'm7')]);
      return { key, minor, ask: 'iiø7 – V7 – i7', target, palette };
    },
    secondary() {
      const key = rand(SEC_KEYS);
      const tri = (d) => chordIn(key, false, d, DIA_TRI[DEGS.indexOf(d)]);
      const sec = (d) => {
        const t = tri(d);
        const c = chordFrom(T.spellFrom(t.rootName, ['5'])[0], '7');
        c.roman = 'V/' + t.roman;
        return c;
      };
      const pats = [
        { ask: 'I – V/vi – vi – IV', seq: [tri('1'), sec('6'), tri('6'), tri('4')] },
        { ask: 'I – V/ii – ii – V', seq: [tri('1'), sec('2'), tri('2'), tri('5')] },
        { ask: 'I – V/V – V – I', seq: [tri('1'), sec('5'), tri('5'), tri('1')] },
        { ask: 'I – V/IV – IV – I', seq: [tri('1'), sec('4'), tri('4'), tri('1')] },
        { ask: 'I – vi – V/V – V', seq: [tri('1'), tri('6'), sec('5'), tri('5')] },
        { ask: 'I – V/iii – iii – IV', seq: [tri('1'), sec('3'), tri('3'), tri('4')] },
      ];
      const p = rand(pats);
      const palette = DEGS.slice(0, 6)
        .map(tri)
        .concat(['2', '3', '4', '5', '6'].map(sec));
      return { key, minor: false, ask: p.ask, target: p.seq, palette };
    },
  };

  function runBuild(el, cfg, onDone) {
    let solved = 0;
    let task = null;
    let picked = [];
    let checked = false;
    function newTask() {
      task = BUILD[cfg.tasks]();
      const seen = new Set();
      task.palette = shuffle(task.palette.filter((c) => (seen.has(c.name) ? false : seen.add(c.name))));
      picked = [];
      checked = false;
      render();
    }
    function render(msg = '') {
      el.innerHTML = `<div class="card hm-build">
        <div class="hm-quiz-top"><span class="muted small">${cfg.title}</span><span class="muted small">Solved ${Math.min(solved, cfg.goal)} / ${cfg.goal}</span></div>
        <div class="hm-meter"><i style="width:${Math.min(100, (solved / cfg.goal) * 100)}%"></i></div>
        <p class="prompt">Build <span class="big">${task.ask}</span> in <strong>${keyLabel(task.key, task.minor)}</strong></p>
        <div class="hm-slots">${task.target
          .map((_, i) => {
            const c = picked[i];
            const st = checked && c ? (c.name === task.target[i].name ? 'good' : 'bad') : '';
            return `<button class="hm-slot ${c ? 'filled' : ''} ${st}" data-slot="${i}">${c ? c.name : i + 1}</button>`;
          })
          .join('')}</div>
        <p class="hint hm-center">Click chords below to fill the slots in order. Click a filled slot to clear it.</p>
        <div class="chord-grid hm-palette">${task.palette.map((c, i) => `<button class="chord-btn" data-p="${i}"><span class="cn">${c.name}</span></button>`).join('')}</div>
        <div class="feedback">${msg}</div>
        <div class="btn-row center">
          <button class="btn" data-hear ${picked.length ? '' : 'disabled'}>🔊 Hear yours</button>
          <button class="btn primary" data-check ${picked.length === task.target.length && !checked ? '' : 'disabled'}>Check</button>
          <button class="btn" data-new>${checked ? 'Next round →' : 'Skip'}</button>
        </div>
      </div>`;
    }
    el.onclick = (e) => {
      const p = e.target.closest('[data-p]');
      if (p && !checked && picked.length < task.target.length) {
        const c = task.palette[+p.dataset.p];
        picked.push(c);
        playChord(c);
        render();
        return;
      }
      const s = e.target.closest('[data-slot]');
      if (s && !checked) {
        picked.splice(+s.dataset.slot, 1);
        render();
        return;
      }
      if (e.target.closest('[data-hear]')) playSteps(picked);
      if (e.target.closest('[data-new]')) newTask();
      if (e.target.closest('[data-check]')) {
        checked = true;
        const ok = picked.every((c, i) => c.name === task.target[i].name);
        if (ok) solved++;
        const answer = task.target.map((c) => `${c.name} <span class="muted">(${c.roman})</span>`).join(' – ');
        render(
          ok
            ? `<div class="hm-why ok"><strong>Correct.</strong> ${answer}</div>`
            : `<div class="hm-why no"><strong>Not quite.</strong> The answer is ${answer}. <button class="btn sm link" data-hear-answer>Hear it</button></div>`
        );
        playSteps(ok ? picked : task.target);
        if (ok && solved === cfg.goal) onDone();
      }
      if (e.target.closest('[data-hear-answer]')) playSteps(task.target);
    };
    newTask();
  }

  /* ================================================================== */
  /* View                                                                */
  /* ================================================================== */
  let root;
  let unitIdx = null;
  let stage = 'learn';
  let lastStage = {};

  const view = {
    init(el) {
      root = el;
      el.addEventListener('click', onClick);
    },
    show(params) {
      if (params.unit) {
        const i = UNITS.findIndex((u) => u.id === params.unit);
        if (i >= 0 && isUnlocked(i)) return openUnit(i, params.stage);
      }
      if (unitIdx !== null) return openUnit(unitIdx, stage);
      renderHome();
    },
    hide() {
      silence();
    },
    transport() {
      if (activeLoop && document.body.contains(activeLoop.el)) activeLoop.toggle();
    },
  };

  function clearStage() {
    silence();
    loops.forEach((l) => l.destroy());
    activeLoop = null;
  }

  function stageState(u) {
    const p = U(u.id);
    return {
      learn: p.learn,
      check: p.quiz >= PASS,
      play: p.practice,
      quizText: p.quiz ? Math.round(p.quiz * QUIZ_LEN) + '/' + QUIZ_LEN : '',
    };
  }

  function renderHome() {
    clearStage();
    unitIdx = null;
    const done = UNITS.filter((u) => isComplete(u.id)).length;
    const nextI = UNITS.findIndex((u, i) => isUnlocked(i) && !isComplete(u.id));
    root.innerHTML = `
      <div class="view-head">
        <div><p class="eyebrow">Harmony course</p><h1>Understand chord progressions</h1>
        <p class="sub">Twelve units from building a triad to tritone substitutions. Each one goes <strong>Learn → Check → Play</strong>: hear and see the idea, prove you understand it, then use it on the fretboard.</p></div>
        <div class="head-actions">${nextI >= 0 ? `<button class="btn primary big" data-open="${nextI}">${done || U(UNITS[nextI].id).learn ? 'Continue' : 'Start'}: Unit ${nextI + 1} →</button>` : '<span class="tag">Course complete</span>'}</div>
      </div>
      <div class="card hm-overview">
        <div class="row-between">
          <div><strong>${done} of ${UNITS.length} units complete</strong><span class="muted small"> · pass a unit’s check (${Math.round(PASS * QUIZ_LEN)}/${QUIZ_LEN}) to unlock the next</span></div>
          <label class="hm-check"><input type="checkbox" data-unlock ${prog.unlockAll ? 'checked' : ''}> Unlock all units</label>
        </div>
        <div class="hm-meter big"><i style="width:${(done / UNITS.length) * 100}%"></i></div>
      </div>
      <div class="hm-units">${UNITS.map((u, i) => {
        const s = stageState(u);
        const open = isUnlocked(i);
        const complete = isComplete(u.id);
        const status = complete
          ? `<span class="hm-stars small">${starHTML(stars(U(u.id).quiz))}</span><span class="hm-done-tag">✓ Completed</span>`
          : i === nextI
            ? '<span class="hm-next-tag">Up next</span>'
            : open
              ? ''
              : '<span class="muted small">🔒 Locked</span>';
        return `<button class="hm-unit ${open ? '' : 'locked'} ${complete ? 'done' : ''} ${i === nextI ? 'next' : ''}" data-open="${i}" ${open ? '' : 'aria-disabled="true"'}>
          <span class="hm-unit-num">${complete ? '✓' : String(i + 1).padStart(2, '0')}</span>
          <span class="hm-unit-body">
            <span class="hm-unit-top"><span class="tag">${u.level}</span>${status}</span>
            <strong>${u.title}</strong>
            <span class="muted small">${u.goal}</span>
            <span class="hm-pills"><i class="${s.learn ? 'on' : ''}">Learn</i><i class="${s.check ? 'on' : ''}">Check${s.quizText ? ' ' + s.quizText : ''}</i><i class="${s.play ? 'on' : ''}">Play</i></span>
          </span>
        </button>`;
      }).join('')}</div>`;
  }

  function openUnit(i, st) {
    clearStage();
    unitIdx = i;
    const u = UNITS[i];
    prog.last = u.id;
    save();
    stage = st || lastStage[u.id] || (U(u.id).learn ? (U(u.id).quiz >= PASS ? 'play' : 'check') : 'learn');
    const s = stageState(u);
    root.innerHTML = `
      <div class="hm-unit-head">
        <button class="btn sm link" data-home>← All units</button>
        <p class="eyebrow">Unit ${i + 1} of ${UNITS.length} · ${u.level}</p>
        <h1>${u.title}</h1>
        <p class="sub">${u.goal}</p>
      </div>
      <div class="hm-steps" role="tablist">
        ${[['learn', '1', 'Learn', 'Theory you can hear'], ['check', '2', 'Check', 'Questions & ear tests'], ['play', '3', 'Play', u.practice.title]]
          .map(
            ([id, num, label, sub]) => `<button role="tab" class="hm-stepbtn ${stage === id ? 'on' : ''} ${s[id] ? 'done' : ''}" data-stage="${id}" aria-selected="${stage === id}">
              <span class="hm-stepnum">${s[id] ? '✓' : num}</span><span><strong>${label}</strong><span>${sub}</span></span></button>`
          )
          .join('')}
      </div>
      <div class="hm-stage" data-stagebox></div>`;
    renderStage();
    window.scrollTo(0, 0);
  }

  function renderStage() {
    const u = UNITS[unitIdx];
    lastStage[u.id] = stage;
    $$('.hm-stepbtn', root).forEach((b) => {
      b.classList.toggle('on', b.dataset.stage === stage);
      b.setAttribute('aria-selected', b.dataset.stage === stage);
    });
    const box = $('[data-stagebox]', root);
    clearStage();
    if (stage === 'learn') renderLearn(box, u);
    else if (stage === 'check') renderCheck(box, u);
    else renderPlay(box, u);
  }

  function refreshSteps() {
    const s = stageState(UNITS[unitIdx]);
    $$('.hm-stepbtn', root).forEach((b) => {
      const id = b.dataset.stage;
      b.classList.toggle('done', !!s[id]);
      $('.hm-stepnum', b).textContent = s[id] ? '✓' : { learn: 1, check: 2, play: 3 }[id];
    });
  }

  function renderLearn(box, u) {
    box.innerHTML =
      u.learn
        .map(
          (sec, k) => `<section class="card hm-section">
            <h3><span class="ln-num">${String(k + 1).padStart(2, '0')}</span>${sec.h}</h3>
            <div class="lesson-body">${sec.html}</div>
            ${sec.demo ? `<div class="hm-demo" data-demo="${k}"></div>` : ''}
          </section>`
        )
        .join('') +
      `<div class="hm-next card"><div><strong>Ready?</strong><span class="muted"> Check your understanding with ${QUIZ_LEN} questions, some of them by ear.</span></div>
        <button class="btn primary" data-learned>Take the check →</button></div>`;
    u.learn.forEach((sec, k) => {
      if (sec.demo) DEMOS[sec.demo.type]($(`[data-demo="${k}"]`, box), sec.demo);
    });
  }

  function quizQuestions(u) {
    const items = shuffle([...u.quiz.gens.map((g) => ({ g })), ...(u.quiz.mc || []).map((m) => ({ m }))]).slice(0, QUIZ_LEN);
    while (items.length < QUIZ_LEN) items.push({ g: rand(u.quiz.gens) });
    return items;
  }
  function fixedQ(m) {
    return mcq(m.q, m.a, m.o, m.why);
  }

  function renderCheck(box, u) {
    const items = quizQuestions(u);
    const goal = Math.ceil(PASS * QUIZ_LEN);
    runQuiz(box, {
      title: 'Check',
      total: QUIZ_LEN,
      goal,
      next: (i) => (items[i].g ? GENS[items[i].g]() : fixedQ(items[i].m)),
      onDone(score, passed, actions) {
        const p = U(u.id);
        const firstPass = passed && p.quiz < PASS;
        p.learn = true;
        p.quiz = Math.max(p.quiz, score / QUIZ_LEN);
        save();
        refreshSteps();
        if (firstPass) GT.game.award(40, 'check passed');
        if (score === QUIZ_LEN) GT.game.unlock('harmony-perfect');
        if (passed) checkCompletion(u);
        actions.innerHTML = `<button class="btn" data-stage="check">Try again</button>${
          passed ? `<button class="btn primary" data-stage="play">Go to practice →</button>` : '<button class="btn" data-stage="learn">Review the lesson</button>'
        }`;
      },
    });
  }

  function renderPlay(box, u) {
    const pr = u.practice;
    const done = () => {
      const p = U(u.id);
      if (!p.practice) {
        p.practice = true;
        save();
        refreshSteps();
        A.bell();
        GT.game.award(60, 'practice done');
      }
      renderComplete(box.querySelector('[data-complete]'), u);
      checkCompletion(u, true);
    };
    box.innerHTML = `<div class="card hm-practice-intro"><p class="eyebrow">Play · ${pr.title}</p><p>${pr.intro}</p></div><div data-ex></div><div data-complete></div>`;
    const ex = $('[data-ex]', box);
    if (pr.type === 'ear') {
      const run = () =>
        runQuiz(ex, {
          title: pr.title,
          total: pr.rounds,
          goal: pr.goal,
          next: () => GENS[rand(pr.gens)](),
          onDone(score, passed, actions) {
            actions.innerHTML = '<button class="btn" data-again>Play again</button>';
            $('[data-again]', actions).onclick = run;
            if (passed) done();
          },
        });
      run();
    } else if (pr.type === 'build') {
      runBuild(ex, pr, done);
    } else if (pr.type === 'guide') {
      const holder = document.createElement('div');
      holder.className = 'card';
      ex.appendChild(holder);
      activeLoop = new Loop(holder, pr, { game: { target: pr.target, goal: pr.goal, onDone: done } });
    } else if (pr.type === 'jam') {
      const p = U(u.id);
      const holder = document.createElement('div');
      holder.className = 'card';
      ex.appendChild(holder);
      activeLoop = new Loop(holder, Object.assign({ view: 'scale' }, pr));
      const list = document.createElement('div');
      list.className = 'card hm-tasks';
      list.innerHTML = `<h3>Challenges</h3>${pr.tasks
        .map((t, k) => `<label class="hm-task"><input type="checkbox" data-task="${k}" ${p.ticks.includes(k) ? 'checked' : ''}><span>${t}</span></label>`)
        .join('')}${pr.links ? `<div class="btn-row">${pr.links.map((l) => `<button class="btn sm" data-go="${l.go}">${l.label}</button>`).join('')}</div>` : ''}`;
      ex.appendChild(list);
      list.addEventListener('change', (e) => {
        const k = +e.target.dataset.task;
        p.ticks = e.target.checked ? [...new Set([...p.ticks, k])] : p.ticks.filter((x) => x !== k);
        save();
        if (p.ticks.length >= pr.tasks.length) done();
      });
    }
    if (U(u.id).practice) renderComplete($('[data-complete]', box), u);
  }

  const stars = (q) => (q >= 1 ? 3 : q >= 0.875 ? 2 : 1);
  const starHTML = (n) => '★★★'.slice(0, n) + '<i>' + '★★★'.slice(n) + '</i>';

  /** Called after the check is passed or the practice is done */
  function checkCompletion(u, fromPractice) {
    const p = U(u.id);
    if (isComplete(u.id) && !p.celebrated) {
      p.celebrated = true;
      save();
      celebrate(u);
    } else if (fromPractice && p.quiz < PASS && !p.nudged) {
      p.nudged = true;
      save();
      showModal({
        icon: '🎸',
        title: 'Practice complete!',
        body: `One step left: pass the <strong>Check</strong> (${Math.ceil(PASS * QUIZ_LEN)}/${QUIZ_LEN}) to complete “${u.title}” and unlock the next unit.`,
        primary: { label: 'Take the check →', run: () => goStage('check') },
        secondary: { label: 'Keep practising', run: () => {} },
      });
    }
  }

  function celebrate(u) {
    const i = UNITS.indexOf(u);
    const next = UNITS[i + 1];
    const p = U(u.id);
    loops.forEach((l) => l.stop());
    silence();
    GT.game.award(100, 'unit complete');
    GT.game.unlock('harmony-unit');
    const done = UNITS.filter((x) => isComplete(x.id)).length;
    if (done >= 6) GT.game.unlock('harmony-half');
    if (done >= UNITS.length) GT.game.unlock('harmony-all');
    const n = stars(p.quiz);
    showModal({
      icon: '🏆',
      cls: 'win',
      title: `Unit ${i + 1} complete!`,
      body: `<div class="hm-stars" aria-label="${n} of 3 stars">${starHTML(n)}</div>
        <p><strong>${u.title}</strong><br><span class="muted">Check ${Math.round(p.quiz * QUIZ_LEN)}/${QUIZ_LEN} · Practice ✓ · ${done}/${UNITS.length} units done</span></p>
        ${n < 3 ? '<p class="muted small">Score 8/8 on the check to earn all three stars.</p>' : ''}
        ${next ? `<p>Up next: <strong>Unit ${i + 2} · ${next.title}</strong></p>` : '<p>You finished the whole course! 🎉</p>'}`,
      primary: next ? { label: `Start unit ${i + 2} →`, run: () => openUnit(i + 1, 'learn') } : { label: 'Back to the course map', run: renderHome },
      secondary: { label: 'Stay here', run: () => {} },
      tertiary: next ? { label: 'Course map', run: renderHome } : null,
      countdown: next ? 8 : 0,
      confetti: true,
    });
  }

  function goStage(id) {
    stage = id;
    renderStage();
    window.scrollTo(0, 0);
  }

  /** Small modal dialog with an optional auto-continue countdown */
  function showModal(o) {
    const old = $('.hm-modal');
    if (old) old.remove();
    const m = GT.h(`<div class="hm-modal ${o.cls || ''}" role="dialog" aria-modal="true" aria-label="${esc(o.title)}">
      <div class="hm-modal-card">
        ${o.confetti ? `<div class="hm-confetti" aria-hidden="true">${Array.from({ length: 24 }, (_, k) => `<i style="--x:${(k * 37) % 100};--d:${(k % 6) * 0.12}s;--h:${(k * 47) % 360}"></i>`).join('')}</div>` : ''}
        <div class="hm-modal-icon">${o.icon}</div>
        <h2>${o.title}</h2>
        <div class="hm-modal-body">${o.body}</div>
        <div class="btn-row center">
          ${o.tertiary ? '<button class="btn" data-m="3">' + o.tertiary.label + '</button>' : ''}
          <button class="btn" data-m="2">${o.secondary.label}</button>
          <button class="btn primary" data-m="1">${o.primary.label}${o.countdown ? ' <span class="hm-count"></span>' : ''}</button>
        </div>
        ${o.countdown ? '<div class="hm-meter"><i class="hm-countbar"></i></div>' : ''}
      </div>
    </div>`);
    document.body.appendChild(m);
    let left = o.countdown;
    let timer = null;
    const close = (fn) => {
      clearInterval(timer);
      document.removeEventListener('keydown', onKey);
      m.remove();
      if (fn) fn();
    };
    const onKey = (e) => {
      if (e.key === 'Escape') close(o.secondary.run);
    };
    document.addEventListener('keydown', onKey);
    m.addEventListener('click', (e) => {
      const b = e.target.closest('[data-m]');
      if (b) close({ 1: o.primary, 2: o.secondary, 3: o.tertiary }[b.dataset.m].run);
      else if (e.target === m) close(o.secondary.run);
    });
    if (left) {
      const tick = () => {
        $('.hm-count', m).textContent = `(${left})`;
        $('.hm-countbar', m).style.width = `${(left / o.countdown) * 100}%`;
        if (left-- <= 0) close(o.primary.run);
      };
      tick();
      timer = setInterval(tick, 1000);
    }
    $('[data-m="1"]', m).focus();
  }

  function renderComplete(el, u) {
    if (!el) return;
    const i = UNITS.indexOf(u);
    const passed = U(u.id).quiz >= PASS;
    const next = UNITS[i + 1];
    el.innerHTML = `<div class="card hm-done">
      <div><p class="eyebrow">${passed ? 'Unit complete' : 'Practice complete'}</p>
      <p>${passed ? (next ? `Next up: <strong>${next.title}</strong>.` : 'You finished the whole course. Take it to the Improvise lab and the Analyzer.') : 'Pass the check to complete the unit and unlock the next one.'}</p></div>
      <div class="btn-row">${!passed ? '<button class="btn primary" data-stage="check">Take the check</button>' : next ? `<button class="btn primary" data-open="${i + 1}">Unit ${i + 2} →</button>` : '<button class="btn primary" data-go="improvise">Improvise lab →</button>'}</div>
    </div>`;
  }

  function onClick(e) {
    const t = e.target;
    const open = t.closest('[data-open]');
    if (open) {
      const i = +open.dataset.open;
      if (isUnlocked(i)) openUnit(i);
      else GT.ui.toast(`Pass the check of unit ${i} to unlock this one (or tick “Unlock all units”).`, 3200);
      return;
    }
    if (t.closest('[data-home]')) return renderHome();
    const sb = t.closest('[data-stage]');
    if (sb && unitIdx !== null) {
      stage = sb.dataset.stage;
      renderStage();
      if (!sb.closest('.hm-steps')) window.scrollTo(0, 0);
      return;
    }
    if (t.closest('[data-learned]')) {
      U(UNITS[unitIdx].id).learn = true;
      save();
      stage = 'check';
      refreshSteps();
      renderStage();
      window.scrollTo(0, 0);
      return;
    }
    const unlock = t.closest('[data-unlock]');
    if (unlock) {
      prog.unlockAll = unlock.checked;
      save();
      renderHome();
    }
  }

  GT.views.harmony = view;
  // exposed for automated checks of the generated content
  GT.harmonyInternals = { GENS, BUILD, DEMOS, chordIn, roman, celebrate: (id) => celebrate(UNITS.find((u) => u.id === id)) };
})();
