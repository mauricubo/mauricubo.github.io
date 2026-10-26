/* practice.js — note finder, degree hunter, ear training and sequence drills */
(function () {
  'use strict';
  const GT = window.GT;
  const T = GT.theory;
  const A = GT.audio;
  const { $, $$, ui, rand, randInt, store } = GT;

  const TABS = [
    { id: 'notes', label: 'Note Finder', desc: 'Know every note on the neck instantly.' },
    { id: 'degrees', label: 'Degree Hunter', desc: 'See intervals inside scale shapes.' },
    { id: 'intervals', label: 'Interval Ear', desc: 'Hear distances between notes.' },
    { id: 'modes', label: 'Mode Ear', desc: 'Recognise modal colors over a drone.' },
    { id: 'drills', label: 'Sequence Drills', desc: 'Technique & speed with a tempo log.' },
  ];

  let root;
  let currentTab = store.get('practiceTab', 'notes');
  const panels = {};

  const stringName = (s) => {
    const n = T.pretty(T.SHARPS[GT.tuning()[s] % 12]);
    return s === GT.tuning().length - 1 && n === 'E' ? 'e' : n;
  };
  const stringLabel = (s) => `${stringName(s)} string (${6 - s}${['th', 'th', 'th', 'rd', 'nd', 'st'][s]})`;

  function statsHTML(items) {
    return items.map(([k, v]) => `<div class="stat"><span class="v">${v}</span><span class="k">${k}</span></div>`).join('');
  }

  /* ================================================================== */
  /* NOTE FINDER                                                         */
  /* ================================================================== */
  panels.notes = (function () {
    let el, fb;
    const s = Object.assign({ mode: 'find', strings: [0, 1, 2, 3, 4, 5], maxF: 12, naturals: false }, store.get('nf', {}));
    let heat = store.get('nfHeat', {});
    let target = null;
    let t0 = 0;
    let tries = 0;
    let showHeat = false;
    const stats = { ok: 0, n: 0, streak: 0, best: store.get('nfBest', 0), times: [] };
    const NAT = [0, 2, 4, 5, 7, 9, 11];

    function save() {
      store.set('nf', { mode: s.mode, strings: s.strings, maxF: s.maxF, naturals: s.naturals });
    }

    function init(container) {
      el = container;
      el.innerHTML = `
        <div class="card controls">
          <div class="ctl-row">
            <div class="ctl"><label>Mode</label><div id="nfMode"></div></div>
            <div class="ctl"><label>Strings</label><div id="nfStrings" class="chips small"></div></div>
            <div class="ctl"><label>Frets</label><div id="nfRange"></div></div>
            <label class="toggle"><input type="checkbox" id="nfNat"><span></span> Natural notes only</label>
            <label class="toggle"><input type="checkbox" id="nfHeat"><span></span> Show weak spots</label>
          </div>
        </div>
        <div class="card prompt-card">
          <div class="prompt" id="nfPrompt"></div>
          <div class="answers" id="nfAnswers"></div>
          <div class="stats" id="nfStats"></div>
        </div>
        <div class="card fb-card"><div class="fb-scroll"><div id="nfFb"></div></div></div>
        <div class="card coach">
          <h3>Coach’s method</h3>
          <ul>
            <li><strong>One string at a time.</strong> Start with the low E and A strings — they hold the roots of almost every chord shape you play.</li>
            <li><strong>Say the note out loud</strong> before you click. Linking voice, eye and hand is what makes it stick.</li>
            <li><strong>Use octave shapes</strong> (2 frets + 2 strings up; 3 frets + 2 strings up across the B string) to jump from known notes to unknown ones.</li>
            <li>Goal: <strong>under 2 seconds</strong> average with 95% accuracy on all strings, frets 0–12. Check “weak spots” to see where you hesitate.</li>
          </ul>
        </div>`;
      fb = new GT.Fretboard($('#nfFb', el), Object.assign(GT.fbOpts(), { onClick }));
      ui.seg($('#nfMode', el), [{ v: 'find', label: 'Find the note' }, { v: 'name', label: 'Name the note' }], s.mode, (v) => {
        s.mode = v;
        save();
        next();
      });
      const strOpts = [5, 4, 3, 2, 1, 0].map((i) => ({ v: i, label: stringName(i) }));
      ui.multi($('#nfStrings', el), strOpts, s.strings, (vals) => {
        s.strings = vals;
        save();
        next();
      });
      ui.seg($('#nfRange', el), [{ v: 5, label: '0–5' }, { v: 12, label: '0–12' }, { v: 15, label: '0–15' }], s.maxF, (v) => {
        s.maxF = v;
        save();
        next();
      });
      $('#nfNat', el).checked = s.naturals;
      $('#nfNat', el).addEventListener('change', (e) => {
        s.naturals = e.target.checked;
        save();
        next();
      });
      $('#nfHeat', el).addEventListener('change', (e) => {
        showHeat = e.target.checked;
        if (showHeat) drawHeat();
        else next();
      });
      $('#nfAnswers', el).addEventListener('click', (e) => {
        const b = e.target.closest('button[data-pc]');
        if (b) answerName(+b.dataset.pc, b);
      });
    }

    function maxF() {
      return Math.min(s.maxF, +GT.settings.frets);
    }

    function next() {
      if (showHeat) return drawHeat();
      tries = 0;
      const str = rand(s.strings);
      const tuning = GT.tuning();
      const answers = $('#nfAnswers', el);
      if (s.mode === 'find') {
        const pool = s.naturals ? NAT : [...Array(12).keys()];
        let pc;
        do pc = rand(pool);
        while (target && target.pc === pc && pool.length > 1 && Math.random() < 0.8);
        const name = rand([T.SHARPS[pc], T.FLATS[pc]]);
        target = { s: str, pc, name };
        $('#nfPrompt', el).innerHTML = `Find <span class="big">${T.pretty(name)}</span> on the <strong>${stringLabel(str)}</strong>`;
        answers.innerHTML = '';
        fb.draw([]);
      } else {
        let f;
        let pc;
        do {
          f = randInt(0, maxF());
          pc = (tuning[str] + f) % 12;
        } while (s.naturals && !NAT.includes(pc));
        target = { s: str, f, pc };
        $('#nfPrompt', el).innerHTML = `Name the highlighted note <span class="muted small">(${stringLabel(str)}, fret ${f})</span>`;
        answers.innerHTML = T.PC_LABEL.map((n, i) => `<button class="btn ans" data-pc="${i}">${n}</button>`).join('');
        fb.draw([{ s: str, f, label: '?', cls: 'target' }]);
      }
      t0 = performance.now();
      renderStats();
    }

    function record(sf, ok) {
      const ms = performance.now() - t0;
      const k = sf;
      const h = heat[k] || [0, 0, 0];
      h[0] += ok ? 1 : 0;
      h[1] += 1;
      h[2] += Math.min(ms, 10000);
      heat[k] = h;
      store.set('nfHeat', heat);
      stats.n++;
      if (ok) {
        stats.ok++;
        stats.streak++;
        stats.times.push(ms);
        if (stats.times.length > 20) stats.times.shift();
        if (stats.streak > stats.best) {
          stats.best = stats.streak;
          store.set('nfBest', stats.best);
        }
      } else stats.streak = 0;
      renderStats();
    }

    function onClick(str, f) {
      if (showHeat || !target) return;
      const tuning = GT.tuning();
      const m = tuning[str] + f;
      if (s.mode !== 'find') {
        A.pluck(m);
        return;
      }
      const pc = m % 12;
      if (str === target.s && pc === target.pc) {
        A.pluck(m, undefined, { vel: 0.9 });
        if (tries === 0) record(`${str}-${f}`, true);
        fb.draw([{ s: str, f, label: T.pretty(target.name), cls: 'hit' }]);
        target = null;
        setTimeout(next, 650);
      } else {
        tries++;
        fb.flash(str, f, 'miss', 800, T.pretty(T.SHARPS[pc]));
        if (tries === 1) {
          // record a miss on the correct location(s)
          const fr = T.mod12(target.pc - tuning[target.s]);
          record(`${target.s}-${fr}`, false);
        }
        if (tries >= 2) {
          const sols = [];
          for (let x = 0; x <= +GT.settings.frets; x++) if ((tuning[target.s] + x) % 12 === target.pc) sols.push({ s: target.s, f: x, label: T.pretty(target.name), cls: 'hint' });
          fb.draw(sols);
        }
      }
    }

    function answerName(pc, btn) {
      if (!target || s.mode !== 'name') return;
      const m = GT.tuning()[target.s] + target.f;
      if (pc === target.pc) {
        A.pluck(m, undefined, { vel: 0.9 });
        btn.classList.add('good');
        if (tries === 0) record(`${target.s}-${target.f}`, true);
        fb.draw([{ s: target.s, f: target.f, label: T.pretty(T.rootNameFor(pc)), cls: 'hit' }]);
        target = null;
        setTimeout(next, 650);
      } else {
        btn.classList.add('bad');
        if (tries === 0) record(`${target.s}-${target.f}`, false);
        tries++;
      }
    }

    function renderStats() {
      const avg = stats.times.length ? (stats.times.reduce((a, b) => a + b, 0) / stats.times.length / 1000).toFixed(2) + 's' : '—';
      $('#nfStats', el).innerHTML = statsHTML([
        ['Score', `${stats.ok}/${stats.n}`],
        ['Accuracy', stats.n ? Math.round((stats.ok / stats.n) * 100) + '%' : '—'],
        ['Streak', stats.streak],
        ['Best streak', stats.best],
        ['Avg time', avg],
      ]);
    }

    function drawHeat() {
      const tuning = GT.tuning();
      const notes = [];
      tuning.forEach((_, str) => {
        for (let f = 0; f <= maxF(); f++) {
          const h = heat[`${str}-${f}`];
          let cls = 'heat-none';
          let label = '';
          if (h) {
            const acc = h[0] / h[1];
            const avg = h[2] / h[1] / 1000;
            label = avg.toFixed(1);
            cls = acc >= 0.9 && avg < 2.5 ? 'heat-good' : acc >= 0.7 && avg < 4.5 ? 'heat-mid' : 'heat-bad';
          }
          notes.push({ s: str, f, label, cls, small: !h });
        }
      });
      fb.draw(notes);
      $('#nfPrompt', el).innerHTML = `Weak-spot map <span class="muted small">— green: fast &amp; accurate · amber: hesitant · red: errors/slow · number = avg seconds</span>`;
      $('#nfAnswers', el).innerHTML = `<button class="btn sm" id="nfReset">Reset map</button>`;
      $('#nfReset', el).onclick = () => {
        heat = {};
        store.set('nfHeat', heat);
        drawHeat();
      };
    }

    return {
      init,
      show() {
        fb.set(GT.fbOpts());
        next();
      },
      hide() {},
    };
  })();

  /* ================================================================== */
  /* DEGREE HUNTER                                                       */
  /* ================================================================== */
  panels.degrees = (function () {
    let el, fb, keyApi, degApi;
    const s = Object.assign({ scale: 'dorian', key: 9, randomKey: false, dots: true, degs: null }, store.get('dh', {}));
    let round = null;
    let stats = { ok: 0, n: 0, streak: 0 };
    let tries = 0;

    const save = () => store.set('dh', s);

    function init(container) {
      el = container;
      el.innerHTML = `
        <div class="card controls">
          <div class="ctl wide"><label>Key</label><div id="dhKeys"></div></div>
          <div class="ctl-row">
            <div class="ctl"><label for="dhScale">Scale</label><select id="dhScale"></select></div>
            <label class="toggle"><input type="checkbox" id="dhRand"><span></span> Random key each round</label>
            <label class="toggle"><input type="checkbox" id="dhDots"><span></span> Show scale dots</label>
          </div>
          <div class="ctl wide"><label>Degrees to hunt</label><div id="dhDegs" class="chips small"></div></div>
        </div>
        <div class="card prompt-card">
          <div class="prompt" id="dhPrompt"></div>
          <div class="stats" id="dhStats"></div>
        </div>
        <div class="card fb-card"><div class="fb-scroll"><div id="dhFb"></div></div></div>
        <div class="card coach">
          <h3>Why this matters</h3>
          <p>Great improvisers don’t think “pattern 3, box 2” — they see <em>where the 3rd and 7th are</em> relative to the root. That is what lets them target chord tones, outline changes and play melodically instead of running scales. Start with the dots visible, then hide them and find degrees from the roots alone.</p>
        </div>`;
      fb = new GT.Fretboard($('#dhFb', el), Object.assign(GT.fbOpts(), { onClick }));
      keyApi = ui.keyChips($('#dhKeys', el), s.key, (v) => {
        s.key = v;
        save();
        next();
      });
      ui.scaleOptions($('#dhScale', el), s.scale, (sc) => sc.deg.length >= 5);
      $('#dhScale', el).addEventListener('change', (e) => {
        s.scale = e.target.value;
        s.degs = null;
        save();
        buildDegChips();
        next();
      });
      $('#dhRand', el).checked = s.randomKey;
      $('#dhRand', el).addEventListener('change', (e) => {
        s.randomKey = e.target.checked;
        save();
      });
      $('#dhDots', el).checked = s.dots;
      $('#dhDots', el).addEventListener('change', (e) => {
        s.dots = e.target.checked;
        save();
        draw();
      });
      buildDegChips();
    }

    function buildDegChips() {
      const scale = T.SCALE_BY_ID[s.scale];
      const avail = scale.deg.filter((d) => d !== '1');
      if (!s.degs || !s.degs.every((d) => avail.includes(d))) s.degs = avail.slice();
      degApi = ui.multi($('#dhDegs', el), avail.map((d) => ({ v: d, label: T.prettyDeg(d) })), s.degs, (vals) => {
        s.degs = vals;
        save();
      });
    }

    function next() {
      tries = 0;
      const scale = T.SCALE_BY_ID[s.scale];
      if (s.randomKey) {
        s.key = randInt(0, 11);
        keyApi.set(s.key);
      }
      const pats = T.buildPatterns(GT.tuning(), s.key, scale, +GT.settings.frets);
      if (!pats.length) return;
      const pi = randInt(0, pats.length - 1);
      const deg = rand(s.degs);
      const nm = ui.nameMap(s.key, scale.deg);
      round = { scale, pat: pats[pi], pi, deg, pc: T.mod12(s.key + T.DEG_SEMI[deg]), nm };
      $('#dhPrompt', el).innerHTML = `Click a <span class="big deg">${T.prettyDeg(deg)}</span> <span class="muted">in ${T.pretty(nm.root)} ${scale.name} · pattern ${pi + 1}</span>`;
      draw();
      renderStats();
    }

    function draw(reveal = false) {
      if (!round) return;
      const notes = round.pat.notes.map((n) => {
        const isRoot = n.deg === '1';
        const isT = n.m % 12 === round.pc;
        if (reveal && isT) return { s: n.s, f: n.f, label: T.prettyDeg(round.deg), cls: 'hit' };
        if (isRoot) return { s: n.s, f: n.f, label: 'R', cls: 'role-root' };
        if (reveal) return { s: n.s, f: n.f, label: T.prettyDeg(n.deg), cls: 'ghost' };
        return s.dots ? { s: n.s, f: n.f, label: '', cls: 'blank' } : null;
      });
      fb.draw(notes.filter(Boolean));
    }

    function onClick(str, f) {
      if (!round) return;
      const m = GT.tuning()[str] + f;
      const pc = m % 12;
      const inArea = f >= round.pat.minF - 1 && f <= round.pat.maxF + 1;
      if (pc === round.pc && inArea) {
        A.pluck(m, undefined, { vel: 0.9 });
        stats.n++;
        if (tries === 0) {
          stats.ok++;
          stats.streak++;
        }
        draw(true);
        round = null;
        renderStats();
        setTimeout(next, 1100);
      } else {
        tries++;
        if (tries === 1) stats.streak = 0;
        const rel = T.mod12(pc - s.key);
        const d = round.scale.deg.find((x) => T.DEG_SEMI[x] === rel);
        fb.flash(str, f, 'miss', 900, d ? T.prettyDeg(d) : '✕');
        A.pluck(m, undefined, { vel: 0.5 });
        if (tries >= 3) {
          stats.n++;
          draw(true);
          round = null;
          renderStats();
          setTimeout(next, 1800);
        }
      }
    }

    function renderStats() {
      $('#dhStats', el).innerHTML = statsHTML([
        ['Score', `${stats.ok}/${stats.n}`],
        ['Accuracy', stats.n ? Math.round((stats.ok / stats.n) * 100) + '%' : '—'],
        ['Streak', stats.streak],
      ]);
    }

    return {
      init,
      show(params) {
        if (params.scale && T.SCALE_BY_ID[params.scale]) {
          s.scale = params.scale;
          s.degs = null;
          $('#dhScale', el).value = s.scale;
          buildDegChips();
        }
        if (params.key !== undefined && params.key !== '') {
          s.key = T.mod12(+params.key);
          keyApi.set(s.key);
        }
        fb.set(GT.fbOpts());
        next();
      },
      hide() {},
    };
  })();

  /* ================================================================== */
  /* INTERVAL EAR                                                        */
  /* ================================================================== */
  panels.intervals = (function () {
    let el, fb;
    const s = Object.assign({ set: [3, 4, 5, 7, 12], dir: 'asc' }, store.get('iv', {}));
    let q = null;
    let answered = true;
    const stats = { ok: 0, n: 0, streak: 0 };
    let per = store.get('ivStats', {});

    function init(container) {
      el = container;
      el.innerHTML = `
        <div class="card controls">
          <div class="ctl wide"><label>Intervals</label><div id="ivSet" class="chips small"></div></div>
          <div class="ctl-row">
            <div class="ctl"><label>Direction</label><div id="ivDir"></div></div>
          </div>
        </div>
        <div class="card prompt-card">
          <div class="prompt" id="ivPrompt">Press <strong>Play</strong> and name the interval.</div>
          <div class="btn-row center">
            <button class="btn primary" id="ivPlay">▶ Play</button>
            <button class="btn" id="ivReplay">↻ Replay</button>
          </div>
          <div class="answers" id="ivAnswers"></div>
          <div class="feedback" id="ivFeedback"></div>
          <div class="stats" id="ivStats"></div>
        </div>
        <div class="card fb-card"><div class="fb-scroll"><div id="ivFb"></div></div></div>
        <div class="card">
          <h3>Accuracy by interval</h3>
          <div class="iv-table" id="ivTable"></div>
          <p class="hint">Sing the interval before answering. Then connect it to the fretboard shape shown above — ear and hand should know the same map.</p>
        </div>`;
      fb = new GT.Fretboard($('#ivFb', el), Object.assign(GT.fbOpts(), { onClick: (st, f) => A.pluck(GT.tuning()[st] + f) }));
      ui.multi($('#ivSet', el), T.INTERVALS.map((i) => ({ v: i.semi, label: i.short })), s.set, (vals) => {
        s.set = vals.slice().sort((a, b) => a - b);
        store.set('iv', s);
        renderAnswers();
      });
      ui.seg($('#ivDir', el), [{ v: 'asc', label: 'Ascending' }, { v: 'desc', label: 'Descending' }, { v: 'harm', label: 'Harmonic' }, { v: 'mix', label: 'Mixed' }], s.dir, (v) => {
        s.dir = v;
        store.set('iv', s);
      });
      $('#ivPlay', el).addEventListener('click', () => (answered ? newQ() : play()));
      $('#ivReplay', el).addEventListener('click', play);
      $('#ivAnswers', el).addEventListener('click', (e) => {
        const b = e.target.closest('button[data-semi]');
        if (b) answer(+b.dataset.semi, b);
      });
      renderAnswers();
      renderTable();
    }

    function renderAnswers() {
      $('#ivAnswers', el).innerHTML = T.INTERVALS.filter((i) => s.set.includes(i.semi))
        .map((i) => `<button class="btn ans" data-semi="${i.semi}" title="${i.name}">${i.short}</button>`)
        .join('');
    }

    function newQ() {
      const semi = rand(s.set);
      const dir = s.dir === 'mix' ? rand(['asc', 'desc', 'harm']) : s.dir;
      const rootM = dir === 'desc' ? randInt(55, 67) : randInt(45, 57);
      q = { semi, dir, root: rootM, target: dir === 'desc' ? rootM - semi : rootM + semi };
      answered = false;
      $$('.ans', el).forEach((b) => b.classList.remove('good', 'bad'));
      $('#ivFeedback', el).innerHTML = '';
      $('#ivPrompt', el).innerHTML = `Name the <strong>${dir === 'harm' ? 'harmonic' : dir === 'asc' ? 'ascending' : 'descending'}</strong> interval`;
      $('#ivPlay', el).textContent = '▶ Play';
      fb.draw([]);
      play();
    }

    function play() {
      if (!q) return newQ();
      const t = A.now() + 0.05;
      if (q.dir === 'harm') {
        A.pluck(q.root, t, { dur: 1.6 });
        A.pluck(q.target, t, { dur: 1.6 });
      } else {
        A.pluck(q.root, t, { dur: 0.75 });
        A.pluck(q.target, t + 0.7, { dur: 1.2 });
      }
    }

    function answer(semi, btn) {
      if (!q || answered) return;
      const ok = semi === q.semi;
      btn.classList.add(ok ? 'good' : 'bad');
      const p = per[q.semi] || [0, 0];
      p[1]++;
      if (ok) p[0]++;
      per[q.semi] = p;
      store.set('ivStats', per);
      stats.n++;
      if (ok) {
        stats.ok++;
        stats.streak++;
      } else stats.streak = 0;
      answered = true;
      const info = T.INTERVALS.find((i) => i.semi === q.semi);
      $$('.ans', el).forEach((b) => {
        if (+b.dataset.semi === q.semi) b.classList.add('good');
      });
      $('#ivFeedback', el).innerHTML = `${ok ? '✓ Correct' : '✕ It was'} <strong>${info.name}</strong> <span class="muted">· ${info.song}</span>`;
      $('#ivPlay', el).textContent = '▶ Next';
      showShape();
      renderStats();
      renderTable();
    }

    function showShape() {
      const tuning = GT.tuning();
      const maxF = Math.min(12, +GT.settings.frets);
      const r = T.positionFor(tuning.slice(0, 5), q.root, 5, maxF) || T.positionFor(tuning, q.root, 5, maxF);
      if (!r) return;
      let best = null;
      tuning.forEach((open, st) => {
        const f = q.target - open;
        if (f < 0 || f > +GT.settings.frets) return;
        const cost = Math.abs(f - r.f) + Math.abs(st - r.s) * 0.8 + (st === r.s && q.semi > 5 ? 3 : 0);
        if (!best || cost < best.cost) best = { s: st, f, cost };
      });
      const info = T.INTERVALS.find((i) => i.semi === q.semi);
      const notes = [{ s: r.s, f: r.f, label: 'R', cls: 'role-root' }];
      if (best) notes.push({ s: best.s, f: best.f, label: info.short, cls: 'role-third' });
      fb.draw(notes);
    }

    function renderStats() {
      $('#ivStats', el).innerHTML = statsHTML([
        ['Score', `${stats.ok}/${stats.n}`],
        ['Accuracy', stats.n ? Math.round((stats.ok / stats.n) * 100) + '%' : '—'],
        ['Streak', stats.streak],
      ]);
    }
    function renderTable() {
      $('#ivTable', el).innerHTML = T.INTERVALS.map((i) => {
        const p = per[i.semi];
        const pct = p ? Math.round((p[0] / p[1]) * 100) : null;
        const cls = pct === null ? '' : pct >= 85 ? 'good' : pct >= 60 ? 'mid' : 'bad';
        return `<div class="iv-cell ${cls}"><span>${i.short}</span><b>${pct === null ? '—' : pct + '%'}</b><i style="width:${pct || 0}%"></i></div>`;
      }).join('');
    }

    return {
      init,
      show() {
        fb.set(GT.fbOpts());
      },
      hide() {},
    };
  })();

  /* ================================================================== */
  /* MODE EAR                                                            */
  /* ================================================================== */
  panels.modes = (function () {
    let el, fb;
    const MODE_IDS = ['ionian', 'dorian', 'phrygian', 'lydian', 'mixolydian', 'aeolian', 'locrian', 'harmonicMinor', 'phrygianDominant', 'melodicMinor', 'lydianDominant'];
    const s = Object.assign({ set: ['ionian', 'dorian', 'mixolydian', 'aeolian'], melody: 'phrase' }, store.get('me', {}));
    let q = null;
    let answered = true;
    let timers = [];
    const stats = { ok: 0, n: 0, streak: 0 };

    function init(container) {
      el = container;
      el.innerHTML = `
        <div class="card controls">
          <div class="ctl wide"><label>Modes in the quiz</label><div id="meSet" class="chips small"></div></div>
          <div class="ctl-row"><div class="ctl"><label>Melody</label><div id="meMel"></div></div></div>
        </div>
        <div class="card prompt-card">
          <div class="prompt" id="mePrompt">A drone sets the tonic, then a melody plays. Which mode is it?</div>
          <div class="btn-row center">
            <button class="btn primary" id="mePlay">▶ Play</button>
            <button class="btn" id="meReplay">↻ Replay</button>
            <button class="btn" id="meStop">■ Stop drone</button>
          </div>
          <div class="answers" id="meAnswers"></div>
          <div class="feedback" id="meFeedback"></div>
          <div class="stats" id="meStats"></div>
        </div>
        <div class="card fb-card"><div class="fb-scroll"><div id="meFb"></div></div></div>
        <div class="card coach">
          <h3>Listening strategy</h3>
          <ol>
            <li><strong>Major or minor?</strong> Listen to the 3rd against the drone first. That halves the options.</li>
            <li><strong>Find the color note.</strong> Major family: ♯4 = Lydian, ♭7 = Mixolydian, neither = Ionian. Minor family: 6 = Dorian, ♭6 = Aeolian, ♭2 = Phrygian, ♭5 = Locrian.</li>
            <li><strong>Exotic leading tones:</strong> a raised 7 in a minor context means harmonic or melodic minor.</li>
          </ol>
        </div>`;
      fb = new GT.Fretboard($('#meFb', el), Object.assign(GT.fbOpts(), { onClick: (st, f) => A.pluck(GT.tuning()[st] + f) }));
      ui.multi($('#meSet', el), MODE_IDS.map((id) => ({ v: id, label: T.SCALE_BY_ID[id].name.replace(/ \(.*\)/, '') })), s.set, (vals) => {
        s.set = vals;
        store.set('me', s);
        renderAnswers();
      });
      ui.seg($('#meMel', el), [{ v: 'scale', label: 'Scale run' }, { v: 'phrase', label: 'Melodic phrase' }], s.melody, (v) => {
        s.melody = v;
        store.set('me', s);
      });
      $('#mePlay', el).addEventListener('click', () => (answered ? newQ() : play()));
      $('#meReplay', el).addEventListener('click', play);
      $('#meStop', el).addEventListener('click', stopAll);
      $('#meAnswers', el).addEventListener('click', (e) => {
        const b = e.target.closest('button[data-id]');
        if (b) answer(b.dataset.id, b);
      });
      renderAnswers();
    }

    function renderAnswers() {
      $('#meAnswers', el).innerHTML = MODE_IDS.filter((id) => s.set.includes(id))
        .map((id) => `<button class="btn ans" data-id="${id}">${T.SCALE_BY_ID[id].name.replace(/ \(.*\)/, '')}</button>`)
        .join('');
    }

    function makeMelody(scale) {
      const semis = scale.deg.map(T.degSemi);
      const at = (i) => semis[((i % 7) + 7) % 7] + 12 * Math.floor(i / 7);
      const charIdx = scale.char.map((d) => scale.deg.indexOf(d)).filter((i) => i >= 0);
      if (s.melody === 'scale') {
        const up = [0, 1, 2, 3, 4, 5, 6, 7];
        return up.concat([6, 5, 4, 3, 2, 1, 0]).map((i) => ({ semi: at(i), dur: i === 0 ? 0.5 : 0.32 }));
      }
      const seq = [0];
      let cur = rand([0, 2, 4]);
      seq.push(cur);
      for (let k = 0; k < 9; k++) {
        if ((k === 2 || k === 6) && charIdx.length) {
          const c = rand(charIdx);
          cur = Math.abs(c - cur) <= Math.abs(c + 7 - cur) ? c : c + 7;
        } else {
          cur += rand([-2, -1, -1, 1, 1, 2, 3]);
          cur = Math.max(-2, Math.min(9, cur));
        }
        seq.push(cur);
      }
      seq.push(rand([2, 4, 1]), 0);
      return seq.map((i, k) => ({ semi: at(i), dur: k === seq.length - 1 ? 1.2 : rand([0.3, 0.3, 0.45, 0.6]) }));
    }

    function newQ() {
      const id = rand(s.set);
      const rootPc = randInt(0, 11);
      const rootMidi = 45 + T.mod12(rootPc - 45);
      q = { scale: T.SCALE_BY_ID[id], rootPc, rootMidi };
      q.melody = makeMelody(q.scale);
      answered = false;
      $$('.ans', el).forEach((b) => b.classList.remove('good', 'bad'));
      $('#meFeedback', el).innerHTML = '';
      $('#mePlay', el).textContent = '▶ Play';
      fb.draw([]);
      play();
    }

    function play() {
      if (!q) return newQ();
      timers.forEach(clearTimeout);
      timers = [];
      A.hush(); // never overlap the previous melody
      A.droneStart(q.rootMidi - 12 >= 36 ? q.rootMidi - 12 : q.rootMidi);
      let t = A.now() + 1.0;
      q.melody.forEach((n) => {
        A.pluck(q.rootMidi + 12 + n.semi, t, { dur: n.dur * 1.4, vel: 0.85 });
        t += n.dur;
      });
    }

    function stopAll() {
      A.droneStop();
    }

    function answer(id, btn) {
      if (!q || answered) return;
      const ok = id === q.scale.id;
      btn.classList.add(ok ? 'good' : 'bad');
      $$('.ans', el).forEach((b) => {
        if (b.dataset.id === q.scale.id) b.classList.add('good');
      });
      stats.n++;
      if (ok) {
        stats.ok++;
        stats.streak++;
      } else stats.streak = 0;
      answered = true;
      const nm = ui.nameMap(q.rootPc, q.scale.deg);
      const charTxt = q.scale.char.length
        ? 'Color notes: ' + q.scale.char.map((d) => `${T.prettyDeg(d)} (${T.pretty(nm.map.get(T.mod12(q.rootPc + T.DEG_SEMI[d])))})`).join(', ')
        : '';
      $('#meFeedback', el).innerHTML = `${ok ? '✓ Correct —' : '✕ It was'} <strong>${T.pretty(nm.root)} ${q.scale.name}</strong>. <span class="muted">${charTxt}. ${q.scale.mood}</span>
        <button class="btn sm link" data-go="explore?scale=${q.scale.id}&key=${q.rootPc}">Open in explorer →</button>`;
      $('#mePlay', el).textContent = '▶ Next';
      const pats = T.buildPatterns(GT.tuning(), q.rootPc, q.scale, +GT.settings.frets);
      const p = pats.find((x) => x.minF >= 2 && x.maxF <= 12) || pats[0];
      if (p)
        fb.draw(
          p.notes.map((n) => ({
            s: n.s, f: n.f, label: T.prettyDeg(n.deg), cls: ui.degCls(n.deg, q.scale.char),
          }))
        );
      $('#meStats', el).innerHTML = statsHTML([
        ['Score', `${stats.ok}/${stats.n}`],
        ['Accuracy', stats.n ? Math.round((stats.ok / stats.n) * 100) + '%' : '—'],
        ['Streak', stats.streak],
      ]);
    }

    return {
      init,
      show() {
        fb.set(GT.fbOpts());
      },
      hide() {
        stopAll();
      },
    };
  })();

  /* ================================================================== */
  /* SEQUENCE DRILLS                                                     */
  /* ================================================================== */
  panels.drills = (function () {
    let el, fb, keyApi, subApi;
    const s = Object.assign({ key: 9, scale: 'ionian', pos: 1, seq: 'g4', sub: 4, bpm: 80, loop: true, countIn: true }, store.get('dr', {}));
    let log = store.get('drillLog', {});
    let clock = null;
    let full = [];
    let notes = [];

    const SEQS = {
      straight: { name: 'Straight up & down', asc: (n) => [...Array(n).keys()], tip: 'Pure alternate picking. Focus on evenness: every note the same volume and length. Record yourself — unevenness hides at speed.' },
      g3: { name: 'Groups of 3', asc: (n) => groups(n, 3), tip: 'In 8ths or 16ths the accent shifts every beat — superb for rhythmic control. Accent the first note of each group, then try accenting the beat instead.' },
      g4: { name: 'Groups of 4', asc: (n) => groups(n, 4), tip: 'The classic sequence. Play it with strict alternate picking, then economy picking on string changes. Keep the fretting hand fingers close to the strings.' },
      g6: { name: 'Groups of 6 (triplets)', asc: (n) => groups(n, 6), tip: 'Shred staple (Paul Gilbert, Yngwie). Use triplet subdivision so each group aligns with two beats. Watch the string crossings.' },
      thirds: { name: 'Diatonic 3rds', asc: (n) => skips(n, 2), tip: 'Sounds instantly melodic — the basis of countless jazz and country lines. Use rolling technique when both notes are on the same fret across strings.' },
      fourths: { name: 'Diatonic 4ths', asc: (n) => skips(n, 3), tip: 'Modern, open sound (fusion, McCoy Tyner-style). Many 4ths fall on the same fret on adjacent strings — roll the fingertip.' },
      sixths: { name: 'Diatonic 6ths', asc: (n) => skips(n, 5), tip: 'Wide intervals force string skipping. Great for picking accuracy and for breaking out of step-wise playing.' },
      triads: { name: 'Diatonic triad arpeggios', asc: (n) => chords(n, 3), tip: 'Outlines every diatonic chord inside the scale. Say the chord name as you play it (Am, Bdim, C…). This is chord-tone soloing training.' },
      sevenths: { name: 'Diatonic 7th arpeggios', asc: (n) => chords(n, 4), tip: 'The jazz musician’s daily bread. Each 4-note group spells a diatonic 7th chord — know which one you are playing.' },
    };
    function groups(n, k) {
      const out = [];
      for (let i = 0; i + k <= n; i++) for (let j = 0; j < k; j++) out.push(i + j);
      return out;
    }
    function skips(n, k) {
      const out = [];
      for (let i = 0; i + k < n; i++) out.push(i, i + k);
      return out;
    }
    function chords(n, k) {
      const out = [];
      for (let i = 0; i + (k - 1) * 2 < n; i++) for (let j = 0; j < k; j++) out.push(i + j * 2);
      return out;
    }

    const save = () => store.set('dr', s);
    const logKey = () => `${s.scale}|${s.seq}|${s.sub}`;

    function init(container) {
      el = container;
      el.innerHTML = `
        <div class="card controls">
          <div class="ctl wide"><label>Key</label><div id="drKeys"></div></div>
          <div class="ctl-row">
            <div class="ctl"><label for="drScale">Scale</label><select id="drScale"></select></div>
            <div class="ctl"><label>Position</label><div id="drPos" class="chips small"></div></div>
            <div class="ctl"><label for="drSeq">Sequence</label><select id="drSeq"></select></div>
            <div class="ctl"><label>Subdivision</label><div id="drSub"></div></div>
          </div>
          <div class="ctl-row">
            <div class="ctl"><label>Tempo (beats per minute)</label>
              <div class="stepper"><button class="btn sm" id="drDown">−4</button><input type="number" id="drBpm" min="30" max="300"><button class="btn sm" id="drUp">+4</button></div>
            </div>
            <label class="toggle"><input type="checkbox" id="drLoop"><span></span> Loop</label>
            <label class="toggle"><input type="checkbox" id="drCount"><span></span> Count-in</label>
            <div class="btn-row">
              <button class="btn primary" id="drStart" title="Start / pause (Space)">▶ Start</button>
              <button class="btn" id="drStop" hidden>■ Stop</button>
              <button class="btn" id="drLog" title="Save this tempo as clean (3 perfect repetitions)">✓ Log clean tempo</button>
            </div>
          </div>
        </div>
        <div class="card fb-card"><div class="fb-scroll"><div id="drFb"></div></div></div>
        <div class="card">
          <div class="row-between"><h3>Tab</h3><span class="muted small" id="drInfo"></span></div>
          <div class="tab-wrap" id="drTab"></div>
        </div>
        <div class="grid-2">
          <div class="card"><h3>Technique focus</h3><p id="drTip"></p>
            <div class="tip"><strong>Speed-ladder method</strong> Start at a tempo where you can play 3 perfect repetitions. Log it, add 4 bpm, repeat. If it gets sloppy, drop 8 bpm and rebuild. Clean beats fast — always.</div>
          </div>
          <div class="card"><h3>Your tempo log</h3><div id="drLogView"></div></div>
        </div>`;
      fb = new GT.Fretboard($('#drFb', el), Object.assign(GT.fbOpts(), { onClick: (st, f) => A.pluck(GT.tuning()[st] + f) }));
      keyApi = ui.keyChips($('#drKeys', el), s.key, (v) => {
        s.key = v;
        save();
        build();
      });
      ui.scaleOptions($('#drScale', el), s.scale);
      $('#drScale', el).addEventListener('change', (e) => {
        s.scale = e.target.value;
        s.pos = 1;
        save();
        build();
      });
      $('#drSeq', el).innerHTML = Object.entries(SEQS).map(([k, v]) => `<option value="${k}">${v.name}</option>`).join('');
      $('#drSeq', el).value = s.seq;
      $('#drSeq', el).addEventListener('change', (e) => {
        s.seq = e.target.value;
        save();
        build();
      });
      subApi = ui.seg($('#drSub', el), [{ v: 2, label: '8ths' }, { v: 3, label: 'Triplets' }, { v: 4, label: '16ths' }], s.sub, (v) => {
        s.sub = v;
        save();
        build();
      });
      $('#drPos', el).addEventListener('click', (e) => {
        const b = e.target.closest('button');
        if (!b) return;
        s.pos = +b.dataset.v;
        save();
        build();
      });
      const bpm = $('#drBpm', el);
      bpm.value = s.bpm;
      const setBpm = (v) => {
        s.bpm = Math.max(30, Math.min(300, Math.round(v) || 80));
        bpm.value = s.bpm;
        if (clock) clock.bpm = s.bpm;
        save();
      };
      bpm.addEventListener('change', () => setBpm(+bpm.value));
      $('#drDown', el).addEventListener('click', () => setBpm(s.bpm - 4));
      $('#drUp', el).addEventListener('click', () => setBpm(s.bpm + 4));
      $('#drLoop', el).checked = s.loop;
      $('#drLoop', el).addEventListener('change', (e) => {
        s.loop = e.target.checked;
        save();
      });
      $('#drCount', el).checked = s.countIn;
      $('#drCount', el).addEventListener('change', (e) => {
        s.countIn = e.target.checked;
        save();
      });
      $('#drStart', el).addEventListener('click', toggle);
      $('#drStop', el).addEventListener('click', stop);
      $('#drLog', el).addEventListener('click', () => {
        const k = logKey();
        (log[k] = log[k] || []).push({ bpm: s.bpm, d: new Date().toISOString().slice(0, 10) });
        store.set('drillLog', log);
        ui.toast(`Logged ${s.bpm} bpm — next target: ${s.bpm + 4} bpm`);
        renderLog();
      });
    }

    function build() {
      stop();
      keyApi.set(s.key);
      subApi.set(s.sub);
      $('#drScale', el).value = s.scale;
      $('#drSeq', el).value = s.seq;
      const scale = T.SCALE_BY_ID[s.scale];
      const pats = T.buildPatterns(GT.tuning(), s.key, scale, +GT.settings.frets);
      if (!pats.length) return;
      if (s.pos > pats.length || s.pos < 1) s.pos = 1;
      $('#drPos', el).innerHTML = pats.map((p, i) => `<button data-v="${i + 1}" class="${s.pos === i + 1 ? 'on' : ''}">${i + 1}</button>`).join('');
      const pat = pats[s.pos - 1];
      notes = T.uniquePitches(pat.notes);
      const n = notes.length;
      const seq = SEQS[s.seq];
      const asc = seq.asc(n);
      let desc = asc.map((i) => n - 1 - i);
      if (s.seq === 'straight') desc = desc.slice(1, -1);
      full = asc.concat(desc).map((i) => notes[i]);
      const nm = ui.nameMap(s.key, scale.deg);
      const mode = GT.settings.labels === 'none' ? 'intervals' : GT.settings.labels;
      fb.draw(pat.notes.map((x) => ({ s: x.s, f: x.f, label: ui.noteLabel(mode, nm.map.get(x.m % 12), x.deg), cls: ui.degCls(x.deg, scale.char) })));
      $('#drInfo', el).textContent = `${T.pretty(nm.root)} ${scale.name} · pattern ${s.pos} · ${full.length} notes`;
      $('#drTip', el).textContent = seq.tip;
      renderTab();
      renderLog();
    }

    function renderTab() {
      const strings = GT.tuning().length;
      const per = s.sub;
      let html = `<div class="tab">`;
      html += `<div class="tab-beat tab-names">${[...Array(strings).keys()].reverse().map((st) => `<span>${stringName(st)}</span>`).join('')}</div>`;
      for (let b = 0; b < full.length; b += per) {
        html += '<div class="tab-beat">';
        for (let i = b; i < Math.min(b + per, full.length); i++) {
          const nt = full[i];
          html += `<div class="tab-col" data-i="${i}">${[...Array(strings).keys()]
            .reverse()
            .map((st) => `<span>${st === nt.s ? nt.f : ''}</span>`)
            .join('')}</div>`;
        }
        html += '</div>';
      }
      html += '</div>';
      $('#drTab', el).innerHTML = html;
    }

    function renderLog() {
      const entries = log[logKey()] || [];
      const v = $('#drLogView', el);
      if (!entries.length) {
        v.innerHTML = `<p class="muted">No tempos logged for <strong>${T.SCALE_BY_ID[s.scale].name} · ${SEQS[s.seq].name} · ${{ 2: '8ths', 3: 'triplets', 4: '16ths' }[s.sub]}</strong> yet. Play it cleanly three times, then hit “Log clean tempo”.</p>`;
        return;
      }
      const best = entries.reduce((a, b) => (b.bpm > a.bpm ? b : a));
      const nps = ((best.bpm * s.sub) / 60).toFixed(1);
      v.innerHTML = `
        <div class="stats">${statsHTML([
          ['Personal best', best.bpm + ' bpm'],
          ['Notes / sec', nps],
          ['Sessions', entries.length],
        ])}</div>
        ${ui.sparkline(entries.slice(-20).map((e) => e.bpm), 320, 60)}
        <p class="muted small">Last: ${entries[entries.length - 1].bpm} bpm on ${entries[entries.length - 1].d}. Next goal: <strong>${best.bpm + 4} bpm</strong>.</p>
        <button class="btn sm" id="drClear">Clear this log</button>`;
      $('#drClear', el).onclick = () => {
        delete log[logKey()];
        store.set('drillLog', log);
        renderLog();
      };
    }

    const sync = () => ui.syncTransport($('#drStart', el), $('#drStop', el), ui.clockState(clock), 'Start');
    /** Start → Pause → Resume (resume gives a one-bar count-in, then continues from the same note) */
    function toggle() {
      if (clock && clock.running) return clock.pause();
      if (clock && clock.paused) return clock.resume();
      if (!full.length) return;
      A.ensure();
      clock = new A.Clock();
      const per = s.sub;
      let countLeft = s.countIn ? 4 * per : 0;
      let idx = 0;
      let lastCol = null;
      clock.onStop = () => {
        clock = null;
        sync();
        if (lastCol) lastCol.classList.remove('now');
      };
      clock.onPause = sync;
      clock.onResume = () => {
        countLeft = 4 * per;
        sync();
      };
      clock.start(
        s.bpm,
        (step, t, dur) => {
          if (step % per === 0) A.click(t, (step / per) % 4 === 0, countLeft > 0 ? 1 : 0.6);
          if (countLeft > 0) {
            countLeft--;
            return;
          }
          if (idx >= full.length) {
            if (!s.loop) return false;
            idx = 0;
          }
          const i = idx++;
          const nt = full[i];
          A.pluck(nt.m, t, { vel: i % per === 0 ? 0.85 : 0.68, dur: Math.max(0.12, dur * 1.3) });
          A.at(t, () => {
            fb.flash(nt.s, nt.f, 'playing', Math.max(90, dur * 900));
            if (lastCol) lastCol.classList.remove('now');
            lastCol = el.querySelector(`.tab-col[data-i="${i}"]`);
            if (lastCol) {
              lastCol.classList.add('now');
              if (i % (per * 8) === 0) lastCol.scrollIntoView({ block: 'nearest', inline: 'nearest' });
            }
          });
        },
        { stepsPerBeat: per }
      );
      sync();
    }
    function stop() {
      if (clock) clock.stop();
    }

    return {
      init,
      show(params) {
        if (params.scale && T.SCALE_BY_ID[params.scale]) {
          s.scale = params.scale;
          s.pos = 1;
        }
        if (params.key !== undefined && params.key !== '') s.key = T.mod12(+params.key);
        fb.set(GT.fbOpts());
        build();
      },
      hide() {
        stop();
      },
      transport: () => toggle(),
    };
  })();

  /* ================================================================== */
  /* VIEW                                                                */
  /* ================================================================== */
  function showTab(id, params = {}) {
    if (panels[currentTab] && panels[currentTab]._inited && currentTab !== id) {
      panels[currentTab].hide();
      A.stopAll();
    }
    currentTab = id;
    store.set('practiceTab', id);
    $$('#prTabs button', root).forEach((b) => b.classList.toggle('on', b.dataset.p === id));
    $$('.pr-panel', root).forEach((p) => p.classList.toggle('active', p.dataset.p === id));
    const p = panels[id];
    if (!p._inited) {
      p.init($(`.pr-panel[data-p="${id}"]`, root));
      p._inited = true;
    }
    p.show(params);
  }

  GT.views.practice = {
    init(el) {
      root = el;
      el.innerHTML = `
        <div class="view-head">
          <div><p class="eyebrow">Practice room</p><h1>Train hands, eyes &amp; ears</h1>
          <p class="sub">Short, focused drills. Ten minutes a day on each beats two hours once a week.</p></div>
        </div>
        <div class="subnav" id="prTabs">${TABS.map((t) => `<button data-p="${t.id}"><strong>${t.label}</strong><span>${t.desc}</span></button>`).join('')}</div>
        ${TABS.map((t) => `<div class="pr-panel" data-p="${t.id}"></div>`).join('')}`;
      $('#prTabs', el).addEventListener('click', (e) => {
        const b = e.target.closest('button[data-p]');
        if (b) showTab(b.dataset.p);
      });
    },
    show(params) {
      const id = params.tab && panels[params.tab] ? params.tab : currentTab;
      showTab(id, params);
    },
    hide() {
      const p = panels[currentTab];
      if (p && p._inited) p.hide();
    },
    transport() {
      const p = panels[currentTab];
      if (p && p._inited && p.transport) p.transport();
    },
  };
})();
