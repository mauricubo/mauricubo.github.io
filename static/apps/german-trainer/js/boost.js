/* ==========================================================================
   DeutschWeg – learning boosters
   · GT.smart   adaptive session builder (interleaving, weak spots, context)
   · GT.quests  bounties (daily + weekly challenges, chest, streak freeze)
   · GT.badges  trophies
   · GT.quick   one-tap mini sessions for the phone
   · views      #/quick, #/quests, #/stats (learning dashboard)
   ========================================================================== */
(function () {
  const { h, esc, shuffle, sample, pick } = GT;
  const S = () => GT.state;
  const go = (hash) => GT.goto(hash);
  const X = (GT.xviews = {});

  /* ======================================================================
     Smart session builder
     ====================================================================== */
  const M = (GT.smart = {});
  const escRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  /** Date key of n calendar days ago (safe across daylight-saving changes) */
  GT.dayKeyAgo = (n) => { const d = new Date(GT.startOfDay()); d.setDate(d.getDate() - n); return GT.dateKey(d); };

  /** Find the word inside its example sentence → {q (with ___), a} */
  M.cloze = function (v) {
    if (!v || !v.ex) return null;
    const base = GT.stripArticle(v.de).replace(/\s*\(.*?\)/g, '').replace(/^sich\s+/, '').trim();
    // single words only: phrases ("Keine Ahnung.") make poor gap-fills
    if (/[\s.!?]/.test(base.split(/\s*[/,]\s*/)[0])) return null;
    const lemma = base.split(/[\s/,]+/)[0];
    if (!lemma || lemma.length < 3) return null;
    const f = GT.fold(lemma);
    const stem = f.slice(0, Math.max(3, f.length - (f.length > 5 ? 2 : 1)));
    const tokens = v.ex.match(/[\p{L}-]+/gu) || [];
    const hit = tokens.find((t) => GT.fold(t).startsWith(stem) && t.length <= lemma.length + 4);
    if (!hit) return null;
    const re = new RegExp('(^|[^\\p{L}])' + escRe(hit) + '(?![\\p{L}])', 'u');
    const q = v.ex.replace(re, '$1___');
    return q === v.ex ? null : { q, a: hit };
  };

  /** Words the learner has met (cards seen at least once) */
  M.learned = () => GT.allVocab.filter((v) => { const c = S().cards[v.id]; return c && c.s > 0; });
  /** Words available so far: everything in unlocked units up to the current one */
  M.available = function () {
    const cu = GT.currentUnit();
    return GT.allVocab.filter((v) => v.unit.idx <= cu.idx && GT.isUnlocked(v.unit));
  };
  /** Practice pool for quick games: learned words, padded with available ones */
  M.pool = function (min) {
    const l = M.learned();
    if (l.length >= (min || 12)) return l;
    const ids = new Set(l.map((v) => v.id));
    return l.concat(M.available().filter((v) => !ids.has(v.id)).slice(-((min || 12) * 2)));
  };
  /** Learned words sorted by lowest recall probability (most at risk first) */
  M.atRisk = () => M.learned().map((v) => ({ v, r: GT.srs.R(v.id) })).filter((x) => x.r != null).sort((a, b) => a.r - b.r);
  M.leeches = () => Object.keys(S().cards).filter((id) => GT.srs.valid(id) && GT.srs.leech(id));

  M.SKILL = {
    vocab: 'Wortschatz', grammar: 'Grammatik', gender: 'Artikel', listening: 'Hören', speaking: 'Sprechen', reading: 'Lesen',
    writing: 'Schreiben', adjective: 'Adjektivendungen', verbs: 'Starke Verben', prepositions: 'Präpositionen', wordorder: 'Satzbau',
    verbprep: 'Verben + Präposition', aux: 'haben oder sein',
  };
  const SKILL_DRILL = { gender: 'gender', adjective: 'adjective', verbs: 'verbs', prepositions: 'preps', wordorder: 'connectors', listening: 'dictation', speaking: 'shadow', verbprep: 'verbprep', aux: 'aux' };

  /** Per-skill [answers, correct] over the last `days` days */
  M.skillStats = function (days) {
    const out = {};
    for (let i = 0; i < days; i++) {
      const d = S().daily[GT.dayKeyAgo(i)];
      if (!d) continue;
      for (const k in d.sk) { const o = out[k] || (out[k] = [0, 0]); o[0] += d.sk[k][0]; o[1] += d.sk[k][1]; }
    }
    return out;
  };
  /** The skill with the lowest recent accuracy (needs a minimum of evidence) */
  M.weakSkill = function () {
    let st = M.skillStats(30);
    let cand = Object.keys(st).filter((k) => st[k][0] >= 6 && M.SKILL[k]);
    if (!cand.length) { st = {}; for (const k in S().skills) st[k] = [S().skills[k].n, S().skills[k].ok]; cand = Object.keys(st).filter((k) => st[k][0] >= 6 && M.SKILL[k]); }
    if (!cand.length) return null;
    cand.sort((a, b) => st[a][1] / st[a][0] - st[b][1] / st[b][0]);
    const k = cand[0];
    return { skill: k, acc: Math.round((st[k][1] / st[k][0]) * 100), n: st[k][0] };
  };
  M.weakItems = function (n, w) {
    w = w || M.weakSkill();
    const drill = w && SKILL_DRILL[w.skill] && GT.drills.catalogue.find((d) => d.id === SKILL_DRILL[w.skill]);
    if (drill && (!drill.needsSpeech || GT.speech.available())) return drill.make(n).filter(Boolean);
    if (w && w.skill === 'grammar') {
      const xs = Object.keys(S().cards).filter((id) => id.startsWith('x:') && GT.srs.valid(id));
      if (xs.length) return shuffle(xs).slice(0, n).map(GT.items.forCard);
      const u = GT.currentUnit();
      return sample(u.exercises.map((_, i) => i), n).map((i) => GT.items.fromExercise(u, i));
    }
    const risk = M.atRisk().slice(0, n).map((x) => GT.items.forCard(x.v.id));
    if (risk.length) return risk;
    return sample(GT.drills.catalogue[0].make(n * 2), n);
  };
  M.newWords = function (n) {
    const out = [];
    for (const u of GT.units) {
      if (!GT.isUnlocked(u)) continue;
      if (GT.LEVELS.indexOf(u.level) < GT.LEVELS.indexOf(S().startLevel) && !S().units[u.id]) continue;
      for (let i = 0; i < u.vocab.length && out.length < n; i++) {
        const v = GT.vocabById['v:' + u.id + ':' + i];
        if (!S().cards[v.id] || !S().cards[v.id].s) out.push(v);
      }
      if (out.length >= n) break;
    }
    return out;
  };

  /**
   * Interleave: different exercise kinds alternate (interleaving beats blocking),
   * new words are introduced early and tested again a few items later
   * (expanding retrieval inside the session).
   */
  M.interleave = function (main, fresh, pool) {
    let a = shuffle(main);
    for (let k = 1; k < a.length; k++) {
      if (a[k].kind === a[k - 1].kind) {
        const j = a.findIndex((x, i) => i > k && x.kind !== a[k - 1].kind);
        if (j > -1) [a[k], a[j]] = [a[j], a[k]];
      }
    }
    fresh.forEach((v, i) => {
      const at = Math.min(a.length, 1 + i * 2);
      a.splice(at, 0, GT.items.intro(v));
      a.splice(Math.min(a.length, at + 4), 0, GT.items.vmcr(v, pool));
    });
    return a;
  };

  /** Tagesmix: due reviews + weakest skill + new words + context + production */
  M.mix = function (n) {
    n = n || 12;
    const items = [], used = new Set();
    GT.srs.due(Math.ceil(n * 0.45)).forEach((id) => { items.push(GT.items.forCard(id)); used.add(id); });
    const w = M.weakSkill();
    M.weakItems(3, w).forEach((it) => items.push(it));
    const learned = M.learned();
    const ctx = shuffle(learned.filter((v) => !used.has(v.id) && (S().cards[v.id].r || 0) >= 1)).map(GT.items.vcloze).filter(Boolean).slice(0, 2);
    ctx.forEach((it) => { items.push(it); used.add(it.v.id); });
    if (learned.length >= 10) { const cand = learned.filter((v) => !used.has(v.id)); items.push(GT.items.produce(pick(cand.length ? cand : learned))); }
    for (const x of M.atRisk()) { if (items.length >= n - 2) break; if (!used.has(x.v.id)) { items.push(GT.items.forCard(x.v.id)); used.add(x.v.id); } }
    const fresh = M.newWords(items.length < 6 ? 4 : 2);
    const pool = M.pool(12);
    while (items.length < n - fresh.length * 2 && pool.length) { const v = pick(pool); items.push(GT.genderOf(v.de) && Math.random() < 0.4 ? GT.items.gender(v) : GT.items.vmc(v, pool)); }
    return { items: M.interleave(items, fresh, pool), weak: w };
  };

  /* ======================================================================
     Extra drills: verbs with prepositions, haben/sein
     ====================================================================== */
  // [verb, preposition, case A|D, English, example containing the preposition]
  GT.ref.verbPreps = [
    ['warten', 'auf', 'A', 'to wait for', 'Ich warte schon seit zehn Minuten auf den Bus.'],
    ['denken', 'an', 'A', 'to think of', 'Ich denke oft an meine Familie.'],
    ['sich freuen', 'auf', 'A', 'to look forward to', 'Wir freuen uns auf den Urlaub.'],
    ['sich freuen', 'über', 'A', 'to be happy about', 'Sie freut sich über das Geschenk.'],
    ['sich interessieren', 'für', 'A', 'to be interested in', 'Er interessiert sich für Politik.'],
    ['sich kümmern', 'um', 'A', 'to take care of', 'Sie kümmert sich um die Kinder.'],
    ['sich erinnern', 'an', 'A', 'to remember', 'Erinnerst du dich an unseren ersten Urlaub?'],
    ['sich ärgern', 'über', 'A', 'to be annoyed about', 'Ich ärgere mich über den Lärm.'],
    ['sich bewerben', 'um', 'A', 'to apply for', 'Er bewirbt sich um die Stelle als Ingenieur.'],
    ['sich gewöhnen', 'an', 'A', 'to get used to', 'Ich habe mich an das Wetter gewöhnt.'],
    ['sich verlassen', 'auf', 'A', 'to rely on', 'Du kannst dich auf mich verlassen.'],
    ['glauben', 'an', 'A', 'to believe in', 'Sie glaubt an das Gute im Menschen.'],
    ['bitten', 'um', 'A', 'to ask for', 'Darf ich Sie um einen Gefallen bitten?'],
    ['sich entscheiden', 'für', 'A', 'to decide on', 'Wir haben uns für die kleinere Wohnung entschieden.'],
    ['sich beschweren', 'über', 'A', 'to complain about', 'Er beschwert sich über den schlechten Service.'],
    ['sprechen', 'über', 'A', 'to talk about', 'Lass uns morgen über das Projekt sprechen.'],
    ['achten', 'auf', 'A', 'to pay attention to', 'Achte bitte auf die Endungen!'],
    ['sich vorbereiten', 'auf', 'A', 'to prepare for', 'Ich bereite mich auf die Prüfung vor.'],
    ['sich konzentrieren', 'auf', 'A', 'to concentrate on', 'Ich kann mich heute nicht auf die Arbeit konzentrieren.'],
    ['sich bedanken', 'für', 'A', 'to thank for', 'Ich bedanke mich für die Einladung.'],
    ['teilnehmen', 'an', 'D', 'to take part in', 'Ich nehme an einem Sprachkurs teil.'],
    ['sich beschäftigen', 'mit', 'D', 'to deal with', 'Sie beschäftigt sich seit Jahren mit Fotografie.'],
    ['anfangen', 'mit', 'D', 'to start with', 'Wir fangen mit der ersten Übung an.'],
    ['sich treffen', 'mit', 'D', 'to meet with', 'Ich treffe mich heute Abend mit Freunden.'],
    ['telefonieren', 'mit', 'D', 'to talk on the phone with', 'Er telefoniert gerade mit seiner Mutter.'],
    ['träumen', 'von', 'D', 'to dream of', 'Sie träumt von einer Reise nach Japan.'],
    ['abhängen', 'von', 'D', 'to depend on', 'Das hängt von deiner Zeit ab.'],
    ['sich fürchten', 'vor', 'D', 'to be afraid of', 'Das Kind fürchtet sich vor dem Gewitter.'],
    ['Angst haben', 'vor', 'D', 'to be afraid of', 'Viele Menschen haben Angst vor Spinnen.'],
    ['fragen', 'nach', 'D', 'to ask about', 'Der Tourist fragt nach dem Weg.'],
    ['suchen', 'nach', 'D', 'to look for', 'Wir suchen nach einer günstigen Lösung.'],
    ['gehören', 'zu', 'D', 'to be part of', 'Das gehört zu meinen Aufgaben.'],
    ['gratulieren', 'zu', 'D', 'to congratulate on', 'Wir gratulieren dir zu deinem Erfolg!'],
    ['leiden', 'unter', 'D', 'to suffer from', 'Viele Pendler leiden unter dem Stress.'],
    ['sich verabschieden', 'von', 'D', 'to say goodbye to', 'Er verabschiedet sich von seinen Kollegen.'],
    ['einladen', 'zu', 'D', 'to invite to', 'Ich lade dich zu meiner Geburtstagsfeier ein.'],
    ['erzählen', 'von', 'D', 'to tell about', 'Erzähl mal von deiner Reise!'],
    ['riechen', 'nach', 'D', 'to smell of', 'Hier riecht es nach frischem Kaffee.'],
    ['bestehen', 'aus', 'D', 'to consist of', 'Das Team besteht aus fünf Personen.'],
    ['sich erholen', 'von', 'D', 'to recover from', 'Ich muss mich von der langen Woche erholen.'],
  ];
  const PREPS = ['auf', 'an', 'für', 'um', 'über', 'mit', 'von', 'vor', 'nach', 'zu', 'unter', 'aus'];
  GT.drills.verbPrep = function () {
    const vp = pick(GT.ref.verbPreps);
    const re = new RegExp('(^|[^\\p{L}])(' + vp[1] + ')(?![\\p{L}])', 'iu');
    if (Math.random() < 0.7) {
      const opts = shuffle([vp[1]].concat(sample(PREPS.filter((p) => p !== vp[1]), 3)));
      return { kind: 'mc', skill: 'verbprep', q: vp[4].replace(re, '$1___'), h: vp[0] + ' … (' + vp[3] + ')', o: opts, a: opts.indexOf(vp[1]), e: '<b>' + vp[0] + ' ' + vp[1] + '</b> + ' + (vp[2] === 'A' ? 'Akkusativ' : 'Dativ') + '. Lerne Verben immer mit Präposition und Kasus.' };
    }
    return { kind: 'mc', skill: 'verbprep', q: vp[0] + ' ' + vp[1] + ' + ?', h: vp[3] + ' – „' + vp[4] + '“', o: ['Akkusativ', 'Dativ'], a: vp[2] === 'A' ? 0 : 1, e: vp[1] === 'auf' || vp[1] === 'über' ? '„auf“ und „über“ nach Verben stehen fast immer mit Akkusativ.' : vp[2] === 'D' ? '„mit, von, zu, nach, aus, bei“ sind immer Dativ.' : '„für“ und „um“ sind immer Akkusativ; „an“ nach Verben meist Akkusativ (Ausnahme: teilnehmen an + Dat.).' };
  };
  GT.drills.aux = function () {
    const v = pick(GT.ref.verbs.filter((x) => !/^(fahren|fliegen|reiten|ziehen|schwimmen)$/.test(x[0])));
    const [aux, ...rest] = v[3].split(' ');
    return {
      kind: 'mc', skill: 'aux', q: 'Perfekt: Er ___ ' + rest.join(' ') + '.', h: v[0] + ' (' + v[4] + ')', o: ['hat', 'ist'], a: aux === 'ist' ? 1 : 0,
      e: aux === 'ist' ? '<b>sein</b>: Bewegung von A nach B, Zustandsänderung (einschlafen, sterben, werden) sowie sein & bleiben.' : '<b>haben</b>: die meisten Verben, alle mit Akkusativobjekt und alle reflexiven Verben.',
    };
  };
  GT.drills.catalogue.push(
    { id: 'verbprep', icon: '🪝', name: 'Verben + Präposition', desc: 'warten auf, denken an, träumen von … mit Kasus', make: (n) => Array.from({ length: n }, GT.drills.verbPrep) },
    { id: 'aux', icon: '⚖️', name: 'haben oder sein?', desc: 'Das richtige Hilfsverb im Perfekt', make: (n) => Array.from({ length: n }, GT.drills.aux) },
  );

  /* ======================================================================
     Bounties (Kopfgelder)
     ====================================================================== */
  const Q = (GT.quests = {});
  const GRAMMAR = ['grammar', 'adjective', 'verbs', 'prepositions', 'wordorder', 'verbprep', 'aux'];
  const goal = () => S().profile.goal;
  const nCards = () => Object.keys(S().cards).length;
  Q.DAILY = [
    { id: 'xp', icon: '⭐', t: (n) => 'Sammle ' + n + ' XP', n: () => goal(), on: { xp: (d) => d.n }, rw: 15, init: () => GT.todayXP() },
    { id: 'rev', icon: '🔁', t: (n) => 'Wiederhole ' + n + ' Karten', n: () => 15, on: { answer: (d) => (d.review ? 1 : 0) }, rw: 20, need: () => nCards() >= 25 },
    { id: 'new', icon: '🌱', t: (n) => 'Lerne ' + n + ' neue Wörter', n: () => 6, on: { newword: () => 1 }, rw: 15, need: () => M.newWords(6).length >= 6 },
    { id: 'combo', icon: '🔥', t: (n) => 'Schaffe ' + n + ' richtige Antworten in Folge', n: () => 10, on: { combo: (d) => d.n }, max: true, rw: 15 },
    { id: 'perfect', icon: '💎', t: () => 'Beende eine Übung (≥ 8 Aufgaben) ohne Fehler', n: () => 1, on: { session: (d) => (d.graded >= 8 && d.acc === 100 ? 1 : 0) }, rw: 25 },
    { id: 'gender', icon: '🎨', t: (n) => n + ' Artikel richtig (der/die/das)', n: () => 12, on: { answer: (d) => (d.ok && d.skill === 'gender' ? 1 : 0) }, rw: 15 },
    { id: 'listen', icon: '🎧', t: (n) => n + ' Hör-Aufgaben richtig', n: () => 6, on: { answer: (d) => (d.ok && d.skill === 'listening' ? 1 : 0) }, rw: 15, need: () => GT.speech.available() },
    { id: 'speak', icon: '🗣️', t: (n) => 'Sprich ' + n + ' Sätze nach', n: () => 4, on: { answer: (d) => (d.kind === 'speak' ? 1 : 0) }, rw: 20, need: () => GT.speech.available() },
    { id: 'sprint', icon: '⚡', t: (n) => n + ' richtige Antworten in einem 60-Sekunden-Sprint', n: () => 12, on: { session: (d) => (d.tag === 'sprint' ? d.right : 0) }, max: true, rw: 20 },
    { id: 'quick', icon: '📱', t: (n) => 'Mach ' + n + ' Schnellübungen', n: () => 3, on: { session: (d) => (d.quick ? 1 : 0) }, rw: 15 },
    { id: 'grammar', icon: '🧩', t: (n) => n + ' Grammatik-Aufgaben richtig', n: () => 15, on: { answer: (d) => (d.ok && GRAMMAR.includes(d.skill) ? 1 : 0) }, rw: 15 },
    { id: 'context', icon: '🧠', t: (n) => n + ' Wörter im Kontext richtig', n: () => 5, on: { answer: (d) => (d.ok && d.kind === 'vcloze' ? 1 : 0) }, rw: 20, need: () => M.learned().length >= 20 },
    { id: 'produce', icon: '✍️', t: (n) => 'Schreib ' + n + ' eigene Sätze', n: () => 2, on: { answer: (d) => (d.ok && d.kind === 'produce' ? 1 : 0) }, rw: 20, need: () => M.learned().length >= 10 },
    { id: 'lesson', icon: '📖', t: () => 'Schließe einen Lektionsschritt ab', n: () => 1, on: { activity: () => 1 }, rw: 20 },
  ];
  Q.WEEKLY = [
    { id: 'days', icon: '📅', t: (n) => 'Lerne an ' + n + ' Tagen', n: () => 5, on: { day: () => 1 }, rw: 80, init: () => weekDays().filter((k) => S().xpLog[k]).length },
    { id: 'xpw', icon: '🌟', t: (n) => 'Sammle ' + n + ' XP', n: () => goal() * 5, on: { xp: (d) => d.n }, rw: 75, init: () => weekDays().reduce((a, k) => a + (S().xpLog[k] || 0), 0) },
    { id: 'revw', icon: '♻️', t: (n) => 'Wiederhole ' + n + ' Karten', n: () => 100, on: { answer: (d) => (d.review ? 1 : 0) }, rw: 75, need: () => nCards() >= 60 },
    { id: 'neww', icon: '🌳', t: (n) => 'Lerne ' + n + ' neue Wörter', n: () => 30, on: { newword: () => 1 }, rw: 60, need: () => M.newWords(30).length >= 30 },
    { id: 'bounties', icon: '🎯', t: (n) => 'Erfülle ' + n + ' Tages-Kopfgelder', n: () => 12, on: { bounty: () => 1 }, rw: 80 },
    { id: 'test', icon: '🏁', t: () => 'Bestehe einen Lektionstest', n: () => 1, on: { lesson: () => 1 }, rw: 60 },
    { id: 'speakw', icon: '🎙️', t: (n) => 'Sprich ' + n + ' Sätze nach', n: () => 20, on: { answer: (d) => (d.kind === 'speak' ? 1 : 0) }, rw: 60, need: () => GT.speech.available() },
  ];
  const weekDays = () => { const out = [], wk = Q.weekKey(); for (let i = 0; i < 7; i++) { const k = GT.dayKeyAgo(i); if (k >= wk) out.push(k); } return out; };
  const DEF = {};
  Q.DAILY.concat(Q.WEEKLY).forEach((d) => (DEF[d.id] = d));

  function seeded(str) {
    let x = 2166136261;
    for (let i = 0; i < str.length; i++) { x ^= str.charCodeAt(i); x = Math.imul(x, 16777619); }
    return () => { x = Math.imul(x ^ (x >>> 15), 2246822507); x = Math.imul(x ^ (x >>> 13), 3266489909); x ^= x >>> 16; return (x >>> 0) / 4294967296; };
  }
  function draw(list, n, key) {
    const rnd = seeded(key);
    const pool = list.filter((d) => !d.need || d.need()).map((d) => [rnd(), d]).sort((a, b) => a[0] - b[0]).map((x) => x[1]);
    // the XP bounty is always on offer: it fits any kind of practice
    const out = list === Q.DAILY ? [DEF.xp].concat(pool.filter((d) => d.id !== 'xp')) : pool;
    // progress made before the bounty appeared (earlier today / this week) counts
    return out.slice(0, n).map((d) => ({ id: d.id, n: d.n(), p: d.init ? Math.min(d.init(), d.n() - 1) : 0, done: false }));
  }
  Q.weekKey = () => { const d = new Date(GT.startOfDay()); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return GT.dateKey(d); };
  Q.ensure = function () {
    const s = S();
    const q = s.quests || (s.quests = {});
    const day = GT.dateKey(), wk = Q.weekKey();
    if (q.day !== day) { q.day = day; q.daily = draw(Q.DAILY, 3, 'd' + day); q.chest = false; }
    if (q.week !== wk) { q.week = wk; q.weekly = draw(Q.WEEKLY, 2, 'w' + wk); }
    return q;
  };
  Q.def = (id) => DEF[id];
  Q.label = (q) => DEF[q.id].t(q.n);
  Q.dailyDone = () => { const q = Q.ensure(); return q.daily.filter((x) => x.done).length; };

  // queued toasts so several rewards do not overwrite each other
  const toastQ = [];
  let toastBusy = false;
  GT.notify = function (msg) {
    toastQ.push(msg);
    if (toastBusy) return;
    const next = () => {
      if (!toastQ.length) { toastBusy = false; return; }
      toastBusy = true; GT.toast(toastQ.shift(), 2600); setTimeout(next, 2800);
    };
    next();
  };

  function complete(q, weekly) {
    const d = DEF[q.id];
    q.done = true; q.p = q.n;
    const c = S().counters;
    c.bounties = (c.bounties || 0) + 1;
    GT.addXP(d.rw, { quiet: true });
    GT.notify('🎯 Kopfgeld erfüllt: ' + d.t(q.n) + ' · +' + d.rw + ' XP');
    if (!weekly) {
      GT.track('bounty', {});
      const qs = Q.ensure();
      if (!qs.chest && qs.daily.every((x) => x.done)) {
        qs.chest = true;
        c.chests = (c.chests || 0) + 1;
        S().freezes = Math.min(2, (S().freezes || 0) + 1);
        GT.addXP(30, { quiet: true });
        GT.notify('🧰 Truhe geöffnet: +30 XP und 🧊 1 Serienschutz');
      }
    }
    GT.save();
  }
  GT.on(function (ev, data) {
    if (!GT.state.onboarded) return;
    const q = Q.ensure();
    [[q.daily, false], [q.weekly, true]].forEach(([list, weekly]) => list.forEach((x) => {
      if (x.done) return;
      const d = DEF[x.id], fn = d && d.on[ev];
      if (!fn) return;
      const v = fn(data);
      if (!v) return;
      x.p = d.max ? Math.max(x.p, v) : x.p + v;
      if (x.p >= x.n) complete(x, weekly);
    }));
    if (ev === 'session' || ev === 'bounty' || ev === 'day' || ev === 'exam') GT.badges.check();
  });

  /* ======================================================================
     Trophies
     ====================================================================== */
  const words = () => Object.keys(S().cards).filter((id) => id.startsWith('v:') && S().cards[id].s > 0 && GT.vocabById[id]).length;
  const knownWords = () => Object.keys(S().cards).filter((id) => id.startsWith('v:') && GT.vocabById[id] && GT.srs.status(id) === 'known').length;
  const cnt = (k) => S().counters[k] || 0;
  GT.badges = {
    list: [
      { id: 'first', icon: '👣', name: 'Erste Schritte', desc: 'Erste Übung abgeschlossen', ok: () => cnt('sessions') >= 1 },
      { id: 'streak3', icon: '🔥', name: 'Warmgelaufen', desc: '3 Tage in Folge', ok: () => S().streak.best >= 3 },
      { id: 'streak7', icon: '📆', name: 'Eine Woche', desc: '7 Tage in Folge', ok: () => S().streak.best >= 7 },
      { id: 'streak30', icon: '🏔️', name: 'Gipfelstürmer', desc: '30 Tage in Folge', ok: () => S().streak.best >= 30 },
      { id: 'streak100', icon: '👑', name: 'Unaufhaltsam', desc: '100 Tage in Folge', ok: () => S().streak.best >= 100 },
      { id: 'words50', icon: '🌱', name: 'Keimling', desc: '50 Wörter gelernt', ok: () => words() >= 50 },
      { id: 'words250', icon: '🌳', name: 'Wortbaum', desc: '250 Wörter gelernt', ok: () => words() >= 250 },
      { id: 'words1000', icon: '📚', name: 'Wortschatzkammer', desc: '1000 Wörter gelernt', ok: () => words() >= 1000 },
      { id: 'known100', icon: '🧠', name: 'Langzeitgedächtnis', desc: '100 Wörter gefestigt', ok: () => knownWords() >= 100 },
      { id: 'perfect10', icon: '💎', name: 'Fehlerfrei', desc: '10 Übungen mit 100 %', ok: () => cnt('perfect') >= 10 },
      { id: 'sprint20', icon: '⚡', name: 'Blitzschnell', desc: '20 richtige in einem Sprint', ok: () => cnt('sprintBest') >= 20 },
      { id: 'bounty10', icon: '🎯', name: 'Kopfgeldjäger', desc: '10 Kopfgelder erfüllt', ok: () => cnt('bounties') >= 10 },
      { id: 'bounty50', icon: '🏹', name: 'Meisterjäger', desc: '50 Kopfgelder erfüllt', ok: () => cnt('bounties') >= 50 },
      { id: 'chest7', icon: '🧰', name: 'Schatzsucher', desc: '7 Truhen geöffnet', ok: () => cnt('chests') >= 7 },
      { id: 'exam', icon: '🎓', name: 'Geprüft', desc: 'Eine Niveau-Prüfung bestanden', ok: () => Object.values(S().exams).some((x) => x >= GT.PASS) },
      { id: 'early', icon: '🌅', name: 'Frühaufsteher', desc: 'Vor 7 Uhr gelernt', ok: () => cnt('early') > 0 },
      { id: 'night', icon: '🦉', name: 'Nachteule', desc: 'Nach 23 Uhr gelernt', ok: () => cnt('night') > 0 },
      { id: 'xp5000', icon: '🏆', name: 'Fleißig', desc: '5000 XP gesammelt', ok: () => S().xp >= 5000 },
    ],
    check() {
      const got = S().badges;
      GT.badges.list.forEach((b) => {
        if (got[b.id] || !b.ok()) return;
        got[b.id] = GT.dateKey();
        GT.notify('🏅 Neue Trophäe: ' + b.icon + ' ' + b.name);
      });
      GT.save();
    },
  };

  /* ======================================================================
     Quick sessions (phone-friendly, one tap)
     ====================================================================== */
  const noSrs = (it) => { if (it) delete it.srs; return it; };
  const sprintItems = function () {
    const pool = M.pool(20);
    return Array.from({ length: 80 }, () => {
      const v = pick(pool);
      const r = Math.random();
      if (GT.genderOf(v.de) && r < 0.3) return GT.items.gender(v);
      return noSrs(r < 0.65 ? GT.items.vmc(v, pool) : GT.items.vmcr(v, pool));
    });
  };
  GT.quick = [
    { id: 'mix', icon: '🎯', name: 'Tagesmix', time: '≈ 5 Min', desc: 'Fällige Karten, deine Schwachstelle, neue Wörter – optimal gemischt',
      build() { const m = M.mix(12); return { title: '🎯 Tagesmix', items: m.items, text: m.weak ? 'Schwerpunkt heute: ' + M.SKILL[m.weak.skill] + ' (' + m.weak.acc + ' %).' : '' }; } },
    { id: 'sprint', icon: '⚡', name: '60-Sekunden-Sprint', time: '1 Min', desc: 'So viele richtige Antworten wie möglich',
      build: () => ({ title: '⚡ Sprint', items: sprintItems(), timeLimit: 60, autoNext: true, requeue: false }) },
    { id: 'review', icon: '🔁', name: '5 Wiederholungen', time: '≈ 1 Min', desc: 'Die Karten, die du gerade am ehesten vergisst',
      build() {
        let ids = GT.srs.due(5);
        if (ids.length < 5) ids = ids.concat(M.atRisk().map((x) => x.v.id).filter((id) => !ids.includes(id)).slice(0, 5 - ids.length));
        return ids.length ? { title: '🔁 Wiederholung', items: ids.map(GT.items.forCard) } : null;
      } },
    { id: 'gender', icon: '🎨', name: 'Artikel-Blitz', time: '≈ 1 Min', desc: '10 × der, die oder das',
      build: () => ({ title: '🎨 Artikel-Blitz', items: sample(GT.drills.genderPool(), 10).map(GT.items.gender), autoNext: true }) },
    { id: 'context', icon: '🧩', name: 'Wörter im Kontext', time: '≈ 3 Min', desc: 'Ergänze deine Wörter in echten Sätzen',
      build() {
        const pool = M.learned().length >= 8 ? M.learned() : M.available();
        const items = shuffle(pool).map(GT.items.vcloze).filter(Boolean).slice(0, 8);
        if (!M.learned().length) items.forEach(noSrs);
        return items.length ? { title: '🧩 Wörter im Kontext', items } : null;
      } },
    { id: 'listen', icon: '🎧', name: 'Hör-Snack', time: '≈ 2 Min', desc: 'Wörter erkennen und Sätze mitschreiben', speech: true,
      build() {
        const pool = M.pool(12);
        const items = sample(pool, 4).map((v) => GT.items.vlisten(v, pool));
        sample(GT.drills.dictationPool(), 2).forEach((s) => items.push(GT.items.listen(s[0], s[1])));
        if (!M.learned().length) items.forEach(noSrs);
        return { title: '🎧 Hör-Snack', items: shuffle(items) };
      } },
    { id: 'weak', icon: '🩹', name: 'Schwachstelle', time: '≈ 3 Min', desc: 'Automatisch: dein schwächster Bereich der letzten 30 Tage',
      build() { const w = M.weakSkill(); const items = M.weakItems(10, w); return { title: '🩹 ' + (w ? M.SKILL[w.skill] : 'Schwachstellen'), items, text: w ? 'Deine Genauigkeit hier: ' + w.acc + ' %. Gezieltes Üben bringt am meisten.' : '' }; } },
    { id: 'leech', icon: '🧠', name: 'Problemwörter', time: '≈ 2 Min', desc: 'Wörter, die immer wieder entwischen – mit Eselsbrücken',
      build() {
        const ids = M.leeches().slice(0, 6).concat(M.atRisk().map((x) => x.v.id)).filter((id, i, a) => a.indexOf(id) === i).slice(0, 8);
        if (!ids.length) return null;
        const items = [];
        ids.forEach((id) => { const v = GT.vocabById[id]; if (v) { items.push(GT.items.intro(v)); items.push(GT.items.vtype(v)); } else items.push(GT.items.forCard(id)); });
        // test again after a gap: spacing even inside a short session
        return { title: '🧠 Problemwörter', items: items.filter((x) => x.kind === 'intro').concat(shuffle(items.filter((x) => x.kind !== 'intro'))) };
      } },
    { id: 'speak', icon: '🗣️', name: 'Sprech-Snack', time: '≈ 2 Min', desc: '3 Sätze nachsprechen (Shadowing)', speech: true,
      build: () => ({ title: '🗣️ Sprech-Snack', items: sample(GT.drills.dictationPool(), 3).map((s) => GT.items.speak(s[0], s[1])) }) },
  ];
  GT.startQuick = function (id) {
    const q = GT.quick.find((x) => x.id === id);
    if (!q) return go('#/quick');
    if (q.speech && !GT.speech.available()) { GT.toast('Dein Browser unterstützt keine Sprachausgabe 😕'); return go('#/quick'); }
    const o = q.build();
    const prevBest = S().counters.sprintBest || 0;
    if (!o || !o.items || !o.items.length) { GT.toast(id === 'leech' ? 'Keine Problemwörter – super! 🎉' : 'Dafür brauchst du erst ein paar gelernte Wörter.'); return go('#/quick'); }
    GT.Session.start({
      title: o.title, items: o.items, exitTo: '#/quick', tag: id, quick: true, timeLimit: o.timeLimit, autoNext: o.autoNext, requeue: o.requeue,
      onFinish(r) {
        return {
          title: id === 'sprint' ? '⚡ ' + r.right + ' richtige in 60 s' + (r.right > prevBest && prevBest ? ' – neuer Rekord!' : '') : null,
          text: [o.text, bountyLine()].filter(Boolean).join('<br>'),
          actions: [h('button.btn.ghost.lg', { onclick: () => GT.startQuick(id) }, '↻ Nochmal')],
        };
      },
    });
  };
  function bountyLine() {
    const q = Q.ensure();
    const open = q.daily.filter((x) => !x.done);
    return open.length ? '🎯 Offene Kopfgelder: ' + open.map((x) => esc(Q.label(x)) + ' (' + Math.min(x.p, x.n) + '/' + x.n + ')').join(' · ') : '🧰 Alle Tages-Kopfgelder erfüllt!';
  }

  /** Small UI pieces reused by the home screen */
  GT.ui = GT.ui || {};
  GT.ui.quickStrip = function () {
    return h('div.quick-strip', ['mix', 'sprint', 'review'].map((id) => {
      const q = GT.quick.find((x) => x.id === id);
      return h('button.quick-chip', { onclick: () => GT.startQuick(id) }, h('span.qi', q.icon), h('span', h('b', q.name), h('small', q.time)));
    }), h('a.quick-chip.more', { href: '#/quick' }, h('span.qi', '⋯'), h('span', h('b', 'Mehr'), h('small', 'Schnellstart'))));
  };
  GT.ui.questCard = function () {
    const q = Q.ensure();
    const done = q.daily.filter((x) => x.done).length;
    return h('a.card.quest-mini', { href: '#/quests' },
      h('small', '🎯 Kopfgelder heute'),
      h('h2', { style: { margin: '4px 0 8px' } }, done + ' / ' + q.daily.length + (q.chest ? ' 🧰' : '')),
      h('div.qdots', q.daily.map((x) => h('i' + (x.done ? '.on' : ''), { title: Q.label(x) }))));
  };
  const questRow = (x) => {
    const d = DEF[x.id];
    const p = Math.min(x.p, x.n);
    return h('div.quest' + (x.done ? '.done' : ''),
      h('span.qicon', x.done ? '✅' : d.icon),
      h('div.qbody', h('b', d.t(x.n)), h('div.progress' + (x.done ? '.ok' : ''), h('span', { style: { width: (p / x.n) * 100 + '%' } })), h('small', p + ' / ' + x.n)),
      h('span.qrw', '+' + d.rw + ' XP'));
  };

  /* ---------------- View: Schnellstart ---------------- */
  X.quick = function (id) {
    if (id) return GT.startQuick(id);
    const v = GT.$('#view');
    v.appendChild(h('h1', '⚡ Schnellstart'));
    v.appendChild(h('p.muted', 'Ein Tipp, und los: kurze Einheiten für die Bahn, die Kaffeepause oder zwischendurch. Fünf Minuten täglich schlagen eine Stunde am Wochenende.'));
    const due = GT.srs.due().length;
    const grid = h('div.quick-grid');
    GT.quick.forEach((q) => {
      const dis = q.speech && !GT.speech.available();
      const sub = q.id === 'review' && due ? due + ' fällig' : q.id === 'weak' && M.weakSkill() ? M.SKILL[M.weakSkill().skill] : q.id === 'leech' ? M.leeches().length + ' Wörter' : q.time;
      grid.appendChild(h('button.quick-tile' + (q.id === 'mix' ? '.hot' : ''), { disabled: dis, onclick: () => GT.startQuick(q.id) },
        h('span.qi', q.icon), h('b', q.name), h('small', sub), h('span.qd', q.desc)));
    });
    v.appendChild(grid);
    v.appendChild(h('div', { style: { marginTop: '18px' } }, questsBlock(true)));
    v.appendChild(h('p.muted', { style: { marginTop: '18px', fontSize: '.88rem' } }, '📱 Tipp: Füge DeutschWeg zum Startbildschirm hinzu (Browsermenü → „Zum Startbildschirm“ / „App installieren“). Dann startest du mit einem Tipp – auch offline. Langes Drücken auf das Icon zeigt Abkürzungen wie den Sprint.'));
  };

  /* ---------------- View: Kopfgelder & Trophäen ---------------- */
  function questsBlock(compact) {
    const q = Q.ensure();
    const left = Math.max(1, Math.round((GT.startOfDay() + GT.DAY - Date.now()) / 3600000));
    const box = h('div.card',
      h('div.row', h('h3', { style: { margin: 0 } }, '🎯 Tages-Kopfgelder'), h('span.spacer'), h('small', 'neu in ' + left + ' Std.')),
      h('div.quests', q.daily.map(questRow)),
      h('div.chest' + (q.chest ? '.open' : ''), h('span', q.chest ? '🧰' : '🔒'),
        h('span', q.chest ? 'Truhe geöffnet: +30 XP und 1 Serienschutz 🧊' : 'Erfülle alle drei → Truhe: +30 XP und 1 Serienschutz 🧊')));
    if (compact) return box;
    return [box, h('div.card',
      h('div.row', h('h3', { style: { margin: 0 } }, '🗓️ Wochen-Kopfgelder'), h('span.spacer'), h('small', 'bis Sonntag')),
      h('div.quests', q.weekly.map(questRow)))];
  }
  X.quests = function () {
    const v = GT.$('#view');
    v.appendChild(h('h1', '🎯 Kopfgelder & Trophäen'));
    v.appendChild(h('p.muted', 'Jeden Tag neue Herausforderungen. Sie lenken dich zu genau den Übungen, die Forschung als besonders wirksam zeigt: abrufen, mischen, sprechen, wiederholen.'));
    v.appendChild(h('div.kpis',
      h('div.kpi', h('b', '🧊 ' + (S().freezes || 0) + ' / 2'), h('span', 'Serienschutz – schützt deine Serie an einem verpassten Tag')),
      h('div.kpi', h('b', cnt('bounties')), h('span', 'Kopfgelder erfüllt')),
      h('div.kpi', h('b', cnt('chests')), h('span', 'Truhen geöffnet'))));
    v.appendChild(h('div', { style: { marginTop: '16px' } }, questsBlock(false)));
    v.appendChild(h('div.row', { style: { marginTop: '14px' } }, h('button.btn.primary', { onclick: () => GT.startQuick('mix') }, '🎯 Tagesmix starten'), h('a.btn.ghost', { href: '#/quick' }, '⚡ Alle Schnellübungen')));
    const got = S().badges;
    v.appendChild(h('h2', { style: { marginTop: '28px' } }, '🏅 Trophäen (' + Object.keys(got).length + ' / ' + GT.badges.list.length + ')'));
    v.appendChild(h('div.badges', GT.badges.list.map((b) => h('div.badge-card' + (got[b.id] ? '.got' : ''), { title: got[b.id] ? 'Erhalten am ' + new Date(GT.keyTime(got[b.id])).toLocaleDateString('de-DE') : 'Noch nicht erhalten' },
      h('span.bi', b.icon), h('b', b.name), h('small', b.desc)))));
  };

  /* ======================================================================
     Learning dashboard (#/stats)
     ====================================================================== */
  const sum = (a) => a.reduce((x, y) => x + y, 0);
  const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0);
  const dayKeys = (n, offset) => Array.from({ length: n }, (_, i) => GT.dayKeyAgo(n - 1 - i + (offset || 0)));
  function periodStats(keys) {
    const s = S();
    let n = 0, ok = 0, rv = 0, rvok = 0, nw = 0;
    keys.forEach((k) => { const d = s.daily[k]; if (d) { n += d.n; ok += d.ok; rv += d.rv; rvok += d.rvok; nw += d.nw; } });
    return { xp: sum(keys.map((k) => s.xpLog[k] || 0)), min: Math.round(sum(keys.map((k) => s.minutes[k] || 0)) / 60), n, ok, acc: pct(ok, n), rv, rvok, nw, days: keys.filter((k) => s.xpLog[k]).length };
  }
  function delta(a, b, unit) {
    if (!b && !a) return h('small.delta', '–');
    const d = a - b;
    const cls = d > 0 ? '.up' : d < 0 ? '.down' : '';
    return h('small.delta' + cls, (d > 0 ? '▲ +' : d < 0 ? '▼ ' : '± ') + d + (unit || '') + ' ggü. Vorwoche');
  }
  /** Simple, responsive HTML bar chart with hover titles */
  function bars(vals, labels, opts) {
    opts = opts || {};
    const max = Math.max(1, opts.max || 0, ...vals);
    const wrap = h('div.chart-bars' + (opts.thin ? '.thin' : ''));
    if (opts.goal) wrap.appendChild(h('div.goal-line', { style: { bottom: (opts.goal / max) * 100 + '%' }, title: opts.goalLabel || '' }, h('small', opts.goalLabel || '')));
    vals.forEach((x, i) => wrap.appendChild(h('div.cb', { title: (opts.tip ? opts.tip(i) : labels[i] + ': ' + x) },
      h('i' + (opts.met && opts.met(x, i) ? '.met' : ''), { style: { height: (x / max) * 100 + '%' } }))));
    const axis = h('div.chart-axis');
    labels.forEach((l, i) => axis.appendChild(h('small', (opts.every ? (i % opts.every === 0 || i === labels.length - 1) : true) ? l : '')));
    return h('div.chart', wrap, axis);
  }

  X.stats = function () {
    const v = GT.$('#view');
    const s = S();
    const vocabIds = Object.keys(s.cards).filter((id) => id.startsWith('v:') && GT.vocabById[id] && s.cards[id].s > 0);
    const allIds = Object.keys(s.cards).filter((id) => GT.srs.valid(id) && s.cards[id].s > 0);
    const rs = allIds.map((id) => GT.srs.R(id)).filter((r) => r != null);
    const avgR = rs.length ? Math.round((sum(rs) / rs.length) * 100) : null;
    const in30 = Math.round(sum(vocabIds.map((id) => GT.srs.R(id, Date.now() + 30 * GT.DAY) || 0)));
    const known = vocabIds.filter((id) => GT.srs.status(id) === 'known').length;
    const leeches = M.leeches();
    const m30 = periodStats(dayKeys(30));
    const wk = periodStats(dayKeys(7)), pw = periodStats(dayKeys(7, 7));
    const totMin = Math.round(sum(Object.values(s.minutes)) / 60);
    const target = Math.round((s.settings.retention || 0.9) * 100);

    v.appendChild(h('div.row', h('h1', { style: { margin: 0 } }, '📈 Dein Lern-Dashboard'), h('span.spacer'), h('a.btn.small.ghost', { href: '#/quests' }, '🏅 Trophäen')));
    v.appendChild(h('p.muted', 'Alles wird lokal auf deinem Gerät berechnet. Das Gedächtnismodell (FSRS) schätzt für jede Karte, wie wahrscheinlich du sie gerade noch weißt.'));

    // KPIs
    v.appendChild(h('div.kpis',
      h('div.kpi', h('b', s.xp), h('span', 'XP gesamt')),
      h('div.kpi', h('b', '🔥 ' + GT.streakAlive()), h('span', 'Serie · Rekord ' + s.streak.best + ' · 🧊 ' + (s.freezes || 0))),
      h('div.kpi', h('b', vocabIds.length), h('span', 'Wörter gelernt · ' + known + ' gefestigt')),
      h('div.kpi', h('b', avgR == null ? '–' : avgR + ' %'), h('span', 'Ø Gedächtnis jetzt', h('br'), h('small', 'Abrufwahrscheinlichkeit'))),
      h('div.kpi', h('b', m30.rv ? pct(m30.rvok, m30.rv) + ' %' : '–'), h('span', 'Echte Behaltensrate (30 Tage) · Ziel ' + target + ' %')),
      h('div.kpi', h('b', totMin + ' min'), h('span', 'Lernzeit gesamt'))));

    // This week vs last week
    v.appendChild(h('div.card', { style: { marginTop: '16px' } }, h('h3', '🗓️ Diese Woche'),
      h('div.week-grid',
        h('div', h('b', wk.xp), h('span', 'XP'), delta(wk.xp, pw.xp)),
        h('div', h('b', wk.min), h('span', 'Minuten'), delta(wk.min, pw.min)),
        h('div', h('b', wk.n), h('span', 'Antworten'), delta(wk.n, pw.n)),
        h('div', h('b', wk.n ? wk.acc + ' %' : '–'), h('span', 'Genauigkeit'), pw.n && wk.n ? delta(wk.acc, pw.acc, ' %') : h('small.delta', '–')),
        h('div', h('b', wk.nw), h('span', 'neue Wörter'), delta(wk.nw, pw.nw)),
        h('div', h('b', wk.days + ' / 7'), h('span', 'aktive Tage'), delta(wk.days, pw.days)))));

    // Heatmap (26 weeks)
    const weeks = 26;
    const start = new Date(GT.startOfDay());
    start.setDate(start.getDate() - ((start.getDay() + 6) % 7) - (weeks - 1) * 7);
    const heat = h('div.heatmap');
    const g = s.profile.goal;
    for (let i = 0; i < weeks * 7; i++) {
      const d = new Date(start); d.setDate(start.getDate() + i);
      const k = GT.dateKey(d), x = s.xpLog[k] || 0;
      const lvl = d.getTime() > Date.now() ? -1 : !x ? 0 : x < g / 2 ? 1 : x < g ? 2 : x < g * 1.5 ? 3 : 4;
      heat.appendChild(h('i.h' + (lvl < 0 ? 'f' : lvl), { title: d.toLocaleDateString('de-DE', { weekday: 'short', day: 'numeric', month: 'short' }) + ': ' + x + ' XP' }));
    }
    const activeDays = Object.keys(s.xpLog).filter((k) => s.xpLog[k] > 0).length;
    v.appendChild(h('div.card', h('div.row', h('h3', { style: { margin: 0 } }, '🟦 Aktivität (26 Wochen)'), h('span.spacer'), h('small', activeDays + ' aktive Tage insgesamt')),
      h('div.heat-wrap', h('div.heat-days', ['Mo', '', 'Mi', '', 'Fr', '', 'So'].map((x) => h('small', x))), heat),
      h('div.heat-legend', h('small', 'weniger'), [0, 1, 2, 3, 4].map((l) => h('i.h' + l)), h('small', 'mehr · Stufen relativ zu deinem Tagesziel (' + g + ' XP)'))));

    // XP + accuracy (two charts, one axis each)
    const k14 = dayKeys(14);
    const lab = k14.map((k) => k.slice(8));
    const accs = k14.map((k) => { const d = s.daily[k]; return d && d.n ? pct(d.ok, d.n) : 0; });
    v.appendChild(h('div.grid.grid-2', { style: { marginTop: '16px' } },
      h('div.card', h('h3', 'XP pro Tag (14 Tage)'),
        bars(k14.map((k) => s.xpLog[k] || 0), lab, { goal: g, goalLabel: 'Ziel ' + g, max: g * 1.2, met: (x) => x >= g, every: 2, tip: (i) => k14[i] + ': ' + (s.xpLog[k14[i]] || 0) + ' XP' })),
      h('div.card', h('h3', 'Genauigkeit pro Tag (14 Tage)'),
        bars(accs, lab, { max: 100, goal: 80, goalLabel: '80 %', every: 2, met: (x) => x >= 80, tip: (i) => { const d = s.daily[k14[i]]; return k14[i] + ': ' + (d && d.n ? accs[i] + ' % von ' + d.n + ' Antworten' : 'keine Daten'); } }))));

    // Memory
    const st = { new: 0, learning: 0, known: 0, leech: 0 };
    GT.allVocab.forEach((x) => { const c = s.cards[x.id]; if (!c || !c.s) return; if (GT.srs.leech(x.id)) st.leech++; else st[GT.srs.status(x.id)]++; });
    const totalV = GT.allVocab.length;
    const unseen = totalV - st.learning - st.known - st.leech;
    const seg = (n, cls, label) => (n ? h('i.' + cls, { style: { flexGrow: n }, title: label + ': ' + n }) : null);
    const fc = Array.from({ length: 30 }, (_, i) => GT.startOfDay() + (i + 1) * GT.DAY);
    const fcVals = fc.map((d) => allIds.filter((id) => s.cards[id].d > d - GT.DAY && s.cards[id].d <= d).length);
    const overdue = GT.srs.due().length;
    v.appendChild(h('div.grid.grid-2', { style: { marginTop: '16px' } },
      h('div.card', h('h3', '🧠 Gedächtnis'),
        h('div.stack', seg(st.known, 'known', 'Gefestigt'), seg(st.learning, 'learning', 'In Arbeit'), seg(st.leech, 'leech', 'Problemwörter'), seg(unseen, 'unseen', 'Noch nicht gelernt')),
        h('div.legend',
          h('span', h('i.known'), 'Gefestigt ', h('b', st.known)), h('span', h('i.learning'), 'In Arbeit ', h('b', st.learning)),
          h('span', h('i.leech'), 'Problemwörter ', h('b', st.leech)), h('span', h('i.unseen'), 'Noch neu ', h('b', unseen))),
        h('p', { style: { marginTop: '14px' } }, vocabIds.length
          ? ['Ohne weitere Wiederholung wüsstest du in 30 Tagen noch etwa ', h('b', in30 + ' von ' + vocabIds.length), ' Wörtern. Mit Wiederholungen hält FSRS dich bei ≈ ' + target + ' %.']
          : 'Sobald du Wörter lernst, siehst du hier, wie stabil dein Gedächtnis ist.')),
      h('div.card', h('h3', '📅 Wiederholungen: nächste 30 Tage'),
        bars(fcVals, fc.map((d) => new Date(d - 1).toLocaleDateString('de-DE', { day: 'numeric' })), { every: 5, thin: true, tip: (i) => new Date(fc[i] - 1).toLocaleDateString('de-DE', { weekday: 'short', day: 'numeric', month: 'short' }) + ': ' + fcVals[i] + ' Karten' }),
        h('small', overdue ? overdue + ' jetzt fällig · ' : '', 'Ø ' + Math.round(sum(fcVals) / 30) + ' pro Tag'))));

    // Skills (30 days)
    const ss = M.skillStats(30);
    const sk = Object.keys(M.SKILL).filter((k) => ss[k] && ss[k][0]);
    const w = M.weakSkill();
    v.appendChild(h('div.card', { style: { marginTop: '16px' } }, h('h3', '🎯 Fertigkeiten (letzte 30 Tage)'),
      sk.length ? sk.sort((a, b) => ss[b][1] / ss[b][0] - ss[a][1] / ss[a][0]).map((k) => {
        const p = pct(ss[k][1], ss[k][0]);
        return h('div.skill-row', h('span', M.SKILL[k]), h('div.progress' + (p >= 80 ? '.ok' : ''), { title: ss[k][1] + ' von ' + ss[k][0] + ' richtig' }, h('span', { style: { width: p + '%' } })), h('b', p + '%'));
      }) : h('p.muted', 'Noch keine Daten – starte eine Übung!'),
      w ? h('div.row', { style: { marginTop: '12px' } }, h('span.muted', 'Schwächster Bereich: ', h('b', M.SKILL[w.skill]), ' (' + w.acc + ' %)'), h('span.spacer'), h('button.btn.small.primary', { onclick: () => GT.startQuick('weak') }, '🩹 Gezielt üben')) : null));

    // Time of day
    const bins = [['Nacht', 0, 6], ['Morgen', 6, 10], ['Vormittag', 10, 12], ['Mittag', 12, 15], ['Nachmittag', 15, 18], ['Abend', 18, 24]];
    const bv = bins.map(([, a, b]) => { let n = 0, ok = 0; for (let i = a; i < b; i++) { const x = s.hours[i]; if (x) { n += x[0]; ok += x[1]; } } return [n, ok]; });
    const bestBin = bv.map((x, i) => [x[0] >= 15 ? x[1] / x[0] : -1, i]).sort((a, b) => b[0] - a[0])[0];
    v.appendChild(h('div.grid.grid-2', { style: { marginTop: '16px' } },
      h('div.card', h('h3', '🕐 Wann du lernst'),
        bars(bv.map((x) => x[0]), ['Nacht', 'Früh', 'Vorm.', 'Mittag', 'Nachm.', 'Abend'], { tip: (i) => bins[i][0] + ' (' + bins[i][1] + '–' + bins[i][2] + ' Uhr): ' + bv[i][0] + ' Antworten' + (bv[i][0] ? ', ' + pct(bv[i][1], bv[i][0]) + ' % richtig' : '') }),
        h('small', bestBin && bestBin[0] >= 0 ? 'Am genauesten bist du: ' + bins[bestBin[1]][0] + ' (' + Math.round(bestBin[0] * 100) + ' %). Lege schwierige Themen in diese Zeit.' : 'Noch zu wenige Daten für eine Empfehlung.')),
      h('div.card', h('h3', '🧩 Problemwörter'),
        (function () {
          const list = leeches.concat(M.atRisk().filter((x) => x.r < 0.85).map((x) => x.v.id)).filter((id, i, a) => a.indexOf(id) === i && GT.vocabById[id]).slice(0, 6);
          if (!list.length) return h('p.muted', 'Keine Problemwörter – dein Gedächtnis ist in Topform. 🎉');
          return [h('div.risk-list', list.map((id) => {
            const x = GT.vocabById[id], c = s.cards[id], r = GT.srs.R(id);
            return h('div.risk', h('span', { html: GT.deHtml(x.de) }), h('small', x.en), h('span.spacer'),
              h('small', (r == null ? '' : 'jetzt ' + Math.round(r * 100) + ' % sicher') + (c.l ? ' · ' + c.l + '× vergessen' : '')), s.notes[id] ? h('span', { title: s.notes[id] }, '🧠') : null);
          })), h('button.btn.small.primary', { style: { marginTop: '10px' }, onclick: () => GT.startQuick('leech') }, '🧠 Jetzt üben')];
        })())));

    // Levels
    v.appendChild(h('div.card', { style: { marginTop: '16px' } }, h('h3', '🏔️ Niveaus'), GT.levels.map((l) => {
      const p = (l.units.filter(GT.unitPassed).length / l.units.length) * 100;
      return h('div.skill-row', h('span', h('span.pill.lvl.lvl-' + l.id, l.id), s.exams[l.id] >= GT.PASS ? ' 🏅' : ''), h('div.progress.ok', h('span', { style: { width: p + '%' } })), h('b', Math.round(p) + '%'));
    })));
  };
})();
