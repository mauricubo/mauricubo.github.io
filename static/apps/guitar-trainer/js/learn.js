/* learn.js — circle of fifths, mode brightness ladder, lessons */
(function () {
  'use strict';
  const GT = window.GT;
  const T = GT.theory;
  const A = GT.audio;
  const { $, $$, ui } = GT;

  const CIRCLE = [0, 7, 2, 9, 4, 11, 6, 1, 8, 3, 10, 5];
  const SIG = ['', '1♯', '2♯', '3♯', '4♯', '5♯', '6♯ / 6♭', '5♭', '4♭', '3♭', '2♭', '1♭'];

  const LESSONS = [
    {
      title: 'Reading scale formulas & intervals',
      body: `<p>Every scale here is written as a <strong>formula relative to the major scale</strong>: <code>1 2 3 4 5 6 7</code>. Alterations are marked with ♭ or ♯. Dorian is <code>1 2 ♭3 4 5 6 ♭7</code>: “a major scale with a flat 3rd and flat 7th”.</p>
      <p>Why this matters: formulas are <em>key-independent</em>. Once you know that the ♭3 is three frets above the root on the same string (or one fret below the root on the next string up), you can find it in any key, instantly. Use the <a data-go="practice?tab=degrees">Degree Hunter</a> to build this skill.</p>
      <p>The <strong>step pattern</strong> (W = whole step, H = half step) shows where the half-steps sit. Moving a half-step is what gives each scale its personality — Phrygian’s ♭2, Lydian’s ♯4–5, Ionian’s 7–8.</p>`,
    },
    {
      title: 'Modes: relative vs parallel thinking',
      body: `<p><strong>Relative</strong> thinking: D Dorian = the notes of C major starting on D. Useful for <em>fingerings</em> — you already know the shapes.</p>
      <p><strong>Parallel</strong> thinking: D Dorian = D natural minor with a raised 6th. Useful for <em>sound</em> — it tells you what makes the mode unique against its root.</p>
      <p>Experts use both, but they <em>hear</em> modes parallel. If you play “C major from D” over a Dm7 vamp while thinking about C, your lines will gravitate to C and sound aimless. Think D, emphasise the color note (the natural 6, B), and Dorian appears. Practice with the drone in the <a data-go="explore?scale=dorian&key=2">explorer</a>.</p>`,
    },
    {
      title: 'Fingering systems: CAGED vs 3 notes per string',
      body: `<p><strong>CAGED</strong> organises the neck around the five open-chord shapes (C, A, G, E, D). Each scale position surrounds a chord shape, so you always see the chord tones — ideal for blues, rock and country, and for chord-tone soloing.</p>
      <p><strong>3 notes per string (3NPS)</strong> gives every string the same fingering logic, perfect for speed, legato and sequences. Seven patterns cover any 7-note scale. The patterns in this app use 3NPS for 7-note scales and 2NPS for pentatonics.</p>
      <p>Advanced players use both: 3NPS for fast runs, CAGED for melodic, chord-aware phrasing. Exercise: in each 3NPS pattern, find which CAGED chord shape is hiding inside.</p>`,
    },
    {
      title: 'Chord–scale theory & “avoid” notes',
      body: `<p>Each chord implies a scale: m7 → Dorian, 7 → Mixolydian, maj7 → Ionian or Lydian, m7♭5 → Locrian (♮2), 7alt → Altered. Look at the <a data-go="improvise">Improvise lab</a> — it applies this automatically.</p>
      <p>An <strong>avoid note</strong> is a scale tone a half step above a chord tone, which clashes when sustained: the 4 over maj7 (against the 3), the ♭2 over m7 in Phrygian, the 4 over a dominant 7. You can still play them — as passing tones that resolve down.</p>
      <p>Chord-scale theory gives you safe notes; it doesn’t give you melody. Use it as a map, not as the music.</p>`,
    },
    {
      title: 'Targeting: chord tones, guide tones & enclosures',
      body: `<p><strong>Chord tones</strong> (1-3-5-7) on strong beats make your lines outline the harmony. The <strong>3rd and 7th</strong> are the <em>guide tones</em>: they define the chord quality and usually move by half or whole step to the next chord’s guide tones.</p>
      <p>In a ii–V–I in C: the C (♭7 of Dm7) falls to B (3 of G7); the F (♭7 of G7) falls to E (3 of Cmaj7). Play only that line, slowly, then decorate it.</p>
      <p><strong>Enclosure</strong>: approach a target from a scale step above and a half step below (or vice versa) — the signature bebop sound. Example targeting E: F – D♯ – E.</p>`,
    },
    {
      title: 'Pentatonic superimposition',
      body: `<p>Play a <em>different</em> minor pentatonic over a chord to get instant extensions with familiar shapes:</p>
      <ul>
        <li>Over <strong>Am7</strong>: A minor pent = basic sound · E minor pent = 5 ♭7 1 9 11 (open, modern) · B minor pent = 9 11 5 13 1 (Dorian color).</li>
        <li>Over <strong>C7</strong>: G minor pent = 5 ♭7 1 9 11 (sus, fusion) · E♭ minor pent = ♯9 ♭5 ♭13 ♭7 ♭9 (instant Altered sound!).</li>
        <li>Over <strong>Cmaj7</strong>: E minor pent = 3 5 6 7 9 · B minor pent = 7 9 3 ♯11 13 (Lydian).</li>
      </ul>
      <p>You already have the shapes — you just move them. This is how players like Scott Henderson and Allan Holdsworth reach colorful sounds with pentatonic fluency.</p>`,
    },
    {
      title: 'Tension & release: playing “outside”',
      body: `<p>Outside playing works because of <strong>resolution</strong>. The listener accepts tension if it resolves convincingly.</p>
      <ul>
        <li><strong>Side-slipping</strong>: play your phrase a half step up for a beat or two, then slide back in.</li>
        <li><strong>Altered dominants</strong>: over V7, use the Altered or half-whole diminished scale, then resolve each tension by half step into the I chord.</li>
        <li><strong>Symmetry</strong>: motifs moved by minor 3rds (diminished) or whole steps (whole tone) keep their internal logic even when “wrong”.</li>
      </ul>
      <p>Rule of thumb: the more confidently you play it — and the more clearly you resolve it — the more intentional it sounds.</p>`,
    },
    {
      title: 'Rhythm: the forgotten half of improvisation',
      body: `<p>Most intermediate players solo in a constant stream of 8th or 16th notes starting on beat 1. Rhythm is where you’ll get the fastest results:</p>
      <ul>
        <li>Start phrases on different beats — especially off-beats (“and” of 1, “and” of 2).</li>
        <li>Mix subdivisions: quarters, 8ths, triplets, 16ths. Contrast is interest.</li>
        <li>Use <strong>space</strong>. A two-bar phrase followed by two bars of rest sounds confident.</li>
        <li><strong>Motifs</strong>: repeat a rhythmic cell with different notes; listeners latch onto repetition.</li>
      </ul>
      <p>Try the <a data-go="improvise">call &amp; response mode</a> and copy the rhythm of each call before changing the notes.</p>`,
    },
    {
      title: 'Phrasing & articulation',
      body: `<p>On guitar, <em>how</em> you play a note matters as much as which note.</p>
      <ul>
        <li><strong>Bends</strong>: always to pitch. Check a whole-step bend against the fretted note two frets up. Try pre-bends and releases.</li>
        <li><strong>Vibrato</strong>: decide its speed and width consciously. B.B. King (fast, narrow) vs Gilmour (slow, wide).</li>
        <li><strong>Slides &amp; legato</strong> smooth a line; <strong>picked staccato</strong> makes it percussive.</li>
        <li><strong>Dynamics</strong>: use pick attack and the volume knob. Build solos with an arc.</li>
      </ul>`,
    },
    {
      title: 'How to practice for speed (without tension)',
      body: `<ol>
        <li>Find the <strong>clean tempo</strong>: three perfect repetitions in a row. Log it in <a data-go="practice?tab=drills">Sequence Drills</a>.</li>
        <li>Add 4 bpm. If clean, log it. If sloppy, <em>drop 8 bpm</em> and rebuild.</li>
        <li><strong>Burst practice</strong>: play 4–6 notes at the target speed, then stop. Gradually lengthen the bursts.</li>
        <li>Minimise motion: fingers close to the strings, small pick strokes, relaxed thumb.</li>
        <li>Rest. Skill consolidates between sessions — sleep is part of practice.</li>
      </ol>`,
    },
    {
      title: 'Transcription: learning the language',
      body: `<p>Every great improviser learned by imitating recordings. Transcribing trains your ear, your vocabulary and your feel at the same time.</p>
      <ol>
        <li>Pick a solo slightly below your level. Loop 2–4 bars and slow it down (without changing pitch).</li>
        <li><strong>Sing it first</strong>, then find it on the guitar.</li>
        <li>Analyse: which notes are chord tones? Where are the tensions? How does the rhythm work?</li>
        <li>Learn your favourite lick in 3 positions and 3 keys, then use it in your own solos.</li>
      </ol>
      <p>Suggested solos: B.B. King “The Thrill Is Gone”, Gilmour “Comfortably Numb”, Wes Montgomery “Four on Six”, Pat Martino “Sunny”.</p>`,
    },
  ];

  let root;
  let sel = { pc: 0, minor: false };
  let ladderRoot = 0;

  const view = {
    init(el) {
      root = el;
      el.innerHTML = `
        <div class="view-head">
          <div><p class="eyebrow">Theory &amp; lessons</p><h1>Understand what you play</h1>
          <p class="sub">The concepts behind the drills — explained the way a working musician would explain them.</p></div>
        </div>
        <div class="grid-2 align-start">
          <div class="card">
            <h3>Circle of fifths</h3>
            <p class="hint">Tap a key. Neighbours share 6 of 7 notes; clockwise adds a sharp, counter-clockwise a flat.</p>
            <div class="circle-wrap" id="lnCircle"></div>
          </div>
          <div class="card" id="lnKey"></div>
        </div>

        <div class="card">
          <div class="row-between"><h3>Mode brightness ladder</h3><div class="ctl inline"><label>Root</label><select id="lnRoot"></select></div></div>
          <p class="hint">From brightest to darkest, each mode lowers exactly <strong>one</strong> note of the previous one. Play each over the drone and feel the light dim.</p>
          <div class="ladder" id="lnLadder"></div>
        </div>

        <div class="card">
          <h3>Lessons</h3>
          <div class="lessons" id="lnLessons">${LESSONS.map((l, i) => `<details ${i === 0 ? 'open' : ''}><summary><span class="ln-num">${String(i + 1).padStart(2, '0')}</span>${l.title}</summary><div class="lesson-body">${l.body}</div></details>`).join('')}</div>
        </div>`;

      const rs = $('#lnRoot', el);
      rs.innerHTML = T.PC_LABEL.map((n, i) => `<option value="${i}">${n}</option>`).join('');
      rs.value = ladderRoot;
      rs.addEventListener('change', () => {
        ladderRoot = +rs.value;
        renderLadder();
      });
      $('#lnCircle', el).addEventListener('click', (e) => {
        const seg = e.target.closest('[data-pc]');
        if (!seg) return;
        sel = { pc: +seg.dataset.pc, minor: seg.dataset.m === '1' };
        renderCircle();
        renderKey();
        const sc = T.SCALE_BY_ID[sel.minor ? 'aeolian' : 'ionian'];
        const ch = T.diatonicChords(sc, sel.pc)[0];
        A.strum(ui.voicing(ch.rootPc, ch.q3), undefined, { vel: 0.7 });
      });
      $('#lnKey', el).addEventListener('click', (e) => {
        const b = e.target.closest('[data-chord]');
        if (!b) return;
        const sc = T.SCALE_BY_ID[sel.minor ? 'aeolian' : 'ionian'];
        const ch = T.diatonicChords(sc, sel.pc)[+b.dataset.chord];
        A.strum(ui.voicing(ch.rootPc, ch.q7), undefined, { vel: 0.7 });
      });
      $('#lnLadder', el).addEventListener('click', (e) => {
        const b = e.target.closest('[data-play]');
        if (b) playMode(b.dataset.play, b);
      });
      renderCircle();
      renderKey();
      renderLadder();
    },
    show() {},
    hide() {
      stopMode();
    },
  };

  function arc(cx, cy, r1, r2, a0, a1) {
    const p = (r, a) => [cx + r * Math.cos(a), cy + r * Math.sin(a)];
    const [x1, y1] = p(r2, a0);
    const [x2, y2] = p(r2, a1);
    const [x3, y3] = p(r1, a1);
    const [x4, y4] = p(r1, a0);
    return `M${x1},${y1} A${r2},${r2} 0 0 1 ${x2},${y2} L${x3},${y3} A${r1},${r1} 0 0 0 ${x4},${y4} Z`;
  }

  function renderCircle() {
    const cx = 170;
    const cy = 170;
    let svg = `<svg viewBox="0 0 340 340" class="circle">`;
    CIRCLE.forEach((pc, i) => {
      const a0 = ((i - 0.5) / 12) * Math.PI * 2 - Math.PI / 2;
      const a1 = ((i + 0.5) / 12) * Math.PI * 2 - Math.PI / 2;
      const am = (i / 12) * Math.PI * 2 - Math.PI / 2;
      const minPc = T.mod12(pc + 9);
      const majName = i === 6 ? 'F♯/G♭' : T.pretty(T.rootNameFor(pc, T.SCALE_BY_ID.ionian.deg));
      const minName = i === 6 ? 'D♯m/E♭m' : T.pretty(T.rootNameFor(minPc, T.SCALE_BY_ID.aeolian.deg)) + 'm';
      const onMaj = !sel.minor && sel.pc === pc;
      const onMin = sel.minor && sel.pc === minPc;
      svg += `<path d="${arc(cx, cy, 108, 160, a0, a1)}" class="seg maj ${onMaj ? 'on' : ''}" data-pc="${pc}" data-m="0"/>`;
      svg += `<path d="${arc(cx, cy, 64, 106, a0, a1)}" class="seg min ${onMin ? 'on' : ''}" data-pc="${minPc}" data-m="1"/>`;
      svg += `<text x="${cx + 134 * Math.cos(am)}" y="${cy + 134 * Math.sin(am)}" class="seg-t maj ${onMaj ? 'on' : ''}" dy="0.35em">${majName}</text>`;
      svg += `<text x="${cx + 85 * Math.cos(am)}" y="${cy + 85 * Math.sin(am)}" class="seg-t min ${onMin ? 'on' : ''}" dy="0.35em">${minName}</text>`;
    });
    const sig = SIG[CIRCLE.indexOf(sel.minor ? T.mod12(sel.pc + 3) : sel.pc)];
    svg += `<text x="${cx}" y="${cy - 4}" class="center-t">${sig || '♮'}</text><text x="${cx}" y="${cy + 16}" class="center-s">key signature</text></svg>`;
    $('#lnCircle', root).innerHTML = svg;
  }

  function renderKey() {
    const sc = T.SCALE_BY_ID[sel.minor ? 'aeolian' : 'ionian'];
    const sp = T.spell(sel.pc, sc.deg);
    const chords = T.diatonicChords(sc, sel.pc);
    const relPc = sel.minor ? T.mod12(sel.pc + 3) : T.mod12(sel.pc + 9);
    const relName = T.pretty(T.rootNameFor(relPc, (sel.minor ? T.SCALE_BY_ID.ionian : T.SCALE_BY_ID.aeolian).deg));
    const idx = CIRCLE.indexOf(sel.minor ? relPc : sel.pc);
    const nb = [CIRCLE[(idx + 11) % 12], CIRCLE[(idx + 1) % 12]].map((p) => T.pretty(T.rootNameFor(p, T.SCALE_BY_ID.ionian.deg)));
    $('#lnKey', root).innerHTML = `
      <p class="eyebrow">${sel.minor ? 'Minor key' : 'Major key'}</p>
      <h2 class="key-title">${T.pretty(sp.root)} ${sel.minor ? 'minor' : 'major'}</h2>
      <div class="notes-row">${sp.notes.map((n, i) => `<span class="note-pill ${ui.degCls(sc.deg[i])}">${T.pretty(n)}</span>`).join('')}</div>
      <h3>Diatonic chords</h3>
      <div class="chord-grid">${chords.map((c, i) => `<button class="chord-btn" data-chord="${i}"><span class="rn">${c.roman}</span><span class="cn">${c.name}</span></button>`).join('')}</div>
      <ul class="facts">
        <li>Relative ${sel.minor ? 'major' : 'minor'}: <strong>${relName}${sel.minor ? '' : 'm'}</strong> — same notes, same shapes.</li>
        <li>Neighbour keys: <strong>${nb[0]}</strong> and <strong>${nb[1]}</strong> (major) — modulations here sound smooth.</li>
        <li>${sel.minor ? 'In minor, players often raise the 7th on the V chord (harmonic minor) to get a strong V7 → i.' : 'Most common progressions: I–IV–V, I–V–vi–IV, ii–V–I, I–vi–ii–V.'}</li>
      </ul>
      <div class="btn-row">
        <button class="btn sm" data-go="explore?scale=${sel.minor ? 'aeolian' : 'ionian'}&key=${sel.pc}">Explore the scale</button>
        <button class="btn sm" data-go="explore?scale=${sel.minor ? 'minorPent' : 'majorPent'}&key=${sel.pc}">Pentatonic</button>
        <button class="btn sm" data-go="improvise?key=${sel.pc}&prog=${sel.minor ? 'andalusian' : 'pop'}">Improvise in this key</button>
      </div>`;
  }

  function renderLadder() {
    let prev = null;
    $('#lnLadder', root).innerHTML = T.MODE_BRIGHTNESS.map((id, i) => {
      const sc = T.SCALE_BY_ID[id];
      const sp = T.spell(ladderRoot, sc.deg);
      const changed = prev ? sc.deg.findIndex((d, k) => d !== prev[k]) : -1;
      prev = sc.deg;
      return `<div class="rung" style="--b:${1 - i / 6}">
        <div class="rung-name"><strong>${T.pretty(sp.root)} ${sc.name.replace(/ \(.*\)/, '')}</strong><span class="muted small">${sc.mood}</span></div>
        <div class="rung-degs">${sc.deg
          .map((d, k) => `<span class="deg ${k === changed ? 'changed' : ''} ${sc.char.includes(d) ? 'char' : ''}" title="${T.pretty(sp.notes[k])}">${T.prettyDeg(d)}</span>`)
          .join('')}</div>
        <div class="rung-act"><button class="btn sm" data-play="${id}">▶</button><button class="btn sm link" data-go="explore?scale=${id}&key=${ladderRoot}">Explore</button></div>
      </div>`;
    }).join('');
  }

  let modeTimer = null;
  let playingBtn = null;
  function stopMode() {
    clearTimeout(modeTimer);
    if (playingBtn) A.hush();
    A.droneStop();
    if (playingBtn) playingBtn.textContent = '▶';
    playingBtn = null;
  }
  function playMode(id, btn) {
    const was = playingBtn === btn;
    stopMode();
    if (was) return;
    playingBtn = btn;
    btn.textContent = '■';
    const sc = T.SCALE_BY_ID[id];
    const r = 48 + T.mod12(ladderRoot - 48);
    A.droneStart(r - 12);
    let t = A.now() + 0.6;
    const semis = sc.deg.map(T.degSemi).concat(12);
    const seq = semis.concat(semis.slice(0, -1).reverse());
    seq.forEach((s, i) => {
      A.pluck(r + s, t, { dur: 0.5, vel: 0.85 });
      t += i === seq.length - 1 ? 1 : 0.32;
    });
    modeTimer = setTimeout(stopMode, (t - A.now() + 1) * 1000);
  }

  GT.views.theory = view;
})();
