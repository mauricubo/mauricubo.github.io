/* plan.js — 12-week study plan, daily routine timer, practice streak */
(function () {
  'use strict';
  const GT = window.GT;
  const A = GT.audio;
  const { $, $$, store, ui } = GT;

  const PHASES = [
    {
      name: 'Phase 1 · Fluency foundations',
      sub: 'Weeks 1–4 — own the fretboard and the two essential scale systems.',
      weeks: [
        {
          title: 'The map: every note, everywhere',
          focus: 'You can’t improvise freely on a neck you can’t read. This week removes the “dark zones”.',
          tasks: [
            { t: 'Note Finder: all strings, frets 0–12, average under 3 s', go: 'practice?tab=notes' },
            { t: 'Say the natural notes aloud up and down each string (B–C and E–F are half steps!)' },
            { t: 'Learn the octave shapes and use them to find every A, then every C, D, E…' },
            { t: 'Minor pentatonic: learn all 5 positions in A', go: 'explore?scale=minorPent&key=9' },
            { t: 'Alternate picking 16ths on one string with the metronome at 60–80 bpm, 5 min daily' },
          ],
        },
        {
          title: 'Pentatonic beyond the boxes',
          focus: 'Turn five shapes into one connected landscape and start making music with them.',
          tasks: [
            { t: 'Connect pentatonic positions with diagonal runs across the whole neck' },
            { t: 'Sequence Drills: minor pentatonic in groups of 3 and 4, log your clean tempo', go: 'practice?tab=drills&scale=minorPent' },
            { t: 'Degree Hunter: find root, ♭3, 5 and ♭7 in all 5 pentatonic shapes', go: 'practice?tab=degrees&scale=minorPent' },
            { t: 'Bend to pitch: ♭3→4, 4→5, ♭7→1 — check each against the fretted target note' },
            { t: 'Improvise over the 12-bar blues using only 3 notes per chorus', go: 'improvise?prog=blues12' },
          ],
        },
        {
          title: 'Major scale — 3 notes per string (patterns 1–4)',
          focus: 'The 3NPS system gives fast, symmetrical fingerings and is the gateway to every mode.',
          tasks: [
            { t: 'Learn major scale 3NPS patterns 1–4 in G', go: 'explore?scale=ionian&key=7' },
            { t: 'Sequence Drills: diatonic 3rds in each pattern', go: 'practice?tab=drills&scale=ionian' },
            { t: 'Play diatonic triad arpeggios and name each chord as you go (G, Am, Bm, C, D, Em, F♯°)' },
            { t: 'Interval Ear: m3, M3, P4, P5, octave — 80% accuracy', go: 'practice?tab=intervals' },
          ],
        },
        {
          title: 'Major scale complete & first melodic solos',
          focus: 'Finish the major-scale map, then use it over real progressions.',
          tasks: [
            { t: 'Learn patterns 5–7 and slide between all seven positions' },
            { t: 'Sequence Drills: groups of 4 and diatonic 4ths, +4 bpm per session', go: 'practice?tab=drills&scale=ionian&key=7' },
            { t: 'Map the CAGED chord shapes inside the scale patterns (where is the chord in each pattern?)' },
            { t: 'Improvise on I–V–vi–IV: land on the root of each chord, then on the 3rd', go: 'improvise?prog=pop' },
          ],
        },
      ],
    },
    {
      name: 'Phase 2 · Modal & harmonic vocabulary',
      sub: 'Weeks 5–8 — hear and use modes as colors, play chord tones, add minor-key harmony.',
      weeks: [
        {
          title: 'Modes as colors: Dorian & Mixolydian',
          focus: 'Think “parallel”: same root, different color. One characteristic note defines each mode.',
          tasks: [
            { t: 'Compare A Aeolian vs A Dorian over a drone — sing the 6 vs ♭6', go: 'explore?scale=dorian&key=9' },
            { t: 'Improvise on the Dorian vamp and target the natural 6', go: 'improvise?prog=dorianVamp' },
            { t: 'Improvise on Mixolydian rock: land on the ♭7 when the ♭VII chord arrives', go: 'improvise?prog=mixoRock' },
            { t: 'Mode Ear: Ionian, Dorian, Mixolydian, Aeolian — reach 80%', go: 'practice?tab=modes' },
          ],
        },
        {
          title: 'Lydian, Phrygian, Locrian — the full spectrum',
          focus: 'Learn the brightness ladder: each step changes exactly one note.',
          tasks: [
            { t: 'Study the mode brightness ladder and play each mode from the same root', go: 'theory' },
            { t: 'Lydian float: make the ♯4 sing over the II chord', go: 'improvise?prog=lydianVamp' },
            { t: 'Phrygian metal: riff with the ♭2 against a low pedal', go: 'improvise?prog=phrygianMetal' },
            { t: 'Compose a 4-bar melody in each of the 7 modes (record them!)' },
            { t: 'Mode Ear: add Lydian and Phrygian', go: 'practice?tab=modes' },
          ],
        },
        {
          title: 'Chord tones, arpeggios & guide tones',
          focus: 'This is where solos start to sound like they “know the changes”.',
          tasks: [
            { t: 'Sequence Drills: diatonic 7th arpeggios in two patterns', go: 'practice?tab=drills&scale=ionian' },
            { t: 'Degree Hunter in major: 3 and 7 only, dots hidden', go: 'practice?tab=degrees&scale=ionian' },
            { t: 'Jazz ii–V–I: play only guide tones (3rds & 7ths), moving to the nearest one', go: 'improvise?prog=iiVI' },
            { t: 'Take a lick you know and re-target its last note to the 3rd of each chord' },
          ],
        },
        {
          title: 'Harmonic minor & Phrygian dominant',
          focus: 'Minor keys need a major V chord — and that changes the scale.',
          tasks: [
            { t: 'Learn harmonic minor in 3 patterns; arpeggiate the diminished 7th from the 7', go: 'explore?scale=harmonicMinor&key=9' },
            { t: 'Andalusian cadence: switch to Phrygian dominant on the V chord', go: 'improvise?prog=andalusian' },
            { t: 'Minor ii–V–i: resolve the ♭9 of V down to the 5 of i', go: 'improvise?prog=minorIIVi' },
            { t: 'Interval Ear: all intervals, descending', go: 'practice?tab=intervals' },
          ],
        },
      ],
    },
    {
      name: 'Phase 3 · Advanced language & personal voice',
      sub: 'Weeks 9–12 — tension & release, symmetric colors, rhythm, and your own sound.',
      weeks: [
        {
          title: 'Melodic minor family: Lydian dominant & Altered',
          focus: 'One fingering, three essential jazz sounds. Tension that resolves by half step.',
          tasks: [
            { t: 'Learn melodic minor; then play its 4th mode (Lydian dominant) and 7th mode (Altered)', go: 'explore?scale=melodicMinor&key=8' },
            { t: 'ii–V–I with the “Advanced” view: Altered on the V chord', go: 'improvise?prog=iiVI' },
            { t: 'Minor blues: Lydian dominant on ♭VI7, Altered on V7', go: 'improvise?prog=minorBlues' },
            { t: 'Write 3 altered licks that resolve to the 3rd of the I chord' },
          ],
        },
        {
          title: 'Symmetric scales & bebop lines',
          focus: 'Diminished, whole tone and bebop — the sounds of sophistication.',
          tasks: [
            { t: 'Diminished half–whole over 7♭9: move one lick up 3 frets, then again', go: 'explore?scale=dimHW&key=7' },
            { t: 'Whole tone over 7♯5 — and notice there are only two of them', go: 'explore?scale=wholeTone&key=7' },
            { t: 'Bebop dominant: 8th-note lines starting from a chord tone on the beat', go: 'practice?tab=drills&scale=bebopDom&key=7' },
            { t: 'Jazz Blues: outline every chord including the ♯iv°7', go: 'improvise?prog=jazzBlues' },
          ],
        },
        {
          title: 'Rhythm, motifs & phrasing',
          focus: 'Notes are half of improvisation. Rhythm, space and development are the other half.',
          tasks: [
            { t: 'Call & response mode: answer each phrase with a variation of it', go: 'improvise?prog=dorianVamp' },
            { t: 'Play the same 3 notes with 5 different rhythms' },
            { t: 'Rhythmic displacement: start a 4-note motif one 8th later each repetition' },
            { t: 'Solo with 50% silence over the So What form; develop one motif for the whole form', go: 'improvise?prog=soWhat' },
            { t: 'Record a solo and mark where you used bends, slides, vibrato and dynamics' },
          ],
        },
        {
          title: 'Your voice: transcription & synthesis',
          focus: 'Learn the language from the masters and make it yours.',
          tasks: [
            { t: 'Transcribe 4 bars a day from a solo you love (by ear — slow it down)' },
            { t: 'Analyze the transcription: which notes are chord tones, which are tensions?' },
            { t: 'Build a lick library: 10 licks, each learned in 3 positions and 3 keys' },
            { t: 'Record yourself over the Minor Cycle and Jazz Blues and compare with week 1', go: 'improvise?prog=autumn' },
            { t: 'Set new tempo records on your 3 main sequence drills', go: 'practice?tab=drills' },
          ],
        },
      ],
    },
  ];

  const BLOCKS = [
    { id: 'warm', name: 'Warm-up & technique', w: 0.15, desc: 'Chromatic “spider” exercise, legato slurs, then alternate picking with the metronome. Relax the shoulders — speed comes from economy, not tension.', go: null },
    { id: 'neck', name: 'Fretboard & theory', w: 0.15, desc: 'Note Finder and Degree Hunter. Accuracy first, speed second.', go: 'practice?tab=notes' },
    { id: 'scales', name: 'Scales & sequences', w: 0.25, desc: 'This week’s scale with a sequence drill. Use the speed ladder: +4 bpm only after 3 clean reps.', go: 'practice?tab=drills' },
    { id: 'ear', name: 'Ear training', w: 0.15, desc: 'Intervals or modes. Sing before you answer.', go: 'practice?tab=intervals' },
    { id: 'improv', name: 'Improvisation', w: 0.3, desc: 'Apply this week’s concept over a backing track. One clear goal per chorus.', go: 'improvise' },
  ];

  let root;
  let done = store.get('planDone', {});
  let days = store.get('practiceDays', []);
  let open = null;
  const timer = { total: store.get('routineMin', 60), idx: 0, left: 0, running: false, iv: null, last: 0 };

  const taskId = (p, w, t) => `${p}.${w}.${t}`;
  const allWeeks = () => PHASES.flatMap((ph, p) => ph.weeks.map((wk, w) => ({ ph, p, wk, w, n: PHASES.slice(0, p).reduce((a, x) => a + x.weeks.length, 0) + w + 1 })));
  const weekProgress = (x) => {
    const ids = x.wk.tasks.map((_, t) => taskId(x.p, x.w, t));
    const d = ids.filter((id) => done[id]).length;
    return { d, n: ids.length };
  };

  const view = {
    init(el) {
      root = el;
      el.innerHTML = `
        <div class="view-head">
          <div><p class="eyebrow">12-week study plan</p><h1>From intermediate to advanced</h1>
          <p class="sub">A structured path built the way teachers at serious music schools build it: fretboard fluency → harmonic vocabulary → personal language. About 45–60 minutes a day, 5–6 days a week.</p></div>
        </div>
        <div class="plan-top">
          <div class="card overview">
            <div class="ring" id="plRing"></div>
            <div>
              <h3>Your progress</h3>
              <p id="plSummary" class="muted"></p>
              <div class="streak" id="plStreak"></div>
            </div>
          </div>
          <div class="card routine">
            <div class="row-between">
              <h3>Daily routine</h3>
              <select id="plTotal" aria-label="Routine length"><option value="30">30 min</option><option value="45">45 min</option><option value="60">60 min</option><option value="90">90 min</option></select>
            </div>
            <div class="blocks" id="plBlocks"></div>
            <div class="timer-row">
              <div class="clock" id="plClock">00:00</div>
              <div class="btn-row">
                <button class="btn primary" id="plStart">▶ Start</button>
                <button class="btn" id="plSkip">Skip ⏭</button>
                <button class="btn" id="plReset">Reset</button>
              </div>
            </div>
          </div>
        </div>
        <div id="plPhases"></div>
        <div class="card coach">
          <h3>Principles that make the plan work</h3>
          <div class="cols-3">
            <div><h4>Deliberate practice</h4><p>Always know what you’re fixing. Work at the edge of your ability — slow enough to be perfect, hard enough to require focus.</p></div>
            <div><h4>Spaced repetition</h4><p>Revisit last week’s material for 5 minutes each day. Short daily sessions beat one long weekly session for retention.</p></div>
            <div><h4>Make music daily</h4><p>Every session ends with improvising. Technique only matters when it serves expression — and that skill needs practice too.</p></div>
          </div>
        </div>`;

      $('#plTotal', el).value = String(timer.total);
      $('#plTotal', el).addEventListener('change', (e) => {
        timer.total = +e.target.value;
        store.set('routineMin', timer.total);
        resetTimer();
      });
      $('#plStart', el).addEventListener('click', toggleTimer);
      $('#plSkip', el).addEventListener('click', () => nextBlock(false));
      $('#plReset', el).addEventListener('click', resetTimer);
      $('#plPhases', el).addEventListener('change', (e) => {
        const cb = e.target.closest('input[data-id]');
        if (!cb) return;
        done[cb.dataset.id] = cb.checked;
        if (!cb.checked) delete done[cb.dataset.id];
        store.set('planDone', done);
        render();
      });
      $('#plPhases', el).addEventListener('click', (e) => {
        const head = e.target.closest('.week-head');
        if (!head) return;
        open = open === +head.dataset.n ? -1 : +head.dataset.n;
        render();
      });
      $('#plStreak', el).addEventListener('click', (e) => {
        if (e.target.closest('#plMark')) {
          markToday();
        }
      });
      resetTimer();
    },
    show() {
      render();
    },
    hide() {},
    transport: () => toggleTimer(),
  };

  function currentWeek() {
    const w = allWeeks().find((x) => {
      const p = weekProgress(x);
      return p.d < p.n;
    });
    return w ? w.n : 12;
  }

  function render() {
    const weeks = allWeeks();
    const cur = currentWeek();
    if (open === null) open = cur;
    let total = 0;
    let d = 0;
    weeks.forEach((x) => {
      const p = weekProgress(x);
      total += p.n;
      d += p.d;
    });
    const pct = total ? Math.round((d / total) * 100) : 0;
    const R = 34;
    const C = 2 * Math.PI * R;
    $('#plRing', root).innerHTML = `<svg viewBox="0 0 80 80" width="96" height="96"><circle cx="40" cy="40" r="${R}" class="ring-bg"/><circle cx="40" cy="40" r="${R}" class="ring-fg" stroke-dasharray="${C}" stroke-dashoffset="${C * (1 - pct / 100)}" transform="rotate(-90 40 40)"/><text x="40" y="44" text-anchor="middle">${pct}%</text></svg>`;
    $('#plSummary', root).innerHTML = `${d} of ${total} tasks complete · you’re on <strong>week ${cur}</strong>.`;
    renderStreak();

    $('#plPhases', root).innerHTML = PHASES.map(
      (ph, p) => `
      <section class="phase">
        <h2>${ph.name}</h2><p class="muted">${ph.sub}</p>
        <div class="weeks">
          ${weeks
            .filter((x) => x.p === p)
            .map((x) => {
              const pr = weekProgress(x);
              const isOpen = open === x.n;
              const state = pr.d === pr.n ? 'complete' : x.n === cur ? 'current' : '';
              return `<div class="week card ${state} ${isOpen ? 'open' : ''}">
                <button class="week-head" data-n="${x.n}" aria-expanded="${isOpen}">
                  <span class="wk-num">W${x.n}</span>
                  <span class="wk-title">${x.wk.title}</span>
                  <span class="wk-prog"><i style="width:${(pr.d / pr.n) * 100}%"></i></span>
                  <span class="wk-count">${pr.d}/${pr.n}</span>
                </button>
                ${
                  isOpen
                    ? `<div class="week-body"><p class="wk-focus">${x.wk.focus}</p><ul class="tasks">
                    ${x.wk.tasks
                      .map((tk, t) => {
                        const id = taskId(x.p, x.w, t);
                        return `<li><label class="check"><input type="checkbox" data-id="${id}" ${done[id] ? 'checked' : ''}><span></span><em>${tk.t}</em></label>${
                          tk.go ? `<button class="btn sm link" data-go="${tk.go}">Open →</button>` : ''
                        }</li>`;
                      })
                      .join('')}</ul></div>`
                    : ''
                }
              </div>`;
            })
            .join('')}
        </div>
      </section>`
    ).join('');
  }

  /* ---------- streak ---------- */
  const ymd = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const today = () => ymd(new Date());
  function markToday() {
    if (!days.includes(today())) {
      days.push(today());
      store.set('practiceDays', days);
      ui.toast('Nice work — practice logged for today 🎸');
    }
    renderStreak();
  }
  function renderStreak() {
    const set = new Set(days);
    let streak = 0;
    const dt = new Date();
    if (!set.has(today())) dt.setDate(dt.getDate() - 1);
    while (set.has(ymd(dt))) {
      streak++;
      dt.setDate(dt.getDate() - 1);
    }
    const cells = [];
    const d0 = new Date();
    d0.setDate(d0.getDate() - 27);
    for (let i = 0; i < 28; i++) {
      const k = ymd(d0);
      cells.push(`<i class="${set.has(k) ? 'on' : ''}" title="${k}"></i>`);
      d0.setDate(d0.getDate() + 1);
    }
    $('#plStreak', root).innerHTML = `
      <div class="cal">${cells.join('')}</div>
      <div class="streak-row"><span><strong>${streak}</strong> day streak</span>
      <button class="btn sm" id="plMark" ${set.has(today()) ? 'disabled' : ''}>${set.has(today()) ? '✓ Practiced today' : 'Mark today as practiced'}</button></div>`;
  }

  /* ---------- routine timer ---------- */
  const blockSecs = (b) => Math.round(b.w * timer.total * 60);
  const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

  function renderBlocks() {
    $('#plBlocks', root).innerHTML = BLOCKS.map((b, i) => {
      const secs = blockSecs(b);
      const state = i < timer.idx ? 'done' : i === timer.idx ? 'now' : '';
      const p = i < timer.idx ? 1 : i === timer.idx ? 1 - timer.left / secs : 0;
      return `<div class="block ${state}">
        <div class="b-head"><strong>${b.name}</strong><span class="muted small">${Math.round(secs / 60)} min</span></div>
        ${i === timer.idx ? `<p class="small">${b.desc} ${b.go ? `<button class="btn sm link" data-go="${b.go}">Open tool →</button>` : ''}</p>` : ''}
        <div class="b-bar"><i style="width:${p * 100}%"></i></div>
      </div>`;
    }).join('');
    $('#plClock', root).textContent = timer.idx >= BLOCKS.length ? 'Done!' : fmt(timer.left);
  }
  function resetTimer() {
    clearInterval(timer.iv);
    timer.running = false;
    timer.idx = 0;
    timer.left = blockSecs(BLOCKS[0]);
    $('#plStart', root).textContent = '▶ Start';
    renderBlocks();
  }
  function toggleTimer() {
    if (timer.idx >= BLOCKS.length) resetTimer();
    timer.running = !timer.running;
    $('#plStart', root).textContent = timer.running ? '❚❚ Pause' : '▶ Resume';
    clearInterval(timer.iv);
    if (timer.running) {
      timer.last = performance.now();
      timer.iv = setInterval(() => {
        const now = performance.now();
        timer.left -= (now - timer.last) / 1000;
        timer.last = now;
        if (timer.left <= 0) nextBlock(true);
        else if (root.offsetParent !== null) renderBlocks();
      }, 250);
    }
  }
  function nextBlock(withBell) {
    if (withBell) A.bell();
    timer.idx++;
    if (timer.idx >= BLOCKS.length) {
      clearInterval(timer.iv);
      timer.running = false;
      $('#plStart', root).textContent = '↻ Again';
      markToday();
      ui.toast('Routine complete! Great session.');
    } else {
      timer.left = blockSecs(BLOCKS[timer.idx]);
      if (withBell) ui.toast(`Next: ${BLOCKS[timer.idx].name}`);
    }
    renderBlocks();
  }

  GT.views.plan = view;
})();
