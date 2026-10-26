/* ==========================================================================
   DeutschWeg – generated drills (unlimited practice for German's hard spots)
   ========================================================================== */
(function () {
  const { shuffle, pick, sample } = GT;
  const D = (GT.drills = {});
  const CASES = ['Nom', 'Akk', 'Dat', 'Gen'];
  const CASE_DE = { Nom: 'Nominativ', Akk: 'Akkusativ', Dat: 'Dativ', Gen: 'Genitiv' };
  const GEN_DE = { m: 'maskulin', f: 'feminin', n: 'neutral', pl: 'Plural' };

  /* ---------------- Adjective endings ---------------- */
  const DEF = { m: ['der', 'den', 'dem', 'des'], f: ['die', 'die', 'der', 'der'], n: ['das', 'das', 'dem', 'des'], pl: ['die', 'die', 'den', 'der'] };
  const INDEF = { m: ['ein', 'einen', 'einem', 'eines'], f: ['eine', 'eine', 'einer', 'einer'], n: ['ein', 'ein', 'einem', 'eines'], pl: ['keine', 'keine', 'keinen', 'keiner'] };
  const WEAK = { m: ['e', 'en', 'en', 'en'], f: ['e', 'e', 'en', 'en'], n: ['e', 'e', 'en', 'en'], pl: ['en', 'en', 'en', 'en'] };
  const MIXED = { m: ['er', 'en', 'en', 'en'], f: ['e', 'e', 'en', 'en'], n: ['es', 'es', 'en', 'en'], pl: ['en', 'en', 'en', 'en'] };
  const STRONG = { m: ['er', 'en', 'em', 'en'], f: ['e', 'e', 'er', 'er'], n: ['es', 'es', 'em', 'en'], pl: ['e', 'e', 'en', 'er'] };
  D.tables = { DEF, INDEF, WEAK, MIXED, STRONG };

  // noun: [singular, gender, genitive sg, plural, dative pl]
  const NOUNS = [
    ['Mann', 'm', 'Mannes', 'Männer', 'Männern'], ['Tisch', 'm', 'Tisches', 'Tische', 'Tischen'], ['Hund', 'm', 'Hundes', 'Hunde', 'Hunden'],
    ['Lehrer', 'm', 'Lehrers', 'Lehrer', 'Lehrern'], ['Garten', 'm', 'Gartens', 'Gärten', 'Gärten'], ['Computer', 'm', 'Computers', 'Computer', 'Computern'],
    ['Frau', 'f', 'Frau', 'Frauen', 'Frauen'], ['Stadt', 'f', 'Stadt', 'Städte', 'Städten'], ['Lampe', 'f', 'Lampe', 'Lampen', 'Lampen'],
    ['Wohnung', 'f', 'Wohnung', 'Wohnungen', 'Wohnungen'], ['Idee', 'f', 'Idee', 'Ideen', 'Ideen'], ['Kollegin', 'f', 'Kollegin', 'Kolleginnen', 'Kolleginnen'],
    ['Kind', 'n', 'Kindes', 'Kinder', 'Kindern'], ['Buch', 'n', 'Buches', 'Bücher', 'Büchern'], ['Haus', 'n', 'Hauses', 'Häuser', 'Häusern'],
    ['Auto', 'n', 'Autos', 'Autos', 'Autos'], ['Zimmer', 'n', 'Zimmers', 'Zimmer', 'Zimmern'], ['Fahrrad', 'n', 'Fahrrads', 'Fahrräder', 'Fahrrädern'],
  ];
  const MASS = [['Wein', 'm', 'Weins'], ['Kaffee', 'm', 'Kaffees'], ['Käse', 'm', 'Käses'], ['Milch', 'f', 'Milch'], ['Musik', 'f', 'Musik'], ['Wasser', 'n', 'Wassers'], ['Brot', 'n', 'Brotes'], ['Wetter', 'n', 'Wetters']];
  // adjective: [base, stem]
  const ADJ = [['alt', 'alt'], ['neu', 'neu'], ['groß', 'groß'], ['klein', 'klein'], ['schön', 'schön'], ['rot', 'rot'], ['interessant', 'interessant'],
    ['teuer', 'teur'], ['dunkel', 'dunkl'], ['modern', 'modern'], ['freundlich', 'freundlich'], ['hoch', 'hoh'], ['bequem', 'bequem'], ['ruhig', 'ruhig']];
  const MASS_ADJ = [['kalt', 'kalt'], ['warm', 'warm'], ['frisch', 'frisch'], ['gut', 'gut'], ['schlecht', 'schlecht'], ['teuer', 'teur']];
  const FRAME = {
    Nom: (pl) => (pl ? 'Das sind {X}.' : 'Das ist {X}.'),
    Akk: () => 'Ich mag {X}.',
    Dat: () => 'Wir sind zufrieden mit {X}.',
    Gen: () => 'Wir bleiben wegen {X} hier.',
  };

  D.adjective = function () {
    const type = pick(['def', 'def', 'indef', 'indef', 'none']);
    const ci = Math.floor(Math.random() * 4), cs = CASES[ci];
    let noun, g, adj, art = '', form, endings, label;
    if (type === 'none') {
      if (Math.random() < 0.5) { const n = pick(MASS); g = n[1]; noun = cs === 'Gen' ? n[2] : n[0]; adj = pick(MASS_ADJ); }
      else { const n = pick(NOUNS); g = 'pl'; noun = cs === 'Dat' ? n[4] : n[3]; adj = pick(ADJ); }
      endings = STRONG; label = 'ohne Artikel → starke Deklination (Adjektiv zeigt den Kasus)';
    } else {
      const n = pick(NOUNS);
      const plural = Math.random() < 0.25;
      g = plural ? 'pl' : n[1];
      noun = plural ? (cs === 'Dat' ? n[4] : n[3]) : (cs === 'Gen' ? n[2] : n[0]);
      adj = pick(ADJ);
      if (type === 'def') { art = DEF[g][ci]; endings = WEAK; label = 'nach bestimmtem Artikel → schwache Deklination (meist -e/-en)'; }
      else { art = INDEF[g][ci]; endings = g === 'pl' ? WEAK : MIXED; label = g === 'pl' ? 'nach „keine“ im Plural → -en' : 'nach ein/kein → gemischte Deklination'; }
    }
    form = adj[1] + endings[g][ci];
    if (adj[0] === adj[1] || !/^(e|en|em|er|es)$/.test(endings[g][ci])) { /* regular */ }
    const X = (art ? art + ' ' : '') + '___ ' + noun;
    const q = FRAME[cs](g === 'pl').replace('{X}', X);
    return {
      kind: 'gap', skill: 'adjective', q, a: [form],
      h: adj[0] + ' → ? (' + CASE_DE[cs] + ', ' + GEN_DE[g] + ')',
      e: 'Endung <b>-' + endings[g][ci] + '</b>: ' + label + '.' + (adj[0] !== adj[1] ? ' Achtung: ' + adj[0] + ' → ' + adj[1] + '-.' : ''),
    };
  };

  /* ---------------- Strong / irregular verbs ---------------- */
  D.verb = function () {
    const v = pick(GT.ref.verbs); // [inf, er-präsens, präteritum, perfekt(aux + PII), en]
    const mode = pick(['prät', 'perf', 'perf', 'präs']);
    if (mode === 'präs' && v[1] === GT.ref.regularPres(v[0])) return D.verb();
    const map = {
      präs: ['Präsens', 'er/sie/es', v[1]],
      prät: ['Präteritum', 'er/sie/es', v[2]],
      perf: ['Perfekt', 'er/sie/es', v[3]],
    };
    const [tense, person, ans] = map[mode];
    const answers = [ans, 'er ' + ans];
    return {
      kind: 'gap', skill: 'verbs', q: tense + ' von „' + v[0] + '“ (' + v[4] + '): er ___',
      h: mode === 'perf' ? 'Hilfsverb + Partizip II, z. B. „hat gemacht“ / „ist gegangen“' : person,
      a: answers,
      e: v[0] + ' – ' + v[1] + ' – ' + v[2] + ' – ' + v[3],
    };
  };

  /* ---------------- Prepositions & cases ---------------- */
  D.prepCase = function () {
    const p = pick(GT.ref.preps); // [prep, case, en, example]
    const opts = ['Akkusativ', 'Dativ', 'Genitiv', 'Wechselpräposition (Akk./Dat.)'];
    const a = { A: 0, D: 1, G: 2, W: 3 }[p[1]];
    return { kind: 'mc', skill: 'prepositions', q: 'Welcher Kasus folgt auf „' + p[0] + '“?', h: p[2], o: opts, a, e: 'Beispiel: ' + p[3] };
  };
  D.prepArticle = function () {
    const p = pick(GT.ref.preps.filter((x) => x[1] !== 'W' && !/^(entlang|gegenüber|dank|ab|bis)$/.test(x[0])));
    const ci = { A: 1, D: 2, G: 3 }[p[1]];
    const n = pick(NOUNS);
    const plural = Math.random() < 0.2;
    const g = plural ? 'pl' : n[1];
    const noun = plural ? (ci === 2 ? n[4] : n[3]) : ci === 3 ? n[2] : n[0];
    const art = DEF[g][ci];
    const contr = { 'zu dem': 'zum', 'zu der': 'zur', 'von dem': 'vom', 'bei dem': 'beim' }[p[0] + ' ' + art];
    return {
      kind: 'gap', skill: 'prepositions', q: p[0].charAt(0).toUpperCase() + p[0].slice(1) + ' ___ ' + noun + ' …',
      h: 'Bestimmter Artikel (' + (plural ? 'Plural von ' : '') + DEF[n[1]][0] + ' ' + n[0] + ')', a: [art],
      e: '„' + p[0] + '“ + ' + CASE_DE[CASES[ci]] + '.' + (contr ? ' Meist zusammengezogen: <b>' + contr + '</b>.' : ''),
    };
  };

  /* ---------------- Connectors & word order ---------------- */
  D.connector = function (c) {
    c = c || pick(GT.ref.connectors); // [main, conn, type, [subj, finite, mid, inf?], en]
    const [s, f, mid, inf] = c[3];
    const rest = [mid, inf].filter(Boolean).join(' ');
    const forms = {
      sub: [s, mid, inf, f].filter(Boolean).join(' '),
      inv: [f, s, mid, inf].filter(Boolean).join(' '),
      main: [s, f, rest].filter(Boolean).join(' '),
    };
    const right = forms[c[2]];
    const opts = shuffle(Object.values(forms));
    const why = { sub: '„' + c[1] + '“ leitet einen Nebensatz ein → Verb am Ende.', inv: '„' + c[1] + '“ ist ein Adverb auf Position 1 → Verb direkt danach (Inversion).', main: '„' + c[1] + '“ ist eine Konjunktion auf Position 0 → normale Wortstellung.' };
    return { kind: 'mc', skill: 'wordorder', q: c[0] + ', ' + c[1] + ' ___.', h: c[4], o: opts, a: opts.indexOf(right), e: why[c[2]] };
  };

  /* ---------------- Gender ---------------- */
  D.genderPool = function () {
    const maxLvl = GT.LEVELS.indexOf(GT.currentLevel());
    const fromUnits = GT.allVocab.filter((v) => GT.genderOf(v.de) && GT.LEVELS.indexOf(v.unit.level) <= maxLvl);
    const extra = GT.ref.nouns.map((n, i) => ({ id: 'n:' + i, de: n[0], en: n[1], ex: '' }));
    return fromUnits.concat(extra);
  };

  /* ---------------- Dictation ---------------- */
  D.dictationPool = function () {
    const out = [];
    GT.units.filter(GT.isUnlocked).forEach((u) => {
      (u.vocab || []).forEach((v) => v[2] && v[2].length < 90 && out.push([v[2], '']));
      (u.speaking || []).forEach((s) => out.push([s, '']));
    });
    return out;
  };

  /* ---------------- Drill catalogue ---------------- */
  D.catalogue = [
    { id: 'gender', icon: '🎨', name: 'der · die · das', desc: 'Artikel-Trainer mit Farb- und Endungsregeln', make: (n) => sample(D.genderPool(), n).map(GT.items.gender) },
    { id: 'adjective', icon: '🧩', name: 'Adjektivendungen', desc: 'Unendlich viele Übungen zu -e, -en, -er, -es, -em', make: (n) => Array.from({ length: n }, D.adjective), table: true },
    { id: 'verbs', icon: '⚡', name: 'Starke Verben', desc: 'Präsens, Präteritum & Perfekt der unregelmäßigen Verben', make: (n) => Array.from({ length: n }, D.verb) },
    { id: 'preps', icon: '🧭', name: 'Präpositionen & Kasus', desc: 'Akkusativ, Dativ, Genitiv oder Wechsel?', make: (n) => Array.from({ length: n }, () => (Math.random() < 0.5 ? D.prepCase() : D.prepArticle())) },
    { id: 'connectors', icon: '🔗', name: 'Satzbau & Konnektoren', desc: 'weil, deshalb, aber, obwohl … wohin mit dem Verb?', make: (n) => sample(GT.ref.connectors, n).map((c) => D.connector(c)) },
    { id: 'dictation', icon: '🎧', name: 'Diktat', desc: 'Hören und schreiben – Sätze aus deinen Lektionen', make: (n) => sample(D.dictationPool(), n).map((s) => GT.items.listen(s[0], s[1])), needsSpeech: true },
    { id: 'shadow', icon: '🗣️', name: 'Shadowing', desc: 'Nachsprechen mit Aussprache-Feedback', make: (n) => sample(D.dictationPool(), n).map((s) => GT.items.speak(s[0], s[1])), needsSpeech: true },
  ];
})();
