/* improv.js — backing tracks, chord-scale guidance, guide tones, call & response */
(function () {
  'use strict';
  const GT = window.GT;
  const T = GT.theory;
  const A = GT.audio;
  const { $, $$, ui, rand, store } = GT;

  const c = (d, q, beats, sc, alt) => ({ d, q, beats, sc, alt });
  const PROGS = [
    {
      id: 'blues12', name: '12-Bar Blues', level: 'Foundation', style: 'shuffle', bpm: 92, overall: 'blues',
      desc: 'The backbone of rock & blues. Play the blues scale over everything — then switch to Mixolydian per chord and hear how much more you outline the changes (target the 3rd of each chord!).',
      chords: [c('1', '7', 4, 'mixolydian'), c('4', '7', 4, 'mixolydian'), c('1', '7', 8, 'mixolydian'), c('4', '7', 8, 'mixolydian'), c('1', '7', 8, 'mixolydian'), c('5', '7', 4, 'mixolydian'), c('4', '7', 4, 'mixolydian'), c('1', '7', 4, 'mixolydian'), c('5', '7', 4, 'mixolydian')],
    },
    {
      id: 'pop', name: 'Pop I–V–vi–IV', level: 'Foundation', style: 'rock', bpm: 100, overall: 'majorPent',
      desc: 'Four chords, one parent scale. Per chord the app shows the mode from the same parent: Ionian, Mixolydian, Aeolian, Lydian — the same notes, different gravity.',
      chords: [c('1', 'maj', 4, 'ionian'), c('5', 'maj', 4, 'mixolydian'), c('6', 'm', 4, 'aeolian'), c('4', 'maj', 4, 'lydian')],
    },
    {
      id: 'mixoRock', name: 'Mixolydian Rock I–♭VII–IV', level: 'Foundation', style: 'rock', bpm: 112, overall: 'mixolydian',
      desc: 'Classic rock (Sweet Child, Sympathy for the Devil). The ♭VII chord is the Mixolydian signature — land on the ♭7 of the key when it arrives.',
      chords: [c('1', 'maj', 4, 'mixolydian'), c('b7', 'maj', 4, 'lydian'), c('4', 'maj', 4, 'ionian'), c('1', 'maj', 4, 'mixolydian')],
    },
    {
      id: 'dorianVamp', name: 'Dorian Vamp i7–IV7', level: 'Intermediate', style: 'funk', bpm: 96, overall: 'dorian',
      desc: 'Santana / Oye Como Va territory. The IV7 chord contains the Dorian natural 6 as its 3rd — target it on the change and the mode speaks.',
      chords: [c('1', 'm7', 8, 'dorian'), c('4', '7', 8, 'mixolydian')],
    },
    {
      id: 'andalusian', name: 'Andalusian Cadence i–♭VII–♭VI–V', level: 'Intermediate', style: 'ballad', bpm: 84, overall: 'aeolian',
      desc: 'Flamenco, Hit the Road Jack, Stairway outro flavor. Aeolian works until the V chord — then switch to Phrygian dominant (raise the ♭7 of the key to the leading tone).',
      chords: [c('1', 'm', 4, 'aeolian'), c('b7', 'maj', 4, 'mixolydian'), c('b6', 'maj', 4, 'lydian'), c('5', '7', 4, 'phrygianDominant')],
    },
    {
      id: 'phrygianMetal', name: 'Phrygian Metal i–♭II', level: 'Intermediate', style: 'rock', bpm: 132, overall: 'phrygian',
      desc: 'The half-step ♭II chord is pure menace. Pedal the root, attack the ♭2 against it, and use the ♭II chord to resolve back down.',
      chords: [c('1', 'm', 8, 'phrygian'), c('b2', 'maj', 4, 'lydian'), c('1', 'm', 4, 'phrygian')],
    },
    {
      id: 'lydianVamp', name: 'Lydian Float Imaj7–II7', level: 'Intermediate', style: 'ballad', bpm: 76, overall: 'lydian',
      desc: 'Satriani / film score sound. The II chord contains the ♯4 of the key as its 3rd — make that note sing.',
      chords: [c('1', 'maj7', 8, 'lydian'), c('2', '7', 8, 'mixolydian')],
    },
    {
      id: 'minorBlues', name: 'Minor Blues', level: 'Intermediate', style: 'swing', bpm: 116, overall: 'minorPent',
      desc: 'Mr. P.C., The Thrill Is Gone (variant). Minor pentatonic covers it — but the ♭VI7 (Lydian dominant) and V7 (Phrygian dominant/Altered) are where you can really sound like a pro.',
      chords: [c('1', 'm7', 16, 'dorian'), c('4', 'm7', 8, 'dorian'), c('1', 'm7', 8, 'dorian'), c('b6', '7', 4, 'lydianDominant'), c('5', '7', 4, 'phrygianDominant', 'altered'), c('1', 'm7', 4, 'dorian'), c('5', '7', 4, 'phrygianDominant', 'altered')],
    },
    {
      id: 'iiVI', name: 'Jazz ii–V–I (major)', level: 'Advanced', style: 'swing', bpm: 132, overall: 'ionian',
      desc: 'The most important progression in jazz. Connect the guide tones: the ♭7 of ii falls a half step to the 3 of V; the ♭7 of V falls to the 3 of I. On V, try the Altered scale for tension.',
      chords: [c('2', 'm7', 4, 'dorian'), c('5', '7', 4, 'mixolydian', 'altered'), c('1', 'maj7', 8, 'ionian')],
    },
    {
      id: 'minorIIVi', name: 'Minor ii–V–i', level: 'Advanced', style: 'swing', bpm: 120, overall: 'harmonicMinor',
      desc: 'Half-diminished → altered dominant → minor tonic. Locrian ♮2 → Phrygian dominant/Altered → melodic minor. Resolve the ♭9 of V down to the 5 of i.',
      chords: [c('2', 'm7b5', 4, 'locrianNat2', 'locrian'), c('5', '7b9', 4, 'phrygianDominant', 'altered'), c('1', 'm6', 8, 'melodicMinor', 'dorian')],
    },
    {
      id: 'autumn', name: 'Minor Cycle (Autumn-style)', level: 'Advanced', style: 'swing', bpm: 138, overall: 'aeolian',
      desc: 'Cycle of fourths through a relative major ii–V–I and a minor ii–V–i. Hear how a single parent (natural minor) covers 6 of the chords — only the V7 needs the raised 7th.',
      chords: [c('4', 'm7', 4, 'dorian'), c('b7', '7', 4, 'mixolydian'), c('b3', 'maj7', 4, 'ionian'), c('b6', 'maj7', 4, 'lydian'), c('2', 'm7b5', 4, 'locrian', 'locrianNat2'), c('5', '7b9', 4, 'phrygianDominant', 'altered'), c('1', 'm7', 8, 'aeolian', 'dorian')],
    },
    {
      id: 'jazzBlues', name: 'Jazz Blues', level: 'Advanced', style: 'swing', bpm: 144, overall: 'blues',
      desc: 'Blues form with jazz harmony: a ii–V into IV, a ♯iv°7 passing chord, a VI7 secondary dominant and a turnaround. The ultimate test of outlining changes.',
      chords: [c('1', '7', 4, 'mixolydian', 'bebopDom'), c('4', '7', 4, 'mixolydian', 'lydianDominant'), c('1', '7', 4, 'mixolydian', 'bebopDom'), c('5', 'm7', 2, 'dorian'), c('1', '7', 2, 'mixolydian', 'altered'), c('4', '7', 4, 'mixolydian', 'lydianDominant'), c('#4', 'dim7', 4, 'dimWH'), c('1', '7', 4, 'mixolydian', 'bebopDom'), c('6', '7', 4, 'phrygianDominant', 'dimHW'), c('2', 'm7', 4, 'dorian'), c('5', '7', 4, 'mixolydian', 'altered'), c('1', '7', 2, 'mixolydian'), c('6', '7', 2, 'phrygianDominant', 'altered'), c('2', 'm7', 2, 'dorian'), c('5', '7', 2, 'mixolydian', 'altered')],
    },
    {
      id: 'soWhat', name: 'Modal Jazz (So What form)', level: 'Advanced', style: 'swing', bpm: 136, overall: 'dorian',
      desc: 'Long Dorian sections that shift up a half step. Practice developing ONE motif across the whole form, and try “side-slipping” — briefly playing a half step out before resolving.',
      chords: [c('1', 'm7', 16, 'dorian'), c('b2', 'm7', 8, 'dorian'), c('1', 'm7', 8, 'dorian')],
    },
    {
      id: 'funk9', name: 'Funk Dominant Vamp', level: 'Intermediate', style: 'funk', bpm: 100, overall: 'mixolydian',
      desc: 'One chord, all groove. Mix Mixolydian with minor pentatonic, play percussive 16th-note figures and leave rests — in funk the rhythm IS the melody.',
      chords: [c('1', '9', 16, 'mixolydian', 'minorPent')],
    },
  ];

  const STYLES = {
    rock: { name: 'Rock', swing: 0 },
    shuffle: { name: 'Blues shuffle', swing: 1 },
    swing: { name: 'Jazz swing', swing: 1 },
    funk: { name: 'Funk', swing: 0 },
    ballad: { name: 'Ballad', swing: 0 },
  };

  const CHALLENGES = [
    'Play only 3 notes for a full chorus. Make them interesting with rhythm, dynamics and articulation.',
    'Land on the 3rd of every chord exactly on beat 1 of the change.',
    'Play a 2-bar phrase, then leave 2 bars of silence. Repeat. Space is part of the music.',
    'Start every phrase on the “and” of beat 2 — get off the downbeat.',
    'Use only one string for a whole chorus. You will discover horizontal playing.',
    'Invent a short motif (3–5 notes) and develop it: repeat, transpose, invert, change its rhythm.',
    'Play only chord tones (1-3-5-7) — no passing notes — for a whole chorus.',
    'Connect guide tones: play only 3rds and 7ths, moving to the nearest one on each change.',
    'Approach every chord tone from a half step below (chromatic enclosure).',
    'Solo using only quarter notes. Then only triplets. Then mix both.',
    'Question & answer: phrase 1 ends going up (question), phrase 2 ends on the root (answer).',
    'Use bends for every target note — bend from a whole step below into the chord tone.',
    'Play the same lick over every chord and adjust only ONE note to fit each chord.',
    'Pick a dynamic arc: start whisper-quiet, build to a climax at the end of the form.',
    'Sing what you play (or play what you sing). Your voice will make your phrasing more lyrical.',
    'Avoid the root completely for a chorus. Resolve to 3rds, 5ths and 9ths instead.',
    'Play in a two-fret window only. Limit the hand, free the imagination.',
    'Quote a melody you know (a nursery rhyme or a famous riff) inside your solo.',
    'Use the characteristic note of the mode on every bar — make the color unmistakable.',
    'Rhythmic displacement: play the same 4-note figure starting one 8th note later each time.',
    'Play 4 bars “inside” then 1 bar a half-step out (side-slip) and resolve back in.',
    'Long notes only: every note at least 2 beats. Work on vibrato and tone.',
    'Arpeggio solo: outline each chord with its arpeggio, connecting by the nearest note.',
    'End every phrase with a different articulation: slide, bend, vibrato, staccato, hammer-on.',
  ];

  let root, fb, keyApi, styleApi;
  const st = Object.assign(
    { key: 9, prog: 'blues12', style: null, bpm: null, view: 'chord', area: 'all', labels: 'intervals', callResp: false },
    store.get('improv', {})
  );
  const save = () => store.set('improv', st);
  let clock = null;
  let timeline = [];
  let totalSteps = 0;
  let current = 0;
  let playing = false;
  const COUNT_IN = 16;

  const prog = () => PROGS.find((p) => p.id === st.prog) || PROGS[0];
  const keyRootName = () => T.spell(st.key, T.SCALE_BY_ID[prog().overall].deg).root;
  function chordInfo(ch) {
    const rootName = ch.rootName || T.spellFrom(keyRootName(), [ch.d])[0];
    const rootPc = T.mod12(st.key + T.DEG_SEMI[ch.d]);
    const degs = T.CHORDS[ch.q].deg;
    const names = T.spellFrom(rootName, degs);
    const roman = romanOf(ch);
    return { rootName, rootPc, degs, names, name: T.chordName(rootName, ch.q), roman, pcs: degs.map((d) => T.mod12(rootPc + T.DEG_SEMI[d])) };
  }
  function romanOf(ch) {
    if (ch.rn) return ch.rn;
    const n = T.degNum(ch.d);
    let r = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'][n - 1];
    const minor = ['m', 'm7', 'm6', 'm7b5', 'dim', 'dim7', 'm9', 'mMaj7'].includes(ch.q);
    if (minor) r = r.toLowerCase();
    const sym = { m7b5: 'ø7', dim7: '°7', dim: '°', m: '', maj: '', m7: '7', m6: '6', maj7: 'maj7', 7: '7', '7b9': '7♭9', 9: '9' }[ch.q] ?? T.CHORDS[ch.q].sym;
    return T.prettyDeg(ch.d.replace(/[0-9]/g, '')) + r + sym;
  }

  function buildTimeline() {
    timeline = [];
    let step = 0;
    prog().chords.forEach((ch, i) => {
      timeline.push({ i, start: step, steps: ch.beats * 4 });
      step += ch.beats * 4;
    });
    totalSteps = step;
  }
  const chordAtStep = (ls) => timeline.find((t) => ls >= t.start && ls < t.start + t.steps);

  /* ---------------- view ---------------- */
  const view = {
    init(el) {
      root = el;
      el.innerHTML = `
        <div class="view-head">
          <div><p class="eyebrow">Improvisation lab</p><h1>Play over the changes</h1>
          <p class="sub">Backing tracks with live chord-scale guidance. Watch the chord tones, connect guide tones, tell a story.</p></div>
          <div class="head-actions">
            <button class="btn primary big" id="imPlay" title="Play / pause (Space)"><span class="ico">▶</span> Play</button>
            <button class="btn big" id="imStop" hidden><span class="ico">■</span> Stop</button>
          </div>
        </div>

        <div class="card controls">
          <div class="ctl wide"><label>Key</label><div id="imKeys"></div></div>
          <div class="ctl-row">
            <div class="ctl"><label for="imProg">Progression</label><select id="imProg"></select></div>
            <div class="ctl"><label>Groove</label><div id="imStyle"></div></div>
            <div class="ctl"><label for="imBpm">Tempo <output id="imBpmOut"></output></label><input type="range" id="imBpm" min="50" max="220" step="2"></div>
          </div>
          <div class="ctl-row">
            <div class="ctl"><label>Show scale for</label><div id="imView"></div></div>
            <div class="ctl"><label>Neck area</label><div id="imArea"></div></div>
            <div class="ctl"><label>Labels</label><div id="imLabels"></div></div>
            <label class="toggle" title="The app plays a phrase, you answer it"><input type="checkbox" id="imCR"><span></span> Call &amp; response</label>
          </div>
        </div>

        <div class="card prog-card">
          <p class="prog-desc" id="imDesc"></p>
          <div class="prog-strip" id="imStrip"></div>
        </div>

        <div class="now-grid">
          <div class="card now-card">
            <div class="now-top">
              <div><span class="muted small" id="imNowLabel">Now</span><div class="now-chord" id="imChord"></div><div class="now-rn" id="imRn"></div></div>
              <div class="cr-badge" id="imCRBadge"></div>
            </div>
            <div class="now-scale" id="imScale"></div>
            <div class="now-tones" id="imTones"></div>
            <div class="now-guide" id="imGuide"></div>
          </div>
          <div class="card challenge-card">
            <h3>Improv challenge</h3>
            <p id="imChallenge"></p>
            <button class="btn sm" id="imNewCh">New challenge ↻</button>
          </div>
        </div>

        <div class="card fb-card">
          <div class="fb-scroll"><div id="imFb"></div></div>
          <div class="fb-foot"><div class="legend">
            <span><i class="dot role-root"></i>Chord root</span><span><i class="dot role-third"></i>3rd</span><span><i class="dot role-fifth"></i>5th</span>
            <span><i class="dot role-seventh"></i>7th</span><span><i class="dot role-other"></i>Scale tone / tension</span>
          </div></div>
        </div>

        <div class="card coach">
          <h3>How to use this lab</h3>
          <div class="cols-3">
            <div><h4>1 · Survive</h4><p>Use the overall scale (“Whole progression”). Focus on rhythm and phrasing; aim for short, singable phrases with space between them.</p></div>
            <div><h4>2 · Target</h4><p>Switch to “Each chord”. Land on the <span class="c3">3rd</span> or <span class="c7">7th</span> of the new chord right on the change. These notes define the harmony.</p></div>
            <div><h4>3 · Connect</h4><p>Follow the guide-tone line shown above, then embellish it. Add the “Advanced” scale suggestions for tension that resolves.</p></div>
          </div>
        </div>`;

      fb = new GT.Fretboard($('#imFb', el), Object.assign(GT.fbOpts(), { onClick: (s, f) => A.pluck(GT.tuning()[s] + f, undefined, { vel: 0.9 }) }));
      keyApi = ui.keyChips($('#imKeys', el), st.key, (v) => {
        st.key = v;
        save();
        refresh();
      });
      const sel = $('#imProg', el);
      buildSelect();
      sel.addEventListener('change', () => {
        st.prog = sel.value;
        st.style = null;
        st.bpm = null;
        save();
        const wasPlaying = !!(clock && clock.running);
        stop();
        refresh();
        if (wasPlaying) start();
      });
      styleApi = ui.seg($('#imStyle', el), Object.entries(STYLES).map(([v, s]) => ({ v, label: s.name })), st.style || prog().style, (v) => {
        st.style = v;
        save();
        if (clock) clock.swing = STYLES[v].swing;
      });
      const bpm = $('#imBpm', el);
      bpm.addEventListener('input', () => {
        st.bpm = +bpm.value;
        $('#imBpmOut', el).textContent = st.bpm + ' bpm';
        if (clock) clock.bpm = st.bpm;
        save();
      });
      ui.seg($('#imView', el), [{ v: 'chord', label: 'Each chord' }, { v: 'overall', label: 'Whole progression' }, { v: 'alt', label: 'Advanced' }], st.view, (v) => {
        st.view = v;
        save();
        showChord(current);
      });
      ui.seg($('#imArea', el), [{ v: 'all', label: 'All' }, { v: '0-5', label: '0–5' }, { v: '4-9', label: '4–9' }, { v: '7-12', label: '7–12' }, { v: '11-17', label: '11–17' }], st.area, (v) => {
        st.area = v;
        save();
        showChord(current);
      });
      ui.seg($('#imLabels', el), [{ v: 'intervals', label: 'Chord degrees' }, { v: 'notes', label: 'Notes' }, { v: 'none', label: 'None' }], st.labels, (v) => {
        st.labels = v;
        save();
        showChord(current);
      });
      $('#imCR', el).checked = st.callResp;
      $('#imCR', el).addEventListener('change', (e) => {
        st.callResp = e.target.checked;
        save();
        $('#imCRBadge', el).textContent = '';
      });
      $('#imPlay', el).addEventListener('click', transport);
      $('#imStop', el).addEventListener('click', stop);
      $('#imStrip', el).addEventListener('click', (e) => {
        const b = e.target.closest('[data-i]');
        if (!b) return;
        showChord(+b.dataset.i);
        if (!clock || !clock.running) {
          const ch = prog().chords[+b.dataset.i];
          const info = chordInfo(ch);
          A.strum(ui.voicing(info.rootPc, ch.q), undefined, { vel: 0.7 });
        }
      });
      $('#imNewCh', el).addEventListener('click', newChallenge);
      newChallenge();
    },
    show(params) {
      if (params.key !== undefined && params.key !== '') st.key = T.mod12(+params.key);
      if (params.prog && PROGS.some((p) => p.id === params.prog)) {
        st.prog = params.prog;
        st.style = null;
        st.bpm = null;
      }
      fb.set(GT.fbOpts());
      refresh();
    },
    hide() {
      stop();
    },
    transport: () => transport(),
  };

  function newChallenge() {
    $('#imChallenge', root).textContent = rand(CHALLENGES);
  }

  function buildSelect() {
    const levels = ['Your progression', 'Foundation', 'Intermediate', 'Advanced'];
    $('#imProg', root).innerHTML = levels
      .map((l) => {
        const opts = PROGS.filter((p) => p.level === l).map((p) => `<option value="${p.id}">${p.name}</option>`).join('');
        return opts ? `<optgroup label="${l}">${opts}</optgroup>` : '';
      })
      .join('');
  }

  /** Register a user progression (from the Analyzer) as a playable backing track */
  function setCustom(p) {
    const i = PROGS.findIndex((x) => x.id === 'custom');
    const prog = Object.assign({ id: 'custom', level: 'Your progression' }, p);
    if (i >= 0) PROGS[i] = prog;
    else PROGS.unshift(prog);
    store.set('customProg', prog);
    if (root) buildSelect();
  }
  GT.setCustomProg = setCustom;
  const savedCustom = store.get('customProg', null);
  if (savedCustom && savedCustom.chords && savedCustom.chords.every((c) => T.CHORDS[c.q] && T.SCALE_BY_ID[c.sc])) PROGS.unshift(savedCustom);

  function refresh() {
    const p = prog();
    keyApi.set(st.key);
    $('#imProg', root).value = p.id;
    styleApi.set(st.style || p.style);
    const bpm = st.bpm || p.bpm;
    $('#imBpm', root).value = bpm;
    $('#imBpmOut', root).textContent = bpm + ' bpm';
    const overall = T.SCALE_BY_ID[p.overall];
    $('#imDesc', root).innerHTML = `<span class="tag">${p.level}</span> ${p.desc} <span class="muted">Overall: <strong>${T.pretty(keyRootName())} ${overall.name}</strong>.</span>`;
    buildTimeline();
    const totalBeats = p.chords.reduce((a, ch) => a + ch.beats, 0);
    $('#imStrip', root).innerHTML = p.chords
      .map((ch, i) => {
        const info = chordInfo(ch);
        return `<button class="pchord" data-i="${i}" style="flex-grow:${ch.beats}" title="${ch.beats / 4} bar(s)">
          <span class="pc-name">${info.name}</span><span class="pc-rn">${info.roman}</span><i class="pc-bar"></i></button>`;
      })
      .join('');
    $('#imStrip', root).style.setProperty('--beats', totalBeats);
    showChord(0);
  }

  function scaleFor(ch) {
    const p = prog();
    if (st.view === 'overall') return { scale: T.SCALE_BY_ID[p.overall], rootPc: st.key };
    const id = st.view === 'alt' && ch.alt ? ch.alt : ch.sc;
    return { scale: T.SCALE_BY_ID[id], rootPc: T.mod12(st.key + T.DEG_SEMI[ch.d]) };
  }

  function showChord(i) {
    current = i;
    const p = prog();
    const ch = p.chords[i];
    if (!ch) return;
    const info = chordInfo(ch);
    $$('.pchord', root).forEach((b, k) => b.classList.toggle('on', k === i));
    $('#imChord', root).textContent = info.name;
    $('#imRn', root).textContent = info.roman;

    const { scale, rootPc } = scaleFor(ch);
    const nm = ui.nameMap(rootPc, scale.deg);
    const altTxt =
      ch.alt && st.view !== 'alt'
        ? `<span class="muted"> · Advanced: ${T.pretty(T.spell(T.mod12(st.key + T.DEG_SEMI[ch.d]), T.SCALE_BY_ID[ch.alt].deg).root)} ${T.SCALE_BY_ID[ch.alt].name}</span>`
        : '';
    $('#imScale', root).innerHTML = `Play <strong>${T.pretty(nm.root)} ${scale.name}</strong>${altTxt}`;
    $('#imTones', root).innerHTML = info.degs
      .map((d, k) => `<span class="tone role-${T.roleOf(d)}"><b>${T.pretty(info.names[k])}</b><small>${T.prettyDeg(d)}</small></span>`)
      .join('');

    // guide tones → next chord
    const next = p.chords[(i + 1) % p.chords.length];
    const nInfo = chordInfo(next);
    const guide = (inf) =>
      inf.degs
        .map((d, k) => ({ d, pc: inf.pcs[k], name: inf.names[k] }))
        .filter((x) => [3, 7].includes(T.degNum(x.d)) || x.d === '6');
    const g1 = guide(info);
    const g2 = guide(nInfo);
    let guideTxt = '';
    if (g1.length && g2.length && nInfo.name !== info.name) {
      const pairs = g1.map((a) => {
        let best = null;
        g2.forEach((b) => {
          const dist = Math.min(T.mod12(b.pc - a.pc), T.mod12(a.pc - b.pc));
          if (!best || dist < best.dist) best = { b, dist };
        });
        return { a, ...best };
      });
      guideTxt =
        `<span class="muted small">Guide tones → ${nInfo.name}</span> ` +
        pairs
          .map((x) => `<span class="gt">${T.pretty(x.a.name)}<small>${T.prettyDeg(x.a.d)}</small> → ${T.pretty(x.b.name)}<small>${T.prettyDeg(x.b.d)}</small>${x.dist === 0 ? ' <em>common</em>' : ''}</span>`)
          .join('');
    }
    $('#imGuide', root).innerHTML = guideTxt;

    // fretboard
    const chordRole = new Map(info.degs.map((d, k) => [info.pcs[k], d]));
    const [aLo, aHi] = st.area === 'all' ? [0, 99] : st.area.split('-').map(Number);
    const notes = T.neckNotes(GT.tuning(), rootPc, scale.deg, +GT.settings.frets).map((n) => {
      const pc = n.m % 12;
      const cd = chordRole.get(pc);
      const relDeg = cd || T.prettyDeg(degreeRelativeTo(info.rootPc, pc));
      let cls = cd ? 'role-' + T.roleOf(cd) : 'role-other';
      if (n.f < aLo || n.f > aHi) cls += ' ghost';
      const label = st.labels === 'notes' ? T.pretty(nm.map.get(pc)) : st.labels === 'intervals' ? (cd ? T.prettyDeg(cd) : relDeg) : '';
      return { s: n.s, f: n.f, label, cls };
    });
    fb.draw(notes);
  }

  const REL_DEG = ['1', 'b9', '9', '#9', '3', '11', '#11', '5', 'b13', '13', 'b7', '7'];
  function degreeRelativeTo(rootPc, pc) {
    return REL_DEG[T.mod12(pc - rootPc)];
  }

  /* ---------------- engine ---------------- */
  const sync = () => ui.syncTransport($('#imPlay', root), $('#imStop', root), ui.clockState(clock));
  /** Play → Pause → Resume */
  function transport() {
    if (!clock) start();
    else if (clock.running) clock.pause();
    else if (clock.paused) clock.resume();
  }
  function start() {
    A.ensure();
    buildTimeline();
    playing = true;
    const style = st.style || prog().style;
    clock = new A.Clock();
    clock.onStop = () => {
      playing = false;
      clock = null;
      sync();
      $$('.pchord', root).forEach((b) => b.style.removeProperty('--p'));
      $('#imCRBadge', root).textContent = '';
      $('#imNowLabel', root).textContent = 'Now';
    };
    clock.onPause = () => {
      sync();
      $('#imNowLabel', root).textContent = 'Paused';
      $('#imCRBadge', root).textContent = '';
    };
    clock.onResume = () => {
      sync();
      $('#imNowLabel', root).textContent = 'Now';
    };
    clock.start(st.bpm || prog().bpm, onStep, { stepsPerBeat: 4, swing: STYLES[style].swing });
    sync();
  }
  function stop() {
    if (clock) clock.stop();
    clock = null;
  }

  function onStep(step, t, sd) {
    const style = st.style || prog().style;
    if (step < COUNT_IN) {
      if (step % 4 === 0) {
        A.rim(t, step === 0 ? 1 : 0.7);
        A.at(t, () => {
          $('#imNowLabel', root).textContent = `Count-in ${step / 4 + 1}…`;
        });
      }
      return;
    }
    const gs = step - COUNT_IN;
    const ls = gs % totalSteps;
    const slot = chordAtStep(ls);
    const p = prog();
    const ch = p.chords[slot.i];
    const info = chordInfo(ch);
    const k = ls - slot.start; // step within chord
    const bs = gs % 16; // step within bar
    const bar = Math.floor(gs / 16);
    const nextCh = p.chords[(slot.i + 1) % p.chords.length];
    const nextInfo = chordInfo(nextCh);

    if (k === 0) {
      A.at(t, () => {
        $('#imNowLabel', root).textContent = 'Now';
        showChord(slot.i);
      });
    }
    if (k % 4 === 0) {
      const prog01 = (k + 4) / slot.steps;
      A.at(t, () => {
        const b = $$('.pchord', root)[slot.i];
        if (b) b.style.setProperty('--p', prog01);
      });
    }

    drums(style, bs, t, bar);
    bass(style, bs, k, slot, info, nextInfo, t, sd);
    comp(style, bs, k, info, ch, t, sd, bar);

    if (st.callResp && bs === 0) {
      const callBar = bar % 2 === 0;
      A.at(t, () => {
        const b = $('#imCRBadge', root);
        b.textContent = callBar ? '👂 Listen…' : '🎸 Your turn!';
        b.className = 'cr-badge ' + (callBar ? 'listen' : 'yours');
      });
      if (callBar) playPhrase(ch, info, t, sd, style);
    }
  }

  function drums(style, bs, t, bar) {
    switch (style) {
      case 'rock':
        if (bs === 0 || bs === 8 || bs === 10) A.kick(t, bs === 10 ? 0.7 : 1);
        if (bs === 4 || bs === 12) A.snare(t, 0.9);
        if (bs % 2 === 0) A.hat(t, bs % 4 === 0 ? 0.9 : 0.55, bs === 14 && bar % 4 === 3);
        break;
      case 'shuffle':
        if (bs === 0 || bs === 8) A.kick(t, 0.9);
        if (bs === 4 || bs === 12) A.snare(t, 0.85);
        if (bs % 2 === 0) A.hat(t, bs % 4 === 0 ? 0.8 : 0.5);
        break;
      case 'swing':
        if (bs % 4 === 0) A.kick(t, 0.22);
        if ([0, 4, 6, 8, 12, 14].includes(bs)) A.ride(t, bs % 4 === 0 ? 0.9 : 0.6);
        if (bs === 4 || bs === 12) A.hat(t, 0.5);
        if (bs === 14 && bar % 2 === 1) A.snare(t, 0.18);
        break;
      case 'funk':
        if ([0, 3, 7, 10].includes(bs)) A.kick(t, bs === 0 ? 1 : 0.75);
        if (bs === 4 || bs === 12) A.snare(t, 1);
        if (bs === 7 || bs === 15) A.snare(t, 0.15);
        A.hat(t, bs % 4 === 0 ? 0.7 : bs % 2 === 0 ? 0.45 : 0.25, bs === 14);
        break;
      case 'ballad':
        if (bs === 0 || (bs === 10 && bar % 2 === 1)) A.kick(t, 0.75);
        if (bs === 8) A.rim(t, 0.6);
        if (bs % 2 === 0) A.hat(t, 0.35);
        break;
    }
  }

  const bassMidi = (pc) => 28 + T.mod12(pc - 28);
  function bass(style, bs, k, slot, info, nextInfo, t, sd) {
    const r = bassMidi(info.rootPc);
    const fifth = r + 7;
    const deg = (n) => {
      const d = info.degs.find((x) => T.degNum(x) === n);
      return d ? r + T.DEG_SEMI[d] : r + 7;
    };
    switch (style) {
      case 'rock':
        if (bs % 2 === 0) A.bass(bs === 14 ? r + 12 : r, t, sd * 1.7, bs % 4 === 0 ? 0.9 : 0.7);
        break;
      case 'shuffle': {
        if (bs % 2 !== 0) return;
        const line = [0, 4, 7, 9, 10, 9, 7, 4];
        const third = info.degs.includes('b3') ? 3 : 4;
        const semi = line[(bs / 2) % 8] === 4 ? third : line[(bs / 2) % 8];
        A.bass(r + semi, t, sd * 1.6, bs % 4 === 0 ? 0.9 : 0.7);
        break;
      }
      case 'swing': {
        if (k % 4 !== 0) return;
        const beat = k / 4;
        const beats = slot.steps / 4;
        let m;
        if (beat === 0) m = r;
        else if (beat === beats - 1) {
          const nr = bassMidi(nextInfo.rootPc);
          m = Math.random() < 0.5 ? nr - 1 : nr + 1;
          if (nextInfo.rootPc === info.rootPc) m = fifth;
        } else {
          const walk = [r, deg(3), deg(5), deg(7), r + 12, deg(7), deg(5), deg(3)];
          m = walk[beat % 8];
        }
        while (m > 45) m -= 12;
        A.bass(m, t, sd * 3.6, beat % 2 === 0 ? 0.85 : 0.72);
        break;
      }
      case 'funk': {
        const pat = { 0: r, 3: r + 12, 6: deg(7) || r + 10, 8: r, 10: fifth, 11: r + 12, 14: r };
        if (pat[bs] !== undefined) A.bass(pat[bs], t, sd * 0.8, bs === 0 ? 1 : 0.75);
        break;
      }
      case 'ballad':
        if (bs === 0 || k === 0) A.bass(r, t, sd * (16 - bs) * 0.95, 0.85);
        else if (bs === 12 && k >= 12) A.bass(fifth - 12 >= 28 ? fifth - 12 : fifth, t, sd * 3.6, 0.6);
        break;
    }
  }

  function comp(style, bs, k, info, ch, t, sd, bar) {
    switch (style) {
      case 'rock': {
        const hits = { 0: 6, 6: 2, 8: 6, 14: 2 };
        if (hits[bs]) A.strum(ui.voicing(info.rootPc, ch.q), t, { vel: 0.55, dur: sd * hits[bs], comp: true, spread: 0.01, up: bs === 6 || bs === 14 });
        break;
      }
      case 'shuffle':
        if (bs === 4 || bs === 12 || (bs === 14 && bar % 2 === 1)) A.strum(ui.voicing(info.rootPc, ch.q, { rootless: true }), t, { vel: 0.55, dur: sd * 1.5, comp: true });
        break;
      case 'swing': {
        const hits = bar % 2 === 0 ? { 0: 3, 6: 1.2 } : { 4: 1.2, 10: 3 };
        if (hits[bs]) A.strum(ui.voicing(info.rootPc, ch.q, { rootless: true }), t, { vel: 0.5, dur: sd * hits[bs], comp: true, spread: 0.008 });
        break;
      }
      case 'funk': {
        const hits = [0, 3, 6, 10, 14];
        if (hits.includes(bs)) A.strum(ui.voicing(info.rootPc, ch.q, { rootless: true }).map((m) => m + 12), t, { vel: 0.5, dur: sd * 0.6, comp: true, spread: 0.006, up: bs % 2 === 1 });
        break;
      }
      case 'ballad': {
        if (bs % 2 !== 0) return;
        const v = ui.voicing(info.rootPc, ch.q);
        const order = [0, 1, 2, 3, 4, 3, 2, 1];
        const idx = order[(bs / 2) % 8] % v.length;
        A.pluck(v[idx], t, { vel: 0.45, dur: sd * 6, comp: true });
        break;
      }
    }
  }

  /* -------- call & response: generate a short phrase that lands on a chord tone -------- */
  function playPhrase(ch, info, t, sd, style) {
    const { scale, rootPc } = scaleFor(ch);
    const pats = T.buildPatterns(GT.tuning(), rootPc, scale, +GT.settings.frets);
    if (!pats.length) return;
    const pat = pats.reduce((a, b) => (Math.abs(b.minF - 6) < Math.abs(a.minF - 6) ? b : a));
    const pool = T.uniquePitches(pat.notes).filter((n) => n.m >= 52 && n.m <= 76);
    if (pool.length < 4) return;
    const swing = STYLES[style].swing;
    const slots = [0, 2, 4, 6, 8, 10, 12];
    const count = 4 + Math.floor(Math.random() * 3);
    const onsets = slots
      .slice()
      .sort(() => Math.random() - 0.5)
      .slice(0, count)
      .sort((a, b) => a - b);
    let idx = Math.floor(pool.length / 2) + Math.floor(Math.random() * 3) - 1;
    onsets.forEach((o, j) => {
      if (j === onsets.length - 1) {
        // land on nearest chord tone
        let best = idx;
        let bd = 99;
        pool.forEach((n, x) => {
          if (info.pcs.slice(0, 4).includes(n.m % 12) && Math.abs(x - idx) < bd) {
            bd = Math.abs(x - idx);
            best = x;
          }
        });
        idx = best;
      } else if (j > 0) {
        idx += rand([-2, -1, -1, 1, 1, 2]);
        idx = Math.max(0, Math.min(pool.length - 1, idx));
      }
      const n = pool[idx];
      let tt = t + o * sd;
      if (swing && o % 4 === 2) tt += 0.667 * sd;
      const next = onsets[j + 1] ?? 16;
      A.pluck(n.m, tt, { vel: 0.95, dur: Math.max(0.15, (next - o) * sd * 0.9) });
      A.at(tt, () => fb.flash(n.s, n.f, 'playing', Math.max(160, (next - o) * sd * 900)));
    });
  }

  GT.views.improvise = view;
  GT.PROGS = PROGS;
})();
