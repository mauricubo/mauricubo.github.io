/* explore.js — interactive scale explorer */
(function () {
  'use strict';
  const GT = window.GT;
  const T = GT.theory;
  const A = GT.audio;
  const { $, $$, h, ui } = GT;

  const st = Object.assign({ key: 9, scale: 'minorPent', pos: 0, focus: null, chord: null, bpm: 110 }, GT.store.get('explore', {}));
  st.focus = null;
  st.chord = null;
  const save = () => GT.store.set('explore', { key: st.key, scale: st.scale, pos: st.pos, bpm: st.bpm });

  let root, fb, keyApi, labelApi, patterns = [], clock = null;

  function stepPattern(degs) {
    const semis = degs.map(T.degSemi).concat(12);
    return semis.slice(1).map((s, i) => {
      const d = s - semis[i];
      return d === 1 ? 'H' : d === 2 ? 'W' : d === 3 ? 'm3' : d === 4 ? 'M3' : d;
    });
  }

  const view = {
    init(el) {
      root = el;
      el.innerHTML = `
      <div class="view-head">
        <div>
          <p class="eyebrow">Scale explorer</p>
          <h1 id="exTitle"></h1>
          <p class="sub" id="exMood"></p>
        </div>
        <div class="head-actions">
          <button class="btn primary" id="exPlay"><span class="ico">▶</span> Play pattern</button>
          <button class="btn" id="exDrone" title="Sustained root drone — hear every note's color against the tonic">Drone</button>
        </div>
      </div>

      <div class="card controls">
        <div class="ctl wide"><label>Key</label><div id="exKeys"></div></div>
        <div class="ctl-row">
          <div class="ctl"><label for="exScale">Scale</label><select id="exScale"></select></div>
          <div class="ctl"><label>Position</label><div id="exPos" class="chips small"></div></div>
          <div class="ctl"><label>Labels</label><div id="exLabels"></div></div>
        </div>
        <details class="more">
          <summary>Fretboard settings</summary>
          <div class="ctl-row">
            <div class="ctl"><label for="exTuning">Tuning</label><select id="exTuning"></select></div>
            <div class="ctl"><label for="exFrets">Frets</label><select id="exFrets"><option>12</option><option>15</option><option>17</option><option>19</option><option>22</option><option>24</option></select></div>
            <div class="ctl"><label for="exBpm">Playback tempo <output id="exBpmOut"></output></label><input type="range" id="exBpm" min="50" max="220" step="2"></div>
            <label class="toggle"><input type="checkbox" id="exLefty"><span></span> Left-handed</label>
          </div>
        </details>
      </div>

      <div class="card fb-card">
        <div class="fb-scroll"><div id="exFb"></div></div>
        <div class="fb-foot">
          <div class="legend">
            <span><i class="dot role-root"></i>Root</span><span><i class="dot role-third"></i>3rd</span>
            <span><i class="dot role-fifth"></i>5th</span><span><i class="dot role-seventh"></i>7th</span>
            <span><i class="dot role-other"></i>Other</span><span><i class="dot ring"></i>Characteristic</span>
          </div>
          <div class="focus" id="exFocus"></div>
        </div>
      </div>

      <div class="grid-2">
        <div class="card">
          <h3>Formula</h3>
          <div class="degchips" id="exFormula"></div>
          <p class="hint">Tap degrees to isolate them on the neck. Step pattern: <span id="exSteps" class="mono"></span></p>
          <h3>Notes</h3>
          <div class="notes-row" id="exNotes"></div>
          <h3>Sound &amp; usage</h3>
          <p id="exUse"></p>
          <div class="tip" id="exTip"></div>
          <p class="muted small" id="exPlayers"></p>
        </div>
        <div class="card">
          <div id="exChordsWrap">
            <h3>Diatonic 7th chords</h3>
            <p class="hint">Tap a chord to hear it and see its tones inside the scale — the core of chord-tone soloing.</p>
            <div class="chord-grid" id="exChords"></div>
          </div>
          <h3>Same notes, different center</h3>
          <p class="hint">These scales share the exact pitches — same shapes, new gravity. Tap to re-center.</p>
          <div class="chips small" id="exRel"></div>
          <h3>Practice it</h3>
          <div class="btn-row" id="exLinks"></div>
        </div>
      </div>`;

      fb = new GT.Fretboard($('#exFb', el), Object.assign(GT.fbOpts(), { onClick: onFretClick }));
      keyApi = ui.keyChips($('#exKeys', el), st.key, (v) => {
        st.key = v;
        st.chord = null;
        update();
      });
      ui.scaleOptions($('#exScale', el), st.scale);
      $('#exScale', el).addEventListener('change', (e) => {
        st.scale = e.target.value;
        st.pos = 0;
        st.focus = null;
        st.chord = null;
        update();
      });
      labelApi = ui.seg(
        $('#exLabels', el),
        [{ v: 'notes', label: 'Notes' }, { v: 'intervals', label: 'Intervals' }, { v: 'none', label: 'None' }],
        GT.settings.labels,
        (v) => {
          GT.settings.labels = v;
          GT.saveSettings();
          update();
        }
      );
      const tun = $('#exTuning', el);
      tun.innerHTML = Object.entries(T.TUNINGS).map(([k, t]) => `<option value="${k}">${t.name}</option>`).join('');
      tun.value = GT.settings.tuning;
      tun.addEventListener('change', () => {
        GT.settings.tuning = tun.value;
        GT.saveSettings();
        fb.set(GT.fbOpts());
        update();
      });
      const fr = $('#exFrets', el);
      fr.value = GT.settings.frets;
      fr.addEventListener('change', () => {
        GT.settings.frets = +fr.value;
        GT.saveSettings();
        fb.set(GT.fbOpts());
        update();
      });
      const lefty = $('#exLefty', el);
      lefty.checked = GT.settings.lefty;
      lefty.addEventListener('change', () => {
        GT.settings.lefty = lefty.checked;
        GT.saveSettings();
        fb.set(GT.fbOpts());
        update();
      });
      const bpm = $('#exBpm', el);
      bpm.value = st.bpm;
      $('#exBpmOut', el).textContent = st.bpm + ' bpm';
      bpm.addEventListener('input', () => {
        st.bpm = +bpm.value;
        $('#exBpmOut', el).textContent = st.bpm + ' bpm';
        if (clock) clock.bpm = st.bpm;
        save();
      });

      $('#exPos', el).addEventListener('click', (e) => {
        const b = e.target.closest('button');
        if (!b) return;
        st.pos = +b.dataset.v;
        update();
      });
      $('#exFormula', el).addEventListener('click', (e) => {
        const b = e.target.closest('button');
        if (!b) return;
        const d = b.dataset.d;
        const scale = T.SCALE_BY_ID[st.scale];
        st.chord = null;
        if (!st.focus) st.focus = new Set([d]);
        else if (st.focus.has(d)) st.focus.delete(d);
        else st.focus.add(d);
        if (!st.focus.size || st.focus.size === scale.deg.length) st.focus = null;
        const pc = T.mod12(st.key + T.DEG_SEMI[d]);
        A.pluck(52 + T.mod12(pc - 52), undefined, { vel: 0.8 });
        update();
      });
      $('#exFocus', el).addEventListener('click', (e) => {
        const b = e.target.closest('button');
        if (!b) return;
        const scale = T.SCALE_BY_ID[st.scale];
        const v = b.dataset.v;
        st.chord = null;
        if (v === 'all') st.focus = null;
        else if (v === 'triad') st.focus = new Set(scale.deg.filter((d) => [1, 3, 5].includes(T.degNum(d))));
        else if (v === 'seventh') st.focus = new Set(scale.deg.filter((d) => [1, 3, 5, 7].includes(T.degNum(d))));
        else if (v === 'char') st.focus = new Set(['1', ...scale.char]);
        else if (v === 'root') st.focus = new Set(['1']);
        update();
      });
      $('#exChords', el).addEventListener('click', (e) => {
        const b = e.target.closest('button');
        if (!b) return;
        const i = +b.dataset.i;
        st.chord = st.chord === i ? null : i;
        st.focus = null;
        if (st.chord !== null) {
          const ch = T.diatonicChords(T.SCALE_BY_ID[st.scale], st.key)[i];
          A.strum(ui.voicing(ch.rootPc, ch.q7 || ch.q3), undefined, { vel: 0.75 });
        }
        update();
      });
      $('#exRel', el).addEventListener('click', (e) => {
        const b = e.target.closest('button');
        if (!b) return;
        st.scale = b.dataset.s;
        st.key = +b.dataset.k;
        st.focus = null;
        st.chord = null;
        update();
      });
      $('#exPlay', el).addEventListener('click', togglePlay);
      $('#exDrone', el).addEventListener('click', toggleDrone);
    },

    show(params) {
      if (params.scale && T.SCALE_BY_ID[params.scale]) {
        st.scale = params.scale;
        st.pos = 0;
        st.focus = null;
        st.chord = null;
      }
      if (params.key !== undefined && params.key !== '') st.key = T.mod12(+params.key);
      fb.set(GT.fbOpts());
      $('#exTuning', root).value = GT.settings.tuning;
      $('#exFrets', root).value = GT.settings.frets;
      $('#exLefty', root).checked = GT.settings.lefty;
      labelApi.set(GT.settings.labels);
      update();
    },

    transport: () => togglePlay(),
    hide() {
      stopPlay();
      if (A.droneOn()) toggleDrone();
    },
  };

  let droneKey = null;
  function update() {
    save();
    if (A.droneOn() && droneKey !== st.key) {
      droneKey = st.key;
      A.droneStart(40 + T.mod12(st.key - 40));
    }
    const scale = T.SCALE_BY_ID[st.scale];
    const nm = ui.nameMap(st.key, scale.deg);
    const tuning = GT.tuning();
    const frets = +GT.settings.frets;
    keyApi.set(st.key);
    $('#exScale', root).value = st.scale;
    $('#exTitle', root).innerHTML = `${T.pretty(nm.root)} <span>${scale.name}</span>`;
    $('#exMood', root).textContent = scale.mood;

    patterns = T.buildPatterns(tuning, st.key, scale, frets);
    if (st.pos > patterns.length) st.pos = 0;
    const posEl = $('#exPos', root);
    posEl.innerHTML =
      `<button data-v="0" class="${st.pos === 0 ? 'on' : ''}">All</button>` +
      patterns.map((p, i) => `<button data-v="${i + 1}" class="${st.pos === i + 1 ? 'on' : ''}" title="Frets ${p.minF}–${p.maxF}">${i + 1}</button>`).join('');

    // chord focus
    let chord = null;
    if (st.chord !== null) chord = T.diatonicChords(scale, st.key)[st.chord];
    const chordRole = new Map();
    if (chord) {
      const q = chord.q7 || chord.q3;
      T.CHORDS[q].deg.forEach((d) => chordRole.set(T.mod12(chord.rootPc + T.DEG_SEMI[d]), d));
    }

    const inPattern = st.pos ? new Set(patterns[st.pos - 1].notes.map((n) => n.s + '-' + n.f)) : null;
    const mode = GT.settings.labels;
    const notes = T.neckNotes(tuning, st.key, scale.deg, frets).map((n) => {
      const pc = n.m % 12;
      let cls = ui.degCls(n.deg, scale.char);
      let label = ui.noteLabel(mode, nm.map.get(pc), n.deg);
      let ghost = false;
      if (inPattern && !inPattern.has(n.s + '-' + n.f)) ghost = true;
      if (st.focus && !st.focus.has(n.deg)) ghost = true;
      if (chord) {
        const cd = chordRole.get(pc);
        if (!cd) ghost = true;
        else {
          cls = 'role-' + T.roleOf(cd);
          if (mode === 'intervals') label = T.prettyDeg(cd);
        }
      }
      if (ghost) cls += ' ghost';
      return { s: n.s, f: n.f, label, cls };
    });
    fb.draw(notes);

    // focus presets
    const has7 = scale.deg.some((d) => T.degNum(d) === 7);
    $('#exFocus', root).innerHTML =
      `<span class="muted small">Focus</span>` +
      [
        ['all', 'All'],
        ['root', 'Roots'],
        ['triad', 'Triad'],
        has7 ? ['seventh', '7th chord'] : null,
        scale.char.length ? ['char', 'Color notes'] : null,
      ]
        .filter(Boolean)
        .map(([v, l]) => `<button data-v="${v}" class="${v === 'all' && !st.focus && !chord ? 'on' : ''}">${l}</button>`)
        .join('');

    // formula
    $('#exFormula', root).innerHTML = scale.deg
      .map(
        (d) =>
          `<button data-d="${d}" class="degchip ${ui.degCls(d, scale.char)} ${st.focus && !st.focus.has(d) ? 'off' : ''}">${T.prettyDeg(d)}</button>`
      )
      .join('');
    $('#exSteps', root).textContent = stepPattern(scale.deg).join(' – ');
    $('#exNotes', root).innerHTML = nm.notes
      .map((n, i) => `<span class="note-pill ${ui.degCls(scale.deg[i], scale.char)}">${T.pretty(n)}</span>`)
      .join('');
    $('#exUse', root).innerHTML = `<strong>Use over:</strong> ${scale.use}`;
    $('#exTip', root).innerHTML = `<strong>Pro tip</strong> ${scale.tip}`;
    $('#exPlayers', root).textContent = scale.players ? 'Listen to: ' + scale.players : '';

    // diatonic chords
    const chords = T.diatonicChords(scale, st.key);
    $('#exChordsWrap', root).style.display = chords.length ? '' : 'none';
    $('#exChords', root).innerHTML = chords
      .map(
        (c, i) =>
          `<button data-i="${i}" class="chord-btn ${st.chord === i ? 'on' : ''}"><span class="rn">${c.roman}</span><span class="cn">${c.name}</span></button>`
      )
      .join('');

    // relatives
    const rel = T.relatives(scale, st.key);
    $('#exRel', root).innerHTML = rel.length
      ? rel.map((r) => `<button data-s="${r.scale.id}" data-k="${r.rootPc}">${T.pretty(r.rootName)} ${r.scale.name}</button>`).join('')
      : '<span class="muted small">This scale is unique among the scales in this app (symmetric or hybrid).</span>';

    const q = `scale=${st.scale}&key=${st.key}`;
    $('#exLinks', root).innerHTML = `
      <button class="btn sm" data-go="practice?tab=drills&${q}">Sequence drills</button>
      <button class="btn sm" data-go="practice?tab=degrees&${q}">Degree hunter</button>
      <button class="btn sm" data-go="improvise?key=${st.key}">Improvise</button>`;
  }

  function onFretClick(s, f) {
    const tuning = GT.tuning();
    const m = tuning[s] + f;
    A.pluck(m, undefined, { vel: 0.85 });
    const scale = T.SCALE_BY_ID[st.scale];
    const nm = ui.nameMap(st.key, scale.deg);
    const name = nm.map.get(m % 12);
    if (name) fb.flash(s, f, 'playing', 300);
    else fb.flash(s, f, 'outside', 700, T.pretty(T.SHARPS[m % 12]));
  }

  function patternForPlay() {
    if (!patterns.length) return [];
    const p = patterns[(st.pos || 1) - 1];
    return T.uniquePitches(p.notes);
  }

  function togglePlay() {
    if (clock && clock.running) return stopPlay();
    const seq = patternForPlay();
    if (!seq.length) return;
    const full = seq.concat(seq.slice(0, -1).reverse());
    clock = new A.Clock();
    const btn = $('#exPlay', root);
    btn.innerHTML = '<span class="ico">■</span> Stop';
    btn.classList.add('active');
    clock.onStop = () => {
      btn.innerHTML = '<span class="ico">▶</span> Play pattern';
      btn.classList.remove('active');
    };
    clock.start(
      st.bpm,
      (step, t, dur) => {
        if (step >= full.length) return false;
        const n = full[step];
        A.pluck(n.m, t, { vel: step === 0 ? 0.9 : 0.75, dur: dur * 1.6 });
        A.at(t, () => fb.flash(n.s, n.f, 'playing', Math.max(120, dur * 900)));
      },
      { stepsPerBeat: 2 }
    );
  }
  function stopPlay() {
    if (clock) clock.stop();
  }

  function toggleDrone() {
    const btn = $('#exDrone', root);
    if (A.droneOn()) {
      A.droneStop();
      btn.classList.remove('on');
    } else {
      droneKey = st.key;
      A.droneStart(40 + T.mod12(st.key - 40));
      btn.classList.add('on');
    }
  }

  GT.views.explore = view;
})();
