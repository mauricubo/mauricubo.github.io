/* theory.js — music theory engine: notes, spelling, scales, chords, fretboard patterns */
(function () {
  'use strict';
  const GT = (window.GT = window.GT || {});

  const LETTERS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
  const LETTER_PC = [0, 2, 4, 5, 7, 9, 11];
  const DEG_SEMI = {
    '1': 0, 'b2': 1, '2': 2, '#2': 3, 'b3': 3, '3': 4, '4': 5, '#4': 6, 'b5': 6,
    '5': 7, '#5': 8, 'b6': 8, '6': 9, 'bb7': 9, 'b7': 10, '7': 11,
  };
  const SHARPS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const FLATS = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
  const PC_LABEL = ['C', 'C♯/D♭', 'D', 'D♯/E♭', 'E', 'F', 'F♯/G♭', 'G', 'G♯/A♭', 'A', 'A♯/B♭', 'B'];
  const KEY_CHIPS = ['C', 'D♭', 'D', 'E♭', 'E', 'F', 'F♯', 'G', 'A♭', 'A', 'B♭', 'B'];
  const ENHARM = { 1: ['C#', 'Db'], 3: ['D#', 'Eb'], 6: ['F#', 'Gb'], 8: ['G#', 'Ab'], 10: ['A#', 'Bb'] };

  const pretty = (n) => (n ? n[0] + n.slice(1).replace(/#/g, '♯').replace(/b/g, '♭') : n);
  const prettyDeg = (d) => d.replace(/bb/g, '𝄫').replace(/#/g, '♯').replace(/b/g, '♭');
  const degNum = (d) => parseInt(d.replace(/[b#]/g, ''), 10);
  const degSemi = (d) => DEG_SEMI[d];
  const mod12 = (n) => ((n % 12) + 12) % 12;

  function nameToPc(n) {
    let pc = LETTER_PC[LETTERS.indexOf(n[0])];
    for (const ch of n.slice(1)) pc += ch === '#' ? 1 : ch === 'b' ? -1 : 0;
    return mod12(pc);
  }
  function noteName(li, pc) {
    let diff = mod12(pc - LETTER_PC[li]);
    if (diff > 6) diff -= 12;
    return LETTERS[li] + (diff > 0 ? '#'.repeat(diff) : 'b'.repeat(-diff));
  }
  /** Spell degrees letter-correctly from a root name (e.g. 'Eb', ['1','b3']) */
  function spellFrom(rootName, degs) {
    const rl = LETTERS.indexOf(rootName[0]);
    const rpc = nameToPc(rootName);
    return degs.map((d) => {
      const pc = mod12(rpc + DEG_SEMI[d]);
      const n = noteName((rl + degNum(d) - 1) % 7, pc);
      // guitarists read A, not B𝄫 — simplify double accidentals
      if (/##/.test(n)) return SHARPS[pc];
      if (/bb/.test(n)) return FLATS[pc];
      return n;
    });
  }
  const accCount = (names) => names.reduce((a, n) => a + n.length - 1, 0);
  /** Choose the enharmonic root spelling that produces the cleanest scale */
  const IONIAN = ['1', '2', '3', '4', '5', '6', '7'];
  const AEOLIAN = ['1', '2', 'b3', '4', '5', 'b6', 'b7'];
  function rootNameFor(pc, degs) {
    pc = mod12(pc);
    if (!ENHARM[pc]) return SHARPS[pc];
    // non-heptatonic scales: spell from the parent major/minor key signature
    if (degs && degs.length !== 7) degs = degs.includes('b3') && !degs.includes('3') ? AEOLIAN : IONIAN;
    const [s, f] = ENHARM[pc];
    const a = accCount(spellFrom(s, degs || ['1', '3', '5']));
    const b = accCount(spellFrom(f, degs || ['1', '3', '5']));
    if (a < b) return s;
    if (b < a) return f;
    return pc === 6 ? s : f;
  }
  function spell(pc, degs) {
    const root = rootNameFor(pc, degs);
    return { root, notes: spellFrom(root, degs) };
  }

  /** role of a degree for color coding */
  function roleOf(d) {
    const n = degNum(d);
    if (n === 1 && DEG_SEMI[d] === 0) return 'root';
    if (n === 3) return 'third';
    if (n === 5) return 'fifth';
    if (n === 7) return 'seventh';
    return 'other';
  }

  const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);

  /* ------------------------------------------------------------------ */
  /* Scales                                                              */
  /* ------------------------------------------------------------------ */
  const SCALES = [
    // Pentatonic & Blues
    {
      id: 'minorPent', name: 'Minor Pentatonic', family: 'Pentatonic & Blues',
      deg: ['1', 'b3', '4', '5', 'b7'], char: [],
      mood: 'Raw, vocal, bluesy — the guitarist’s mother tongue.',
      use: 'm7 / m9 / m11 chords, dominant blues, rock riffs and solos in almost any minor key.',
      tip: 'Make it sound advanced: bend to exact pitch (♭3→4, 4→5, ♭7→1), land on chord tones when the harmony changes, and leave space between phrases. Five shapes, one sound — connect them diagonally.',
      players: 'B.B. King, Jimmy Page, Eric Clapton, Slash',
    },
    {
      id: 'majorPent', name: 'Major Pentatonic', family: 'Pentatonic & Blues',
      deg: ['1', '2', '3', '5', '6'], char: [],
      mood: 'Open, sweet, singing.',
      use: 'Major, 6, add9 and dominant chords; country, southern rock, soul, major blues.',
      tip: 'Same shapes as the minor pentatonic three frets lower (A major pent = F♯ minor pent). Over a blues, alternate major pentatonic (sweet) with minor pentatonic (gritty) to create contrast between phrases.',
      players: 'Duane Allman, Albert Lee, Mark Knopfler',
    },
    {
      id: 'blues', name: 'Blues Scale', family: 'Pentatonic & Blues', base: 'minorPent',
      deg: ['1', 'b3', '4', 'b5', '5', 'b7'], char: ['b5'],
      mood: 'Gritty, expressive, vocal.',
      use: '12-bar blues, rock, funk and minor vamps.',
      tip: 'The ♭5 is a passing “blue note”: slide or hammer through it (4–♭5–5 or 5–♭5–4) rather than resting on it. Its tension only works in motion.',
      players: 'Stevie Ray Vaughan, Jimi Hendrix, Albert King',
    },
    {
      id: 'majorBlues', name: 'Major Blues', family: 'Pentatonic & Blues', base: 'majorPent',
      deg: ['1', '2', 'b3', '3', '5', '6'], char: ['b3'],
      mood: 'Happy, swinging, gospel-tinged.',
      use: 'Major blues, country swing, soul and gospel.',
      tip: 'Hammer or slide the ♭3 into the 3 — the little “curl” that defines B.B. King’s and many country players’ major sound.',
      players: 'B.B. King, T-Bone Walker, Brad Paisley',
    },
    // Major modes
    {
      id: 'ionian', name: 'Ionian (Major)', family: 'Major modes', modeOf: 'ionian', modeNum: 1,
      deg: ['1', '2', '3', '4', '5', '6', '7'], char: ['4', '7'],
      mood: 'Bright, resolved, stable.',
      use: 'maj7, 6, 6/9 and add9 chords functioning as I. Pop, country, rock and jazz standards.',
      tip: 'The 4 is an “avoid note” over a maj7 chord — use it as a passing tone resolving down to the 3, not as a note to sustain.',
      players: 'Everyone — it is the reference for every other mode.',
    },
    {
      id: 'dorian', name: 'Dorian', family: 'Major modes', modeNum: 2,
      deg: ['1', '2', 'b3', '4', '5', '6', 'b7'], char: ['6'],
      mood: 'Minor but hopeful — soulful, funky, cool.',
      use: 'm7, m9, m11, m13 chords — the ii in a ii–V–I and modal vamps (So What, Oye Como Va, Another Brick in the Wall solo).',
      tip: 'The natural 6 is the color. Target it over the i chord and resolve it to the 5 or ♭7. Compare it with Aeolian: one note (6 vs ♭6) changes the whole mood.',
      players: 'Carlos Santana, David Gilmour, Miles Davis',
    },
    {
      id: 'phrygian', name: 'Phrygian', family: 'Major modes', modeNum: 3,
      deg: ['1', 'b2', 'b3', '4', '5', 'b6', 'b7'], char: ['b2'],
      mood: 'Dark, Spanish, menacing.',
      use: 'm7 and sus4(♭9) chords; metal riffs over a low pedal, flamenco i–♭II movement.',
      tip: 'The ♭2 half-step above the root is everything — trill or slide between ♭2 and 1. In metal, pedal the open low string and move the ♭2 against it.',
      players: 'Metallica, Paco de Lucía, Dimebag Darrell',
    },
    {
      id: 'lydian', name: 'Lydian', family: 'Major modes', modeNum: 4,
      deg: ['1', '2', '3', '#4', '5', '6', '7'], char: ['#4'],
      mood: 'Dreamy, floating, cinematic.',
      use: 'maj7(♯11) chords, the IV chord in a major key, film and fusion.',
      tip: 'Resolve the ♯4 up to the 5, or let it ring against the root for that suspended, magical color. The brightest of all modes.',
      players: 'Joe Satriani, Steve Vai, John Williams (film)',
    },
    {
      id: 'mixolydian', name: 'Mixolydian', family: 'Major modes', modeNum: 5,
      deg: ['1', '2', '3', '4', '5', '6', 'b7'], char: ['b7'],
      mood: 'Bluesy-major, rock, dominant.',
      use: 'Dominant 7 / 9 / 13 chords, I–♭VII–IV rock progressions, blues (mixed with minor pentatonic).',
      tip: 'Mix it with the minor pentatonic: bend the ♭3 a quarter-tone toward the 3. That major/minor ambiguity is the sound of blues-rock.',
      players: 'The Allman Brothers, Jerry Garcia, Eric Johnson',
    },
    {
      id: 'aeolian', name: 'Aeolian (Natural Minor)', family: 'Major modes', modeNum: 6,
      deg: ['1', '2', 'b3', '4', '5', 'b6', 'b7'], char: ['b6'],
      mood: 'Sad, epic, melancholic.',
      use: 'm7 chords as vi, or as i in i–♭VI–♭VII rock/metal progressions; ballads.',
      tip: 'The ♭6 carries the sadness — resolve ♭6 → 5. Over a minor progression, Aeolian vs Dorian is decided by the chord on ♭VI or IV.',
      players: 'Gary Moore, Kirk Hammett, Mark Knopfler',
    },
    {
      id: 'locrian', name: 'Locrian', family: 'Major modes', modeNum: 7,
      deg: ['1', 'b2', 'b3', '4', 'b5', 'b6', 'b7'], char: ['b5', 'b2'],
      mood: 'Unstable, diminished, dissonant.',
      use: 'm7♭5 (half-diminished) chords — the iiø of a minor ii–V–i.',
      tip: 'Over m7♭5 many jazz players prefer Locrian ♮2 (6th mode of melodic minor) to avoid the clashing ♭2. As a tonal center Locrian is rare — its tonic chord is unstable.',
      players: 'Jazz players over iiø7; Meshuggah-style metal',
    },
    // Harmonic minor
    {
      id: 'harmonicMinor', name: 'Harmonic Minor', family: 'Harmonic minor',
      deg: ['1', '2', 'b3', '4', '5', 'b6', '7'], char: ['b6', '7'],
      mood: 'Exotic, classical, dramatic.',
      use: 'Minor i chord (m(maj7)) when the V is a major dominant; neoclassical lines.',
      tip: 'The augmented 2nd between ♭6 and 7 is its signature. Arpeggiate the diminished 7th chord built on the 7 — it moves in minor 3rds (every 3 frets) all over the neck.',
      players: 'Yngwie Malmsteen, Randy Rhoads, J.S. Bach',
    },
    {
      id: 'phrygianDominant', name: 'Phrygian Dominant', family: 'Harmonic minor',
      deg: ['1', 'b2', '3', '4', '5', 'b6', 'b7'], char: ['b2', '3'],
      mood: 'Spanish, Middle-Eastern, heavy.',
      use: 'V7 (7♭9) in a minor key — E7 in A minor; flamenco and metal.',
      tip: 'It is the 5th mode of harmonic minor: play A harmonic minor notes over E7 and you are in E Phrygian dominant. The ♭2–3 augmented 2nd is the exotic flavor.',
      players: 'Dick Dale (Misirlou), Al Di Meola, Marty Friedman',
    },
    // Melodic minor
    {
      id: 'melodicMinor', name: 'Melodic Minor', family: 'Melodic minor',
      deg: ['1', '2', 'b3', '4', '5', '6', '7'], char: ['6', '7'],
      mood: 'Sophisticated, bittersweet, jazzy.',
      use: 'm6, m(maj7), m6/9 chords — the tonic minor sound in jazz.',
      tip: 'Its modes generate the most important modern jazz sounds: Locrian ♮2 (6th), Lydian dominant (4th) and Altered (7th). Learn one fingering, unlock three scales.',
      players: 'Pat Martino, Allan Holdsworth, Wes Montgomery',
    },
    {
      id: 'lydianDominant', name: 'Lydian Dominant', family: 'Melodic minor',
      deg: ['1', '2', '3', '#4', '5', '6', 'b7'], char: ['#4', 'b7'],
      mood: 'Bright, bluesy, modern.',
      use: 'Non-resolving dominants: 7♯11, ♭VII7, IV7 in blues, tritone substitutions.',
      tip: '4th mode of melodic minor (G Lydian dominant = D melodic minor). Use it on a dominant that does NOT resolve down a fifth — e.g. the ♭VI7 in a minor blues.',
      players: 'Scott Henderson, Danny Elfman (Simpsons theme), Mike Stern',
    },
    {
      id: 'altered', name: 'Altered (Super Locrian)', family: 'Melodic minor',
      deg: ['1', 'b2', '#2', '3', 'b5', 'b6', 'b7'], char: ['b2', '#2', 'b5', 'b6'],
      mood: 'Maximum tension, wants to resolve.',
      use: 'V7alt resolving to I or i (G7alt → Cmaj7).',
      tip: '7th mode of melodic minor: play A♭ melodic minor over G7alt. It contains every altered tension (♭9 ♯9 ♯11 ♭13) — resolve each by half-step into the next chord’s tones.',
      players: 'Pat Metheny, John Scofield, Michael Brecker',
    },
    {
      id: 'locrianNat2', name: 'Locrian ♮2', family: 'Melodic minor',
      deg: ['1', '2', 'b3', '4', 'b5', 'b6', 'b7'], char: ['2', 'b5'],
      mood: 'Dark but smooth.',
      use: 'm7♭5 chords — the jazz choice for the iiø7 in minor ii–V–i.',
      tip: '6th mode of melodic minor (Bø7 → D melodic minor). The natural 2 (9) sounds much smoother than Locrian’s ♭2 over half-diminished chords.',
      players: 'Bill Evans, Kurt Rosenwinkel',
    },
    // Symmetric & Bebop
    {
      id: 'dimHW', name: 'Diminished (Half–Whole)', family: 'Symmetric & Bebop',
      deg: ['1', 'b2', '#2', '3', '#4', '5', '6', 'b7'], char: ['b2', '#2', '#4'],
      mood: 'Slick, angular, symmetric tension.',
      use: '7♭9, 13♭9 and 7(♭9♯9) dominant chords.',
      tip: 'It repeats every minor 3rd: any lick moved 3 frets up (or down) still fits the chord. Exploit the symmetry with sequences that shift by 3 frets.',
      players: 'Michael Brecker, Frank Gambale, Joe Pass',
    },
    {
      id: 'dimWH', name: 'Diminished (Whole–Half)', family: 'Symmetric & Bebop',
      deg: ['1', '2', 'b3', '4', 'b5', '#5', '6', '7'], char: ['2', '4', '#5', '7'],
      mood: 'Dark, mysterious symmetry.',
      use: 'Diminished 7th chords (°7), passing diminished chords like ♯iv°7.',
      tip: 'Chord tones (1 ♭3 ♭5 6) plus a note a whole step above each. Like the half-whole, it repeats every 3 frets.',
      players: 'Jazz & fusion players over °7 chords',
    },
    {
      id: 'wholeTone', name: 'Whole Tone', family: 'Symmetric & Bebop', nps: 2,
      deg: ['1', '2', '3', '#4', '#5', 'b7'], char: ['#4', '#5'],
      mood: 'Dreamy, suspended, unresolved.',
      use: '7♯5 / 9♯5 / augmented chords.',
      tip: 'Only two distinct whole-tone scales exist. Every shape repeats 2 frets higher — shift any pattern by a whole step and it still fits.',
      players: 'Thelonious Monk, Debussy, Jeff Beck',
    },
    {
      id: 'bebopDom', name: 'Bebop Dominant', family: 'Symmetric & Bebop', base: 'mixolydian',
      deg: ['1', '2', '3', '4', '5', '6', 'b7', '7'], char: ['7'],
      mood: 'Swinging, flowing, classic jazz.',
      use: 'Dominant 7 chords in swing and bebop.',
      tip: 'The added natural 7 is a passing tone: run 8th notes starting from a chord tone on the beat and the chord tones (1 3 5 ♭7) land on the downbeats automatically.',
      players: 'Charlie Parker, Wes Montgomery, Joe Pass',
    },
  ];
  const SCALE_BY_ID = Object.fromEntries(SCALES.map((s) => [s.id, s]));
  const FAMILIES = [...new Set(SCALES.map((s) => s.family))];
  const MODE_BRIGHTNESS = ['lydian', 'ionian', 'mixolydian', 'dorian', 'aeolian', 'phrygian', 'locrian'];

  /* ------------------------------------------------------------------ */
  /* Chords                                                              */
  /* ------------------------------------------------------------------ */
  const CHORDS = {
    maj: { sym: '', deg: ['1', '3', '5'] },
    m: { sym: 'm', deg: ['1', 'b3', '5'] },
    dim: { sym: '°', deg: ['1', 'b3', 'b5'] },
    aug: { sym: '+', deg: ['1', '3', '#5'] },
    maj7: { sym: 'maj7', deg: ['1', '3', '5', '7'] },
    m7: { sym: 'm7', deg: ['1', 'b3', '5', 'b7'] },
    7: { sym: '7', deg: ['1', '3', '5', 'b7'] },
    m7b5: { sym: 'm7♭5', deg: ['1', 'b3', 'b5', 'b7'] },
    dim7: { sym: '°7', deg: ['1', 'b3', 'b5', 'bb7'] },
    mMaj7: { sym: 'm(maj7)', deg: ['1', 'b3', '5', '7'] },
    m6: { sym: 'm6', deg: ['1', 'b3', '5', '6'] },
    maj7s5: { sym: 'maj7♯5', deg: ['1', '3', '#5', '7'] },
    '7s5': { sym: '7♯5', deg: ['1', '3', '#5', 'b7'] },
    '7b5': { sym: '7♭5', deg: ['1', '3', 'b5', 'b7'] },
    dimMaj7: { sym: '°(maj7)', deg: ['1', 'b3', 'b5', '7'] },
    maj7b5: { sym: 'maj7♭5', deg: ['1', '3', 'b5', '7'] },
    '7b9': { sym: '7♭9', deg: ['1', '3', '5', 'b7', 'b2'] },
    '7alt': { sym: '7alt', deg: ['1', '3', '#5', 'b7', '#2'] },
    9: { sym: '9', deg: ['1', '3', '5', 'b7', '2'] },
    m9: { sym: 'm9', deg: ['1', 'b3', '5', 'b7', '2'] },
    maj7s11: { sym: 'maj7♯11', deg: ['1', '3', '5', '7', '#4'] },
    '7s11': { sym: '7♯11', deg: ['1', '3', '5', 'b7', '#4'] },
    6: { sym: '6', deg: ['1', '3', '5', '6'] },
    maj9: { sym: 'maj9', deg: ['1', '3', '5', '7', '2'] },
    m11: { sym: 'm11', deg: ['1', 'b3', '5', 'b7', '4'] },
    13: { sym: '13', deg: ['1', '3', '5', 'b7', '6'] },
    '7s9': { sym: '7♯9', deg: ['1', '3', '5', 'b7', '#2'] },
    sus4: { sym: 'sus4', deg: ['1', '4', '5'] },
    sus2: { sym: 'sus2', deg: ['1', '2', '5'] },
    '7sus4': { sym: '7sus4', deg: ['1', '4', '5', 'b7'] },
    add9: { sym: 'add9', deg: ['1', '3', '5', '2'] },
    5: { sym: '5', deg: ['1', '5'] },
  };
  const SEV = {
    '0,4,7,11': 'maj7', '0,3,7,10': 'm7', '0,4,7,10': '7', '0,3,6,10': 'm7b5', '0,3,6,9': 'dim7',
    '0,3,7,11': 'mMaj7', '0,4,8,11': 'maj7s5', '0,4,8,10': '7s5', '0,4,6,10': '7b5', '0,3,6,11': 'dimMaj7',
    '0,4,6,11': 'maj7b5',
  };
  const TRI = { '0,4,7': 'maj', '0,3,7': 'm', '0,3,6': 'dim', '0,4,8': 'aug' };
  const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];

  function chordPcs(rootPc, q) {
    return CHORDS[q].deg.map((d) => mod12(rootPc + DEG_SEMI[d]));
  }
  function chordName(rootName, q) {
    return pretty(rootName) + CHORDS[q].sym;
  }

  /** Diatonic 7th chords for a 7-note scale */
  function diatonicChords(scale, rootPc) {
    if (scale.deg.length !== 7) return [];
    const semis = scale.deg.map(degSemi);
    const names = spell(rootPc, scale.deg).notes;
    return scale.deg.map((d, i) => {
      const tones = [0, 2, 4, 6].map((k) => semis[(i + k) % 7]);
      const rel = tones.map((t) => mod12(t - tones[0]));
      const q7 = SEV[rel.join(',')] || null;
      const q3 = TRI[rel.slice(0, 3).join(',')] || 'maj';
      let rn = ROMAN[degNum(d) - 1];
      if (q3 === 'm' || q3 === 'dim') rn = rn.toLowerCase();
      const acc = d.replace(/[0-9]/g, '');
      rn = prettyDeg(acc) + rn + (q7 === 'm7b5' ? 'ø' : q3 === 'dim' ? '°' : q3 === 'aug' ? '+' : '');
      return {
        degree: d, roman: rn, rootName: names[i], rootPc: mod12(rootPc + semis[i]),
        q7, q3, name: chordName(names[i], q7 || q3),
        pcs: tones.map((t) => mod12(rootPc + t)),
      };
    });
  }

  /** All 7-note scales (from our list) that contain the exact same pitch set */
  function relatives(scale, rootPc) {
    const set = scale.deg.map((d) => mod12(rootPc + DEG_SEMI[d])).sort((a, b) => a - b).join(',');
    const out = [];
    for (const s of SCALES) {
      if (s.deg.length !== scale.deg.length || s.base) continue;
      for (let r = 0; r < 12; r++) {
        if (s.id === scale.id && r === rootPc) continue;
        const k = s.deg.map((d) => mod12(r + DEG_SEMI[d])).sort((a, b) => a - b).join(',');
        if (k === set && s.deg.includes('1')) {
          const degIdx = scale.deg.findIndex((d) => mod12(rootPc + DEG_SEMI[d]) === r);
          if (degIdx >= 0) out.push({ scale: s, rootPc: r, rootName: spell(r, s.deg).root, degIdx });
        }
      }
    }
    return out.sort((a, b) => a.degIdx - b.degIdx);
  }

  /* ------------------------------------------------------------------ */
  /* Tunings & fretboard                                                 */
  /* ------------------------------------------------------------------ */
  const TUNINGS = {
    standard: { name: 'Standard (E A D G B E)', notes: [40, 45, 50, 55, 59, 64] },
    halfDown: { name: 'E♭ Standard', notes: [39, 44, 49, 54, 58, 63] },
    dropD: { name: 'Drop D', notes: [38, 45, 50, 55, 59, 64] },
    dadgad: { name: 'DADGAD', notes: [38, 45, 50, 55, 57, 62] },
    openG: { name: 'Open G', notes: [38, 43, 50, 55, 59, 62] },
  };

  /** Every scale note on the neck */
  function neckNotes(tuning, rootPc, degs, maxFret) {
    const map = new Map(degs.map((d) => [mod12(rootPc + DEG_SEMI[d]), d]));
    const out = [];
    tuning.forEach((open, s) => {
      for (let f = 0; f <= maxFret; f++) {
        const m = open + f;
        const d = map.get(m % 12);
        if (d) out.push({ s, f, m, deg: d });
      }
    });
    return out;
  }

  /**
   * Fingering patterns: 2 notes/string for pentatonics, 3 notes/string for 7+ note scales.
   * Scales with a `base` (blues, bebop…) use the base patterns plus their extra notes.
   */
  function buildPatterns(tuning, rootPc, scale, maxFret) {
    const baseScale = scale.base ? SCALE_BY_ID[scale.base] : scale;
    const semis = baseScale.deg.map(degSemi);
    const n = semis.length;
    const nps = baseScale.nps || (n <= 5 ? 2 : 3);
    const set = new Set(semis.map((s) => mod12(rootPc + s)));
    const lo = tuning[0];
    const hi = tuning[tuning.length - 1] + maxFret;
    const all = [];
    for (let m = lo; m <= hi; m++) if (set.has(m % 12)) all.push(m);
    const rootIdx = all.findIndex((m) => m % 12 === rootPc);

    const degOf = new Map(scale.deg.map((d) => [mod12(rootPc + DEG_SEMI[d]), d]));
    const tryPattern = (start) => {
      if (start < 0) return null;
      const notes = [];
      let idx = start;
      for (let s = 0; s < tuning.length; s++) {
        for (let j = 0; j < nps; j++) {
          const m = all[idx++];
          if (m === undefined) return null;
          const f = m - tuning[s];
          if (f < 0 || f > maxFret) return null;
          notes.push({ s, f, m, deg: degOf.get(m % 12) });
        }
      }
      return notes;
    };

    const patterns = [];
    for (let k = 0; k < n; k++) {
      let best = null;
      for (const shift of [-2 * n, -n, 0, n, 2 * n]) {
        const p = tryPattern(rootIdx + k + shift);
        if (p && (!best || p[0].f < best[0].f)) best = p;
      }
      if (!best) continue;
      let notes = best;
      // extra notes (e.g. blue note) that fall inside the pattern's area
      if (scale.base) {
        const extras = scale.deg.filter((d) => !baseScale.deg.includes(d)).map((d) => mod12(rootPc + DEG_SEMI[d]));
        const gMin = Math.min(...notes.map((x) => x.f));
        const gMax = Math.max(...notes.map((x) => x.f));
        const add = [];
        tuning.forEach((open, s) => {
          const onS = notes.filter((x) => x.s === s).map((x) => x.f);
          const lo2 = Math.max(gMin, Math.min(...onS) - 1);
          const hi2 = Math.min(gMax, Math.max(...onS) + 1);
          for (let f = lo2; f <= hi2; f++) {
            if (extras.includes((open + f) % 12)) add.push({ s, f, m: open + f, deg: degOf.get((open + f) % 12) });
          }
        });
        notes = notes.concat(add);
      }
      notes.sort((a, b) => a.m - b.m || a.s - b.s);
      patterns.push({
        notes,
        minF: Math.min(...notes.map((x) => x.f)),
        maxF: Math.max(...notes.map((x) => x.f)),
      });
    }
    return patterns;
  }

  /** Remove duplicated pitches, keeping the first occurrence (ascending order) */
  function uniquePitches(notes) {
    const seen = new Set();
    return notes
      .slice()
      .sort((a, b) => a.m - b.m || b.s - a.s)
      .filter((n) => (seen.has(n.m) ? false : (seen.add(n.m), true)));
  }

  /** Find a comfortable position for a midi note near a fret */
  function positionFor(tuning, midi, nearFret = 5, maxFret = 15) {
    let best = null;
    tuning.forEach((open, s) => {
      const f = midi - open;
      if (f < 0 || f > maxFret) return;
      const cost = Math.abs(f - nearFret);
      if (!best || cost < best.cost) best = { s, f, m: midi, cost };
    });
    return best;
  }

  const INTERVALS = [
    { semi: 1, short: 'm2', name: 'Minor 2nd', song: '↑ Jaws · ↓ Für Elise' },
    { semi: 2, short: 'M2', name: 'Major 2nd', song: '↑ Happy Birthday · ↓ Yesterday' },
    { semi: 3, short: 'm3', name: 'Minor 3rd', song: '↑ Smoke on the Water · ↓ Hey Jude' },
    { semi: 4, short: 'M3', name: 'Major 3rd', song: '↑ When the Saints · ↓ Swing Low' },
    { semi: 5, short: 'P4', name: 'Perfect 4th', song: '↑ Here Comes the Bride · ↓ Eine kleine Nachtmusik' },
    { semi: 6, short: 'TT', name: 'Tritone', song: '↑ The Simpsons · ↓ Purple Haze riff' },
    { semi: 7, short: 'P5', name: 'Perfect 5th', song: '↑ Star Wars · ↓ Flintstones' },
    { semi: 8, short: 'm6', name: 'Minor 6th', song: '↑ The Entertainer (3–4) · ↓ Love Story' },
    { semi: 9, short: 'M6', name: 'Major 6th', song: '↑ My Way (NBC) · ↓ Nobody Knows' },
    { semi: 10, short: 'm7', name: 'Minor 7th', song: '↑ Star Trek theme · ↓ An American in Paris' },
    { semi: 11, short: 'M7', name: 'Major 7th', song: '↑ Take On Me (chorus) · ↓ I Love You (Porter)' },
    { semi: 12, short: 'P8', name: 'Octave', song: '↑ Somewhere Over the Rainbow · ↓ Willow Weep' },
  ];

  GT.theory = {
    LETTERS, DEG_SEMI, SHARPS, FLATS, PC_LABEL, KEY_CHIPS, SCALES, SCALE_BY_ID, FAMILIES,
    MODE_BRIGHTNESS, CHORDS, TUNINGS, INTERVALS,
    pretty, prettyDeg, degNum, degSemi, mod12, nameToPc, spell, spellFrom, rootNameFor, roleOf, mtof,
    chordPcs, chordName, diatonicChords, relatives, neckNotes, buildPatterns, uniquePitches, positionFor,
  };
})();
