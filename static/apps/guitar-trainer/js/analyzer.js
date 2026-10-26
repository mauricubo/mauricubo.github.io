/* analyzer.js — chord progression analyzer: key detection, chord functions, scale options, theory */
(function () {
  'use strict';
  const GT = window.GT;
  const T = GT.theory;
  const A = GT.audio;
  const { $, $$, ui, store, esc } = GT;
  const { mod12, DEG_SEMI, SCALE_BY_ID, pretty, prettyDeg } = T;

  /* ------------------------------------------------------------------ */
  /* Parsing                                                             */
  /* ------------------------------------------------------------------ */
  // case-sensitive aliases first (capital M = major)
  const Q_CASE = { M: 'maj', M7: 'maj7', M9: 'maj9', M6: '6', 'M7#11': 'maj7s11', mM7: 'mMaj7', mM9: 'mMaj7' };
  const Q_LOWER = {
    '': 'maj', maj: 'maj', major: 'maj',
    m: 'm', min: 'm', '-': 'm', minor: 'm',
    7: '7', dom7: '7', dom: '7',
    maj7: 'maj7', ma7: 'maj7', j7: 'maj7', maj13: 'maj9', maj9: 'maj9', ma9: 'maj9',
    m7: 'm7', min7: 'm7', '-7': 'm7', mi7: 'm7',
    m7b5: 'm7b5', ø: 'm7b5', ø7: 'm7b5', '-7b5': 'm7b5', min7b5: 'm7b5', halfdim: 'm7b5',
    dim: 'dim', '°': 'dim', o: 'dim', dim7: 'dim7', '°7': 'dim7', o7: 'dim7',
    aug: 'aug', '+': 'aug', '#5': 'aug', '+5': 'aug',
    '7#5': '7s5', '+7': '7s5', aug7: '7s5', '7+': '7s5', '7aug': '7s5', '9#5': '7s5',
    '7b5': '7b5',
    mmaj7: 'mMaj7', 'm-maj7': 'mMaj7', minmaj7: 'mMaj7', '-maj7': 'mMaj7', 'm/maj7': 'mMaj7', mmaj9: 'mMaj7',
    m6: 'm6', '-6': 'm6', min6: 'm6', m69: 'm6',
    6: '6', maj6: '6', 69: '6', add6: '6',
    9: '9', 13: '13', 11: '7sus4',
    m9: 'm9', '-9': 'm9', min9: 'm9', m11: 'm11', '-11': 'm11', m13: 'm9',
    '7b9': '7b9', '13b9': '7b9', '7#9': '7s9', '7alt': '7alt', alt: '7alt', '7b13': '7alt', '7b9b13': '7alt', '7#9b13': '7alt', '7#5#9': '7alt', '7b9#9': '7alt',
    '7#11': '7s11', '9#11': '7s11', '13#11': '7s11',
    'maj7#11': 'maj7s11', 'maj9#11': 'maj7s11', lyd: 'maj7s11',
    sus4: 'sus4', sus: 'sus4', sus2: 'sus2', '7sus4': '7sus4', '7sus': '7sus4', '9sus4': '7sus4', '9sus': '7sus4', '13sus': '7sus4',
    add9: 'add9', add2: 'add9', madd9: 'm', 2: 'sus2',
    5: '5',
  };
  const DOM = new Set(['7', '9', '13', '7b9', '7s9', '7alt', '7s11', '7s5', '7sus4', '7b5']);
  const MIN = new Set(['m', 'm7', 'm9', 'm11', 'm6', 'mMaj7']);
  const family = (q) => (DOM.has(q) ? 'dom' : MIN.has(q) ? 'min' : q === 'm7b5' ? 'hdim' : q === 'dim' || q === 'dim7' ? 'dim' : q === 'aug' ? 'aug' : ['sus4', 'sus2', '5'].includes(q) ? 'sus' : 'maj');

  function parseQuality(raw) {
    let q = raw.replace(/♯/g, '#').replace(/♭/g, 'b').replace(/Δ/g, 'maj7').replace(/[()]/g, '').replace(/[–−]/g, '-').replace(/\s+/g, '');
    if (q === 'maj77') q = 'maj7';
    if (q in Q_CASE) return Q_CASE[q];
    const l = q.toLowerCase();
    if (l in Q_LOWER) return Q_LOWER[l];
    // strip an "add" / extension we don't model, e.g. "m7add11"
    const m = l.match(/^(.*?)(add\d+)$/);
    if (m && m[1] in Q_LOWER) return Q_LOWER[m[1]];
    return null;
  }

  function parseChord(tok) {
    let t = tok.trim().replace(/6\/9/g, '69');
    let bass = null;
    const sl = t.lastIndexOf('/');
    if (sl > 0) {
      bass = t.slice(sl + 1);
      t = t.slice(0, sl);
      if (!/^[A-Ga-g][#b♯♭]?$/.test(bass)) return null;
      bass = bass[0].toUpperCase() + bass.slice(1).replace('♯', '#').replace('♭', 'b');
    }
    const m = t.match(/^([A-Ga-g])([#b♯♭]?)(.*)$/);
    if (!m) return null;
    const rootName = m[1].toUpperCase() + m[2].replace('♯', '#').replace('♭', 'b');
    const q = parseQuality(m[3]);
    if (!q) return null;
    const rootPc = T.nameToPc(rootName);
    const degs = T.CHORDS[q].deg;
    const names = T.spellFrom(rootName, degs);
    return {
      token: tok, rootName, rootPc, q, bass,
      fam: family(q),
      name: T.chordName(rootName, q) + (bass ? '/' + pretty(bass) : ''),
      degs, names,
      core: degs.map((d, i) => ({ d, pc: mod12(rootPc + DEG_SEMI[d]), name: names[i] })),
    };
  }

  /** "Dm7 G7 | Cmaj7 | %"  → chords with beats. No bars → 1 bar per chord. */
  function parseProgression(text) {
    const clean = text.replace(/[,;]/g, ' ').trim();
    if (!clean) return { chords: [], errors: [] };
    const hasBars = clean.includes('|');
    const bars = hasBars ? clean.split('|').map((b) => b.trim()).filter(Boolean) : clean.split(/\s+/);
    const chords = [];
    const errors = [];
    let prevBar = null;
    for (const bar of bars) {
      let toks = bar.split(/\s+/).filter(Boolean);
      if (toks.length === 1 && (toks[0] === '%' || toks[0] === '-')) {
        if (prevBar) toks = prevBar;
        else continue;
      }
      const split = { 1: [4], 2: [2, 2], 3: [2, 1, 1], 4: [1, 1, 1, 1] }[toks.length] || toks.map(() => 1);
      toks.forEach((tk, i) => {
        if (tk === '%' || tk === '-' || tk === '/') {
          if (chords.length) chords[chords.length - 1].beats += split[i];
          return;
        }
        const c = parseChord(tk);
        if (!c) errors.push(tk);
        else chords.push(Object.assign(c, { beats: split[i] }));
      });
      prevBar = toks;
    }
    return { chords, errors };
  }

  /* ------------------------------------------------------------------ */
  /* Key / tonal center detection                                        */
  /* ------------------------------------------------------------------ */
  const CENTER_MODES = ['ionian', 'aeolian', 'dorian', 'mixolydian', 'lydian', 'phrygian'];
  const PRIOR = { ionian: 0.6, aeolian: 0.5, dorian: 0.25, mixolydian: 0.25, lydian: 0.1, phrygian: 0.1 };
  const pcsOf = (scale, root) => new Set(scale.deg.map((d) => mod12(root + DEG_SEMI[d])));
  const isMinorMode = (id) => SCALE_BY_ID[id].deg.includes('b3');

  function tonicMatch(c, modeId) {
    const minor = isMinorMode(modeId);
    if (minor) return c.fam === 'min' ? 1 : c.fam === 'sus' ? 0.5 : 0;
    if (c.fam === 'maj' || c.fam === 'sus') return 1;
    if (c.fam === 'dom') return modeId === 'mixolydian' ? 1 : 0.4;
    return 0;
  }

  /** Scale set used for fit — minor centers accept the raised leading tone on V7 / vii°7 (harmonic minor) */
  function fitSet(base, center, c) {
    if (isMinorMode(center.mode) && ((c.rootPc === mod12(center.pc + 7) && c.fam === 'dom') || (c.rootPc === mod12(center.pc + 11) && c.fam === 'dim'))) {
      const s = new Set(base);
      s.add(mod12(center.pc + 11));
      s.delete(mod12(center.pc + 10));
      return s;
    }
    return base;
  }

  function detectBlues(chords) {
    const total = chords.reduce((a, c) => a + c.beats, 0);
    const domBeats = chords.filter((c) => c.fam === 'dom').reduce((a, c) => a + c.beats, 0);
    if (domBeats / total < 0.7) return null;
    const pc = chords[0].rootPc;
    const roots = new Set(chords.map((c) => mod12(c.rootPc - pc)));
    if (![...roots].every((r) => [0, 5, 7].includes(r)) || !roots.has(5)) return null;
    return { pc, mode: 'mixolydian', blues: true };
  }

  function rankCenters(chords) {
    const total = chords.reduce((a, c) => a + c.beats, 0);
    const first = chords[0];
    const last = chords[chords.length - 1];
    const out = [];
    for (let pc = 0; pc < 12; pc++) {
      for (const mode of CENTER_MODES) {
        const base = pcsOf(SCALE_BY_ID[mode], pc);
        const center = { pc, mode };
        let fit = 0;
        let tonicBeats = 0;
        chords.forEach((c) => {
          const set = fitSet(base, center, c);
          fit += (c.core.filter((x) => set.has(x.pc)).length / c.core.length) * c.beats;
          if (c.rootPc === pc) tonicBeats += c.beats * tonicMatch(c, mode);
        });
        fit /= total;
        let ton = 0;
        if (first.rootPc === pc) ton += 1.2 * tonicMatch(first, mode);
        if (last.rootPc === pc) ton += 1.0 * tonicMatch(last, mode);
        ton += tonicBeats / total;
        if (!chords.some((c) => c.rootPc === pc)) ton -= 1;
        out.push({ pc, mode, score: fit * 6 + ton + PRIOR[mode], fit });
      }
    }
    out.sort((a, b) => b.score - a.score);
    const blues = detectBlues(chords);
    if (blues) out.unshift(Object.assign(blues, { score: 99, fit: 1 }));
    // unique by pc+mode
    const seen = new Set();
    return out.filter((c) => {
      const k = c.pc + c.mode + (c.blues ? 'b' : '');
      return seen.has(k) ? false : (seen.add(k), true);
    });
  }

  const centerRootName = (center) => T.spell(center.pc, SCALE_BY_ID[center.mode].deg).root;
  function centerName(center) {
    const r = pretty(centerRootName(center));
    if (center.blues) return `${r} blues`;
    return {
      ionian: `${r} major`, aeolian: `${r} minor`, dorian: `${r} Dorian`, mixolydian: `${r} Mixolydian`, lydian: `${r} Lydian`, phrygian: `${r} Phrygian`,
    }[center.mode];
  }

  /* ------------------------------------------------------------------ */
  /* Roman numerals & per-chord function                                 */
  /* ------------------------------------------------------------------ */
  const FALLBACK = ['1', 'b2', '2', 'b3', '3', '4', '#4', '5', 'b6', '6', 'b7', '7'];
  const DIM_FALLBACK = { 1: '#1', 3: '#2', 6: '#4', 8: '#5', 10: '#6' };
  function degLabel(center, pc, fam) {
    const rel = mod12(pc - center.pc);
    const sc = SCALE_BY_ID[center.mode];
    const d = sc.deg.find((x) => DEG_SEMI[x] === rel);
    if (d) return d;
    if (fam === 'dim' && DIM_FALLBACK[rel]) return DIM_FALLBACK[rel];
    return FALLBACK[rel];
  }
  const RN_SUFFIX = {
    maj: '', m: '', maj7: 'maj7', m7: '7', 7: '7', m7b5: 'ø7', dim: '°', dim7: '°7', aug: '+', 6: '6', m6: '6', 9: '9', maj9: 'maj9', m9: '9',
    m11: '11', 13: '13', sus4: 'sus4', sus2: 'sus2', '7sus4': '7sus4', '7b9': '7♭9', '7s9': '7♯9', '7alt': '7alt', '7s11': '7♯11', mMaj7: '(maj7)',
    add9: 'add9', 5: '5', '7s5': '+7', '7b5': '7♭5', maj7s11: 'maj7♯11', maj7s5: 'maj7♯5', '7b5': '7♭5', dimMaj7: '°(maj7)', maj7b5: 'maj7♭5',
  };
  function roman(center, c) {
    const d = degLabel(center, c.rootPc, c.fam);
    const n = parseInt(d.replace(/[b#]/g, ''), 10);
    let r = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'][n - 1];
    if (['min', 'hdim', 'dim'].includes(c.fam)) r = r.toLowerCase();
    return { base: prettyDeg(d.replace(/[0-9]/g, '')) + r, full: prettyDeg(d.replace(/[0-9]/g, '')) + r + (RN_SUFFIX[c.q] ?? T.CHORDS[c.q].sym) };
  }

  const PREF = ['ionian', 'dorian', 'mixolydian', 'aeolian', 'lydian', 'phrygian', 'locrian', 'melodicMinor', 'lydianDominant', 'altered', 'locrianNat2', 'harmonicMinor', 'phrygianDominant', 'dimHW', 'dimWH', 'wholeTone', 'minorPent', 'majorPent', 'blues', 'majorBlues', 'bebopDom'];
  /** The 7-note scale with this exact pitch set, rooted on pc */
  function modeAt(set, pc) {
    for (const id of PREF) {
      const sc = SCALE_BY_ID[id];
      if (sc.base || sc.deg.length !== set.size) continue;
      const s = pcsOf(sc, pc);
      if ([...s].every((x) => set.has(x))) return id;
    }
    return null;
  }

  const DEFAULT_SC = {
    maj: ['ionian', 'lydian'], maj7: ['lydian', 'ionian'], 6: ['ionian', 'majorPent'], add9: ['ionian', 'majorPent'], maj9: ['lydian', 'ionian'],
    maj7s11: ['lydian', null], maj7s5: ['wholeTone', null], maj7b5: ['lydian', null],
    m: ['dorian', 'aeolian'], m7: ['dorian', 'aeolian'], m9: ['dorian', 'aeolian'], m11: ['dorian', 'aeolian'], m6: ['melodicMinor', 'dorian'], mMaj7: ['melodicMinor', 'harmonicMinor'],
    7: ['mixolydian', 'lydianDominant'], 9: ['mixolydian', 'lydianDominant'], 13: ['mixolydian', 'lydianDominant'], '7sus4': ['mixolydian', 'dorian'],
    '7b9': ['dimHW', 'phrygianDominant'], '7s9': ['altered', 'blues'], '7alt': ['altered', 'dimHW'], '7s11': ['lydianDominant', null], '7s5': ['wholeTone', 'altered'], '7b5': ['wholeTone', 'lydianDominant'],
    m7b5: ['locrianNat2', 'locrian'], dim: ['dimWH', null], dim7: ['dimWH', null], dimMaj7: ['dimWH', null], aug: ['wholeTone', null],
    sus4: ['mixolydian', 'ionian'], sus2: ['ionian', 'majorPent'], 5: ['aeolian', 'minorPent'],
  };

  const MAJOR_FN = { 1: 'Tonic — home', 2: 'Pre-dominant (subdominant function)', 3: 'Tonic substitute (mediant)', 4: 'Subdominant', 5: 'Dominant — tension that wants to resolve home', 6: 'Tonic substitute (relative minor)', 7: 'Dominant function (leading-tone chord)' };
  const MINOR_FN = { 1: 'Tonic — home', 2: 'Pre-dominant', b2: '♭II — the Phrygian signature chord', b3: 'Relative major (tonic substitute)', 4: 'Subdominant', 5: 'Dominant', b6: 'Subdominant color (♭VI)', 6: 'Dorian color chord (contains the ♮6)', b7: 'Subtonic (♭VII) — modal “soft” dominant' };

  function analyzeChord(c, i, chords, center) {
    const n = chords.length;
    const next = n > 1 ? chords[(i + 1) % n] : null;
    const centerSc = SCALE_BY_ID[center.mode];
    const P = pcsOf(centerSc, center.pc);
    const set = fitSet(P, center, c);
    const rel = mod12(c.rootPc - center.pc);
    const deg = degLabel(center, c.rootPc, c.fam);
    const rn = roman(center, c);
    const nextRn = next ? roman(center, next).full : '';
    const coreIn = c.core.every((x) => set.has(x.pc));
    const r = { rn, deg, tag: 'chromatic', fn: '', why: '', sc: null, alt: null };
    const def = DEFAULT_SC[c.q] || ['ionian', null];
    const resolvesDownFifth = next && mod12(c.rootPc - next.rootPc) === 7;

    if (center.blues && c.fam === 'dom') {
      r.tag = 'blues';
      r.fn = { 0: 'Blues tonic (I7)', 5: 'Blues subdominant (IV7)', 7: 'Blues dominant (V7)' }[rel] || 'Blues dominant';
      r.why = 'In the blues every chord is a dominant 7th. They are not diatonic to one key — the blues mixes major chords with the minor pentatonic melody on purpose.';
      r.sc = 'mixolydian';
      r.alt = 'bebopDom';
    } else if (coreIn) {
      r.tag = 'diatonic';
      r.sc = modeAt(set, c.rootPc) || def[0];
      const minorCenter = isMinorMode(center.mode);
      const table = minorCenter ? MINOR_FN : MAJOR_FN;
      r.fn = table[deg] || table[deg.replace(/[b#]/g, '')] || 'Diatonic chord';
      if (center.mode === 'mixolydian' && deg === 'b7') r.fn = '♭VII — the Mixolydian signature chord';
      if (center.mode === 'lydian' && deg === '2') r.fn = 'II major — the Lydian signature (its 3rd is the ♯4)';
      if (center.mode === 'dorian' && deg === '4' && c.fam !== 'min') r.fn = 'IV major — the Dorian signature (its 3rd is the ♮6)';
      if (set !== P) {
        r.tag = 'harmonic';
        r.fn = c.fam === 'dim' ? 'Leading-tone diminished (vii°7)' : 'Dominant (V7) from harmonic minor';
        r.why = `Natural minor would give a weak minor v chord. Raising the 7th of the key (${pretty(T.spellFrom(centerRootName(center), ['7'])[0])}) creates a leading tone a half step below the tonic — a much stronger pull home.`;
        r.sc = c.fam === 'dim' ? 'dimWH' : 'phrygianDominant';
        r.alt = c.fam === 'dim' ? null : 'altered';
      } else {
        r.why = `All its notes belong to ${centerName(center)}, so the parent scale works — but thinking ${pretty(c.rootName)} ${SCALE_BY_ID[r.sc].name} centers your lines on this chord.`;
        if (c.fam === 'dom') r.alt = resolvesDownFifth ? 'altered' : 'lydianDominant';
        if (c.fam === 'hdim') r.alt = 'locrianNat2';
        if (c.fam === 'min' && r.sc !== 'dorian') r.alt = 'dorian';
      }
    } else if (c.fam === 'dom' && resolvesDownFifth) {
      r.tag = 'secondary';
      const isV = next.rootPc === center.pc;
      r.fn = isV ? 'Dominant (V7)' : `Secondary dominant (V7/${roman(center, next).base})`;
      r.why = isV
        ? `It resolves down a fifth to the tonic. Its 3rd (${pretty(c.names[1])}) is a leading tone pulling up to ${pretty(next.rootName)}.`
        : `It is borrowed from the key of ${pretty(next.rootName)}: it acts as “the V” of ${next.name}, temporarily making that chord sound like home (tonicization). Its 3rd (${pretty(c.names[1])}) is the note outside the key — target it!`;
      if (next.fam === 'min' || next.fam === 'hdim') {
        r.sc = 'phrygianDominant';
        r.alt = 'altered';
        r.why += ' Because it resolves to a minor chord, use Phrygian dominant (♭9 and ♭13 point to the minor target).';
      } else {
        r.sc = c.q === '7b9' ? 'dimHW' : 'mixolydian';
        r.alt = 'altered';
      }
    } else if (c.fam === 'dom' && next && mod12(c.rootPc - next.rootPc) === 1) {
      r.tag = 'tritone';
      r.fn = `Tritone substitute (subV7 of ${roman(center, next).base})`;
      r.why = `Replaces the normal V7 a tritone away — they share the same 3rd and 7th (swapped). The root slides down a half step into ${next.name}, a smooth chromatic bass line.`;
      r.sc = 'lydianDominant';
      r.alt = 'mixolydian';
    } else if (c.fam === 'dim' && next && mod12(next.rootPc - c.rootPc) === 1) {
      r.tag = 'passing';
      r.fn = `Passing diminished → ${next.name}`;
      r.why = `A chromatic connector: its root moves up a half step into ${next.name}. Diminished 7ths are really rootless 7♭9 chords, so it behaves like a dominant leading into the next chord.`;
      r.sc = 'dimWH';
      r.alt = 'dimHW';
    } else {
      // modal interchange: does the chord fit a parallel scale?
      const parallels = isMinorMode(center.mode) ? ['ionian', 'dorian', 'harmonicMinor', 'melodicMinor'] : ['aeolian', 'mixolydian', 'dorian', 'phrygian', 'harmonicMinor'];
      const from = parallels.find((id) => c.core.every((x) => pcsOf(SCALE_BY_ID[id], center.pc).has(x.pc)));
      if (from) {
        const fromSc = SCALE_BY_ID[from];
        r.tag = 'borrowed';
        r.fn = rel === 0
          ? `Tonic with a modal color (${fromSc.name.replace(/ \(.*\)/, '')})`
          : `Borrowed chord (from ${pretty(T.spell(center.pc, fromSc.deg).root)} ${fromSc.name.replace(/ \(.*\)/, '')})`;
        r.why = `Modal interchange: this chord comes from the parallel ${fromSc.name.replace(/ \(.*\)/, '')} scale on the same root. It adds a darker/brighter color without changing the home key — think “${pretty(c.rootName)} ${SCALE_BY_ID[modeAt(pcsOf(fromSc, center.pc), c.rootPc) || def[0]].name}” here.`;
        r.sc = modeAt(pcsOf(fromSc, center.pc), c.rootPc) || def[0];
        r.alt = def[0] !== r.sc ? def[0] : def[1];
      } else if (c.fam === 'dom') {
        r.tag = 'chromatic';
        if (rel === 10 && next && next.rootPc === center.pc) {
          r.fn = 'Backdoor dominant (♭VII7 → I)';
          r.why = 'A “soft” dominant borrowed from the parallel minor. Instead of resolving down a fifth, it slides up a whole step to the tonic.';
          r.sc = 'lydianDominant';
          r.alt = 'mixolydian';
        } else {
          r.fn = 'Non-resolving dominant';
          r.why = 'A dominant 7th that does not resolve down a fifth. It is used for color (blues/rock style) rather than tension — Mixolydian or Lydian dominant fit best.';
          r.sc = def[0];
          r.alt = def[1];
        }
      } else {
        r.fn = 'Chromatic chord';
        r.why = 'This chord sits outside the key and its relatives. Treat it as a momentary new center and follow its chord tones.';
        r.sc = def[0];
        r.alt = def[1];
      }
    }
    if (r.alt === r.sc) r.alt = null;
    r.others = otherScales(c, [r.sc, r.alt]);
    return r;
  }

  /** Other scales rooted on the chord that contain all of its tones */
  function otherScales(c, exclude) {
    const pcs = c.core.map((x) => x.pc);
    return PREF.filter((id) => !exclude.includes(id))
      .filter((id) => {
        const s = pcsOf(SCALE_BY_ID[id], c.rootPc);
        if (SCALE_BY_ID[id].deg.length <= 6) {
          // pentatonic / blues: no contradictions and must contain the 3rd
          const third = c.core.find((x) => T.degNum(x.d) === 3);
          if (third && !s.has(third.pc)) return false;
          return pcs.every((p) => s.has(p) || (!s.has(mod12(p + 1)) && !s.has(mod12(p - 1))));
        }
        return pcs.every((p) => s.has(p));
      })
      .slice(0, 5);
  }

  /* ------------------------------------------------------------------ */
  /* Scale options for the whole progression                             */
  /* ------------------------------------------------------------------ */
  /**
   * Does scale S contradict chord c? A clash is a scale note that plays the *same role* as a chord tone
   * in a different version: ♭3 vs 3, ♭7 vs 7, ♭5/♯5 when the 5th is missing, ♭9 above the root.
   * Notes that are simply absent (pentatonics) are not clashes.
   */
  // a written tension is contradicted by its neighbor version (♭9 vs 9, 11 vs ♯11, 13 vs ♭13…)
  const TENSION_ALTS = { b2: [1], 2: [-1, 1], '#2': [-1], 4: [1], '#4': [-1], 6: [-1], b6: [1] };
  function chordClashes(S, c, ex) {
    const chordPcs = new Set(c.core.map((x) => x.pc));
    const has = (p) => S.has(mod12(p)) && !chordPcs.has(mod12(p));
    const hasSeventh = c.core.some((x) => T.degNum(x.d) === 7);
    const out = [];
    for (const x of c.core) {
      const n = T.degNum(x.d);
      const d = x.d;
      let alts = [];
      if (n === 3 && (d === '3' || d === 'b3')) alts = ex.bluesy ? [] : [d === '3' ? x.pc - 1 : x.pc + 1];
      else if (n === 7) alts = d === 'b7' ? [x.pc + 1] : d === '7' ? [x.pc - 1] : [];
      else if (n === 5) alts = S.has(x.pc) ? [] : d === '5' ? [x.pc - 1, x.pc + 1] : d === 'b5' ? [x.pc + 1] : [x.pc - 1];
      else if (n === 1) alts = !S.has(x.pc) ? [x.pc + 1].concat(hasSeventh ? [x.pc - 1] : []) : ex.parentSame || ex.bluesy ? [] : [x.pc + 1];
      else if (TENSION_ALTS[d] && !(d === '4' && c.fam === 'sus')) alts = TENSION_ALTS[d].map((k) => x.pc + k);
      const hit = alts.find((a) => has(a));
      if (hit !== undefined) out.push({ chord: c, tone: x, clashPc: mod12(hit) });
    }
    return out;
  }

  function globalOptions(chords, center) {
    const total = chords.reduce((a, c) => a + c.beats, 0);
    const groups = new Map();
    const keyOf = (set) => [...set].sort((a, b) => a - b).join(',');
    const parentKeys = [keyOf(pcsOf(SCALE_BY_ID[center.mode], center.pc))];
    if (isMinorMode(center.mode)) parentKeys.push(keyOf(pcsOf(SCALE_BY_ID.harmonicMinor, center.pc)));
    for (const sc of T.SCALES) {
      if (sc.id === 'bebopDom') continue;
      for (let r = 0; r < 12; r++) {
        const S = pcsOf(sc, r);
        const sKey = keyOf(S);
        let covered = 0;
        let coreTot = 0;
        let contraW = 0;
        const clashes = [];
        chords.forEach((c) => {
          c.core.forEach((x) => {
            coreTot += c.beats;
            if (S.has(x.pc)) covered += c.beats;
          });
          // the blues “blue note”: minor pentatonic/blues of the key over dominant chords is intentional
          const bluesy = ['minorPent', 'blues'].includes(sc.id) && r === center.pc && c.fam === 'dom';
          if (bluesy && center.blues) return;
          const cl = chordClashes(S, c, { bluesy, parentSame: parentKeys.includes(sKey) });
          if (cl.length) {
            contraW += c.beats;
            clashes.push(...cl);
          }
        });
        const cand = { sc, root: r, coverage: covered / coreTot, contra: contraW / total, clashes };
        if (cand.contra > 0.5 || cand.coverage < 0.45) continue;
        const key = sKey + (cand.contra ? '' : 'ok');
        const prev = groups.get(key);
        const rank = (x) => (x.root === center.pc ? 0 : x.root === chords[0].rootPc ? 1 : 2) * 100 + PREF.indexOf(x.sc.id);
        if (!prev) groups.set(key, { best: cand, siblings: [cand] });
        else {
          prev.siblings.push(cand);
          if (rank(cand) < rank(prev.best)) prev.best = cand;
        }
      }
    }
    const list = [...groups.values()]
      .map((g) => Object.assign(g.best, { siblings: g.siblings.filter((s) => s !== g.best) }))
      // 7+ note scales only make sense rooted on the center; off-center ones are exotic noise
      .filter((o) => o.sc.deg.length < 7 || o.root === center.pc);
    const centerMode = center.blues ? 'blues' : center.mode;
    list.sort(
      (a, b) =>
        a.contra - b.contra ||
        (b.sc.id === centerMode && b.root === center.pc) - (a.sc.id === centerMode && a.root === center.pc) ||
        b.coverage - a.coverage ||
        (a.root === center.pc ? 0 : 1) - (b.root === center.pc ? 0 : 1) ||
        PREF.indexOf(a.sc.id) - PREF.indexOf(b.sc.id)
    );
    // blues: put the blues & minor pentatonic first, they are THE sound
    if (center.blues) {
      const pick = (id) => list.findIndex((o) => o.sc.id === id && o.root === center.pc);
      ['minorPent', 'blues'].forEach((id) => {
        const k = pick(id);
        if (k > 0) list.unshift(list.splice(k, 1)[0]);
      });
    }
    const good = list.filter((o) => o.contra <= 0.34);
    return (good.length >= 3 ? good : list.slice(0, 3)).slice(0, 8);
  }

  /* ------------------------------------------------------------------ */
  /* Pattern recognition & narrative                                     */
  /* ------------------------------------------------------------------ */
  const TEMPLATES = [
    [['I', 'V', 'vi', 'IV'], 'The “axis” pop progression (I–V–vi–IV) — Let It Be, With or Without You, No Woman No Cry and countless hits.'],
    [['vi', 'IV', 'I', 'V'], 'The axis progression starting on vi — same four chords, but the minor start gives it a melancholic feel.'],
    [['I', 'vi', 'IV', 'V'], 'The 50s / doo-wop progression (Stand By Me, Every Breath You Take).'],
    [['I', 'vi', 'ii', 'V'], 'The “rhythm changes” turnaround (I–vi–ii–V) — the classic jazz way to cycle back to the top.'],
    [['iii', 'vi', 'ii', 'V'], 'A circle-of-fifths turnaround (iii–vi–ii–V) — every chord a fifth above the next.'],
    [['i', '♭VII', '♭VI', 'V'], 'The Andalusian cadence — flamenco, Hit the Road Jack, Stairway to Heaven’s outro.'],
    [['i', '♭VI', '♭III', '♭VII'], 'The epic minor progression (i–♭VI–♭III–♭VII) — film scores and power ballads.'],
    [['vi', 'IV', 'V'], 'A minor-start pop cadence (vi–IV–V).'],
    [['I', '♭VII', 'IV'], 'The Mixolydian rock cadence (I–♭VII–IV) — Sweet Child O’ Mine, Hey Jude coda, Gloria.'],
    [['I', 'IV', 'V'], 'The three-chord foundation (I–IV–V) of rock, blues, folk and country.'],
    [['i', 'iv', 'v'], 'A natural-minor i–iv–v progression — modal, folky; no leading tone.'],
    [['i', 'IV'], 'A Dorian vamp (i–IV) — Oye Como Va, Evil Ways. The IV major chord carries the Dorian natural 6.'],
    [['i', '♭II'], 'A Phrygian vamp (i–♭II) — metal and flamenco menace.'],
    [['I', 'II'], 'A Lydian vamp (I–II) — floating and cinematic; the II chord contains the ♯4.'],
    [['i', '♭VII'], 'An Aeolian/Dorian rock vamp (i–♭VII) — All Along the Watchtower style.'],
  ];

  function findPatterns(chords, an, center) {
    const out = [];
    // merge consecutive duplicates for motion analysis
    const seq = [];
    chords.forEach((c, i) => {
      if (!seq.length || seq[seq.length - 1].c.name !== c.name) seq.push({ c, a: an[i] });
    });
    const m = seq.length;
    const down5 = (a, b) => mod12(a.rootPc - b.rootPc) === 7;
    const used = new Set();
    for (let i = 0; i + 2 < m; i++) {
      const [x, y, z] = [seq[i].c, seq[i + 1].c, seq[i + 2].c];
      if ((x.fam === 'min' || x.fam === 'hdim') && y.fam === 'dom' && down5(x, y) && down5(y, z)) {
        const minor = x.fam === 'hdim';
        const toMinor = z.fam === 'min' || z.fam === 'hdim';
        const home = z.rootPc === center.pc;
        out.push(
          `<strong>${minor ? 'Minor ' : ''}ii–V–${toMinor ? 'i' : 'I'}: ${x.name} → ${y.name} → ${z.name}</strong>${
            home ? ' — the strongest cadence in tonal music, resolving to the home chord.' : ` — a ii–V–I that <em>tonicizes</em> ${z.name} (${seq[i + 2].a.rn.full}): for two bars, ${pretty(z.rootName)} feels like a temporary key.`
          } Guide tones: the 7th of ${x.name} (${pretty(x.names[3] || x.names[2])}) falls to the 3rd of ${y.name} (${pretty(y.names[1])}); the 7th of ${y.name} (${pretty(y.names[3])}) falls to the 3rd of ${z.name} (${pretty(z.names[1])}).`
        );
        used.add(i + 1);
      }
    }
    for (let i = 0; i + 1 < m; i++) {
      const [y, z] = [seq[i].c, seq[i + 1].c];
      if (used.has(i) || y.fam !== 'dom' || !down5(y, z) || center.blues) continue;
      out.push(`<strong>Dominant resolution: ${y.name} → ${z.name}.</strong> The 3rd of ${y.name} (${pretty(y.names[1])}) rises a half step and its 7th (${pretty(y.names[3])}) falls — land on those target notes when the chord changes.`);
    }
    // circle of fifths chain
    let run = 1;
    let best = 1;
    for (let i = 0; i + 1 < m; i++) {
      run = down5(seq[i].c, seq[i + 1].c) ? run + 1 : 1;
      best = Math.max(best, run);
    }
    if (best >= 4) out.push(`<strong>Circle-of-fifths motion</strong> — ${best} chords in a row move down a fifth. This is the engine of jazz standards and baroque music: each chord “resolves” into the next.`);
    // named templates (progressions loop, so test rotations too)
    const bases = seq.map((s) => s.a.rn.base);
    const doubled = bases.concat(bases);
    for (const [tpl, txt] of TEMPLATES) {
      if (tpl.length > m) continue;
      let hit = false;
      for (let i = 0; i < m && !hit; i++) hit = tpl.every((t, k) => doubled[i + k] === t);
      if (hit) {
        out.push(txt);
        break;
      }
    }
    if (center.blues) out.unshift(`<strong>Blues form.</strong> All dominant 7th chords on I, IV and V. Classic blues harmony is not “in a key” the textbook way — the tension between the major 3rds in the chords and the ♭3 in the melody <em>is</em> the sound.`);
    return out;
  }

  function strategy(chords, an, center, opts) {
    const safe = opts.find((o) => o.contra === 0 && o.sc.deg.length <= 6);
    const full = opts.find((o) => o.contra === 0 && o.sc.deg.length >= 7);
    const steps = [];
    if (safe) steps.push(`<strong>Level 1 — safe:</strong> ${optName(safe)}. Few notes, no clashes. Focus on rhythm, space and bending into the target notes.`);
    else if (center.blues) steps.push(`<strong>Level 1:</strong> ${pretty(centerRootName(center))} minor pentatonic / blues scale over everything.`);
    if (full) steps.push(`<strong>Level 2 — the parent scale:</strong> ${optName(full)} covers every chord. Emphasize the chord tones of each chord on strong beats.`);
    const changers = an.map((a, i) => ({ a, c: chords[i] })).filter((x) => x.a.tag !== 'diatonic');
    if (changers.length) {
      const uniq = [...new Map(changers.map((x) => [x.c.name, x])).values()];
      steps.push(
        `<strong>${full ? 'Level 3' : 'Level 2'} — follow the changes:</strong> switch scales on the chords outside the key: ` +
          uniq.map((x) => `${x.c.name} → ${pretty(x.c.rootName)} ${SCALE_BY_ID[x.a.sc].name}`).join('; ') +
          '.'
      );
    }
    const targets = [...new Map(chords.map((c) => [c.name, c])).values()]
      .map((c) => {
        const t3 = c.core.find((x) => T.degNum(x.d) === 3);
        return t3 ? `${pretty(t3.name)} on ${c.name}` : null;
      })
      .filter(Boolean);
    if (targets.length) steps.push(`<strong>Target notes (3rds):</strong> ${targets.join(' · ')}. Landing on these exactly when the chord changes is what makes a solo “follow the changes”.`);
    return steps;
  }

  const optName = (o) => `${pretty(T.spell(o.root, o.sc.deg).root)} ${o.sc.name}`;

  /* ------------------------------------------------------------------ */
  /* View                                                                */
  /* ------------------------------------------------------------------ */
  const EXAMPLES = [
    ['Pop', 'C G Am F'],
    ['Jazz ii–V–I', 'Dm7 | G7 | Cmaj7 | Cmaj7'],
    ['Dorian vamp', 'Am7 D7'],
    ['Andalusian', 'Am G F E7'],
    ['12-bar blues', 'A7 | D7 | A7 | A7 | D7 | D7 | A7 | A7 | E7 | D7 | A7 | E7'],
    ['Secondary dominants', 'Cmaj7 A7 | Dm7 G7 | Em7 A7 | Dm7 G7'],
    ['Borrowed iv', 'Cmaj7 | Fmaj7 | Fm6 | Cmaj7'],
    ['Autumn-style', 'Cm7 | F7 | Bbmaj7 | Ebmaj7 | Am7b5 | D7 | Gm6 | Gm6'],
    ['Tritone sub', 'Dm7 | Db7 | Cmaj7 | Cmaj7'],
    ['Passing dim', 'C | C#dim7 | Dm7 | G7'],
    ['Epic minor', 'Em C G D'],
  ];

  let root, fb, labelApi;
  const st = { input: store.get('anInput', 'Cmaj7 A7 | Dm7 G7 | Em7 A7 | Dm7 G7'), forced: null, chords: [], centers: [], center: null, an: [], opts: [], sel: 0, view: null, labels: 'intervals' };

  const view = {
    init(el) {
      root = el;
      el.innerHTML = `
        <div class="view-head">
          <div><p class="eyebrow">Progression analyzer</p><h1>What can I play over this?</h1>
          <p class="sub">Type any chord progression. You’ll get the key, the role of every chord, all the scales that fit — and the theory that explains why.</p></div>
        </div>

        <div class="card an-input-card">
          <form id="anForm" class="an-form" autocomplete="off">
            <input id="anInput" class="an-input" type="text" spellcheck="false" placeholder="e.g.  Dm7 G7 | Cmaj7 | A7" aria-label="Chord progression">
            <button class="btn primary big" type="submit">Analyze</button>
          </form>
          <p class="hint an-syntax">Separate chords with spaces (1 bar each) or use <code>|</code> for bars: <code>Dm7 G7 | Cmaj7</code> = two chords in bar 1. <code>%</code> repeats the previous bar. Understands <code>m7 7 maj7 m7b5 ø dim7 6 m6 9 13 7b9 7#9 alt 7#11 sus4 add9 /bass</code> and more.</p>
          <div class="chips small an-examples" id="anExamples">${EXAMPLES.map(([n, p]) => `<button type="button" data-p="${esc(p)}">${n}</button>`).join('')}</div>
          <div class="an-error" id="anError"></div>
        </div>

        <div id="anResults" hidden>
          <div class="card an-summary">
            <div class="an-key">
              <span class="muted small">Tonal center</span>
              <div class="an-key-name" id="anKey"></div>
              <div class="muted" id="anKeySub"></div>
            </div>
            <div class="an-key-side">
              <div class="ctl"><label for="anCenter">Not what you hear? Choose another center</label><select id="anCenter"></select></div>
              <div class="btn-row">
                <button class="btn" id="anHear">▶ Hear it</button>
                <button class="btn primary" id="anFocus" title="Play along chord by chord: the current chord and its scale, the next chord coming, and why each scale works">◎ Focus view</button>
                <button class="btn" id="anJam">Jam over it →</button>
              </div>
            </div>
          </div>

          <div class="card">
            <h3>Chords &amp; their roles</h3>
            <div class="an-strip" id="anStrip"></div>
            <div class="an-legend">
              <span class="ftag diatonic">Diatonic</span><span class="ftag secondary">Secondary dominant</span><span class="ftag tritone">Tritone sub</span>
              <span class="ftag borrowed">Borrowed</span><span class="ftag harmonic">Harmonic minor</span><span class="ftag passing">Passing</span><span class="ftag blues">Blues</span><span class="ftag chromatic">Chromatic</span>
            </div>
          </div>

          <div class="grid-2 align-start">
            <div class="card">
              <h3>Scales for the whole progression</h3>
              <p class="hint">Ranked by how well each scale fits every chord. Tap one to see it on the neck.</p>
              <div class="an-opts" id="anOpts"></div>
            </div>
            <div class="card an-detail" id="anDetail"></div>
          </div>

          <div class="card fb-card">
            <div class="row-between an-fb-head"><div id="anShowing" class="small"></div><div id="anLabels"></div></div>
            <div class="fb-scroll"><div id="anFb"></div></div>
            <div class="fb-foot"><div class="legend">
              <span><i class="dot role-root"></i>Chord root</span><span><i class="dot role-third"></i>3rd</span><span><i class="dot role-fifth"></i>5th</span>
              <span><i class="dot role-seventh"></i>7th</span><span><i class="dot role-other"></i>Other scale tones</span>
            </div></div>
          </div>

          <div class="card">
            <h3>The theory behind it</h3>
            <div class="an-theory" id="anTheory"></div>
          </div>

          <div class="card">
            <h3>Chord by chord</h3>
            <div class="table-wrap"><table class="an-table" id="anTable"></table></div>
          </div>
        </div>`;

      fb = new GT.Fretboard($('#anFb', el), Object.assign(GT.fbOpts(), { onClick: (s, f) => A.pluck(GT.tuning()[s] + f, undefined, { vel: 0.9 }) }));
      $('#anInput', el).value = st.input;
      $('#anForm', el).addEventListener('submit', (e) => {
        e.preventDefault();
        st.input = $('#anInput', el).value;
        st.forced = null;
        run();
      });
      $('#anExamples', el).addEventListener('click', (e) => {
        const b = e.target.closest('button[data-p]');
        if (!b) return;
        $('#anInput', el).value = st.input = b.dataset.p;
        st.forced = null;
        run();
      });
      $('#anCenter', el).addEventListener('change', (e) => {
        st.forced = +e.target.value;
        analyze();
      });
      $('#anStrip', el).addEventListener('click', (e) => {
        const b = e.target.closest('[data-i]');
        if (!b) return;
        selectChord(+b.dataset.i, true);
      });
      $('#anOpts', el).addEventListener('click', (e) => {
        const b = e.target.closest('[data-o]');
        if (!b) return;
        const o = st.opts[+b.dataset.o];
        st.view = { id: o.sc.id, root: o.root, label: 'Whole progression' };
        renderOpts();
        renderFretboard();
      });
      $('#anDetail', el).addEventListener('click', (e) => {
        const f = e.target.closest('[data-fx]');
        if (f) return fxOpen(+f.dataset.fx);
        const b = e.target.closest('[data-sc]');
        if (!b) return;
        st.view = { id: b.dataset.sc, root: st.chords[st.sel].rootPc, label: st.chords[st.sel].name };
        renderOpts();
        renderDetail();
        renderFretboard();
      });
      $('#anTable', el).addEventListener('click', (e) => {
        const tr = e.target.closest('[data-i]');
        if (tr) selectChord(+tr.dataset.i, true);
      });
      labelApi = ui.seg($('#anLabels', el), [{ v: 'intervals', label: 'Chord degrees' }, { v: 'notes', label: 'Notes' }, { v: 'scale', label: 'Scale degrees' }], st.labels, (v) => {
        st.labels = v;
        renderFretboard();
      });
      $('#anHear', el).addEventListener('click', hear);
      $('#anJam', el).addEventListener('click', jam);
      $('#anFocus', el).addEventListener('click', () => fxOpen(st.sel));
      run();
    },
    show(params) {
      if (params.p) {
        $('#anInput', root).value = st.input = params.p;
        st.forced = null;
        run();
      }
      fb.set(GT.fbOpts());
      if (st.chords.length) renderFretboard();
    },
    hide() {
      stopHear();
      fxClose();
    },
    transport: () => (fx.open ? fxTransport() : hear()),
  };

  function run() {
    store.set('anInput', st.input);
    const { chords, errors } = parseProgression(st.input);
    const err = $('#anError', root);
    err.innerHTML = errors.length ? `Couldn’t read: ${errors.map((e) => `<code>${esc(e)}</code>`).join(' ')} — check the spelling (e.g. <code>F#m7</code>, <code>Bb7</code>, <code>Ebmaj7</code>).` : '';
    st.chords = chords;
    if (!chords.length) {
      $('#anResults', root).hidden = true;
      return;
    }
    $('#anResults', root).hidden = false;
    st.centers = rankCenters(chords);
    analyze();
  }

  function analyze() {
    stopHear();
    const chords = st.chords;
    st.center = st.forced !== null ? st.centers[st.forced] : st.centers[0];
    const center = st.center;
    st.an = chords.map((c, i) => analyzeChord(c, i, chords, center));
    st.opts = globalOptions(chords, center);
    st.sel = 0;
    st.view = st.opts.length ? { id: st.opts[0].sc.id, root: st.opts[0].root, label: 'Whole progression' } : null;

    // summary
    const sc = SCALE_BY_ID[center.mode];
    const uniq = [...new Map(chords.map((c, i) => [c.name, i])).values()];
    const diat = uniq.filter((i) => ['diatonic', 'harmonic'].includes(st.an[i].tag)).length;
    $('#anKey', root).textContent = centerName(center);
    $('#anKeySub', root).innerHTML = center.blues
      ? 'Dominant-chord blues · minor pentatonic + Mixolydian territory'
      : `${sc.name} · ${diat} of ${uniq.length} chord${uniq.length > 1 ? 's' : ''} inside the key`;
    $('#anCenter', root).innerHTML = st.centers
      .slice(0, 6)
      .map((c, i) => `<option value="${i}" ${c === center ? 'selected' : ''}>${centerName(c)}${i === 0 ? ' (detected)' : ''}</option>`)
      .join('');

    $('#anStrip', root).innerHTML = chords
      .map(
        (c, i) => `<button class="an-chord" data-i="${i}" style="flex-grow:${c.beats}">
          <span class="an-cn">${c.name}</span><span class="an-rn">${st.an[i].rn.full}</span>
          <span class="ftag ${st.an[i].tag}">${shortTag(st.an[i])}</span></button>`
      )
      .join('');

    renderOpts();
    renderTheory();
    renderTable();
    selectChord(0, false);
  }

  function shortTag(a) {
    return { diatonic: 'Diatonic', secondary: a.fn.startsWith('Dominant') ? 'Dominant' : 'Sec. dom.', tritone: 'Tritone sub', borrowed: 'Borrowed', harmonic: 'Harm. minor', passing: 'Passing', blues: 'Blues', chromatic: 'Chromatic' }[a.tag];
  }

  function renderOpts() {
    const nameOf = (o) => `${pretty(T.spell(o.root, o.sc.deg).root)} ${o.sc.name}`;
    $('#anOpts', root).innerHTML = st.opts.length
      ? st.opts
          .map((o, i) => {
            const fits = o.contra === 0 && o.coverage > 0.99;
            const label = fits ? 'Fits every chord' : o.contra === 0 ? 'Safe — no clashes' : 'Works with care';
            const cls = fits ? 'good' : o.contra === 0 ? 'safe' : 'care';
            const sib = o.siblings.filter((s) => s.sc.deg.length === o.sc.deg.length && !s.sc.base).slice(0, 2);
            const clashTxt = dedupeClashes(o)
              .slice(0, 2)
              .map((x) => `Over <strong>${x.chord.name}</strong>, avoid ${pretty(noteNameIn(o, x.clashPc))} — it clashes with ${pretty(x.tone.name)} (${prettyDeg(x.tone.d)} of the chord).`)
              .join(' ');
            const on = st.view && st.view.id === o.sc.id && st.view.root === o.root ? 'on' : '';
            return `<button class="an-opt ${on}" data-o="${i}">
              <div class="an-opt-head"><strong>${nameOf(o)}</strong><span class="fit ${cls}">${label}</span></div>
              <div class="an-opt-meta"><span class="cov"><i style="width:${Math.round(o.coverage * 100)}%"></i></span><span class="muted small">${Math.round(o.coverage * 100)}% of chord tones</span></div>
              <p class="small muted">${o.sc.mood}${sib.length ? ` Same notes as ${sib.map((s) => `${pretty(T.spell(s.root, s.sc.deg).root)} ${s.sc.name.replace(/ \(.*\)/, '')}`).join(', ')}.` : ''}</p>
              ${clashTxt ? `<p class="small clash">${clashTxt}</p>` : ''}
            </button>`;
          })
          .join('')
      : '<p class="muted">No single scale covers this progression without clashes — follow the chord-by-chord scales instead.</p>';
  }

  function dedupeClashes(o) {
    const m = new Map();
    o.clashes.forEach((x) => m.set(x.chord.name + x.tone.d, x));
    return [...m.values()];
  }
  function noteNameIn(o, pc) {
    return ui.nameMap(o.root, o.sc.deg).map.get(pc) || T.SHARPS[pc];
  }

  function selectChord(i, fromUser) {
    st.sel = i;
    $$('.an-chord', root).forEach((b, k) => b.classList.toggle('on', k === i));
    $$('#anTable tr[data-i]', root).forEach((r, k) => r.classList.toggle('on', +r.dataset.i === i));
    const c = st.chords[i];
    const a = st.an[i];
    if (fromUser) {
      st.view = { id: a.sc, root: c.rootPc, label: c.name };
      A.strum(ui.voicing(c.rootPc, c.q), undefined, { vel: 0.7 });
      renderOpts();
    }
    renderDetail();
    renderFretboard();
  }

  function renderDetail() {
    const i = st.sel;
    const c = st.chords[i];
    const a = st.an[i];
    const next = st.chords.length > 1 ? st.chords[(i + 1) % st.chords.length] : null;
    const scBtn = (id, label) => {
      if (!id) return '';
      const on = st.view && st.view.id === id && st.view.root === c.rootPc ? 'on' : '';
      return `<button class="an-scbtn ${on}" data-sc="${id}"><span class="muted small">${label}</span><strong>${pretty(T.spell(c.rootPc, SCALE_BY_ID[id].deg).root)} ${SCALE_BY_ID[id].name}</strong></button>`;
    };
    let guide = '';
    if (next && next.name !== c.name) guide = `<h3>Guide tones → ${next.name}</h3><div class="now-guide">${guidePairs(c, next).map(gtHtml).join('')}</div>`;
    $('#anDetail', root).innerHTML = `
      <div class="row-between"><div><div class="now-chord">${c.name}</div><div class="now-rn">${a.rn.full} · <span class="ftag ${a.tag}">${a.fn}</span></div></div>
        <button class="btn sm" data-fx="${i}">◎ Focus view</button></div>
      <p class="an-why">${a.why}</p>
      <div class="now-tones">${c.core.map((x) => `<span class="tone role-${T.roleOf(x.d)}"><b>${pretty(x.name)}</b><small>${prettyDeg(x.d)}</small></span>`).join('')}</div>
      <h3>Scales for this chord</h3>
      <div class="an-scales">${scBtn(a.sc, 'Best choice')}${scBtn(a.alt, 'Alternative')}</div>
      ${a.others.length ? `<div class="an-scales more">${a.others.map((id) => scBtn(id, 'Also fits')).join('')}</div>` : ''}
      ${guide}`;
  }

  /** Fretboard dots for a scale, colored by the tones of chord c */
  function neckFor(c, id, sRoot, labels) {
    const scale = SCALE_BY_ID[id];
    const nm = ui.nameMap(sRoot, scale.deg);
    const role = new Map(c.core.map((x) => [x.pc, x.d]));
    const notes = T.neckNotes(GT.tuning(), sRoot, scale.deg, +GT.settings.frets).map((n) => {
      const pc = n.m % 12;
      const cd = role.get(pc);
      const label = labels === 'notes' ? pretty(nm.map.get(pc)) : labels === 'scale' ? prettyDeg(n.deg) : cd ? prettyDeg(cd) : REL[mod12(pc - c.rootPc)];
      return { s: n.s, f: n.f, pc, label, cls: cd ? 'role-' + T.roleOf(cd) : 'role-other' };
    });
    return { notes, nm, scale };
  }

  function renderFretboard() {
    if (!st.view) return;
    const c = st.chords[st.sel];
    const { notes, nm, scale } = neckFor(c, st.view.id, st.view.root, st.labels);
    fb.draw(notes);
    $('#anShowing', root).innerHTML = `Showing <strong>${pretty(nm.root)} ${scale.name}</strong> <span class="muted">(${st.view.label})</span> · colored dots = tones of <strong>${c.name}</strong>`;
  }
  const REL = ['1', '♭9', '9', '♯9', '3', '11', '♯11', '5', '♭13', '13', '♭7', '7'];

  function renderTheory() {
    const chords = st.chords;
    const center = st.center;
    const sc = SCALE_BY_ID[center.mode];
    const uniq = [...new Map(chords.map((c, i) => [c.name, i])).values()];
    const parts = [];

    // 1. center
    const rootName = pretty(centerRootName(center));
    if (center.blues) {
      parts.push(`<p><strong>Home: ${rootName}.</strong> The progression starts and lives on ${chords[0].name}, with dominant chords on the IV and V. That makes it a blues: the melody traditionally uses the ${rootName} minor pentatonic / blues scale <em>against</em> major-sounding chords.</p>`);
    } else {
      const diat = uniq.filter((i) => st.an[i].tag === 'diatonic');
      const parentRel = center.mode === 'ionian' || center.mode === 'aeolian' ? null : T.relatives(sc, center.pc).find((r) => r.scale.id === 'ionian');
      let p = `<p><strong>Home: ${centerName(center)}.</strong> `;
      if (st.forced === null) {
        const why = [];
        if (chords[0].rootPc === center.pc) why.push('the progression starts on it');
        if (chords[chords.length - 1].rootPc === center.pc) why.push('it ends there');
        if (!why.length) why.push('it best explains the chords');
        p += `${chords.find((c) => c.rootPc === center.pc)?.name || rootName} sounds like home because ${why.join(' and ')}. `;
      }
      p += `${diat.length} of ${uniq.length} different chords are built only from the notes of ${rootName} ${sc.name.replace(/ \(.*\)/, '')}.`;
      if (parentRel) p += ` Those are the same notes as ${pretty(parentRel.rootName)} major — but with ${rootName} as the center, the mode’s color comes out.`;
      if (sc.char.length && !['ionian', 'aeolian'].includes(center.mode)) {
        const charPcs = sc.char.map((d) => ({ d, pc: mod12(center.pc + DEG_SEMI[d]) }));
        const carrier = uniq.map((i) => chords[i]).find((c) => c.core.some((x) => charPcs.some((cp) => cp.pc === x.pc)));
        if (carrier) {
          const cp = charPcs.find((cp) => carrier.core.some((x) => x.pc === cp.pc));
          p += ` The giveaway is ${carrier.name}: it contains ${pretty(carrier.core.find((x) => x.pc === cp.pc).name)}, the ${prettyDeg(cp.d)} of ${rootName} — ${sc.name}’s characteristic note.`;
        }
      }
      p += '</p>';
      parts.push(p);
      if (uniq.length === 1) parts.push(`<p>With a single chord, <em>you</em> choose the color: every scale listed as “fits every chord” works — each gives a different mood. Try them one after another over the drone of the chord.</p>`);
    }

    // 2. patterns
    const pats = findPatterns(chords, st.an, center);
    if (pats.length) parts.push(`<h4>What’s happening harmonically</h4><ul>${pats.map((p) => `<li>${p}</li>`).join('')}</ul>`);

    // 3. outside chords
    const outside = [...new Map(chords.map((c, i) => [c.name, i])).values()].filter((i) => !['diatonic'].includes(st.an[i].tag));
    if (outside.length && !center.blues) {
      parts.push(
        `<h4>Chords outside the key</h4><ul>${outside
          .map((i) => `<li><strong>${chords[i].name}</strong> (${st.an[i].rn.full}) — <em>${st.an[i].fn}.</em> ${st.an[i].why}</li>`)
          .join('')}</ul>`
      );
    }

    // 4. strategy
    const steps = strategy(chords, st.an, center, st.opts);
    parts.push(`<h4>How to improvise over it</h4><ol>${steps.map((s) => `<li>${s}</li>`).join('')}</ol>`);
    $('#anTheory', root).innerHTML = parts.join('');
  }

  function renderTable() {
    $('#anTable', root).innerHTML =
      `<thead><tr><th>Chord</th><th>Numeral</th><th>Function</th><th>Scale</th><th>Alternative</th><th>Chord tones</th></tr></thead><tbody>` +
      st.chords
        .map((c, i) => {
          const a = st.an[i];
          const sn = (id) => (id ? `${pretty(T.spell(c.rootPc, SCALE_BY_ID[id].deg).root)} ${SCALE_BY_ID[id].name}` : '—');
          return `<tr data-i="${i}"><td><strong>${c.name}</strong></td><td>${a.rn.full}</td><td><span class="ftag ${a.tag}">${a.fn}</span></td><td>${sn(a.sc)}</td><td class="muted">${sn(a.alt)}</td><td class="mono">${c.core.map((x) => pretty(x.name)).join(' ')}</td></tr>`;
        })
        .join('') +
      '</tbody>';
  }

  /** Guide tones (3rds, 7ths, 6ths) of c, each paired with the nearest guide tone of the next chord */
  function guidePairs(c, next) {
    const g = (ch) => ch.core.filter((x) => [3, 7].includes(T.degNum(x.d)) || x.d === '6');
    return g(c)
      .map((x) => {
        let best = null;
        g(next).forEach((y) => {
          const dist = Math.min(mod12(y.pc - x.pc), mod12(x.pc - y.pc));
          if (!best || dist < best.dist) best = { x, y, dist };
        });
        return best;
      })
      .filter(Boolean);
  }
  const gtHtml = (p) => `<span class="gt">${pretty(p.x.name)}<small>${prettyDeg(p.x.d)}</small> → ${pretty(p.y.name)}<small>${prettyDeg(p.y.d)}</small>${p.dist === 0 ? ' <em>common</em>' : ''}</span>`;

  /* ------------------------------------------------------------------ */
  /* Focus view — play along chord by chord                              */
  /* ------------------------------------------------------------------ */
  // what each scale brings when you pick it as the variation
  const VARIATION_WHY = {
    ionian: 'The plain major sound. The natural 4 gives a more “inside” pop/folk flavor — just treat it as a passing note.',
    lydian: 'Raising the 4 to ♯11 removes the only avoid note over a major chord, so every note can ring. Brighter and more modern — film scores, Satriani.',
    mixolydian: 'The basic dominant sound: natural 9 and 13, no extra tension. Bluesy and relaxed.',
    lydianDominant: '♯11 instead of 11 means no avoid note: a bright, floating dominant. Best on dominants that don’t resolve down a fifth (tritone subs, ♭VII7, blues IV7).',
    altered: 'Keeps the root, 3rd and ♭7 and alters everything else (♭9 ♯9 ♭5 ♭13). Maximum tension that resolves hard into the next chord — use it on the last beats before the change.',
    phrygianDominant: 'Mixolydian with ♭9 and ♭13 — notes borrowed from the minor chord it resolves to. Spanish / Middle-Eastern flavor; the classic choice for a V7 going to minor.',
    dimHW: 'Half-whole diminished: ♭9, ♯9, ♯11 and 13 together. Symmetrical — move any lick 3 frets and it still fits.',
    dimWH: 'Whole-half diminished: every chord tone plus a note a whole step above it. Symmetrical — shapes repeat every 3 frets.',
    dorian: 'Minor with a natural 6 (13): brighter and jazzier than natural minor, no avoid note over m7. Santana, So What, funk.',
    aeolian: 'Natural minor: the ♭6 (♭13) makes it darker and sadder. Rock ballads — treat the ♭6 as a passing note.',
    phrygian: 'The ♭2 right above the root sounds dark and Spanish — metal and flamenco.',
    melodicMinor: 'Minor with natural 6 and 7: a smooth, sophisticated minor-tonic sound (m6, m(maj7)).',
    harmonicMinor: 'Minor with a raised 7th: exotic and classical, with a strong pull to the tonic.',
    locrianNat2: 'Locrian with a natural 9: removes the ♭9 avoid note over m7♭5 — the jazz standard choice.',
    locrian: 'The diatonic choice: it matches the key, but its ♭9 sits a half step above the root — use it as a passing note.',
    wholeTone: 'All whole steps: dreamy and unresolved; fits augmented and 7♯5 chords perfectly.',
    minorPent: 'Only five notes and no half steps — nothing can clash. Safe, vocal and bluesy.',
    majorPent: 'Five sweet notes with no avoid notes at all — country, soul and pop melodies.',
    blues: 'Minor pentatonic plus the ♭5 blue note: grit and attitude.',
    majorBlues: 'Major pentatonic plus the ♭3 “curl” into the 3rd: happy and gospel, B.B. King.',
    bebopDom: 'Mixolydian plus a passing natural 7: eight notes, so in running 8ths the chord tones land on the beats.',
  };
  const DEG_WORD = { 1: 'root', 2: '9th', 3: '3rd', 4: '11th', 5: '5th', 6: '6th', 7: '7th', 9: '9th', 11: '11th', 13: '13th' };
  const degWord = (d) => {
    const n = T.degNum(d);
    if (n === 1 || n === 3 || n === 7) return DEG_WORD[n];
    return prettyDeg(d.replace(/[0-9]/g, '')) + DEG_WORD[n];
  };
  const scaleTitle = (pc, id) => `${pretty(T.spell(pc, SCALE_BY_ID[id].deg).root)} ${SCALE_BY_ID[id].name}`;
  const near = (a, b) => mod12(a - b) === 1 || mod12(b - a) === 1;

  /**
   * Notes in `to` but not in `from`, paired with the note they replace when it is a half step away.
   * With name maps, a note on the same letter wins (C♯ replaces C rather than D).
   */
  function noteChanges(fromSet, toSet, fromNm, toNm) {
    const add = [...toSet].filter((p) => !fromSet.has(p));
    const drop = [...fromSet].filter((p) => !toSet.has(p));
    const used = new Set();
    const letter = (m, p) => (m && m.get(p) ? m.get(p)[0] : null);
    const out = add.map((p) => {
      const free = drop.filter((q) => !used.has(q) && near(p, q));
      const q = free.find((q) => letter(fromNm, q) && letter(fromNm, q) === letter(toNm, p)) ?? free[0];
      if (q !== undefined) used.add(q);
      return { to: p, from: q };
    });
    drop.filter((q) => !used.has(q)).forEach((q) => out.push({ from: q }));
    return out;
  }

  /** Difference between two scales on the same root, in degrees relative to it */
  function diffText(rootPc, fromId, toId) {
    const mA = ui.nameMap(rootPc, SCALE_BY_ID[fromId].deg).map;
    const mB = ui.nameMap(rootPc, SCALE_BY_ID[toId].deg).map;
    const lab = (p, m) => `<strong>${REL[mod12(p - rootPc)]}</strong> (${pretty(m.get(p))})`;
    const ch = noteChanges(new Set(mA.keys()), new Set(mB.keys()), mA, mB).sort((a, b) => mod12((a.to ?? a.from) - rootPc) - mod12((b.to ?? b.from) - rootPc));
    if (!ch.length) return 'Same notes, different center.';
    return ch.map((x) => (x.to === undefined ? `drops ${lab(x.from, mA)}` : x.from === undefined ? `adds ${lab(x.to, mB)}` : `${lab(x.to, mB)} instead of ${lab(x.from, mA)}`)).join(', ');
  }

  const FX_DEFAULTS = { pick: 'best', labels: 'intervals', bpm: 80 };
  const fx = Object.assign({ open: false, i: 0, clock: null, pos: 0, starts: [], total: 0, opener: null, el: null, fb: null }, FX_DEFAULTS, store.get('anFocus', {}));
  const fxSave = () => store.set('anFocus', { pick: fx.pick, labels: fx.labels, bpm: fx.bpm });

  const keyOpt = () => st.opts[0] || null;
  /** The variation for chord i: the analyzer's alternative, else the first other scale holding every chord tone */
  const altOf = (i) => st.an[i].alt || st.an[i].others[0] || null;
  /** The scale shown over chord i for the chosen option: best / variation / one scale for the whole progression */
  function fxScale(i, pick = fx.pick) {
    const c = st.chords[i];
    const a = st.an[i];
    if (pick === 'key' && keyOpt()) return { id: keyOpt().sc.id, root: keyOpt().root };
    return { id: pick === 'alt' && altOf(i) ? altOf(i) : a.sc, root: c.rootPc };
  }

  function fxBuild() {
    const el = GT.h(`<div class="fx" id="anFx" role="dialog" aria-modal="true" aria-labelledby="fxTitle" tabindex="-1" hidden>
      <div class="fx-panel">
        <header class="fx-head">
          <div class="fx-title"><p class="eyebrow">Focus view</p><strong id="fxTitle"></strong></div>
          <div class="fx-ctl"><div id="fxPick"></div><div id="fxLabels"></div></div>
          <button class="icon-btn fx-close" id="fxClose" aria-label="Close focus view">✕</button>
        </header>
        <div class="fx-body">
          <div class="an-strip fx-strip" id="fxStrip"></div>
          <div class="fx-main">
            <section class="card fx-now" id="fxNow"></section>
            <aside class="card fx-next" id="fxNextCard"></aside>
          </div>
          <div class="card fb-card fx-fbcard">
            <div class="fb-scroll"><div id="fxFb"></div></div>
            <div class="fb-foot"><div class="legend">
              <span><i class="dot role-root"></i>Chord root</span><span><i class="dot role-third"></i>3rd</span><span><i class="dot role-fifth"></i>5th</span>
              <span><i class="dot role-seventh"></i>7th</span><span><i class="dot role-other"></i>Other scale tones</span><span><i class="dot nxt"></i>Next chord’s target notes</span>
            </div></div>
          </div>
          <div class="fx-main">
            <section class="card fx-why" id="fxWhy"></section>
            <aside class="card fx-var" id="fxVar"></aside>
          </div>
        </div>
        <footer class="fx-bar">
          <button class="btn" id="fxBack" aria-label="Previous chord" title="Previous chord (←)">◀</button>
          <button class="btn primary big" id="fxPlay"></button>
          <button class="btn" id="fxFwd" aria-label="Next chord" title="Next chord (→)">▶</button>
          <label class="fx-tempo"><span>Tempo <output id="fxBpmOut"></output></span><input type="range" id="fxBpm" min="40" max="200" step="2"></label>
          <span class="muted small fx-keys">Space play/pause · ← → chords · Esc close</span>
        </footer>
      </div>
    </div>`);
    document.body.appendChild(el);
    fx.el = el;
    fx.fb = new GT.Fretboard($('#fxFb', el), Object.assign(GT.fbOpts(), { onClick: (s, f) => A.pluck(GT.tuning()[s] + f, undefined, { vel: 0.9 }) }));
    fx.pickApi = ui.seg($('#fxPick', el), [{ v: 'best', label: 'Best scale' }, { v: 'alt', label: 'Variation' }, { v: 'key', label: 'One scale for all' }], fx.pick, (v) => {
      fx.pick = v;
      fxSave();
      fxShow(fx.i);
    });
    ui.seg($('#fxLabels', el), [{ v: 'intervals', label: 'Degrees' }, { v: 'notes', label: 'Notes' }], fx.labels, (v) => {
      fx.labels = v;
      fxSave();
      fxShow(fx.i);
    });
    $('#fxClose', el).addEventListener('click', fxClose);
    $('#fxPlay', el).addEventListener('click', fxTransport);
    $('#fxBack', el).addEventListener('click', () => fxJump(fx.i - 1));
    $('#fxFwd', el).addEventListener('click', () => fxJump(fx.i + 1));
    const bpm = $('#fxBpm', el);
    bpm.addEventListener('input', () => {
      fx.bpm = +bpm.value;
      $('#fxBpmOut', el).textContent = fx.bpm + ' bpm';
      if (fx.clock) fx.clock.bpm = fx.bpm;
      fxSave();
    });
    $('#fxStrip', el).addEventListener('click', (e) => {
      const b = e.target.closest('[data-i]');
      if (b) fxJump(+b.dataset.i);
    });
    $('#fxVar', el).addEventListener('click', (e) => {
      const b = e.target.closest('[data-pick]');
      if (!b) return;
      fx.pick = b.dataset.pick;
      fx.pickApi.set(fx.pick);
      fxSave();
      fxShow(fx.i);
    });
    // click on the dimmed backdrop closes
    el.addEventListener('click', (e) => {
      if (e.target === el) fxClose();
    });
    el.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        fxClose();
      } else if (e.code === 'Space' && !e.target.closest('input, select')) {
        e.preventDefault();
        e.stopPropagation();
        if (!e.repeat) fxTransport();
      } else if ((e.key === 'ArrowLeft' || e.key === 'ArrowRight') && !e.target.closest('input, select')) {
        e.preventDefault();
        fxJump(fx.i + (e.key === 'ArrowRight' ? 1 : -1));
      }
    });
  }

  function fxOpen(i = 0) {
    if (!st.chords.length) return;
    stopHear();
    if (!fx.el) fxBuild();
    fx.opener = document.activeElement;
    fx.open = true;
    fx.el.hidden = false;
    document.body.classList.add('fx-lock');
    fx.fb.set(GT.fbOpts());
    // timeline in beats
    fx.starts = [];
    let b = 0;
    st.chords.forEach((c) => {
      fx.starts.push(b);
      b += c.beats;
    });
    fx.total = b;
    $('#fxTitle', fx.el).textContent = `${centerName(st.center)} · ${st.chords.map((c) => c.name).join('  ')}`;
    $('#fxBpm', fx.el).value = fx.bpm;
    $('#fxBpmOut', fx.el).textContent = fx.bpm + ' bpm';
    $('#fxStrip', fx.el).innerHTML = st.chords
      .map((c, k) => `<button class="an-chord" data-i="${k}" style="flex-grow:${c.beats}"><span class="an-cn">${c.name}</span><span class="an-rn">${st.an[k].rn.full}</span><i class="fx-prog"></i></button>`)
      .join('');
    // without a whole-progression scale the third option has nothing to show
    $('#fxPick button[data-v="key"]', fx.el).hidden = !keyOpt();
    if (fx.pick === 'key' && !keyOpt()) fx.pick = 'best';
    fx.pickApi.set(fx.pick);
    fxSync();
    fxShow(Math.max(0, Math.min(i, st.chords.length - 1)));
    fx.el.focus();
  }

  function fxClose() {
    if (!fx.open) return;
    fxStop();
    fx.open = false;
    fx.el.hidden = true;
    document.body.classList.remove('fx-lock');
    if (st.chords[fx.i]) selectChord(fx.i, false);
    if (fx.opener && fx.opener.focus) fx.opener.focus();
  }

  function fxJump(i) {
    const n = st.chords.length;
    i = ((i % n) + n) % n;
    // playing or paused: continue from the start of that chord
    if (fx.clock) fx.pos = fx.starts[i];
    if (!fx.clock || !fx.clock.running) {
      const c = st.chords[i];
      A.strum(ui.voicing(c.rootPc, c.q), undefined, { vel: 0.7 });
    }
    fxShow(i);
  }

  /* ---- rendering ---- */
  function fxShow(i) {
    fx.i = i;
    const el = fx.el;
    const n = st.chords.length;
    const c = st.chords[i];
    const a = st.an[i];
    const next = n > 1 ? st.chords[(i + 1) % n] : null;
    const cur = fxScale(i);
    const sc = SCALE_BY_ID[cur.id];
    $$('#fxStrip .an-chord', el).forEach((b, k) => {
      b.classList.toggle('on', k === i);
      if (k !== i) b.style.removeProperty('--p');
    });

    const tones = c.core.map((x) => `<span class="tone role-${T.roleOf(x.d)}"><b>${pretty(x.name)}</b><small>${prettyDeg(x.d)}</small></span>`).join('');
    $('#fxNow', el).innerHTML = `
      <div class="fx-label"><span id="fxNowLabel">Now</span><span class="muted small">Chord ${i + 1} of ${n} · ${c.beats} beat${c.beats > 1 ? 's' : ''}</span></div>
      <div class="fx-chord">${c.name}</div>
      <div class="now-rn">${a.rn.full} · <span class="ftag ${a.tag}">${a.fn}</span></div>
      <div class="fx-scale"><span class="muted small">Play</span><strong>${scaleTitle(cur.root, cur.id)}</strong><span class="muted small">${sc.mood}</span></div>
      <div class="now-tones">${tones}</div>
      <div class="fx-beats" id="fxBeats">${'<i></i>'.repeat(c.beats)}</div>`;

    // next chord
    let nextHtml;
    if (!next) {
      nextHtml = `<div class="fx-label"><span>Next</span></div><p class="muted">Only one chord: stay here and try each scale option to hear how the color changes.</p>`;
    } else {
      const na = st.an[(i + 1) % n];
      const ns = fxScale((i + 1) % n);
      const sameScale = ns.id === cur.id && ns.root === cur.root;
      const curNm = ui.nameMap(cur.root, sc.deg).map;
      const nxtNm = ui.nameMap(ns.root, SCALE_BY_ID[ns.id].deg).map;
      const changes = noteChanges(new Set(curNm.keys()), new Set(nxtNm.keys()), curNm, nxtNm);
      const keep = curNm.size - changes.filter((x) => x.from !== undefined).length;
      let change;
      if (sameScale) change = 'Same scale — keep playing, but aim for the new chord’s notes below.';
      else if (!changes.length) change = `Same notes as now — only the center moves to ${pretty(next.rootName)}.`;
      else
        change =
          `Keep ${keep} note${keep === 1 ? '' : 's'}, change ${changes.length === 1 ? 'one' : changes.length}: ` +
          changes
            .map((x) => (x.from === undefined ? `<b>+${pretty(nxtNm.get(x.to))}</b>` : x.to === undefined ? `<s>${pretty(curNm.get(x.from))}</s>` : `${pretty(curNm.get(x.from))} → <b>${pretty(nxtNm.get(x.to))}</b>`))
            .join(', ');
      const pairs = next.name !== c.name ? guidePairs(c, next) : [];
      const third = next.core.find((x) => T.degNum(x.d) === 3);
      nextHtml = `
        <div class="fx-label"><span>Next</span><span class="muted small" id="fxIn"></span></div>
        <div class="fx-chord sm">${next.name}</div>
        <div class="now-rn">${na.rn.full} · <span class="ftag ${na.tag}">${na.fn}</span></div>
        <p class="fx-switch">${sameScale ? 'Stay on' : 'Switch to'} <strong>${scaleTitle(ns.root, ns.id)}</strong></p>
        <p class="small fx-change">${change}</p>
        ${pairs.length ? `<h3>Land on</h3><div class="now-guide">${pairs.map(gtHtml).join('')}</div>` : third ? `<h3>Land on</h3><p class="small">${pretty(third.name)} — the 3rd of ${next.name}.</p>` : ''}`;
    }
    $('#fxNextCard', el).innerHTML = nextHtml;

    // fretboard: current scale + where the next chord's guide tones are
    const { notes } = neckFor(c, cur.id, cur.root, fx.labels);
    if (next && next.name !== c.name) {
      const targets = new Map(guidePairs(c, next).map((p) => [p.y.pc, p.y]));
      if (!targets.size) next.core.filter((x) => T.degNum(x.d) === 3).forEach((x) => targets.set(x.pc, x));
      const has = new Set();
      notes.forEach((nt) => {
        if (targets.has(nt.pc)) {
          nt.cls += ' nxt';
          has.add(nt.pc);
        }
      });
      // targets outside the current scale: hollow markers so you can see where the change goes
      const extra = [...targets.values()].filter((x) => !has.has(x.pc));
      extra.forEach((x) => {
        T.neckNotes(GT.tuning(), x.pc, ['1'], +GT.settings.frets).forEach((p) => {
          notes.push({ s: p.s, f: p.f, pc: x.pc, label: fx.labels === 'notes' ? pretty(x.name) : prettyDeg(x.d), cls: 'nxt nxt-only' });
        });
      });
    }
    fx.fb.draw(notes);

    $('#fxWhy', el).innerHTML = whyHtml(i, cur);
    $('#fxVar', el).innerHTML = variationHtml(i);
    fxBeat(-1);
  }

  /** "Why this scale works here" — built from the actual notes of the chord, the scale and the key */
  function whyHtml(i, cur) {
    const c = st.chords[i];
    const a = st.an[i];
    const sc = SCALE_BY_ID[cur.id];
    const nm = ui.nameMap(cur.root, sc.deg).map;
    const S = new Set(nm.keys());
    const nn = (pc) => pretty(nm.get(pc) || T.SHARPS[pc]);
    const chordPcs = new Set(c.core.map((x) => x.pc));
    const pts = [];

    // 1. the chord tones
    const missing = c.core.filter((x) => !S.has(x.pc));
    if (!missing.length) {
      pts.push(['Covers the chord', `It contains all ${c.core.length} notes of ${c.name} (${c.core.map((x) => pretty(x.name)).join(' ')}). Those are your safe landing notes — hold them on strong beats and they always sound right.`]);
    } else {
      const blue = missing.find((x) => T.degNum(x.d) === 3 && S.has(mod12(x.pc - 1)));
      const rest = missing.filter((x) => x !== blue);
      let s = '';
      if (blue) s += `Instead of the chord’s 3rd (${pretty(blue.name)}) it has ${nn(mod12(blue.pc - 1))}, a half step lower — the “blue note”. Bending it up toward ${pretty(blue.name)} is the classic blues move. `;
      if (rest.length) s += `It leaves out the ${rest.map((x) => `${degWord(x.d)} (${pretty(x.name)})`).join(' and ')}: fewer notes, fewer chances to clash. Add ${rest.length > 1 ? 'them' : 'it'} when you want to spell the chord exactly.`;
      pts.push([blue ? 'Rubs against the chord, on purpose' : 'Covers the chord', s]);
    }

    // 2. relation to the key
    if (!st.center.blues) {
      const keySc = SCALE_BY_ID[st.center.mode];
      const keyNm = ui.nameMap(st.center.pc, keySc.deg).map;
      const P = new Set(keyNm.keys());
      const keyName = centerName(st.center);
      const out = noteChanges(P, S, keyNm, nm).filter((x) => x.to !== undefined);
      if (!out.length) {
        pts.push([
          'Stays in the key',
          S.size === P.size
            ? `It uses the same seven notes as ${keyName}. You don’t need new notes, only a new center: ${pretty(c.rootName)} becomes the note your phrases start and end on.`
            : `Every note belongs to ${keyName}, so it blends with the rest of the progression.`,
        ]);
      } else {
        const items = out.map((x) => {
          const ct = c.core.find((y) => y.pc === x.to);
          return `<strong>${nn(x.to)}</strong>${x.from !== undefined ? ` instead of ${pretty(keyNm.get(x.from))}` : ''}${ct ? ` (the ${degWord(ct.d)} of ${c.name})` : ''}`;
        });
        const lead = a.tag === 'diatonic' ? `The chord itself is in ${keyName}, so these outside notes are a color choice: use them on purpose.` : `${c.name} brings these notes in from outside ${keyName}. Land on them and your solo follows the change instead of ignoring it.`;
        pts.push(['Leaves the key', `Compared with ${keyName} it has ${items.join(', ')}. ${lead}`]);
      }
    }

    // 3. color notes, the scale's signature note, avoid notes
    const color = [...S].filter((p) => !chordPcs.has(p)).sort((x, y) => mod12(x - c.rootPc) - mod12(y - c.rootPc));
    const avoidOf = (p) => (c.fam === 'dim' ? null : c.core.find((x) => mod12(p - x.pc) === 1 && !(c.fam === 'dom' && T.degNum(x.d) === 1)));
    const avoid = color.filter(avoidOf);
    const good = color.filter((p) => !avoidOf(p));
    if (good.length) {
      const sig = sc.char.find((d) => good.includes(mod12(cur.root + DEG_SEMI[d])));
      const sigPc = sig && mod12(cur.root + DEG_SEMI[sig]);
      const sigTxt = sig
        ? ` The <strong>${prettyDeg(sig)}</strong>${cur.root === c.rootPc ? '' : ` of the scale`} (${nn(sigPc)}) is the note that gives ${sc.name.replace(/ \(.*\)/, '')} its sound — feature it.`
        : '';
      pts.push(['Color notes', `On top of the chord it adds ${good.map((p) => `<strong>${REL[mod12(p - c.rootPc)]}</strong> (${nn(p)})`).join(', ')}. These tensions make lines sound richer than plain chord tones.${sigTxt}`]);
    }
    if (avoid.length) {
      pts.push([
        'Handle with care',
        avoid.map((p) => `${nn(p)} (${REL[mod12(p - c.rootPc)]}) is a half step above the ${degWord(avoidOf(p).d)} (${pretty(avoidOf(p).name)})`).join('; ') + '. Pass through it and resolve down. Don’t hold it on a strong beat.',
      ]);
    } else if (S.size >= 7) {
      pts.push(['No avoid notes', 'None of its notes sits a half step above a chord tone, so any note can be held.']);
    }
    // the one-scale option: say where it rubs on this chord
    if (fx.pick === 'key' && keyOpt()) {
      const cl = dedupeClashes(keyOpt()).filter((x) => x.chord === c);
      if (cl.length) pts.push(['Watch out on this chord', cl.map((x) => `avoid ${pretty(noteNameIn(keyOpt(), x.clashPc))}, it clashes with ${pretty(x.tone.name)} (${prettyDeg(x.tone.d)} of the chord)`).join('; ') + '.']);
    }

    return `<h3>Why ${scaleTitle(cur.root, cur.id)} works here</h3>
      <p class="fx-role"><strong>${a.fn}.</strong> ${a.why}</p>
      <ul class="fx-points">${pts.map(([h, t]) => `<li><span class="fx-pt">${h}</span>${t}</li>`).join('')}</ul>`;
  }

  /** The other option for this chord and what changes if you take it */
  function variationHtml(i) {
    const c = st.chords[i];
    const a = st.an[i];
    const btn = (pick, label) => `<button class="btn sm" data-pick="${pick}">${label}</button>`;
    if (fx.pick === 'key') {
      const o = keyOpt();
      return `<h3>Follow the chord instead</h3>
        <p><strong>${scaleTitle(c.rootPc, a.sc)}</strong></p>
        <p class="small muted">${o ? `${scaleTitle(o.root, o.sc.id)} covers the whole progression, so you can stay on one scale. ` : ''}Switching to the chord’s own scale shows its exact color. ${VARIATION_WHY[a.sc] || ''}</p>
        ${btn('best', 'Show chord scales')}`;
    }
    const alt = altOf(i);
    if (!alt) return `<h3>Variation</h3><p class="small muted">No other scale holds every note of ${c.name}: ${scaleTitle(c.rootPc, a.sc)} is the one to use.</p>`;
    const [from, to, title, back] = fx.pick === 'alt' ? [alt, a.sc, 'Compared with the best choice', 'best'] : [a.sc, alt, 'Try the variation', 'alt'];
    return `<h3>${title}</h3>
      <p><strong>${scaleTitle(c.rootPc, to)}</strong></p>
      <p class="small">Compared with ${scaleTitle(c.rootPc, from)}: ${diffText(c.rootPc, from, to)}.</p>
      <p class="small muted">${VARIATION_WHY[to] || SCALE_BY_ID[to].mood}</p>
      ${btn(back, back === 'alt' ? 'Use the variation' : 'Back to best scale')}`;
  }

  /** k = beat within the current chord (-1 = none yet) */
  function fxBeat(k) {
    if (!fx.open) return;
    const c = st.chords[fx.i];
    $$('#fxBeats i', fx.el).forEach((d, j) => d.classList.toggle('on', j <= k));
    const playing = !!(fx.clock && fx.clock.running);
    const left = c.beats - k - 1;
    const inEl = $('#fxIn', fx.el);
    if (inEl) inEl.textContent = playing && k >= 0 ? (left === 0 ? 'now!' : `in ${left} beat${left > 1 ? 's' : ''}`) : '';
    fx.el.classList.toggle('soon', playing && k >= 0 && left <= 1 && st.chords.length > 1);
    const chip = $$('#fxStrip .an-chord', fx.el)[fx.i];
    if (chip) chip.style.setProperty('--p', k < 0 ? 0 : (k + 1) / c.beats);
  }

  /* ---- playback: loops the progression with a 4-beat count-in ---- */
  const fxSync = () => ui.syncTransport($('#fxPlay', fx.el), null, ui.clockState(fx.clock), 'Play along');
  function fxTransport() {
    if (!fx.clock) fxStart();
    else if (fx.clock.running) fx.clock.pause();
    else if (fx.clock.paused) fx.clock.resume();
  }
  function fxStart() {
    A.ensure();
    fx.pos = fx.starts[fx.i];
    const clock = (fx.clock = new A.Clock());
    clock.onStop = () => {
      if (fx.clock === clock) fx.clock = null;
      fxSync();
      fxBeat(-1);
    };
    clock.onPause = () => {
      fxSync();
      fxBeat(-1);
    };
    clock.onResume = fxSync;
    clock.start(fx.bpm, fxStep, { stepsPerBeat: 1 });
    fxSync();
  }
  function fxStop() {
    if (fx.clock) fx.clock.stop();
    fx.clock = null;
  }
  function fxStep(step, t, sd) {
    if (step < 4) {
      A.click(t, step === 0, 0.8);
      A.at(t, () => {
        const l = fx.open && $('#fxNowLabel', fx.el);
        if (l) l.textContent = `Count-in ${step + 1}…`;
      });
      return;
    }
    const b = fx.pos % fx.total;
    fx.pos = b + 1;
    let i = fx.starts.length - 1;
    while (fx.starts[i] > b) i--;
    const c = st.chords[i];
    const k = b - fx.starts[i];
    const v = ui.voicing(c.rootPc, c.q);
    if (k === 0) A.bass(28 + mod12(c.rootPc - 28), t, c.beats * sd * 0.95, 0.7);
    if (k % 2 === 0) A.strum(v, t, { vel: k === 0 ? 0.75 : 0.5, dur: Math.min(2, c.beats - k) * sd * 0.95 });
    A.hat(t, k === 0 ? 0.8 : 0.45);
    A.at(t, () => {
      if (!fx.open) return;
      if (i !== fx.i) fxShow(i);
      const l = $('#fxNowLabel', fx.el);
      if (l) l.textContent = 'Now';
      fxBeat(k);
    });
  }

  /* ---------- audio & jam ---------- */
  let hearTimers = [];
  function stopHear(silence = true) {
    const was = hearTimers.length > 0;
    hearTimers.forEach(clearTimeout);
    hearTimers = [];
    if (was && silence) A.hush();
    if (root) $('#anHear', root).innerHTML = '▶ Hear it';
    return was;
  }
  /** Toggle: play the progression once, or stop it */
  function hear() {
    if (stopHear()) return;
    $('#anHear', root).innerHTML = '■ Stop';
    const beat = 60 / 92;
    let t = A.now() + 0.1;
    st.chords.forEach((c, i) => {
      const v = ui.voicing(c.rootPc, c.q);
      for (let b = 0; b < c.beats; b += 2) A.strum(v, t + b * beat, { vel: b === 0 ? 0.75 : 0.5, dur: Math.min(2, c.beats - b) * beat * 0.95 });
      A.bass(28 + mod12(c.rootPc - 28), t, c.beats * beat * 0.95, 0.7);
      hearTimers.push(A.at(t, () => selectChord(i, false)));
      t += c.beats * beat;
    });
    hearTimers.push(A.at(t + 0.4, () => stopHear(false)));
  }

  function jam() {
    const center = st.center;
    const krn = centerRootName(center);
    const chords = st.chords.map((c, i) => {
      const a = st.an[i];
      return { d: FALLBACK[mod12(c.rootPc - center.pc)], q: c.q, beats: c.beats, sc: a.sc, alt: a.alt || undefined, rootName: c.rootName, rn: a.rn.full };
    });
    const jazzy = st.chords.some((c) => ['m7b5', 'maj7', '7b9', '7alt', 'dim7', 'm6', 'maj9', '13'].includes(c.q));
    const style = center.blues ? 'shuffle' : jazzy ? 'swing' : st.chords.some((c) => c.q === 'm7') && st.chords.length <= 2 ? 'funk' : 'rock';
    GT.setCustomProg({
      name: st.chords.map((c) => c.name).join(' – ').slice(0, 48),
      style,
      bpm: style === 'swing' ? 126 : style === 'shuffle' ? 92 : 100,
      overall: center.blues ? 'blues' : center.mode,
      desc: `Your progression, analyzed in ${centerName(center)} (key root ${pretty(krn)}). Use “Each chord” to see the scale chosen for every chord.`,
      chords,
    });
    GT.go('improvise', { prog: 'custom', key: String(center.pc) });
  }

  GT.views.analyze = view;
  GT.analyzer = { parseProgression, rankCenters, analyzeChord, globalOptions };
})();
