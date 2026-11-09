/* arpeggio.js — arpeggio workouts: vertical (CAGED) and horizontal shapes, single chords or progressions,
 * follow-along cursor, note lane, microphone scoring, speed trainer and rewards */
(function () {
  'use strict';
  const GT = window.GT;
  const T = GT.theory;
  const A = GT.audio;
  const S = GT.shapes;
  const { $, $$, ui, store, esc } = GT;

  const TYPES = [
    { v: 'maj', label: 'Major', hint: '1 3 5' },
    { v: 'm', label: 'Minor', hint: '1 ♭3 5' },
    { v: 'maj7', label: 'Major 7', hint: '1 3 5 7: natural (♯) 7th' },
    { v: '7', label: 'Dominant 7', hint: '1 3 5 ♭7' },
    { v: 'm7', label: 'Minor 7', hint: '1 ♭3 5 ♭7' },
    { v: 'm7b5', label: 'm7♭5', hint: '1 ♭3 ♭5 ♭7' },
  ];
  const SHAPES = [
    { v: 'box', label: 'Vertical · 5 positions' },
    { v: 'string', label: 'Horizontal · one string' },
    { v: 'diag', label: 'Horizontal · across the neck' },
    { v: 'sweep', label: 'Étude · 5-string sweep' },
  ];
  const PROGS = [
    {
      id: 'etude',
      name: 'Minor ↔ major étude: i–iv–V7–i | I–IV–V7–I',
      connect: 'sweep',
      npb: 3,
      ch: [['1', 'm', 1], ['4', 'm', 1], ['5', '7', 1], ['1', 'm', 1], ['1', 'maj', 1], ['4', 'maj', 1], ['5', '7', 1], ['1', 'maj', 1]],
    },
    { id: 'iiVI', name: 'ii–V–I (major)', ch: [['2', 'm7', 1], ['5', '7', 1], ['1', 'maj7', 2]] },
    { id: 'turn', name: 'I–vi–ii–V turnaround', ch: [['1', 'maj7', 1], ['6', 'm7', 1], ['2', 'm7', 1], ['5', '7', 1]] },
    { id: 'pop', name: 'I–V–vi–IV (triads)', ch: [['1', 'maj', 1], ['5', 'maj', 1], ['6', 'm', 1], ['4', 'maj', 1]] },
    { id: 'blues', name: '12-bar blues (dominant 7ths)', ch: [['1', '7', 4], ['4', '7', 2], ['1', '7', 2], ['5', '7', 1], ['4', '7', 1], ['1', '7', 1], ['5', '7', 1]] },
    { id: 'minIIVi', name: 'Minor ii–V–i', minor: true, ch: [['2', 'm7b5', 1], ['5', '7', 1], ['1', 'm7', 2]] },
    { id: 'andalusian', name: 'Andalusian i–♭VII–♭VI–V', minor: true, ch: [['1', 'm', 1], ['b7', 'maj', 1], ['b6', 'maj', 1], ['5', '7', 1]] },
    { id: 'cycle', name: 'Cycle of 4ths (Autumn-style)', minor: true, ch: [['4', 'm7', 1], ['b7', '7', 1], ['b3', 'maj7', 1], ['b6', 'maj7', 1], ['2', 'm7b5', 1], ['5', '7', 1], ['1', 'm7', 2]] },
  ];
  const WINDOWS = ['0-4', '3-7', '5-9', '7-11', '10-14'];
  const PLAY_MODES = [
    { v: 'listen', label: '👂 Listen' },
    { v: 'along', label: '🎸 Play along' },
    { v: 'wait', label: '⏸ Wait for me' },
    { v: 'time', label: '🎤 In time' },
  ];
  const REPS_SINGLE = 4;
  const REPS_PROG = 2;

  const st = Object.assign(
    { mode: 'single', key: 0, type: 'maj7', shape: 'box', pos: 0, string: 1, start: 0, pattern: 'updown', npb: 2, bpm: 72, drums: true, trainer: false, play: 'listen', labels: 'degrees', prog: 'iiVI', win: '5-9', connect: 'area' },
    store.get('arp', {})
  );
  const save = () => store.set('arp', st);
  const record = Object.assign({ types: [], positions: {}, best: {} }, store.get('arpRecord', {}));
  const saveRecord = () => store.set('arpRecord', record);

  let root, fb;
  let seq = []; // [{s, f, m, deg, chord, first}]
  let chords = []; // [{name, rootPc, rootName, degs, names, pcs, shape, bars}]
  let cur = 0;
  let clock = null;
  let waiting = false;
  let score = null;
  let micOff = null;
  let expect = []; // timed-mode expectations
  let pendingXp = 0;

  /* ================================================================== */
  /* Building the workout                                                */
  /* ================================================================== */
  const P = (n) => T.pretty(n);
  const maxFret = () => +GT.settings.frets;
  const progDef = () => PROGS.find((p) => p.id === st.prog) || PROGS[0];

  function chordInfo(rootPc, q, rootName) {
    const degs = T.CHORDS[q].deg;
    const sp = rootName ? { root: rootName, notes: T.spellFrom(rootName, degs) } : T.spell(rootPc, degs);
    return { q, rootPc, rootName: sp.root, degs, names: sp.notes, name: T.chordName(sp.root, q), pcs: degs.map((d) => T.mod12(rootPc + T.DEG_SEMI[d])) };
  }

  /** Sweep shape (6th- or 5th-string root) closest to where the hand already is */
  function sweepNear(tuning, c, mf, center, prevMidi) {
    let best = null;
    [0, 1].forEach((rs) => {
      T.neckNotes(tuning, c.rootPc, ['1'], mf)
        .filter((n) => n.s === rs && n.f > 0)
        .forEach((r) => {
          const shape = S.sweep(tuning, c.rootPc, c.degs, rs, mf, r.f);
          if (!shape.length) return;
          const mid = shape.reduce((a, n) => a + n.f, 0) / shape.length;
          const score = Math.abs(mid - center) + (prevMidi == null ? 0 : 0.15 * Math.abs(shape[0].m - prevMidi));
          if (!best || score < best.score) best = { shape, score };
        });
    });
    return best ? best.shape : [];
  }

  function shapeLabel(c) {
    const tuning = GT.tuning();
    if (st.shape === 'box') {
      const w = S.cagedWindows(tuning, c.rootPc, maxFret())[st.pos];
      return `${w.id} shape · frets ${w.lo}–${w.hi} · root on the ${['6th', '5th', '4th'][w.rootString]} string`;
    }
    if (st.shape === 'string') return `${stringName(st.string)} string · the whole neck, one string`;
    if (st.shape === 'sweep') {
      const rs = c.shape && c.shape.rootString !== undefined ? c.shape.rootString : st.start;
      const fr = c.shape && c.shape.length ? `frets ${Math.min(...c.shape.map((n) => n.f))}–${Math.max(...c.shape.map((n) => n.f))}` : '';
      return `Étude sweep shape · ${rs ? '5th' : '6th'}-string root · ${fr}`;
    }
    const from = c.shape && c.shape.startString !== undefined ? c.shape.startString : st.start;
    return `Diagonal · two notes per string, from the ${from ? '5th' : '6th'}-string root${from !== st.start ? ' (the other root is too high to climb from)' : ''}`;
  }
  const stringName = (s) => ['6th (low E)', '5th (A)', '4th (D)', '3rd (G)', '2nd (B)', '1st (high e)'][s] || `String ${s + 1}`;

  function build() {
    const tuning = GT.tuning();
    const mf = maxFret();
    seq = [];
    chords = [];
    if (st.mode === 'single') {
      const c = chordInfo(st.key, st.type);
      let shape;
      if (st.shape === 'box') {
        const w = S.cagedWindows(tuning, st.key, mf)[st.pos];
        shape = S.box(tuning, st.key, c.degs, w.lo, w.hi, mf);
      } else if (st.shape === 'string') shape = S.oneString(tuning, st.key, c.degs, st.string, mf);
      else if (st.shape === 'sweep') shape = S.sweep(tuning, st.key, c.degs, st.start, mf, 6);
      else shape = S.diagonal(tuning, st.key, c.degs, st.start, mf);
      c.shape = shape;
      chords = [c];
      let order = shape;
      if (st.pattern === 'down') order = shape.slice().reverse();
      else if (st.pattern === 'updown') order = shape.concat(shape.slice(1, -1).reverse());
      seq = order.map((n, i) => ({ ...n, chord: 0, first: i === 0 }));
      // fill whole bars so the backing chord lines up with the pattern
      const bar = 4 * st.npb;
      while (seq.length % bar) seq.push({ rest: true, chord: 0 });
    } else {
      const p = progDef();
      const keyName = T.spell(st.key, (p.minor ? T.SCALE_BY_ID.aeolian : T.SCALE_BY_ID.ionian).deg).root;
      const [lo, hi] = st.win.split('-').map(Number);
      let prev = null;
      let dir = 1;
      let center = (lo + hi) / 2; // where the hand is: sweep shapes stay close to the previous chord
      p.ch.forEach(([d, q, bars], ci) => {
        const rootName = T.spellFrom(keyName, [d])[0];
        const c = chordInfo(T.mod12(st.key + T.DEG_SEMI[d]), q, rootName);
        c.bars = bars;
        chords.push(c);
        const count = bars * 4 * st.npb;
        if (st.connect === 'sweep') {
          c.shape = sweepNear(tuning, c, mf, center, prev);
          // up the shape and back down, like the étude bars, repeated to fill the chord's bars
          const cycle = c.shape.concat(c.shape.slice(1, -1).reverse());
          for (let k = 0; k < count && cycle.length; k++) seq.push({ ...cycle[k % cycle.length], chord: ci, first: k === 0 });
          if (c.shape.length) center = c.shape.reduce((a, n) => a + n.f, 0) / c.shape.length;
          if (seq.length) prev = seq[seq.length - 1].m;
          return;
        }
        c.shape = S.box(tuning, c.rootPc, c.degs, lo, hi, mf);
        const r = S.connect(c.shape, prev, dir, count);
        dir = r.dir;
        r.notes.forEach((n, k) => seq.push({ ...n, chord: ci, first: k === 0 }));
        if (r.notes.length) prev = r.notes[r.notes.length - 1].m;
      });
    }
    cur = seq.findIndex((n) => !n.rest);
    if (cur < 0) cur = 0;
  }

  /* ================================================================== */
  /* Rendering                                                           */
  /* ================================================================== */
  const view = {
    init(el) {
      root = el;
      el.innerHTML = `
        <div class="view-head">
          <div><p class="eyebrow">Arpeggio workouts</p><h1>See it, hear it, play it</h1>
          <p class="sub">Arpeggios are chords played one note at a time: the bridge between knowing a chord and soloing over it. Follow the cursor, then let the app listen to you.</p></div>
          <div class="head-actions">
            <button class="btn primary big" id="arPlay"><span class="ico">▶</span> Start</button>
          </div>
        </div>

        <div class="card controls">
          <div class="ctl-row">
            <div class="ctl"><label>Workout</label><div id="arMode"></div></div>
            <div class="ctl" data-single><label>Chord type</label><div id="arType"></div></div>
            <div class="ctl" data-prog><label for="arProg">Progression</label><select id="arProg">${PROGS.map((p) => `<option value="${p.id}">${p.name}</option>`).join('')}</select></div>
          </div>
          <div class="ctl wide"><label>Key</label><div id="arKeys"></div></div>
          <div class="ctl-row">
            <div class="ctl" data-single><label>Shape</label><div id="arShape"></div></div>
            <div class="ctl" data-single data-shape="box"><label>Position (CAGED)</label><div id="arPos"></div></div>
            <div class="ctl" data-single data-shape="string"><label>String</label><div id="arString"></div></div>
            <div class="ctl" data-single data-shape="diag sweep"><label>Start from</label><div id="arStart"></div></div>
            <div class="ctl" data-prog><label>Connect chords</label><div id="arConnect"></div></div>
            <div class="ctl" data-prog data-connect="area"><label>Stay in frets</label><div id="arWin"></div></div>
          </div>
          <div class="ctl-row">
            <div class="ctl" data-single><label>Pattern</label><div id="arPattern"></div></div>
            <div class="ctl"><label>Rhythm</label><div id="arNpb"></div></div>
            <div class="ctl"><label for="arBpm">Tempo <output id="arBpmOut"></output></label><input type="range" id="arBpm" min="40" max="220" step="2"></div>
            <label class="toggle"><input type="checkbox" id="arDrums"><span></span> Drums</label>
            <label class="toggle" title="Adds 4 bpm after every clean repetition"><input type="checkbox" id="arTrainer"><span></span> Speed trainer</label>
          </div>
          <div class="ctl-row">
            <div class="ctl"><label>How to play</label><div id="arPlayMode"></div></div>
            <div class="ctl"><label>Labels</label><div id="arLabels"></div></div>
          </div>
        </div>

        <div class="ar-grid">
          <div class="card ar-now">
            <div class="ar-now-top">
              <div><span class="muted small" id="arNowLabel">Arpeggio</span><div class="now-chord" id="arChord"></div><div class="muted small" id="arShapeInfo"></div></div>
              <div class="ar-next" id="arNext"></div>
            </div>
            <div class="now-tones" id="arTones"></div>
            <p class="ar-tip" id="arTip"></p>
          </div>
          <div class="card ar-score">
            <div class="stats" id="arStats"></div>
            <div class="ar-mic">
              <button class="btn sm" id="arMic">🎤 Listen to my guitar</button>
              <span class="ar-meter"><i id="arLevel"></i></span><span class="ar-heard" id="arHeard">—</span>
            </div>
            <p class="hint" id="arMicHint">Use headphones so the app hears your guitar, not the backing track.</p>
          </div>
        </div>

        <div class="card ar-lane-card">
          <div class="ar-lane" id="arLane" aria-live="off"></div>
        </div>

        <div class="card fb-card">
          <div class="fb-scroll"><div id="arFb"></div></div>
          <div class="fb-foot"><div class="legend">
            <span><i class="dot role-root"></i>Root</span><span><i class="dot role-third"></i>3rd</span><span><i class="dot role-fifth"></i>5th</span><span><i class="dot role-seventh"></i>7th</span>
            <span><i class="dot ar-dot-now"></i>Play now</span><span><i class="dot ar-dot-next"></i>Next</span><span data-prog><i class="dot ar-dot-common"></i>Also in next chord</span>
          </div></div>
        </div>

        <div class="card coach">
          <h3>How to get the most out of it</h3>
          <div class="cols-3">
            <div><h4>1 · Vertical</h4><p>Learn each chord in all <strong>5 CAGED positions</strong>. Each one is a box under your hand. Say the interval names out loud as you play.</p></div>
            <div><h4>2 · Horizontal</h4><p>Connect the boxes. <strong>One string</strong> teaches you where every chord tone lives; <strong>across the neck</strong> glues the positions together.</p></div>
            <div><h4>3 · Through changes</h4><p>Pick a progression and stay in one area. Each chord starts on the <strong>nearest</strong> note of the new arpeggio: that is voice leading, and it is how great solos sound.</p></div>
          </div>
        </div>`;

      const seg = (id, opts, val, fn) => ui.seg($(id, el), opts, val, fn);
      seg('#arMode', [{ v: 'single', label: 'Single chord' }, { v: 'prog', label: 'Chord progression' }], st.mode, (v) => set({ mode: v }));
      seg('#arType', TYPES.map((t) => ({ v: t.v, label: t.label })), st.type, (v) => set({ type: v }));
      $$('#arType button', el).forEach((b) => (b.title = TYPES.find((t) => t.v === b.dataset.v).hint));
      $('#arProg', el).value = st.prog;
      $('#arProg', el).addEventListener('change', (e) => {
        // presets can bring their own way of connecting chords and rhythm (the étude: sweeps in triplets)
        const p = PROGS.find((x) => x.id === e.target.value) || {};
        const patch = { prog: e.target.value };
        if (p.connect) patch.connect = p.connect;
        if (p.npb) patch.npb = p.npb;
        set(patch);
        if (p.connect) view.connectApi.set(p.connect);
        if (p.npb) view.npbApi.set(p.npb);
      });
      this.keyApi = ui.keyChips($('#arKeys', el), st.key, (v) => set({ key: v }));
      seg('#arShape', SHAPES, st.shape, (v) => set({ shape: v }));
      this.posApi = seg('#arPos', [0, 1, 2, 3, 4].map((i) => ({ v: i, label: String(i + 1) })), st.pos, (v) => set({ pos: v }));
      seg('#arString', [0, 1, 2, 3, 4, 5].map((i) => ({ v: i, label: ['E', 'A', 'D', 'G', 'B', 'e'][i] })), st.string, (v) => set({ string: v }));
      seg('#arStart', [{ v: 0, label: '6th-string root' }, { v: 1, label: '5th-string root' }], st.start, (v) => set({ start: v }));
      seg('#arWin', WINDOWS.map((w) => ({ v: w, label: w.replace('-', '–') })), st.win, (v) => set({ win: v }));
      this.connectApi = seg('#arConnect', [{ v: 'area', label: 'Stay in a fret area' }, { v: 'sweep', label: 'Étude: sweep shapes' }], st.connect, (v) => set({ connect: v }));
      seg('#arPattern', [{ v: 'up', label: 'Up' }, { v: 'down', label: 'Down' }, { v: 'updown', label: 'Up & down' }], st.pattern, (v) => set({ pattern: v }));
      this.npbApi = seg('#arNpb', [{ v: 2, label: '8ths' }, { v: 3, label: 'Triplets' }, { v: 4, label: '16ths' }], st.npb, (v) => set({ npb: v }));
      seg('#arPlayMode', PLAY_MODES, st.play, (v) => set({ play: v }));
      seg('#arLabels', [{ v: 'degrees', label: 'Intervals' }, { v: 'notes', label: 'Notes' }, { v: 'fingers', label: 'Fingers' }], st.labels, (v) => {
        st.labels = v;
        save();
        drawAll();
      });
      const bpm = $('#arBpm', el);
      bpm.value = st.bpm;
      bpm.addEventListener('input', () => {
        st.bpm = +bpm.value;
        $('#arBpmOut', el).textContent = st.bpm + ' bpm';
        if (clock) clock.bpm = st.bpm;
        save();
      });
      $('#arDrums', el).checked = st.drums;
      $('#arDrums', el).addEventListener('change', (e) => ((st.drums = e.target.checked), save()));
      $('#arTrainer', el).checked = st.trainer;
      $('#arTrainer', el).addEventListener('change', (e) => ((st.trainer = e.target.checked), save()));
      $('#arPlay', el).addEventListener('click', transport);
      $('#arMic', el).addEventListener('click', toggleMic);
      $('#arLane', el).addEventListener('click', (e) => {
        const c = e.target.closest('[data-i]');
        if (c && !isRunning()) {
          cur = +c.dataset.i;
          const n = seq[cur];
          if (n && !n.rest) A.pluck(n.m, undefined, { vel: 0.9, dur: 0.8 });
          drawAll();
        }
      });
      fb = new GT.Fretboard($('#arFb', el), Object.assign(GT.fbOpts(), { onClick: onFretClick }));
      if (!GT.pitch || !GT.pitch.supported()) {
        $('#arMic', el).disabled = true;
        $('#arMicHint', el).textContent = 'Microphone input is not available in this browser. Use “Wait for me” and click the notes instead.';
      }
      refresh();
    },
    show() {
      fb.set(GT.fbOpts());
      refresh();
    },
    hide() {
      stop();
    },
    transport: () => transport(),
  };

  /** Change settings; anything that changes the notes stops and rebuilds the workout */
  function set(patch) {
    const wasRunning = isRunning();
    stop();
    Object.assign(st, patch);
    if (patch.key !== undefined || patch.type !== undefined || patch.shape !== undefined) st.pos = Math.min(st.pos, 4);
    save();
    refresh();
    if (wasRunning && patch.play === undefined) start();
  }

  function refresh() {
    const el = root;
    const single = st.mode === 'single';
    $$('[data-single]', el).forEach((n) => (n.hidden = !single || (n.dataset.shape && !n.dataset.shape.split(' ').includes(st.shape))));
    $$('[data-prog]', el).forEach((n) => (n.hidden = single || (n.dataset.connect && n.dataset.connect !== st.connect)));
    $('#arBpmOut', el).textContent = st.bpm + ' bpm';
    $('#arBpm', el).value = st.bpm;
    build();
    // CAGED letters on the position buttons
    if (single) {
      const wins = S.cagedWindows(GT.tuning(), st.key, maxFret());
      $$('#arPos button', el).forEach((b, i) => (b.textContent = `${i + 1} · ${wins[i].id}`));
    }
    resetScore();
    fb.paths([]);
    drawAll();
    syncButton();
  }

  function drawAll() {
    const n = seq[cur] || {};
    const c = chords[n.chord || 0];
    if (!c) return;
    const el = root;
    $('#arChord', el).textContent = c.name;
    $('#arShapeInfo', el).textContent =
      st.mode === 'single'
        ? shapeLabel(c)
        : `${progDef().name} · ${st.connect === 'sweep' ? `sweep shape, ${c.shape.rootString ? '5th' : '6th'}-string root` : `frets ${st.win.replace('-', '–')}`} · chord ${n.chord + 1} of ${chords.length}`;
    $('#arTones', el).innerHTML = c.degs
      .map((d, k) => `<span class="tone role-${T.roleOf(d)}"><b>${P(c.names[k])}</b><small>${T.prettyDeg(d)}</small></span>`)
      .join('');
    // next chord + common tones
    let next = '';
    if (st.mode === 'prog') {
      const nc = chords[((n.chord || 0) + 1) % chords.length];
      const common = S.commonTones(c.pcs, nc.pcs).map((pc) => P(c.names[c.pcs.indexOf(pc)]));
      next = `<span class="muted small">Next</span><strong>${nc.name}</strong><span class="muted small">${common.length ? `Common tones: <strong>${common.join(', ')}</strong>` : 'No common tones: move by step'}</span>`;
    }
    $('#arNext', el).innerHTML = next;
    $('#arTip', el).innerHTML = tip(c);
    drawFretboard();
    drawLane();
  }

  function tip(c) {
    if (st.mode === 'prog' && st.connect === 'sweep')
      return 'Like a classical arpeggio étude: each chord is a 7-note sweep shape, up and back down. The hand stays in the same area of the neck by switching between <strong>6th-string-root</strong> and <strong>5th-string-root</strong> shapes. Notice how the minor and major versions keep the same layout.';
    if (st.mode === 'prog') return 'The line never jumps: each new chord starts on its chord tone <strong>closest</strong> to the last note. Notes ringed in white are shared with the next chord: hold them across the change.';
    if (st.shape === 'sweep')
      return 'Seven notes over five strings: two notes on a string only when they are a 3rd apart, otherwise the next string. Minor and major triads share the same layout, so you learn one shape for both. Pick it in one smooth motion per string (sweep) or alternate, and slide to the top note.';
    if (st.shape === 'box') {
      const id = S.cagedWindows(GT.tuning(), st.key, maxFret())[st.pos].id;
      return `Position ${st.pos + 1} of 5: the ${id} shape, built around the ${id} chord form you already know. Keep one finger per fret and the hand still; the small circled numbers are the fingers (switch Labels to <strong>Fingers</strong> to see them on the neck).`;
    }
    if (st.shape === 'string') return `One string forces you to see the <strong>distance</strong> between chord tones: ${c.degs.map(T.prettyDeg).join(' → ')} → 1. Say each interval name as you slide.`;
    const kind = c.shape && c.shape.kind;
    const pattern =
      kind === 'classic'
        ? 'The classic pattern: <strong>two notes per string</strong>, the index starting each string'
        : kind === 'short'
          ? 'This root sits high on the neck, so the shape stops before the top octave'
          : 'Mostly two notes per string, with one where a second note would need a stretch';
    return `${pattern}. The hand <strong>shifts by sliding along a string</strong> (watch the finger numbers), never while crossing strings, so the line stays smooth across positions.`;
  }

  /** Finger that plays a note: 1–4 (stretches use the index or pinky), 0 = open string */
  const fingerOf = (n) => (n.finger === undefined ? null : n.finger === 'o' ? 0 : Math.min(4, Math.max(1, n.finger)));

  function labelFor(n, c) {
    if (st.labels === 'fingers' && fingerOf(n) !== null) return String(fingerOf(n));
    if (st.labels === 'notes') return P(c.names[c.degs.indexOf(n.deg)] || T.FLATS[n.m % 12]);
    return T.prettyDeg(n.deg);
  }

  function nextIndex(i) {
    for (let k = 1; k <= seq.length; k++) {
      const j = (i + k) % seq.length;
      if (!seq[j].rest) return j;
    }
    return i;
  }

  function drawFretboard() {
    const n = seq[cur];
    if (!n) return;
    const ci = n.chord || 0;
    const c = chords[ci];
    const ni = nextIndex(cur);
    const nn = seq[ni];
    const nextChord = st.mode === 'prog' ? chords[(ci + 1) % chords.length] : null;
    const notes = c.shape.map((x) => {
      let cls = 'role-' + T.roleOf(x.deg);
      if (nextChord && nextChord.pcs.includes(x.m % 12)) cls += ' common';
      if (!n.rest && x.s === n.s && x.f === n.f) cls += ' target';
      else if (nn && !nn.rest && x.s === nn.s && x.f === nn.f) cls += ' nxt';
      return { s: x.s, f: x.f, label: labelFor(x, c), cls };
    });
    // next note from the next chord (progressions) may be outside the current shape
    if (nn && !nn.rest && nn.chord !== ci) {
      const nc = chords[nn.chord];
      notes.push({ s: nn.s, f: nn.f, label: labelFor(nn, nc), cls: 'nxt nxt-only' });
    }
    fb.draw(notes);
    fb.paths([{ pts: c.shape, cls: 'shape' }]);
  }

  function drawLane() {
    const el = $('#arLane', root);
    const cells = [];
    const start = Math.max(0, Math.min(cur - 3, seq.length - 16));
    for (let i = start; i < Math.min(seq.length, start + 16); i++) {
      const n = seq[i];
      const c = chords[n.chord || 0];
      const res = score && score.marks[i];
      const chordTag = st.mode === 'prog' && n.first ? `<em>${c.name}</em>` : '';
      if (n.rest) cells.push(`<span class="ar-cell rest ${i === cur ? 'cur' : ''}" data-i="${i}">${chordTag}<b>·</b><i>rest</i></span>`);
      else
        cells.push(
          `<span class="ar-cell role-${T.roleOf(n.deg)} ${i === cur ? 'cur' : ''} ${res || ''} ${n.first && st.mode === 'prog' ? 'first' : ''}" data-i="${i}">${chordTag}<b>${labelFor(n, c)}</b><i>${['E', 'A', 'D', 'G', 'B', 'e'][n.s] || n.s + 1}${n.f}${fingerOf(n) !== null && st.labels !== 'fingers' ? `<span class="ar-fg" title="Finger ${fingerOf(n) || 'open'}">${fingerOf(n)}</span>` : ''}</i></span>`
        );
    }
    el.innerHTML = cells.join('');
  }

  /* ================================================================== */
  /* Score & rewards                                                     */
  /* ================================================================== */
  function resetScore() {
    score = { hits: 0, misses: 0, wrong: 0, streak: 0, best: 0, reps: 0, marks: {}, rewarded: false, startBpm: st.bpm };
    pendingXp = 0;
    renderStats();
  }
  const accuracy = () => {
    const t = score.hits + score.misses + score.wrong;
    return t ? score.hits / t : null;
  };
  function renderStats() {
    const reps = st.mode === 'single' ? REPS_SINGLE : REPS_PROG;
    const acc = accuracy();
    const micMode = st.play === 'time' || st.play === 'wait';
    $('#arStats', root).innerHTML = `
      <div class="stat"><span class="v">${Math.min(score.reps, reps)}/${reps}</span><span class="k">${st.mode === 'single' ? 'Reps' : 'Loops'}</span></div>
      ${micMode ? `<div class="stat"><span class="v">${acc === null ? '—' : Math.round(acc * 100) + '%'}</span><span class="k">Accuracy</span></div>
      <div class="stat"><span class="v">${score.streak}<small> / ${score.best}</small></span><span class="k">Streak / best</span></div>` : ''}
      <div class="stat"><span class="v">${st.bpm}</span><span class="k">bpm</span></div>`;
  }
  function hit(i) {
    score.hits++;
    score.streak++;
    score.best = Math.max(score.best, score.streak);
    score.marks[i] = 'hit';
    pendingXp += 1 + (score.streak >= 8 ? 1 : 0);
    const n = seq[i];
    fb.flash(n.s, n.f, 'hit', 380);
    renderStats();
  }
  function miss(i) {
    score.misses++;
    score.streak = 0;
    score.marks[i] = 'miss';
    renderStats();
  }

  function repDone() {
    score.reps++;
    if (pendingXp) {
      GT.game.award(pendingXp, 'notes');
      pendingXp = 0;
    }
    const target = st.mode === 'single' ? REPS_SINGLE : REPS_PROG;
    if (st.trainer && st.play !== 'wait') {
      const acc = accuracy();
      if (st.play !== 'time' || acc === null || acc >= 0.8) {
        st.bpm = Math.min(220, st.bpm + 4);
        if (clock) clock.bpm = st.bpm;
        $('#arBpm', root).value = st.bpm;
        $('#arBpmOut', root).textContent = st.bpm + ' bpm';
        save();
        GT.ui.toast(`Speed trainer: ${st.bpm} bpm`);
        if (st.bpm >= 120) GT.game.unlock('arp-speed');
      }
    }
    if (score.reps >= target && !score.rewarded) {
      score.rewarded = true;
      workoutComplete();
    }
    score.marks = {};
    renderStats();
  }

  function workoutComplete() {
    const acc = accuracy();
    const mic = st.play === 'time' || st.play === 'wait';
    let xp = st.play === 'listen' ? 10 : 30;
    if (mic && acc !== null) xp += Math.round(acc * 30);
    GT.game.award(xp, 'workout');
    GT.game.unlock('arp-first');
    if (st.mode === 'prog') GT.game.unlock('arp-changes');
    if (mic && acc !== null && acc >= 0.9) GT.game.unlock('arp-clean');
    if (st.mode === 'single' && st.play !== 'listen') {
      if (!record.types.includes(st.type)) record.types.push(st.type);
      if (record.types.length >= 4) GT.game.unlock('arp-types');
      if (st.shape === 'box') {
        const k = `${st.type}@${st.key}`;
        record.positions[k] = [...new Set([...(record.positions[k] || []), st.pos])];
        if (record.positions[k].length >= 5) GT.game.unlock('arp-positions');
      }
    }
    const bk = `${st.mode === 'single' ? st.type + '-' + st.shape : st.prog}`;
    const isBest = st.bpm > (record.best[bk] || 0);
    if (isBest) record.best[bk] = st.bpm;
    saveRecord();
    const banner = GT.h(`<div class="ar-banner"><strong>Workout complete!</strong> ${acc !== null && mic ? `${Math.round(acc * 100)}% accuracy · ` : ''}${isBest ? `new best: ${st.bpm} bpm · ` : ''}+${xp} XP
      <span class="muted">${nextSuggestion()}</span></div>`);
    $('.ar-score', root).appendChild(banner);
    setTimeout(() => banner.remove(), 7000);
  }

  function nextSuggestion() {
    if (st.mode === 'prog') return 'Try another fret area or a faster tempo.';
    if (st.shape === 'box' && st.pos < 4) return `Next: position ${st.pos + 2}.`;
    if (st.shape === 'box') return 'Now connect them: try “across the neck”.';
    return 'Now try it over a chord progression.';
  }

  /* ================================================================== */
  /* Playback                                                            */
  /* ================================================================== */
  const isRunning = () => !!(clock && clock.running) || waiting;
  function syncButton() {
    const b = $('#arPlay', root);
    b.innerHTML = isRunning() ? '<span class="ico">■</span> Stop' : '<span class="ico">▶</span> Start';
    b.classList.toggle('active', isRunning());
    $('#arNowLabel', root).textContent = waiting ? 'Your turn: play the highlighted note' : isRunning() ? 'Now' : 'Arpeggio';
  }
  function transport() {
    if (isRunning()) stop();
    else start();
  }

  async function start() {
    stop();
    A.ensure();
    resetScore();
    cur = seq.findIndex((n) => !n.rest);
    if (cur < 0) {
      GT.ui.toast('This shape has no notes with the current tuning and fret range.', 3000);
      cur = 0;
      return;
    }
    if (st.play === 'time' && !(GT.pitch && GT.pitch.active)) {
      const ok = await toggleMic();
      if (!ok) return;
    }
    if (st.play === 'wait') return startWait();
    const npb = st.npb;
    const countIn = 4 * npb;
    const bar = 4 * npb;
    clock = new A.Clock();
    clock.onStop = () => {
      clock = null;
      syncButton();
    };
    clock.start(
      st.bpm,
      (step, t, sd) => {
        if (step < countIn) {
          if (step % npb === 0) A.rim(t, step === 0 ? 1 : 0.7);
          return;
        }
        const g = step - countIn;
        const i = g % seq.length;
        const n = seq[i];
        if (i === 0 && g > 0) A.at(t, repDone);
        // backing: chord on each bar (and lightly on beat 3), drums
        const inBar = g % bar;
        const c = chords[n.chord || 0];
        if (inBar === 0 || n.first) {
          A.strum(GT.ui.voicing(c.rootPc, c.q), t, { vel: 0.42, dur: sd * bar * 0.9, comp: true });
          A.bass(36 + T.mod12(c.rootPc - 36), t, sd * bar * 0.45, 0.5);
        } else if (inBar === 2 * npb) A.bass(36 + T.mod12(c.rootPc - 36), t, sd * bar * 0.45, 0.4);
        if (st.drums && inBar % npb === 0) {
          const beat = inBar / npb;
          A.hat(t, 0.5);
          if (beat === 0 || beat === 2) A.kick(t, 0.7);
          if (beat === 1 || beat === 3) A.snare(t, 0.4);
        }
        if (!n.rest) {
          if (st.play === 'listen') A.pluck(n.m, t, { vel: 0.9, dur: sd * 0.95 });
          if (st.play === 'time') {
            const ex = { i, m: n.m, t, end: t + sd, hit: false };
            expect.push(ex);
            A.at(t + sd + 0.12, () => {
              if (!ex.hit && score) miss(ex.i);
              expect = expect.filter((x) => x !== ex);
            });
          }
        }
        A.at(t, () => {
          cur = i;
          drawAll();
        });
      },
      { stepsPerBeat: npb }
    );
    syncButton();
  }

  function startWait() {
    waiting = true;
    const c = chords[seq[cur].chord || 0];
    A.strum(GT.ui.voicing(c.rootPc, c.q), undefined, { vel: 0.5, dur: 2.5 });
    syncButton();
    drawAll();
  }

  /** Wait mode: the right note was played (or clicked) → advance */
  function waitAdvance() {
    hit(cur);
    const prevChord = seq[cur].chord;
    let j = nextIndex(cur);
    if (j <= cur) repDone();
    cur = j;
    const n = seq[cur];
    if (n.chord !== prevChord || j === seq.findIndex((x) => !x.rest)) {
      const c = chords[n.chord || 0];
      A.strum(GT.ui.voicing(c.rootPc, c.q), undefined, { vel: 0.45, dur: 2.5 });
    }
    drawAll();
  }

  function stop() {
    if (clock) clock.stop();
    clock = null;
    expect = [];
    if (waiting) {
      waiting = false;
      A.hush();
    }
    if (pendingXp) {
      GT.game.award(pendingXp, 'notes');
      pendingXp = 0;
    }
    if (root) syncButton();
  }

  /* ================================================================== */
  /* Input: microphone and fretboard clicks                              */
  /* ================================================================== */
  const samePitch = (a, b) => a === b || Math.abs(a - b) === 12; // tolerate octave slips of the detector

  async function toggleMic() {
    const btn = $('#arMic', root);
    if (GT.pitch.active) {
      GT.pitch.stop();
      if (micOff) micOff();
      micOff = null;
      btn.classList.remove('on');
      btn.textContent = '🎤 Listen to my guitar';
      return false;
    }
    try {
      await GT.pitch.start();
    } catch (e) {
      GT.ui.toast('Microphone permission was denied.', 3000);
      return false;
    }
    btn.classList.add('on');
    btn.textContent = '🎤 Listening… (click to stop)';
    micOff = GT.pitch.on(onPitch);
    return true;
  }

  function onPitch(ev) {
    if (!root || !document.body.contains(root) || !root.classList.contains('active')) return;
    if (ev.type === 'level') {
      $('#arLevel', root).style.width = Math.min(100, ev.rms * 900) + '%';
      return;
    }
    $('#arHeard', root).textContent = P(T.FLATS[ev.midi % 12]) + (Math.floor(ev.midi / 12) - 1);
    const n = seq[cur];
    if (waiting) {
      if (n && !n.rest && samePitch(ev.midi, n.m)) waitAdvance();
      else {
        score.wrong++;
        score.streak = 0;
        renderStats();
      }
      return;
    }
    if (st.play === 'time' && clock) {
      const ex = expect.find((x) => !x.hit && samePitch(ev.midi, x.m) && ev.time >= x.t - 0.15 && ev.time <= x.end + 0.08);
      if (ex) {
        ex.hit = true;
        hit(ex.i);
      } else {
        score.wrong++;
        score.streak = 0;
        renderStats();
      }
    }
  }

  function onFretClick(s, f) {
    const m = GT.tuning()[s] + f;
    A.pluck(m, undefined, { vel: 0.9, dur: 0.8 });
    if (!waiting) return;
    const n = seq[cur];
    if (n && !n.rest && m === n.m) waitAdvance();
    else {
      fb.flash(s, f, 'miss', 380);
      score.wrong++;
      score.streak = 0;
      renderStats();
    }
  }

  GT.views.arpeggios = view;
  // exposed for automated checks
  GT.arpInternals = { build: () => (build(), { seq, chords }), st, PROGS, TYPES };
})();
