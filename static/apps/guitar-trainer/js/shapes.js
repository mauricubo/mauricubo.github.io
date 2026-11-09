/* shapes.js — arpeggio geometry on the neck: CAGED boxes, one-string and diagonal shapes, voice-led connections */
(function () {
  'use strict';
  const GT = window.GT;
  const T = GT.theory;

  /**
   * The five CAGED regions, located by where the chord root sits.
   * str = string holding the reference root (0 = low E), lo/hi = box edges relative to that root's fret.
   */
  const CAGED = [
    { id: 'C', str: 1, lo: -3, hi: 1 },
    { id: 'A', str: 1, lo: -1, hi: 3 },
    { id: 'G', str: 0, lo: -3, hi: 1 },
    { id: 'E', str: 0, lo: -1, hi: 3 },
    { id: 'D', str: 2, lo: -1, hi: 3 },
  ];

  /** Chord tones on the neck as {s, f, m, deg} */
  const tones = (tuning, rootPc, degs, maxFret) => T.neckNotes(tuning, rootPc, degs, maxFret);

  /* ------------------------------------------------------------------ */
  /* Fingering planner                                                   */
  /* ------------------------------------------------------------------ */
  /*
   * The left hand is modelled by the fret of the index finger (h): fingers 1–4 cover h…h+3,
   * finger "0" is the index stretched back to h−1 and "5" the pinky stretched to h+4.
   * A dynamic program walks an ascending list of pitches and picks, for every note, the string,
   * the hand position and the finger that make the whole line cheapest to play.
   */
  const FINGER_COST = { 0: 1.6, 1: 0, 2: 0, 3: 0.05, 4: 0.25, 5: 1.6 };
  // frets get narrower up the neck: a one-fret stretch (e.g. 1→4 for a major 3rd) is hard
  // near the nut and comfortable from the 5th fret up
  const stretchCost = (f) => (f <= 4 ? 1.6 : f <= 9 ? 1.2 : 0.8);
  const fingerCost = (x) => (x.finger === 'o' ? 0 : x.finger === 0 || x.finger === 5 ? stretchCost(x.f) : FINGER_COST[x.finger]);

  /**
   * pitches: ascending [{m, deg}]
   * opts: hands     → allowed index positions (null = any)
   *       shifts    → allow position changes (false = one position)
   *       open      → allow open strings
   *       strings   → allowed strings (null = all)
   *       maxPer    → max notes per string
   *       per       → exactly this many notes on a string before moving on (last string excepted)
   *       first     → string the first note must be played on
   *       fLo, fHi  → frets the notes must stay within
   *       climb     → reward per fret the hand moves up the neck (diagonal shapes)
   *       counts    → exact number of notes on each string, starting from the first note's string
   *       maxGap    → max semitones between two notes on the same string (4 = a 3rd: move to
   *                   the next string rather than reach a 4th along one string)
   *       noSkip    → never skip a string
   * Returns the cheapest fingering as [{s, f, m, deg, h, finger}] (finger 'o' = open string) or null.
   */
  function plan(pitches, tuning, maxFret, opts) {
    const o = Object.assign({ hands: null, shifts: false, open: false, strings: null, maxPer: 3, noSkip: true }, opts);
    const options = (p) => {
      const out = [];
      tuning.forEach((open, s) => {
        if (o.strings && !o.strings.includes(s)) return;
        const f = p.m - open;
        if (f < 0 || f > maxFret) return;
        if (f > 0 && ((o.fLo != null && f < o.fLo) || (o.fHi != null && f > o.fHi))) return;
        if (f === 0) {
          if (o.open) out.push({ s, f, finger: 'o', h: null });
          return;
        }
        for (let h = Math.max(1, f - 4); h <= f + 1; h++) {
          if (o.hands && !o.hands.includes(h)) continue;
          out.push({ s, f, h, finger: f - h + 1 });
        }
      });
      return out;
    };
    const pathStart = (x) => x.s0;
    // starting a line on the index or middle finger leaves room for the rest of the hand
    const START = { 1: 0, 2: 0.1, 3: 0.4, 4: 0.9 };
    let layer = options(pitches[0])
      .filter((x) => o.first == null || x.s === o.first)
      .map((x) => ({ ...x, c: 1, cost: fingerCost(x) + (START[x.finger] || 0), prev: null, h0: x.h, s0: x.s }));
    if (!layer.length) return null;
    const layers = [layer];
    for (let i = 1; i < pitches.length; i++) {
      const next = [];
      options(pitches[i]).forEach((b) => {
        let best = null;
        layer.forEach((a) => {
          if (b.s < a.s) return; // ascending lines never go back to a lower string
          if (o.noSkip && b.s > a.s + 1) return;
          if (o.per && b.s !== a.s && a.c !== o.per) return;
          if (o.maxGap && b.s === a.s && pitches[i].m - pitches[i - 1].m > o.maxGap && !(o.topSlide && i === pitches.length - 1)) return;
          const c = b.s === a.s ? a.c + 1 : 1;
          if (c > o.maxPer) return;
          if (o.counts) {
            const k = b.s - pathStart(a);
            if (b.s !== a.s && a.c !== o.counts[a.s - pathStart(a)]) return;
            if (k >= o.counts.length || c > o.counts[k]) return;
          }
          let cost = a.cost + (b.s - a.s > 1 ? 4 * (b.s - a.s - 1) : 0) + (c === 3 ? 1.2 : 0);
          // effective hand position (open strings leave the hand where it was)
          const ha = a.h ?? a.hCarry;
          let hb = b.h;
          if (b.finger === 'o') hb = ha;
          if (ha != null && hb != null && hb !== ha) {
            if (!o.shifts) return;
            const d = Math.abs(hb - ha);
            if (d > 5) return;
            if (b.s === a.s) {
              // shifting along a string: sliding the same finger is the most natural; moving the hand up
              // while also reaching with a higher finger is awkward; long jumps get expensive
              cost += 0.5 + 0.5 * d + (d > 2 ? 0.6 * (d - 2) : 0);
              if (a.finger === b.finger) cost -= 0.3;
              else if (hb > ha && b.finger > a.finger) cost += 0.6;
            } else cost += 1.8 + 0.6 * d; // shifting while crossing strings is harder
            if (hb < ha) cost += 2; // the line goes up, the hand should too
            if (o.climb && hb > ha) cost -= o.climb * Math.min(d, 3);
          }
          if (b.finger !== 'o') {
            cost += fingerCost(b);
            if (a.finger !== 'o' && b.s === a.s && hb === ha && b.finger <= a.finger) return; // same string: next finger up
            if (a.finger === b.finger && b.s !== a.s) cost += hb === ha ? 1.2 : 2; // finger roll or jump
          }
          if (!best || cost < best.cost) best = { ...b, hCarry: hb, c, cost, prev: a, h0: a.h0 ?? hb, s0: a.s0 };
        });
        if (best) next.push(best);
      });
      if (!next.length) return null;
      layers.push(next);
      layer = next;
    }
    const finish = (end) => {
      const out = [];
      for (let x = end; x; x = x.prev) out.unshift(x);
      return out.map((x, i) => ({ s: x.s, f: x.f, m: pitches[i].m, deg: pitches[i].deg, h: x.h ?? x.hCarry, finger: x.finger, cost: x.cost }));
    };
    const ends = layer.slice().sort((a, b) => a.cost - b.cost);
    if (o.accept) {
      for (const e of ends) {
        const path = finish(e);
        if (o.accept(path)) return path;
      }
      return null;
    }
    return finish(ends[0]);
  }

  /** Ascending chord tones (one per pitch) between two MIDI notes */
  function pitchRange(rootPc, degs, lo, hi) {
    const pcs = new Map(degs.map((d) => [T.mod12(rootPc + T.DEG_SEMI[d]), d]));
    const out = [];
    for (let m = lo; m <= hi; m++) if (pcs.has(m % 12)) out.push({ m, deg: pcs.get(m % 12) });
    return out;
  }

  const isStretch = (n) => n.finger === 0 || n.finger === 5;

  /** Best one-position fingering of every chord tone reachable inside a fret window */
  function boxPlan(tuning, rootPc, degs, lo, hi, maxFret) {
    const hands = [];
    for (let h = Math.max(1, lo); h <= Math.max(1, hi - 3); h++) hands.push(h);
    let best = null;
    hands.forEach((h) => {
      const reachLo = Math.max(lo, h - 1);
      const reachHi = Math.min(hi, h + 4);
      const openOk = lo === 0;
      // every chord tone that some string can reach from this hand position
      const reach = tones(tuning, rootPc, degs, maxFret).filter((n) => (n.f >= reachLo && n.f <= reachHi) || (openOk && n.f === 0));
      if (!reach.length) return;
      const ms = [...new Set(reach.map((n) => n.m))].sort((a, b) => a - b);
      let pitches = pitchRange(rootPc, degs, ms[0], ms[ms.length - 1]).filter((p) => ms.includes(p.m));
      // keep the longest run with no missing chord tone in between
      const all = pitchRange(rootPc, degs, ms[0], ms[ms.length - 1]);
      let run = [];
      let cur = [];
      all.forEach((p) => {
        if (ms.includes(p.m)) cur.push(p);
        else cur = [];
        if (cur.length > run.length) run = cur.slice();
      });
      pitches = run;
      let path = null;
      while (pitches.length >= 3 && !(path = plan(pitches, tuning, maxFret, { hands: [h], open: openOk, fLo: reachLo, fHi: reachHi }))) pitches = pitches.slice(0, -1);
      if (!path) return;
      // drop stretched notes at the very ends when the shape stays big enough without them
      const min = Math.max(5, 2 * degs.length - 1);
      while (path.length > min && isStretch(path[path.length - 1])) path.pop();
      while (path.length > min && isStretch(path[0])) path.shift();
      const stretches = path.filter(isStretch).length;
      const score = path.length * 3 - stretches * 2 - path[path.length - 1].cost / path.length;
      if (!best || score > best.score) best = { path, score };
    });
    return best ? best.path : [];
  }

  GT.shapes = {
    plan,
    /** The 5 CAGED windows for a chord root, ordered up the neck */
    cagedWindows(tuning, rootPc, maxFret) {
      return CAGED.map((c) => {
        const r = T.mod12(rootPc - tuning[c.str]);
        let lo = r + c.lo;
        let hi = r + c.hi;
        if (lo < 0) {
          lo += 12;
          hi += 12;
        }
        if (hi > maxFret && lo - 12 >= 0) {
          lo -= 12;
          hi -= 12;
        }
        return { id: c.id, lo: Math.max(0, lo), hi: Math.min(maxFret, hi), rootString: c.str };
      }).sort((a, b) => a.lo - b.lo);
    },

    /** Chord tones inside a fret window, fingered in one position, ascending (notes carry .finger) */
    box(tuning, rootPc, degs, lo, hi, maxFret) {
      return boxPlan(tuning, rootPc, degs, lo, hi, maxFret);
    },

    /** Every chord tone on one string, ascending along the neck, with slide fingering */
    oneString(tuning, rootPc, degs, s, maxFret) {
      const notes = tones(tuning, rootPc, degs, maxFret)
        .filter((n) => n.s === s)
        .sort((a, b) => a.f - b.f);
      const path = plan(notes.map((n) => ({ m: n.m, deg: n.deg })), tuning, maxFret, { strings: [s], shifts: true, open: true, maxPer: 99 });
      return path || notes;
    },

    /**
     * Diagonal arpeggio: two octaves from the root on `startString` (0 = 6th, 1 = 5th string),
     * travelling up the neck through several positions with the most comfortable fingering:
     * shifts happen mostly by sliding along a string, with at most 3 notes per string.
     */
    diagonal(tuning, rootPc, degs, startString, maxFret) {
      // Most comfortable first: up to two notes per string with a reward for climbing, increased
      // until the line really travels; then strict two-notes-per-string; then shortened or relaxed shapes.
      const travels = (p) => {
        const hs = p.map((n) => n.h).filter((h) => h != null);
        return hs.length && hs[hs.length - 1] - hs[0] >= (p[0].finger === 'o' ? 2 : 3);
      };
      const SOFT = (climb) => ({ shifts: true, open: true, maxPer: 2, climb });
      const STRICT = { shifts: true, open: true, maxPer: 2, per: 2 };
      const RELAXED = { shifts: true, open: true, maxPer: 3 };
      const climb = (from, rules, mayTrim, check, kind) => {
        const roots = tones(tuning, rootPc, ['1'], maxFret)
          .filter((n) => n.s === from)
          .sort((a, b) => a.f - b.f);
        for (const r of roots) {
          const all = pitchRange(rootPc, degs, r.m, r.m + 24);
          // high roots run out of frets: drop top notes, but keep at least an octave and a half
          for (let trim = 0; trim === 0 || (mayTrim && all.length - trim >= Math.ceil(degs.length * 1.5) + 1); trim++) {
            const path = plan(all.slice(0, all.length - trim), tuning, maxFret, Object.assign({ first: from }, rules));
            if (path && (!check || check(path))) {
              path.startString = from;
              path.kind = trim ? 'short' : kind;
              return path;
            }
          }
        }
        return [];
      };
      const other = startString === 0 ? 1 : 0;
      const fewStretches = (p) => p.filter(isStretch).length <= 1;
      // 1) the classic pattern players learn: two notes per string, index starting each string
      // 2) if that needs more than one stretch, fewer notes on some strings, still travelling
      // 3) then shortened or relaxed shapes for very high roots
      const attempts = [[startString, STRICT, false, fewStretches, 'classic'], [other, STRICT, false, fewStretches, 'classic']];
      [startString, other].forEach((from) => [0.2, 0.4, 0.7, 1].forEach((c) => attempts.push([from, SOFT(c), false, travels, 'soft'])));
      attempts.push(
        [startString, STRICT, false, null, 'classic'],
        [other, STRICT, false, null, 'classic'],
        [startString, STRICT, true, null, 'classic'],
        [other, STRICT, true, null, 'classic'],
        [startString, RELAXED, true, null, 'soft'],
        [other, RELAXED, true, null, 'soft']
      );
      for (const [from, rules, mayTrim, check, kind] of attempts) {
        const path = climb(from, rules, mayTrim, check, kind);
        if (path.length) return path;
      }
      return [];
    },

    /**
     * Sweep-style arpeggio (as in classical arpeggio études): two octaves from a root on the 6th
     * or 5th string, with two notes on a string only when they are a 3rd apart, otherwise the
     * next string. Gives the familiar 2-1-2-1-1 shapes that sit under the hand.
     */
    sweep(tuning, rootPc, degs, rootString, maxFret, near = 6) {
      const roots = tones(tuning, rootPc, ['1'], maxFret)
        .filter((n) => n.s === rootString && n.f > 0)
        .sort((a, b) => Math.abs(a.f - near) - Math.abs(b.f - near));
      for (const r of roots) {
        for (let trim = 0; trim <= 2; trim++) {
          // seven notes, as in the études: two full octaves of a triad, root to 5th for 7th chords
          const pitches = pitchRange(rootPc, degs, r.m, r.m + 24).slice(0, 7);
          // five strings from the root string, like sweep-picking shapes; the top note may be reached by a slide
          const strings = [0, 1, 2, 3, 4].map((k) => rootString + k).filter((x) => x < tuning.length);
          const base = { shifts: true, maxPer: 2, maxGap: 4, topSlide: true, strings, first: rootString };
          const list = pitches.slice(0, pitches.length - trim);
          // triads: the étude layout, same for major and minor (6th-string root 2-1-2-1-1,
          // 5th-string root 2-1-1-1-2), unless it needs more than one stretch
          let path = null;
          if (degs.length === 3 && !trim) {
            const counts = rootString === 0 ? [2, 1, 2, 1, 1] : [2, 1, 1, 1, 2];
            const p = plan(list, tuning, maxFret, Object.assign({ counts }, base));
            if (p && p.filter(isStretch).length <= 1) path = p;
          }
          if (!path) path = plan(list, tuning, maxFret, base);
          if (path) {
            path.rootString = rootString;
            return path;
          }
        }
      }
      return [];
    },

    /**
     * Voice-led arpeggio through one chord: start on the pool note nearest `prevMidi`,
     * keep moving in direction `dir` and bounce at the edges of the box.
     * Returns { notes, dir } so the next chord can continue the line.
     */
    connect(pool, prevMidi, dir, count) {
      if (!pool.length) return { notes: [], dir };
      let i = 0;
      if (prevMidi != null) {
        let best = Infinity;
        pool.forEach((n, k) => {
          // nearest note; on ties prefer the one in the current direction
          const d = Math.abs(n.m - prevMidi) + (Math.sign(n.m - prevMidi) === dir ? 0 : 0.1);
          if (d < best) {
            best = d;
            i = k;
          }
        });
      } else i = dir > 0 ? 0 : pool.length - 1;
      const notes = [];
      for (let k = 0; k < count; k++) {
        notes.push(pool[i]);
        if (pool.length === 1) continue;
        if (i + dir < 0 || i + dir >= pool.length) dir = -dir;
        i += dir;
      }
      return { notes, dir };
    },

    /** Pitch classes shared by two chords */
    commonTones(a, b) {
      return a.filter((pc) => b.includes(pc));
    },

    /**
     * Guide-tone moves for the Improvise lab: for each 3rd/7th of `from` inside the window,
     * the nearest chord tone of `to` within reach (±2 frets, same or neighbouring string).
     */
    moves(tuning, from, to, lo, hi, maxFret) {
      const guide = from.degs.filter((d) => [3, 7].includes(T.degNum(d)) || d === '6');
      const src = tones(tuning, from.rootPc, guide, maxFret).filter((n) => n.f >= lo && n.f <= hi);
      const dst = tones(tuning, to.rootPc, to.degs.slice(0, 4), maxFret);
      return src
        .map((a) => {
          let best = null;
          dst.forEach((b) => {
            if (Math.abs(b.s - a.s) > 1 || Math.abs(b.f - a.f) > 2) return;
            const dist = Math.abs(b.m - a.m);
            if (dist > 2) return;
            if (!best || dist < best.dist || (dist === best.dist && b.s === a.s)) best = { b, dist };
          });
          return best ? { from: a, to: best.b, dist: best.dist } : null;
        })
        .filter(Boolean);
    },
  };
})();
