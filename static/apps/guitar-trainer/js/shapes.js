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

  /** One playable note per pitch, ascending (prefers the higher string, like a standard box fingering) */
  const unique = (notes) => T.uniquePitches(notes);

  GT.shapes = {
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

    /** Chord tones inside a fret window, one per pitch, ascending */
    box(tuning, rootPc, degs, lo, hi, maxFret) {
      return unique(tones(tuning, rootPc, degs, maxFret).filter((n) => n.f >= lo && n.f <= hi));
    },

    /** Every chord tone on one string, ascending along the neck */
    oneString(tuning, rootPc, degs, s, maxFret) {
      return tones(tuning, rootPc, degs, maxFret)
        .filter((n) => n.s === s)
        .sort((a, b) => a.f - b.f);
    },

    /**
     * Diagonal arpeggio: climbs two notes per string while shifting up the neck,
     * starting from the lowest root on `startString` (0 = 6th string, 1 = 5th string).
     */
    diagonal(tuning, rootPc, degs, startString, maxFret) {
      const all = tones(tuning, rootPc, degs, maxFret);
      const climb = (from) => {
        const start = all.filter((n) => n.s === from && n.deg === '1').sort((a, b) => a.f - b.f)[0];
        if (!start) return [];
        const out = [start];
        let last = start;
        for (let s = from; s < tuning.length; s++) {
          const onS = all.filter((n) => n.s === s && n.m > last.m).sort((a, b) => a.m - b.m);
          const want = s === from ? 1 : 2;
          let picked = onS.filter((n) => n.f >= last.f - 2 && n.f <= last.f + 4).slice(0, want);
          if (!picked.length) picked = onS.filter((n) => n.f >= last.f - 3).slice(0, want);
          picked.forEach((n) => {
            out.push(n);
            last = n;
          });
        }
        out.startString = from;
        return out;
      };
      // a high root leaves no room to climb: then start from the other root string
      let best = climb(startString);
      if (best.length < 8) {
        const other = climb(startString === 0 ? 1 : 0);
        if (other.length > best.length) best = other;
      }
      return best;
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
