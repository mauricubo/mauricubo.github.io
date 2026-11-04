/* harmony-course.js — curriculum for the Harmony course (content only; the engine lives in harmony.js)
 *
 * Each unit has three stages:
 *   learn    — sections of theory, each with an optional interactive demo
 *   quiz     — generated questions (`gens`, see harmony.js) plus fixed multiple-choice questions (`mc`)
 *   practice — one interactive exercise: 'ear' | 'build' | 'guide' | 'jam'
 *
 * Chords are written as scale degrees relative to the key + a quality from GT.theory.CHORDS,
 * so every demo and exercise works in any key.
 *   c('5', '7', 4, 'mixolydian')  → V7 for 4 beats, Mixolydian over it
 * Demo types:
 *   chords  — clickable chords: hear them, see their tones (and scale)
 *   compare — labelled mini-sequences to hear side by side
 *   stack   — harmonize a scale: stack thirds on any degree
 *   loop    — progression lab: looping backing + fretboard with chord tones / scale / guide tones
 */
(function () {
  'use strict';
  const GT = (window.GT = window.GT || {});

  const c = (d, q, beats = 4, sc = null, fn = '') => ({ d, q, beats, sc, fn });
  const ch = (d, q) => [d, q];
  const n = (...midi) => ({ n: midi });

  const UNITS = [
    /* ------------------------------------------------------------------ 1 */
    {
      id: 'triads',
      title: 'How chords are built',
      level: 'Foundation',
      goal: 'Build and recognise the four triads by their intervals and by ear.',
      learn: [
        {
          h: 'Intervals are the atoms of harmony',
          html: `<p>An <strong>interval</strong> is the distance between two notes, counted in semitones. On guitar that is simply <strong>frets on the same string</strong>.</p>
          <ul>
            <li><strong>Minor 3rd</strong>: 3 frets. Dark, sad.</li>
            <li><strong>Major 3rd</strong>: 4 frets. Bright, happy.</li>
            <li><strong>Perfect 5th</strong>: 7 frets. Stable and open (a power chord is just root + 5th).</li>
          </ul>
          <p>Chords are built by stacking these intervals. Listen to each one, first melodically, then together.</p>`,
          demo: {
            type: 'compare',
            items: [
              { label: 'Minor 3rd', sub: 'C → E♭ · 3 frets', steps: [n(60), n(63), n(60, 63)] },
              { label: 'Major 3rd', sub: 'C → E · 4 frets', steps: [n(60), n(64), n(60, 64)] },
              { label: 'Perfect 5th', sub: 'C → G · 7 frets', steps: [n(60), n(67), n(60, 67)] },
            ],
          },
        },
        {
          h: 'Stacking thirds: the four triads',
          html: `<p>A <strong>triad</strong> is three notes stacked in 3rds: root, 3rd and 5th. There are only two kinds of 3rd, so there are only four ways to stack two of them:</p>
          <ul>
            <li><strong>Major</strong> = major 3rd + minor 3rd → <code>1 3 5</code></li>
            <li><strong>Minor</strong> = minor 3rd + major 3rd → <code>1 ♭3 5</code></li>
            <li><strong>Diminished</strong> = minor 3rd + minor 3rd → <code>1 ♭3 ♭5</code></li>
            <li><strong>Augmented</strong> = major 3rd + major 3rd → <code>1 3 ♯5</code></li>
          </ul>
          <p>Click each chord. The colours match the rest of the app: <span class="hm-dot role-root"></span> root, <span class="hm-dot role-third"></span> 3rd, <span class="hm-dot role-fifth"></span> 5th.</p>`,
          demo: { type: 'chords', key: 0, items: [ch('1', 'maj'), ch('1', 'm'), ch('1', 'dim'), ch('1', 'aug')] },
        },
        {
          h: 'Hearing the quality',
          html: `<p>Two notes do almost all the work:</p>
          <ul>
            <li>The <strong>3rd</strong> decides <em>major or minor</em>: the mood.</li>
            <li>The <strong>5th</strong> decides <em>stable or unstable</em>. A perfect 5th feels grounded; a ♭5 (diminished) feels tense and wants to move; a ♯5 (augmented) feels suspended, like a question.</li>
          </ul>
          <p>Ear tip: compare each chord with the major chord on the same root. If raising one note (the 3rd) would make it brighter, it was minor; if the top note feels like it wants to fall, it was augmented; if the whole chord feels like it wants to collapse, it was diminished.</p>`,
          demo: {
            type: 'compare',
            items: [
              { label: 'Major ↔ minor', sub: 'only the 3rd moves', steps: [ch('1', 'maj'), ch('1', 'm'), ch('1', 'maj'), ch('1', 'm')] },
              { label: 'Diminished ↔ augmented', sub: 'the unstable pair', steps: [ch('1', 'dim'), ch('1', 'aug'), ch('1', 'dim'), ch('1', 'aug')] },
            ],
          },
        },
      ],
      quiz: {
        gens: ['triadNotes', 'triadNotes', 'triadEar', 'triadEar'],
        mc: [
          { q: 'Which note of a triad decides whether it is major or minor?', a: 'The 3rd', o: ['The root', 'The 5th', 'The octave'], why: 'Major = 1 3 5, minor = 1 ♭3 5. Only the 3rd changes.' },
          { q: 'A diminished triad is built from…', a: 'Two minor 3rds', o: ['Two major 3rds', 'A major 3rd + a minor 3rd', 'A minor 3rd + a perfect 5th'], why: 'Minor 3rd + minor 3rd gives 1 ♭3 ♭5. The ♭5 is what makes it tense.' },
          { q: 'How many frets (semitones) is a perfect 5th?', a: '7', o: ['5', '6', '8'], why: 'A perfect 5th is 7 semitones, the same shape as a power chord: root on one string, 5th two frets higher on the next.' },
          { q: 'Which triad is symmetric, made of two major 3rds?', a: 'Augmented', o: ['Diminished', 'Major', 'Minor'], why: 'Augmented = 1 3 ♯5 = major 3rd + major 3rd. Move the shape up 4 frets and you get the same notes.' },
        ],
      },
      practice: {
        type: 'ear',
        title: 'Triad ear trainer',
        intro: 'Hear a chord, name its quality. Use “Hear again” as often as you like. Get 8 of 10 right to complete the unit.',
        gens: ['triadEar'],
        rounds: 10,
        goal: 8,
      },
    },

    /* ------------------------------------------------------------------ 2 */
    {
      id: 'diatonic',
      title: 'The harmonized major scale',
      level: 'Foundation',
      goal: 'Know the seven chords of any major key and name them with Roman numerals.',
      learn: [
        {
          h: 'One scale, seven chords',
          html: `<p>Take a major scale and build a triad on every note, using <strong>only notes from the scale</strong> (skip one note, take one, skip one…). You get seven chords: the <strong>diatonic chords</strong> of the key.</p>
          <p>Pick a degree below and watch the thirds stack up inside the scale. Notice that you never choose the quality: the scale decides it for you.</p>`,
          demo: { type: 'stack', key: 0, scale: 'ionian' },
        },
        {
          h: 'Roman numerals: the universal language',
          html: `<p>Musicians name chords by their <strong>position in the key</strong>, not by letter. Upper case = major, lower case = minor, ° = diminished:</p>
          <p class="hm-big-formula">I &nbsp; ii &nbsp; iii &nbsp; IV &nbsp; V &nbsp; vi &nbsp; vii°</p>
          <p>Memorise the quality pattern: <strong>major – minor – minor – major – major – minor – diminished</strong>. It is the same in all 12 keys, so once a song is in numerals you can play it in any key instantly.</p>`,
          demo: { type: 'chords', key: 7, items: [ch('1', 'maj'), ch('2', 'm'), ch('3', 'm'), ch('4', 'maj'), ch('5', 'maj'), ch('6', 'm'), ch('7', 'dim')] },
        },
        {
          h: 'Same pattern, every key',
          html: `<p>Change the key on the loop below: the chord names change, the numerals and the sound of the progression stay the same.</p>
          <p><strong>Guitar shortcut:</strong> with the I chord rooted on the low E string, the IV is on the A string at the same fret, and the V is two frets higher. That little “box” works in every key.</p>`,
          demo: { type: 'loop', key: 0, bpm: 92, chords: [c('1', 'maj', 4, 'ionian'), c('6', 'm', 4, 'aeolian'), c('4', 'maj', 4, 'lydian'), c('5', 'maj', 4, 'mixolydian')] },
        },
      ],
      quiz: {
        gens: ['diatonicName', 'diatonicName', 'diatonicRoman', 'diatonicQuality', 'diatonicRoman'],
        mc: [
          { q: 'Which chord of a major key is diminished?', a: 'vii°', o: ['ii', 'iii', 'vi'], why: 'Stacking thirds on the 7th degree gives 1 ♭3 ♭5, a diminished triad.' },
          { q: 'Which three diatonic chords are major?', a: 'I, IV and V', o: ['I, ii and V', 'I, iii and vi', 'IV, V and vi'], why: 'The pattern is major – minor – minor – major – major – minor – diminished.' },
          { q: 'In Roman-numeral notation, a lower-case numeral means…', a: 'A minor chord', o: ['A major chord', 'A seventh chord', 'A chord outside the key'], why: 'Upper case = major, lower case = minor; a ° sign is added for diminished.' },
        ],
      },
      practice: {
        type: 'build',
        title: 'Build it in any key',
        intro: 'Each round asks for a progression in Roman numerals in a random key. Click the chords in order, then check. Five correct rounds complete the unit.',
        tasks: 'diatonic',
        goal: 5,
      },
    },

    /* ------------------------------------------------------------------ 3 */
    {
      id: 'function',
      title: 'Function: tension and release',
      level: 'Foundation',
      goal: 'Understand why chords move the way they do: tonic, subdominant, dominant and the four cadences.',
      learn: [
        {
          h: 'Three families of chords',
          html: `<p>Every diatonic chord belongs to one of three <strong>functions</strong>:</p>
          <ul>
            <li><strong>Tonic</strong>: I (also vi, iii). Home, rest, the end of the sentence.</li>
            <li><strong>Subdominant</strong> (pre-dominant): IV, ii. Moving away from home.</li>
            <li><strong>Dominant</strong>: V, vii°. Maximum tension that wants to resolve home.</li>
          </ul>
          <p>Why does V pull to I? It contains the <strong>leading tone</strong>, the 7th degree of the key, a half step below the tonic (B → C in C major). Our ears expect that half step to resolve.</p>
          <p>Chords in the same family share notes, so they can <strong>substitute</strong> for each other: vi for I, ii for IV.</p>`,
          demo: { type: 'chords', key: 0, items: [ch('1', 'maj'), ch('6', 'm'), ch('3', 'm'), ch('4', 'maj'), ch('2', 'm'), ch('5', 'maj'), ch('7', 'dim')], fn: ['Tonic', 'Tonic', 'Tonic', 'Subdominant', 'Subdominant', 'Dominant', 'Dominant'] },
        },
        {
          h: 'Cadences: how musical sentences end',
          html: `<p>A <strong>cadence</strong> is the last two chords of a phrase, the musical punctuation:</p>
          <ul>
            <li><strong>Authentic</strong> V → I: a full stop.</li>
            <li><strong>Plagal</strong> IV → I: the gentle “Amen” ending.</li>
            <li><strong>Half</strong> → V: a comma or a question; it leaves you hanging.</li>
            <li><strong>Deceptive</strong> V → vi: you expect home and get a surprise.</li>
          </ul>`,
          demo: {
            type: 'compare',
            key: 0,
            items: [
              { label: 'Authentic', sub: 'I – ii – V – I', steps: [ch('1', 'maj'), ch('2', 'm'), ch('5', 'maj'), ch('1', 'maj')] },
              { label: 'Plagal', sub: 'I – V – IV – I', steps: [ch('1', 'maj'), ch('5', 'maj'), ch('4', 'maj'), ch('1', 'maj')] },
              { label: 'Half', sub: 'I – vi – ii – V', steps: [ch('1', 'maj'), ch('6', 'm'), ch('2', 'm'), ch('5', 'maj')] },
              { label: 'Deceptive', sub: 'I – ii – V – vi', steps: [ch('1', 'maj'), ch('2', 'm'), ch('5', 'maj'), ch('6', 'm')] },
            ],
          },
        },
        {
          h: 'The T → S → D → T cycle',
          html: `<p>Most progressions are simply <strong>Tonic → Subdominant → Dominant → Tonic</strong>, with substitutes swapped in: I–IV–V–I, I–ii–V–I, I–vi–IV–V. Once you hear a song as that cycle, you can predict where it is going.</p>
          <p>Loop it below and listen to the pull towards the end of each pass. Change the key and the effect is identical.</p>`,
          demo: { type: 'loop', key: 0, bpm: 88, chords: [c('1', 'maj', 4, 'ionian', 'T'), c('6', 'm', 4, 'aeolian', 'T'), c('2', 'm', 4, 'dorian', 'S'), c('5', 'maj', 4, 'mixolydian', 'D')] },
        },
      ],
      quiz: {
        gens: ['functionGroup', 'functionGroup', 'cadenceEar', 'cadenceEar'],
        mc: [
          { q: 'Which note makes V want to resolve to I?', a: 'The leading tone (7th degree of the key)', o: ['The root of V', 'The 5th of V', 'The 4th degree of the key'], why: 'The leading tone sits a half step below the tonic (B → C in C). That half step is the pull.' },
          { q: 'A deceptive cadence goes from V to…', a: 'vi', o: ['I', 'IV', 'ii'], why: 'V → vi shares two notes with V → I but lands on the minor tonic substitute. It feels like a surprise.' },
          { q: 'Which chord can replace IV because it shares two notes with it?', a: 'ii', o: ['V', 'iii', 'vii°'], why: 'In C, F–A–C (IV) and D–F–A (ii) share F and A. Both have subdominant function.' },
          { q: 'A phrase that ends on V is a…', a: 'Half cadence', o: ['Plagal cadence', 'Authentic cadence', 'Deceptive cadence'], why: 'Ending on V leaves the tension unresolved, like a comma or a question.' },
        ],
      },
      practice: {
        type: 'ear',
        title: 'Function by ear',
        intro: 'You will hear the tonic (I) and then another chord from the key. Which one is it? Listen for tension (V), openness (IV), and the minor colour (ii, iii, vi).',
        gens: ['functionEar'],
        rounds: 10,
        goal: 8,
      },
    },

    /* ------------------------------------------------------------------ 4 */
    {
      id: 'sevenths',
      title: 'Seventh chords and the dominant',
      level: 'Foundation',
      goal: 'Know the five essential seventh chords and why V7 resolves so strongly.',
      learn: [
        {
          h: 'Add one more third',
          html: `<p>Stack one more 3rd on a triad and you get a <strong>seventh chord</strong>. Five of them cover almost all music:</p>
          <ul>
            <li><strong>maj7</strong> <code>1 3 5 7</code>: lush, dreamy (I and IV).</li>
            <li><strong>m7</strong> <code>1 ♭3 5 ♭7</code>: smooth, soulful (ii, iii, vi).</li>
            <li><strong>7</strong> (dominant) <code>1 3 5 ♭7</code>: bluesy, tense, wants to move (V).</li>
            <li><strong>m7♭5</strong> (half-diminished, ø) <code>1 ♭3 ♭5 ♭7</code>: dark, unstable (vii in major, ii in minor).</li>
            <li><strong>°7</strong> (diminished) <code>1 ♭3 ♭5 𝄫7</code>: dramatic, symmetric.</li>
          </ul>`,
          demo: { type: 'chords', key: 0, items: [ch('1', 'maj7'), ch('1', 'm7'), ch('1', '7'), ch('1', 'm7b5'), ch('1', 'dim7')] },
        },
        {
          h: 'Diatonic sevenths',
          html: `<p>Harmonize the major scale in four notes and the pattern becomes:</p>
          <p class="hm-big-formula">Imaj7 &nbsp; ii7 &nbsp; iii7 &nbsp; IVmaj7 &nbsp; V7 &nbsp; vi7 &nbsp; viiø7</p>
          <p>There is exactly <strong>one dominant 7th chord</strong> in a major key: V7. When you hear a dominant 7th, your ear immediately asks “where is it going?”</p>`,
          demo: { type: 'stack', key: 0, scale: 'ionian', sevenths: true },
        },
        {
          h: 'The tritone engine',
          html: `<p>V7 contains a <strong>tritone</strong> (6 semitones) between its 3rd and 7th: <strong>B and F</strong> in G7. The tritone is the most unstable interval in music.</p>
          <p>It resolves <strong>inward by half steps</strong>: B rises to C, F falls to E. Those are the root and 3rd of C major. That is why V7 → I is the strongest move in tonal harmony.</p>`,
          demo: {
            type: 'compare',
            key: 0,
            items: [
              { label: 'G → C', sub: 'triad, no tritone', steps: [ch('5', 'maj'), ch('1', 'maj')] },
              { label: 'G7 → C', sub: 'with the tritone', steps: [ch('5', '7'), ch('1', 'maj')] },
              { label: 'Tritone alone', sub: 'B + F → C + E', steps: [n(59, 65), n(60, 64)] },
            ],
          },
        },
      ],
      quiz: {
        gens: ['seventhFormula', 'seventhFormula', 'seventhDiatonic', 'tritone', 'seventhEar', 'seventhEar'],
        mc: [
          { q: 'How many dominant 7th chords are there in a major key (diatonically)?', a: 'One (V7)', o: ['None', 'Two (IV7 and V7)', 'Three (I7, IV7, V7)'], why: 'Only the chord on the 5th degree has a major 3rd and a ♭7. That uniqueness is what points to the tonic.' },
          { q: 'The tritone in a dominant 7th chord is between…', a: 'The 3rd and the ♭7', o: ['The root and the 5th', 'The root and the ♭7', 'The 5th and the ♭7'], why: '3 to ♭7 is 6 semitones. In G7: B to F.' },
        ],
      },
      practice: {
        type: 'ear',
        title: 'Seventh-chord ear trainer',
        intro: 'Name the quality of each seventh chord. Tip: dominant 7 sounds bluesy, maj7 sounds dreamy, m7 sounds smooth, m7♭5 sounds dark, °7 sounds like a horror film.',
        gens: ['seventhEar'],
        rounds: 10,
        goal: 8,
      },
    },

    /* ------------------------------------------------------------------ 5 */
    {
      id: 'progressions',
      title: 'Progressions you already know',
      level: 'Intermediate',
      goal: 'Recognise the most common progressions by ear and know what to play over them.',
      learn: [
        {
          h: 'The four-chord family',
          html: `<p>A handful of progressions power thousands of songs. Listen to each and keep the numerals in mind:</p>
          <ul>
            <li><strong>I – V – vi – IV</strong>: the modern pop progression (Let It Be, and many more).</li>
            <li><strong>vi – IV – I – V</strong>: the same four chords, started on the minor one. Moodier.</li>
            <li><strong>I – vi – IV – V</strong>: the 1950s doo-wop progression (Stand By Me).</li>
            <li><strong>I – IV – V – I</strong>: folk, country, early rock’n’roll.</li>
          </ul>`,
          demo: {
            type: 'compare',
            key: 7,
            items: [
              { label: 'I – V – vi – IV', sub: 'pop', steps: [ch('1', 'maj'), ch('5', 'maj'), ch('6', 'm'), ch('4', 'maj')] },
              { label: 'vi – IV – I – V', sub: 'pop, minor start', steps: [ch('6', 'm'), ch('4', 'maj'), ch('1', 'maj'), ch('5', 'maj')] },
              { label: 'I – vi – IV – V', sub: 'doo-wop', steps: [ch('1', 'maj'), ch('6', 'm'), ch('4', 'maj'), ch('5', 'maj')] },
              { label: 'I – IV – V – I', sub: 'folk / rock’n’roll', steps: [ch('1', 'maj'), ch('4', 'maj'), ch('5', 'maj'), ch('1', 'maj')] },
            ],
          },
        },
        {
          h: 'One scale for the whole song',
          html: `<p>When every chord is diatonic, <strong>one scale covers the whole progression</strong>: the major scale of the key (or its major pentatonic for a safer sound). In G: G major, or G major pentatonic, which is the same shapes as E minor pentatonic.</p>
          <p>The skill is not the scale, it’s <strong>landing on chord tones when the chord changes</strong>. Turn on “Chord tones” in the lab and aim for the coloured notes on beat 1 of each chord.</p>`,
          demo: { type: 'loop', key: 7, bpm: 96, chords: [c('1', 'maj', 4, 'ionian'), c('5', 'maj', 4, 'mixolydian'), c('6', 'm', 4, 'aeolian'), c('4', 'maj', 4, 'lydian')], view: 'tones' },
        },
        {
          h: 'The 12-bar blues breaks the rules',
          html: `<p>The blues puts a <strong>dominant 7th on every chord</strong>: I7, IV7 and V7. That is not diatonic, and it doesn’t need to be: the blues is its own harmonic language.</p>
          <p class="hm-big-formula">I7 I7 I7 I7 · IV7 IV7 I7 I7 · V7 IV7 I7 V7</p>
          <ul>
            <li><strong>Minor pentatonic / blues scale</strong> of the key over everything: the classic gritty sound.</li>
            <li><strong>Mixolydian of each chord</strong> (A Mixolydian over A7, D Mixolydian over D7…): you outline every change.</li>
            <li>The pros mix both, and land on the <strong>3rd of each chord</strong> when it arrives.</li>
          </ul>`,
          demo: { type: 'loop', key: 9, bpm: 112, chords: [c('1', '7', 16, 'mixolydian'), c('4', '7', 8, 'mixolydian'), c('1', '7', 8, 'mixolydian'), c('5', '7', 4, 'mixolydian'), c('4', '7', 4, 'mixolydian'), c('1', '7', 4, 'mixolydian'), c('5', '7', 4, 'mixolydian')], link: 'improvise?prog=blues12' },
        },
      ],
      quiz: {
        gens: ['progEar', 'progEar', 'progEar', 'progNames', 'progNames'],
        mc: [
          { q: 'In a standard 12-bar blues, the I, IV and V chords are usually…', a: 'All dominant 7ths', o: ['All major 7ths', 'Minor, minor, major', 'Major triads only'], why: 'I7, IV7 and V7. That non-diatonic “dominant everywhere” sound is the blues.' },
          { q: 'Which single scale fits a diatonic I–V–vi–IV in G major?', a: 'G major (or G major pentatonic)', o: ['G minor pentatonic', 'G Mixolydian', 'G harmonic minor'], why: 'All four chords come from G major, so its scale (or the safer pentatonic subset) covers them all.' },
          { q: 'I–V–vi–IV and vi–IV–I–V are…', a: 'The same four chords in a different order', o: ['Completely different progressions', 'In different keys', 'One major and one blues'], why: 'Rotating a progression changes where it starts, and so its mood, but not its chords.' },
        ],
      },
      practice: {
        type: 'ear',
        title: 'Name that progression',
        intro: 'Listen to a four-chord progression in a random key and pick its numerals. Start by finding the tonic, then listen for the minor chord. Get 7 of 10.',
        gens: ['progEar'],
        rounds: 10,
        goal: 7,
      },
    },

    /* ------------------------------------------------------------------ 6 */
    {
      id: 'chordscale',
      title: 'Which notes work over each chord',
      level: 'Intermediate',
      goal: 'Choose the right scale for each chord and know which notes are safe, colourful or risky.',
      learn: [
        {
          h: 'Every chord has a home scale',
          html: `<p>In a key, each diatonic chord gets the <strong>mode that starts on its root</strong>:</p>
          <p class="hm-big-formula">I Ionian · ii Dorian · iii Phrygian · IV Lydian · V Mixolydian · vi Aeolian · viiø Locrian</p>
          <p>They all contain the same seven notes. What changes is the <strong>centre of gravity</strong>: over Dm7 you think from D and lean on D, F, A and C. Click a chord to see its mode and its colour note.</p>`,
          demo: { type: 'chords', key: 0, items: [ch('1', 'maj7'), ch('2', 'm7'), ch('3', 'm7'), ch('4', 'maj7'), ch('5', '7'), ch('6', 'm7'), ch('7', 'm7b5')], scales: ['ionian', 'dorian', 'phrygian', 'lydian', 'mixolydian', 'aeolian', 'locrian'] },
        },
        {
          h: 'Chord tones, tensions and avoid notes',
          html: `<p>Every note of the scale has a role over the chord:</p>
          <ul>
            <li><strong>Chord tones</strong> (1 3 5 7): safe landing notes. Put them on the strong beats.</li>
            <li><strong>Tensions</strong> (9, 11, 13): colour. A whole step above a chord tone: they shimmer.</li>
            <li><strong>Avoid notes</strong>: a <em>half step</em> above a chord tone, like the 4 over a maj7 chord (F over Cmaj7 rubs against E). Play them in passing; don’t sit on them.</li>
          </ul>
          <p>In the lab, “Scale” view shows the whole mode faintly with the chord tones coloured on top: that is your map.</p>`,
          demo: { type: 'loop', key: 0, bpm: 76, chords: [c('1', 'maj7', 8, 'ionian'), c('4', 'maj7', 8, 'lydian')], view: 'scale' },
        },
        {
          h: 'Strong beats, strong notes',
          html: `<p>The difference between “playing the scale” and “playing the changes” is <strong>where the chord tones fall</strong>. Rules of thumb:</p>
          <ul>
            <li>Arrive on a chord tone on beat 1 of each new chord.</li>
            <li>Use scale notes between chord tones as passing notes.</li>
            <li>Long notes are chord tones or tensions, never avoid notes.</li>
          </ul>
          <p>Practice: loop this progression, play only chord tones for a pass, then add one passing note between them.</p>`,
          demo: { type: 'loop', key: 0, bpm: 80, chords: [c('1', 'maj7', 4, 'ionian'), c('6', 'm7', 4, 'aeolian'), c('2', 'm7', 4, 'dorian'), c('5', '7', 4, 'mixolydian')], view: 'tones' },
        },
      ],
      quiz: {
        gens: ['chordScale', 'chordScale', 'avoidNote', 'toneRole', 'toneRole'],
        mc: [
          { q: 'Over the V7 chord of a major key, the diatonic mode is…', a: 'Mixolydian', o: ['Ionian', 'Dorian', 'Lydian'], why: 'The mode starting on the 5th degree is Mixolydian: 1 2 3 4 5 6 ♭7, which matches a dominant 7th.' },
          { q: 'An “avoid note” is a scale note that…', a: 'Sits a half step above a chord tone', o: ['Is not in the scale', 'Is the root of the chord', 'Is a whole step above a chord tone'], why: 'The half-step rub (like F against E over Cmaj7) clashes when sustained. Use it as a passing tone.' },
          { q: 'Why does the IV chord take the Lydian mode?', a: 'Lydian is the mode starting on the 4th degree of the major scale', o: ['Lydian is the brightest, so it always fits', 'IV chords are always maj7♯11', 'Because Ionian contains an avoid note'], why: 'Diatonically, the scale built from the 4th degree of the key is Lydian. Its ♯4 is the key’s 7th degree.' },
        ],
      },
      practice: {
        type: 'guide',
        title: 'Chord-tone catcher',
        intro: 'Start the loop. While each chord plays, click any of its chord tones on the fretboard. Each correct note in time scores a point. Wrong notes flash red. Score 12 to complete the unit.',
        target: 'chord',
        key: 0,
        bpm: 66,
        chords: [c('1', 'maj7', 8, 'ionian'), c('6', 'm7', 8, 'aeolian'), c('2', 'm7', 8, 'dorian'), c('5', '7', 8, 'mixolydian')],
        goal: 12,
      },
    },

    /* ------------------------------------------------------------------ 7 */
    {
      id: 'guidetones',
      title: 'Guide tones and voice leading',
      level: 'Intermediate',
      goal: 'Use the 3rd and 7th of each chord to make your lines follow the harmony.',
      learn: [
        {
          h: 'The 3rd and 7th define the chord',
          html: `<p>The root and 5th are shared by many chords (the bass usually plays the root anyway). The <strong>3rd and 7th</strong> are what tell maj7, 7 and m7 apart. They are called <strong>guide tones</strong>.</p>
          <ul>
            <li>Cmaj7 → 3 = E, 7 = B</li>
            <li>C7 → 3 = E, ♭7 = B♭</li>
            <li>Cm7 → ♭3 = E♭, ♭7 = B♭</li>
          </ul>
          <p>Play only the 3rd and 7th of a chord over a bass note and the chord is fully recognisable.</p>`,
          demo: { type: 'chords', key: 0, items: [ch('2', 'm7'), ch('5', '7'), ch('1', 'maj7')], guide: true },
        },
        {
          h: 'Guide tones move by step',
          html: `<p>In a ii–V–I the guide tones barely move:</p>
          <ul>
            <li>The <strong>7th of each chord falls a half step to the 3rd of the next</strong>: C (7 of Dm7) → B (3 of G7); F (7 of G7) → E (3 of Cmaj7).</li>
            <li>The <strong>3rd of each chord becomes the 7th of the next</strong>: F (3 of Dm7) stays as the 7 of G7.</li>
          </ul>
          <p>That smooth motion is <strong>voice leading</strong>. Hear just the two guide-tone voices, then hear them under the full chords.</p>`,
          demo: {
            type: 'compare',
            key: 0,
            items: [
              { label: 'Guide tones only', sub: 'F/C → F/B → E/B', steps: [n(53, 60), n(53, 59), n(52, 59)] },
              { label: 'Full ii–V–I', sub: 'Dm7 → G7 → Cmaj7', steps: [ch('2', 'm7'), ch('5', '7'), ch('1', 'maj7')] },
            ],
          },
        },
        {
          h: 'Targeting in your solos',
          html: `<p>Use guide tones as the skeleton of a solo:</p>
          <ol>
            <li>Play one guide tone per chord, choosing the nearest one each time.</li>
            <li>Arrive on it on beat 1 of the chord.</li>
            <li>Decorate: approach it from a half step below, or from a scale step above (an <em>enclosure</em>).</li>
          </ol>
          <p>Turn on “Guide tones” in the lab and trace a line through the changes.</p>`,
          demo: { type: 'loop', key: 0, bpm: 80, chords: [c('2', 'm7', 4, 'dorian'), c('5', '7', 4, 'mixolydian'), c('1', 'maj7', 8, 'ionian')], view: 'guide', link: 'improvise?prog=iiVI' },
        },
      ],
      quiz: {
        gens: ['guideTones', 'guideTones', 'guideTones', 'toneRole'],
        mc: [
          { q: 'Which two notes are the “guide tones” of a chord?', a: 'The 3rd and the 7th', o: ['The root and the 5th', 'The root and the 3rd', 'The 5th and the 9th'], why: 'They define the chord quality and move smoothly between chords.' },
          { q: 'In a ii–V–I, the 7th of each chord usually moves to…', a: 'The 3rd of the next chord, down a half step', o: ['The root of the next chord', 'The 5th of the next chord', 'The same note an octave up'], why: 'C (♭7 of Dm7) → B (3 of G7); F (♭7 of G7) → E (3 of Cmaj7).' },
          { q: 'An enclosure approaches a target note from…', a: 'Above and below, then lands on it', o: ['Only from far away', 'An octave above', 'The root of the chord'], why: 'For example, targeting E: F – D♯ – E. It is the classic bebop way to aim at chord tones.' },
        ],
      },
      practice: {
        type: 'guide',
        title: 'Guide-tone game',
        intro: 'Start the loop and click a 3rd or a 7th of each chord while it plays. Try to stay in one area of the neck and move to the nearest guide tone each time. Score 12 to complete the unit.',
        target: 'guide',
        key: 0,
        bpm: 66,
        chords: [c('2', 'm7', 8, 'dorian'), c('5', '7', 8, 'mixolydian'), c('1', 'maj7', 8, 'ionian'), c('6', 'm7', 8, 'aeolian')],
        goal: 12,
      },
    },

    /* ------------------------------------------------------------------ 8 */
    {
      id: 'twofive',
      title: 'The ii–V–I, major and minor',
      level: 'Intermediate',
      goal: 'Play and hear the most important progression in jazz and pop, in major and in minor.',
      learn: [
        {
          h: 'The engine of jazz',
          html: `<p><strong>ii – V – I</strong> is the T-S-D cycle in its strongest form: subdominant → dominant → tonic, with roots moving up a 4th each time (D → G → C).</p>
          <p>Thousands of tunes are chains of ii–V–Is, sometimes in different keys. Once you can hear and play it, most standards start to make sense.</p>`,
          demo: { type: 'loop', key: 0, bpm: 92, chords: [c('2', 'm7', 4, 'dorian'), c('5', '7', 4, 'mixolydian'), c('1', 'maj7', 8, 'ionian')], view: 'scale', link: 'improvise?prog=iiVI' },
        },
        {
          h: 'What to play over a major ii–V–I',
          html: `<ul>
            <li><strong>Dm7</strong>: D Dorian · <strong>G7</strong>: G Mixolydian · <strong>Cmaj7</strong>: C Ionian. All three are the C major scale, so one scale covers the whole thing.</li>
            <li>To sound more advanced, add <strong>tension on V</strong>: the Altered scale (G7alt) or the half-whole diminished, then resolve each tension by half step into a chord tone of I.</li>
          </ul>`,
          demo: {
            type: 'compare',
            key: 0,
            items: [
              { label: 'Plain V7', sub: 'Dm7 – G7 – Cmaj7', steps: [ch('2', 'm7'), ch('5', '7'), ch('1', 'maj7')] },
              { label: 'Altered V7', sub: 'Dm7 – G7alt – Cmaj7', steps: [ch('2', 'm7'), ch('5', '7alt'), ch('1', 'maj7')] },
            ],
          },
        },
        {
          h: 'The minor ii–V–i',
          html: `<p>In a minor key the same cycle uses darker chords: <strong>iiø7 – V7♭9 – i</strong> (Bm7♭5 – E7♭9 – Am6 in A minor).</p>
          <ul>
            <li><strong>iiø7</strong>: Locrian ♮2 (or Locrian).</li>
            <li><strong>V7♭9</strong>: Phrygian dominant (the 5th mode of harmonic minor) or the Altered scale.</li>
            <li><strong>i</strong>: melodic minor (for m6 / m(maj7)) or Dorian.</li>
          </ul>
          <p>The key move: resolve the ♭9 of V (F over E7) down a half step to the 5th of i (E).</p>`,
          demo: { type: 'loop', key: 9, minor: true, bpm: 88, chords: [c('2', 'm7b5', 4, 'locrianNat2'), c('5', '7b9', 4, 'phrygianDominant'), c('1', 'm6', 8, 'melodicMinor')], view: 'scale', link: 'improvise?prog=minorIIVi' },
        },
        {
          h: 'Spotting ii–Vs in songs',
          html: `<p>Any <strong>m7 chord followed by a dominant 7th a 4th higher</strong> is a ii–V, even if it never resolves, and even if it is in a different key from the song. Chains of them create the “cycle” sound of standards like Autumn Leaves.</p>
          <p>Paste any progression into the <a data-go="analyze">Analyzer</a> and it will point out every ii–V it finds.</p>`,
        },
      ],
      quiz: {
        gens: ['twoFiveOne', 'twoFiveOne', 'twoFiveOneMinor', 'twoFiveOneMinor'],
        mc: [
          { q: 'Over Dm7 – G7 – Cmaj7, which single scale covers all three chords?', a: 'C major', o: ['D Dorian only', 'G Mixolydian only', 'C minor pentatonic'], why: 'Dorian, Mixolydian and Ionian here are all modes of C major.' },
          { q: 'In a minor ii–V–i, the ii chord is…', a: 'Half-diminished (m7♭5)', o: ['Minor 7', 'Dominant 7', 'Major 7'], why: 'In natural minor the 2nd degree gives 1 ♭3 ♭5 ♭7, a m7♭5.' },
          { q: 'Which scale gives maximum tension on V7 before resolving to I?', a: 'Altered', o: ['Ionian', 'Lydian', 'Major pentatonic'], why: 'The Altered scale contains every altered tension (♭9 ♯9 ♯11 ♭13), all a half step from a chord tone of I.' },
          { q: 'Over E7♭9 resolving to Am, a great scale choice is…', a: 'E Phrygian dominant', o: ['E Mixolydian', 'E Dorian', 'E Lydian'], why: 'Phrygian dominant (A harmonic minor from E) contains the ♭9 (F) and the leading tone G♯.' },
        ],
      },
      practice: {
        type: 'build',
        title: 'ii–V–I in every key',
        intro: 'Build major and minor ii–V–Is in random keys. Name the chords before clicking them: that is the skill. Five correct rounds complete the unit.',
        tasks: 'twoFive',
        goal: 5,
      },
    },

    /* ------------------------------------------------------------------ 9 */
    {
      id: 'minor',
      title: 'Minor keys: three minors in one',
      level: 'Advanced',
      goal: 'Understand natural, harmonic and melodic minor, and which one each chord calls for.',
      learn: [
        {
          h: 'Natural minor harmony',
          html: `<p>Harmonize natural minor (Aeolian) and you get:</p>
          <p class="hm-big-formula">i &nbsp; ii° &nbsp; ♭III &nbsp; iv &nbsp; v &nbsp; ♭VI &nbsp; ♭VII</p>
          <p>Notice the <strong>v is minor</strong>: there is no leading tone, so v → i resolves weakly. Rock and modal music love that softness (Am – G – F – G).</p>`,
          demo: { type: 'chords', key: 9, minor: true, items: [ch('1', 'm'), ch('2', 'dim'), ch('b3', 'maj'), ch('4', 'm'), ch('5', 'm'), ch('b6', 'maj'), ch('b7', 'maj')] },
        },
        {
          h: 'Harmonic minor: borrowing the leading tone',
          html: `<p>Raise the 7th degree of natural minor (G → G♯ in A minor) and you get <strong>harmonic minor</strong>. Now the V chord is major (E, or E7) and has a leading tone pulling to the tonic.</p>
          <p>That is why minor-key songs almost always use a <strong>major V7</strong> even though the key is minor. Over that V7, play harmonic minor of the key (E Phrygian dominant).</p>`,
          demo: {
            type: 'compare',
            key: 9,
            minor: true,
            items: [
              { label: 'v → i', sub: 'Em → Am (natural)', steps: [ch('1', 'm'), ch('4', 'm'), ch('5', 'm'), ch('1', 'm')] },
              { label: 'V7 → i', sub: 'E7 → Am (harmonic)', steps: [ch('1', 'm'), ch('4', 'm'), ch('5', '7'), ch('1', 'm')] },
            ],
          },
        },
        {
          h: 'Melodic minor and Dorian',
          html: `<p>Raise the 6th as well and you get <strong>melodic minor</strong>: the jazz minor, with a smooth m6 or m(maj7) tonic.</p>
          <p><strong>Dorian</strong> (natural minor with a ♮6) is the modal cousin: its IV chord is <em>major</em>. i – IV is the sound of Santana, funk and soul. Compare i – iv (Aeolian) with i – IV (Dorian):</p>`,
          demo: {
            type: 'compare',
            key: 9,
            minor: true,
            items: [
              { label: 'i – iv', sub: 'Am – Dm (Aeolian)', steps: [ch('1', 'm7'), ch('4', 'm7'), ch('1', 'm7'), ch('4', 'm7')] },
              { label: 'i – IV', sub: 'Am – D (Dorian)', steps: [ch('1', 'm7'), ch('4', '7'), ch('1', 'm7'), ch('4', '7')] },
            ],
          },
        },
        {
          h: 'Which scale, when?',
          html: `<p>Take the <strong>Andalusian cadence</strong> i – ♭VII – ♭VI – V (Am – G – F – E). The first three chords are natural minor, so A Aeolian works. The last chord is E major, which contains G♯: switch to <strong>E Phrygian dominant</strong> (A harmonic minor) and land on G♯ as it arrives.</p>
          <p>That one-note switch is what separates a player who “plays in A minor” from one who plays the changes.</p>`,
          demo: { type: 'loop', key: 9, minor: true, bpm: 84, chords: [c('1', 'm', 4, 'aeolian'), c('b7', 'maj', 4, 'mixolydian'), c('b6', 'maj', 4, 'lydian'), c('5', '7', 4, 'phrygianDominant')], view: 'scale', link: 'improvise?prog=andalusian' },
        },
      ],
      quiz: {
        gens: ['minorDiatonic', 'minorDiatonic', 'minorV', 'majorMinorEar', 'majorMinorEar'],
        mc: [
          { q: 'Natural minor’s v chord is minor. What do composers usually change?', a: 'Raise the 7th degree so V becomes major', o: ['Lower the 5th degree', 'Raise the 3rd of the tonic', 'Nothing: v → i is the strongest cadence'], why: 'Raising the 7th (harmonic minor) gives V a major 3rd, the leading tone, a half step below the tonic.' },
          { q: 'Which mode is minor but has a natural 6th?', a: 'Dorian', o: ['Aeolian', 'Phrygian', 'Locrian'], why: 'Dorian = 1 2 ♭3 4 5 6 ♭7. That ♮6 makes the IV chord major.' },
          { q: 'Over E7 in the key of A minor, the best-fitting scale is…', a: 'E Phrygian dominant (A harmonic minor)', o: ['E Mixolydian', 'A natural minor', 'E minor pentatonic'], why: 'It keeps the key’s notes but includes G♯, the 3rd of E7 and the leading tone of A minor.' },
        ],
      },
      practice: {
        type: 'jam',
        title: 'Jam: the Andalusian cadence',
        intro: 'Loop the progression and work through the challenges. Tick each one when you can do it comfortably. Use “Scale” view to see the switch on the last chord.',
        key: 9,
        minor: true,
        bpm: 84,
        chords: [c('1', 'm', 4, 'aeolian'), c('b7', 'maj', 4, 'mixolydian'), c('b6', 'maj', 4, 'lydian'), c('5', '7', 4, 'phrygianDominant')],
        tasks: [
          'Play the A natural minor scale over the first three chords, in one position.',
          'On the E7, switch to A harmonic minor: play the G♯ as soon as the chord arrives.',
          'Target the 3rd of every chord on beat 1 (C, B, A, G♯).',
          'Improvise a phrase that ends on the G♯ over E7 and resolves to A on the next Am.',
        ],
      },
    },

    /* ------------------------------------------------------------------ 10 */
    {
      id: 'secondary',
      title: 'Secondary dominants',
      level: 'Advanced',
      goal: 'Recognise and use “V of” chords, and know what to play over them.',
      learn: [
        {
          h: 'V of anything',
          html: `<p>Any major or minor chord of the key can be approached by <strong>its own dominant 7th</strong>, as if it were a temporary tonic. These are <strong>secondary dominants</strong>, written V/ii (“five of two”), V/V and so on. In C:</p>
          <ul>
            <li>V/ii = <strong>A7</strong> → Dm</li>
            <li>V/iii = <strong>B7</strong> → Em</li>
            <li>V/IV = <strong>C7</strong> → F</li>
            <li>V/V = <strong>D7</strong> → G</li>
            <li>V/vi = <strong>E7</strong> → Am</li>
          </ul>
          <p>(vii° never gets one: a diminished chord is too unstable to act as a temporary home.)</p>`,
          demo: { type: 'chords', key: 0, items: [ch('6', '7'), ch('2', 'm'), ch('2', '7'), ch('5', 'maj'), ch('3', '7'), ch('6', 'm')] },
        },
        {
          h: 'Spot them by the chromatic note',
          html: `<p>A secondary dominant always brings <strong>one note from outside the key</strong>: the leading tone of its target. A7 in C contains <strong>C♯</strong>, which pulls up to D. E7 contains <strong>G♯</strong>, which pulls up to A.</p>
          <p>Rule: a major or dominant chord built on a degree where the key has a minor chord (II, III, VI), or a dominant 7th on I, is almost always a secondary dominant.</p>`,
          demo: {
            type: 'compare',
            key: 0,
            items: [
              { label: 'I – vi – ii – V', sub: 'all diatonic', steps: [ch('1', 'maj'), ch('6', 'm'), ch('2', 'm'), ch('5', '7')] },
              { label: 'I – VI7 – ii – V', sub: 'A7 = V/ii', steps: [ch('1', 'maj'), ch('6', '7'), ch('2', 'm'), ch('5', '7')] },
              { label: 'I – III7 – vi', sub: 'E7 = V/vi', steps: [ch('1', 'maj'), ch('3', '7'), ch('6', 'm'), ch('6', 'm')] },
            ],
          },
        },
        {
          h: 'What to play over them',
          html: `<ul>
            <li>If the target is <strong>major</strong> (D7 → G), use <strong>Mixolydian</strong> of the secondary dominant.</li>
            <li>If the target is <strong>minor</strong> (A7 → Dm, E7 → Am), use <strong>Phrygian dominant</strong>: the harmonic minor of the target, starting from the dominant.</li>
            <li>Shortcut: keep playing the key’s scale and <strong>change one note</strong>, the chromatic one (C → C♯ over A7).</li>
          </ul>`,
          demo: { type: 'loop', key: 0, bpm: 88, chords: [c('1', 'maj7', 4, 'ionian'), c('6', '7', 4, 'phrygianDominant'), c('2', 'm7', 4, 'dorian'), c('5', '7', 4, 'mixolydian')], view: 'scale' },
        },
      ],
      quiz: {
        gens: ['secondaryDom', 'secondaryDom', 'secondaryTarget', 'secondaryTarget'],
        mc: [
          { q: 'E7 in the key of C usually resolves to…', a: 'Am (vi)', o: ['C (I)', 'F (IV)', 'G (V)'], why: 'E is the 5th of A, so E7 is V/vi. Its G♯ pulls up to A.' },
          { q: 'Over A7 resolving to Dm, a great scale is…', a: 'A Phrygian dominant (D harmonic minor)', o: ['A Mixolydian', 'A minor pentatonic', 'C major'], why: 'It keeps the ♭9 (B♭) and ♭13 (F) from D minor and the leading tone C♯.' },
          { q: 'Which diatonic chord does not get a secondary dominant?', a: 'vii°', o: ['ii', 'IV', 'vi'], why: 'A diminished chord is not stable enough to be “tonicized”.' },
        ],
      },
      practice: {
        type: 'build',
        title: 'Add the secondary dominant',
        intro: 'Build progressions that include secondary dominants. Find the target chord first, then the dominant a 5th above it. Five correct rounds complete the unit.',
        tasks: 'secondary',
        goal: 5,
      },
    },

    /* ------------------------------------------------------------------ 11 */
    {
      id: 'borrowed',
      title: 'Borrowed chords (modal interchange)',
      level: 'Advanced',
      goal: 'Colour a major key with chords from its parallel minor and know which scale to use.',
      learn: [
        {
          h: 'Borrowing from the parallel minor',
          html: `<p>A major key can borrow chords from the <strong>minor key with the same tonic</strong> (C major borrows from C minor). The most common:</p>
          <ul>
            <li><strong>iv</strong> (Fm): bittersweet, nostalgic.</li>
            <li><strong>♭VI</strong> (A♭): epic, cinematic.</li>
            <li><strong>♭VII</strong> (B♭): rock, anthemic.</li>
            <li><strong>♭III</strong> (E♭): bold, bluesy.</li>
          </ul>`,
          demo: { type: 'chords', key: 0, items: [ch('1', 'maj'), ch('4', 'm'), ch('b6', 'maj'), ch('b7', 'maj'), ch('b3', 'maj')] },
        },
        {
          h: 'Famous borrowed sounds',
          html: `<p>Each borrowed chord has a signature effect. Hear them against the plain diatonic version:</p>`,
          demo: {
            type: 'compare',
            key: 0,
            items: [
              { label: 'I – IV – I', sub: 'plain', steps: [ch('1', 'maj'), ch('4', 'maj'), ch('1', 'maj')] },
              { label: 'I – iv – I', sub: 'minor plagal', steps: [ch('1', 'maj'), ch('4', 'm'), ch('1', 'maj')] },
              { label: 'I – ♭VI – ♭VII – I', sub: 'the heroic cadence', steps: [ch('1', 'maj'), ch('b6', 'maj'), ch('b7', 'maj'), ch('1', 'maj')] },
              { label: 'I – ♭VII – IV – I', sub: 'Mixolydian rock', steps: [ch('1', 'maj'), ch('b7', 'maj'), ch('4', 'maj'), ch('1', 'maj')] },
            ],
          },
        },
        {
          h: 'Scales over borrowed chords',
          html: `<p>The simplest rule: over a borrowed chord, <strong>play the parallel minor</strong> (C natural minor over A♭ or B♭ in C major). Seen from each chord’s root, that gives:</p>
          <ul>
            <li>iv → <strong>Dorian</strong> (F Dorian)</li>
            <li>♭VI → <strong>Lydian</strong> (A♭ Lydian)</li>
            <li>♭VII → <strong>Mixolydian</strong> (B♭ Mixolydian)</li>
            <li>♭III → <strong>Ionian</strong> (E♭ major)</li>
          </ul>
          <p>In practice you only change one or two notes from the home key: E → E♭, A → A♭, B → B♭. Target those changed notes: they <em>are</em> the colour.</p>`,
          demo: { type: 'loop', key: 0, bpm: 84, chords: [c('1', 'maj', 4, 'ionian'), c('b6', 'maj', 4, 'lydian'), c('b7', 'maj', 4, 'mixolydian'), c('1', 'maj', 4, 'ionian')], view: 'scale' },
        },
      ],
      quiz: {
        gens: ['borrowed', 'borrowed', 'borrowedScale', 'borrowedEar', 'borrowedEar'],
        mc: [
          { q: 'C major borrowing from its parallel minor means borrowing from…', a: 'C minor', o: ['A minor', 'G major', 'F major'], why: 'Parallel = same tonic (C major ↔ C minor). A minor is the relative minor: same notes, not a source of new colours.' },
          { q: 'The I – ♭VI – ♭VII – I progression gets its colour from…', a: 'Chords borrowed from the parallel minor', o: ['Secondary dominants', 'Tritone substitutions', 'The blues scale'], why: '♭VI and ♭VII don’t exist in the major key; they come from the minor key on the same tonic.' },
        ],
      },
      practice: {
        type: 'ear',
        title: 'Spot the borrowed chord',
        intro: 'You will hear I – ? – I. Is the middle chord the plain IV or V, or a borrowed iv, ♭VI or ♭VII? Get 8 of 10.',
        gens: ['borrowedEar'],
        rounds: 10,
        goal: 8,
      },
    },

    /* ------------------------------------------------------------------ 12 */
    {
      id: 'tension',
      title: 'Tension tools: tritone subs, altered and diminished',
      level: 'Advanced',
      goal: 'Use the advanced tools that make dominant chords exciting.',
      learn: [
        {
          h: 'Tritone substitution',
          html: `<p>G7 and D♭7 share the same tritone: B/C♭ and F. So D♭7 can <strong>replace G7</strong> and still resolve to C. Dm7 – D♭7 – Cmaj7 gives a smooth chromatic bass line (D – D♭ – C).</p>
          <p>Over the ♭II7, play <strong>Lydian dominant</strong> (D♭ Lydian dominant has the same notes as G Altered).</p>`,
          demo: {
            type: 'compare',
            key: 0,
            items: [
              { label: 'ii – V – I', sub: 'Dm7 – G7 – Cmaj7', steps: [ch('2', 'm7'), ch('5', '7'), ch('1', 'maj7')] },
              { label: 'ii – ♭II7 – I', sub: 'Dm7 – D♭7 – Cmaj7', steps: [ch('2', 'm7'), ch('b2', '7'), ch('1', 'maj7')] },
            ],
          },
        },
        {
          h: 'Altered dominants',
          html: `<p>A dominant that resolves can take <strong>altered tensions</strong>: ♭9, ♯9, ♯11 (♭5) and ♭13 (♯5). Each sits a half step from a note of the target chord, so it resolves naturally.</p>
          <p>The <strong>Altered scale</strong> contains all of them: <code>1 ♭9 ♯9 3 ♭5 ♭13 ♭7</code>. Shortcut: it is the melodic minor scale a half step above the root (A♭ melodic minor over G7alt).</p>`,
          demo: {
            type: 'compare',
            key: 0,
            items: [
              { label: 'G7 → C', sub: 'plain', steps: [ch('5', '7'), ch('1', 'maj7')] },
              { label: 'G7♭9 → C', sub: 'dark', steps: [ch('5', '7b9'), ch('1', 'maj7')] },
              { label: 'G7alt → C', sub: 'maximum tension', steps: [ch('5', '7alt'), ch('1', 'maj7')] },
            ],
          },
        },
        {
          h: 'Diminished passing chords',
          html: `<p>A °7 chord between two diatonic chords creates a chromatic bass line: <strong>C – C♯°7 – Dm7</strong>. The °7 is symmetric: it is built only from minor 3rds, so it <strong>repeats every 3 frets</strong>, and any of its four notes can be the root.</p>
          <p>Secret: C♯°7 is an A7♭9 without its root, so it works as a secondary dominant (V/ii) in disguise. Over °7, use the <strong>whole-half diminished</strong> scale.</p>`,
          demo: {
            type: 'compare',
            key: 0,
            items: [
              { label: 'I – ii', sub: 'C – Dm7', steps: [ch('1', 'maj7'), ch('1', 'maj7'), ch('2', 'm7'), ch('5', '7')] },
              { label: 'I – ♯I°7 – ii', sub: 'C – C♯°7 – Dm7', steps: [ch('1', 'maj7'), ch('#1', 'dim7'), ch('2', 'm7'), ch('5', '7')] },
            ],
          },
        },
        {
          h: 'Putting it all together',
          html: `<p>A <strong>jazz blues</strong> uses almost every tool in this course: dominant 7ths, ii–Vs, a ♯iv°7 passing chord, secondary dominants and a turnaround. Play it in the <a data-go="improvise?prog=jazzBlues">Improvise lab</a>, and paste your favourite songs into the <a data-go="analyze">Analyzer</a> to find these devices in the wild.</p>`,
          demo: { type: 'loop', key: 0, bpm: 92, chords: [c('1', 'maj7', 4, 'ionian'), c('#1', 'dim7', 4, 'dimWH'), c('2', 'm7', 4, 'dorian'), c('b2', '7', 4, 'lydianDominant')], view: 'scale' },
        },
      ],
      quiz: {
        gens: ['tritoneSub', 'tritoneSub', 'tritoneSub'],
        mc: [
          { q: 'Why can D♭7 replace G7?', a: 'They share the same tritone (F and B/C♭)', o: ['They have the same root', 'D♭ is the relative minor of G', 'Both are diatonic in C'], why: 'The 3rd and ♭7 of G7 (B, F) are the ♭7 and 3rd of D♭7 (C♭, F).' },
          { q: 'The Altered scale over G7 has the same notes as…', a: 'A♭ melodic minor', o: ['G melodic minor', 'C major', 'G harmonic minor'], why: 'The Altered scale is the 7th mode of melodic minor: play melodic minor a half step above the root.' },
          { q: 'A diminished 7th chord shape repeats every…', a: '3 frets', o: ['2 frets', '4 frets', '5 frets'], why: 'It is built entirely from minor 3rds (3 semitones), so moving it 3 frets gives the same four notes.' },
          { q: 'Over a ♭II7 tritone substitute, a common scale choice is…', a: 'Lydian dominant', o: ['Ionian', 'Phrygian', 'Aeolian'], why: 'D♭ Lydian dominant contains the chord tones plus the ♯11, and shares its notes with G Altered.' },
          { q: 'C♯°7 between C and Dm7 works because it is…', a: 'A7♭9 without its root (V/ii in disguise)', o: ['A borrowed chord from C minor', 'A tritone sub of G7', 'The vii° of C major'], why: 'A7♭9 = A C♯ E G B♭. Drop the A and you get C♯ E G B♭, which is C♯°7.' },
        ],
      },
      practice: {
        type: 'jam',
        title: 'Jam: tension and release',
        intro: 'Loop the progression and work through the challenges. Tick each one when it feels comfortable. Then take it further in the Improvise lab with the jazz blues.',
        key: 0,
        bpm: 84,
        chords: [c('2', 'm7', 4, 'dorian'), c('b2', '7', 4, 'lydianDominant'), c('1', 'maj7', 4, 'ionian'), c('6', '7b9', 4, 'phrygianDominant')],
        tasks: [
          'Hear the chromatic bass line D – D♭ – C under the ii – ♭II7 – I.',
          'Over D♭7, play D♭ Lydian dominant, then resolve its 3rd (F) down a half step to E as Cmaj7 arrives.',
          'Over A7♭9, play the ♭9 (B♭) and resolve it down to A on the next Dm7.',
          'Improvise one chorus using only guide tones (3rds and 7ths), then add tensions on the dominants.',
        ],
        links: [
          { label: 'Jazz blues in the Improvise lab', go: 'improvise?prog=jazzBlues' },
          { label: 'Analyze your own progression', go: 'analyze' },
        ],
      },
    },
  ];

  GT.HARMONY = { UNITS };
})();
