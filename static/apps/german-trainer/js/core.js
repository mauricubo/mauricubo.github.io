/* ==========================================================================
   DeutschWeg – core: utilities, persistence, curriculum index, SRS, speech,
   answer checking. Plain scripts (no modules) so index.html works from file://
   ========================================================================== */
window.GT = window.GT || {};

/* ---------------- Utilities ---------------- */
GT.$ = (sel, root) => (root || document).querySelector(sel);
GT.$$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));

/** Tiny element builder: h('div.card#id', {onclick}, children...) */
GT.h = function (tag, attrs, ...children) {
  const m = tag.match(/^([a-z0-9]+)?((?:[.#][\w-]+)*)$/i);
  const el = document.createElement((m && m[1]) || 'div');
  if (m && m[2]) m[2].replace(/([.#])([\w-]+)/g, (_, t, v) => (t === '.' ? el.classList.add(v) : (el.id = v)));
  if (attrs !== undefined && (attrs === null || typeof attrs !== 'object' || attrs instanceof Node || Array.isArray(attrs))) { children.unshift(attrs); attrs = null; }
  for (const k in attrs || {}) {
    const v = attrs[k];
    if (v == null || v === false) continue;
    if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
    else if (k === 'html') el.innerHTML = v;
    else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
    else el.setAttribute(k, v === true ? '' : v);
  }
  const add = (c) => {
    if (c == null || c === false) return;
    if (Array.isArray(c)) return c.forEach(add);
    el.appendChild(c instanceof Node ? c : document.createTextNode(String(c)));
  };
  children.forEach(add);
  return el;
};

GT.esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
GT.shuffle = (arr) => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
GT.pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
GT.sample = (arr, n) => GT.shuffle(arr).slice(0, n);
GT.clamp = (x, a, b) => Math.max(a, Math.min(b, x));

GT.DAY = 86400000;
GT.dateKey = (d) => { d = d ? new Date(d) : new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
GT.startOfDay = (t) => { const d = new Date(t || Date.now()); d.setHours(0, 0, 0, 0); return d.getTime(); };

GT.toast = function (msg, ms) {
  const t = GT.$('#toast');
  t.textContent = msg; t.classList.add('show');
  clearTimeout(GT._toastT);
  GT._toastT = setTimeout(() => t.classList.remove('show'), ms || 2200);
};

/** Grammatical gender of a vocab entry like "der Hund" → 'der' */
GT.genderOf = (de) => { const m = /^(der|die|das)\s+\S/.exec(de); return m ? m[1] : null; };
GT.stripArticle = (de) => de.replace(/^(der|die|das)\s+/, '');
/** Render German text with coloured article */
GT.deHtml = (de) => {
  const g = GT.genderOf(de);
  if (!g) return GT.esc(de);
  return '<span class="art g-' + g + '">' + g + '</span> ' + GT.esc(GT.stripArticle(de));
};

/* ---------------- Persistence ---------------- */
GT.STORE_KEY = 'deutschweg.v1';
GT.defaultState = () => ({
  v: 1,
  created: Date.now(),
  onboarded: false,
  profile: { name: '', goal: 50 },
  settings: { rate: 0.95, theme: 'auto', voice: '', english: true, sound: true },
  xp: 0,
  xpLog: {},          // dateKey -> xp that day
  streak: { count: 0, last: null, best: 0 },
  units: {},          // unitId -> {learn, practice, read, listen, write, test(best %)}
  unlocked: {},       // unitId -> true (placement / test-out)
  exams: {},          // levelId -> best %
  cards: {},          // srs cards
  skills: {},         // skill -> {n, ok}
  minutes: {},        // dateKey -> seconds of activity
  startLevel: 'A2',
});

GT.load = function () {
  let s = null;
  try { s = JSON.parse(localStorage.getItem(GT.STORE_KEY)); } catch (e) { s = null; }
  const d = GT.defaultState();
  if (!s || typeof s !== 'object') return d;
  // shallow-merge to tolerate older saves
  for (const k in d) if (!(k in s)) s[k] = d[k];
  s.settings = Object.assign(d.settings, s.settings);
  s.profile = Object.assign(d.profile, s.profile);
  s.streak = Object.assign(d.streak, s.streak);
  return s;
};
GT.save = function () {
  try { localStorage.setItem(GT.STORE_KEY, JSON.stringify(GT.state)); }
  catch (e) { GT.toast('⚠️ Fortschritt konnte nicht gespeichert werden'); }
};
GT.state = GT.load();

/* ---------------- XP, streak, skills ---------------- */
GT.addXP = function (n) {
  const s = GT.state, k = GT.dateKey();
  s.xp += n;
  s.xpLog[k] = (s.xpLog[k] || 0) + n;
  const yesterday = GT.dateKey(Date.now() - GT.DAY);
  if (s.streak.last !== k) {
    s.streak.count = s.streak.last === yesterday ? s.streak.count + 1 : 1;
    s.streak.last = k;
    s.streak.best = Math.max(s.streak.best, s.streak.count);
  }
  GT.save();
  GT.updateTopbar && GT.updateTopbar();
};
GT.streakAlive = () => {
  const s = GT.state.streak;
  return s.last === GT.dateKey() || s.last === GT.dateKey(Date.now() - GT.DAY) ? s.count : 0;
};
GT.todayXP = () => GT.state.xpLog[GT.dateKey()] || 0;
GT.logSkill = function (skill, ok) {
  const sk = GT.state.skills[skill] || (GT.state.skills[skill] = { n: 0, ok: 0 });
  sk.n++; if (ok) sk.ok++;
};
GT.addTime = function (sec) {
  const k = GT.dateKey();
  GT.state.minutes[k] = (GT.state.minutes[k] || 0) + Math.round(sec);
};

/* ---------------- Curriculum index ---------------- */
GT.LEVELS = ['A2', 'B1', 'B2', 'C1', 'C2'];
GT.levels = (GT.levels || []).sort((a, b) => GT.LEVELS.indexOf(a.id) - GT.LEVELS.indexOf(b.id));
GT.units = [];
GT.unitById = {};
GT.levels.forEach((lvl) => {
  lvl.units.forEach((u, i) => {
    u.level = lvl.id; u.n = i + 1; u.idx = GT.units.length;
    GT.units.push(u); GT.unitById[u.id] = u;
  });
});
GT.levelById = (id) => GT.levels.find((l) => l.id === id);

GT.ACTIVITIES = [
  { key: 'learn', icon: '📖', name: 'Lernen', desc: 'Grammatik & neue Wörter' },
  { key: 'practice', icon: '🧠', name: 'Üben', desc: 'Gemischte Übungen' },
  { key: 'read', icon: '📰', name: 'Lesen', desc: 'Text verstehen' },
  { key: 'listen', icon: '🎧', name: 'Hören & Sprechen', desc: 'Diktat & Shadowing' },
  { key: 'write', icon: '✍️', name: 'Schreiben', desc: 'Freies Schreiben' },
  { key: 'test', icon: '🏁', name: 'Abschlusstest', desc: '≥ 80 % schaltet frei' },
];
GT.PASS = 80;

GT.unitState = (id) => GT.state.units[id] || (GT.state.units[id] = {});
GT.unitPassed = (u) => (GT.state.units[u.id] && GT.state.units[u.id].test || 0) >= GT.PASS;
GT.isUnlocked = function (u) {
  if (u.idx === 0) return true;
  if (GT.state.unlocked[u.id]) return true;
  return GT.unitPassed(GT.units[u.idx - 1]);
};
GT.unitProgress = function (u) {
  const st = GT.state.units[u.id] || {};
  return GT.ACTIVITIES.filter((a) => (a.key === 'test' ? (st.test || 0) >= GT.PASS : st[a.key])).length;
};
/** The unit the learner should work on next */
GT.currentUnit = function () {
  for (const u of GT.units) if (GT.isUnlocked(u) && !GT.unitPassed(u)) {
    // prefer earliest unlocked & unfinished unit at/after the start level
    if (GT.LEVELS.indexOf(u.level) >= GT.LEVELS.indexOf(GT.state.startLevel) || GT.state.units[u.id]) return u;
  }
  for (const u of GT.units) if (GT.isUnlocked(u) && !GT.unitPassed(u)) return u;
  return GT.units[GT.units.length - 1];
};
GT.currentLevel = () => GT.currentUnit().level;
GT.nextActivity = function (u) {
  const st = GT.state.units[u.id] || {};
  for (const a of GT.ACTIVITIES) {
    if (a.key === 'test' ? (st.test || 0) < GT.PASS : !st[a.key]) return a.key;
  }
  return null;
};

/** All vocab entries with stable ids: {id, de, en, ex, unit} */
GT.allVocab = [];
GT.units.forEach((u) => (u.vocab || []).forEach((v, i) => GT.allVocab.push({ id: 'v:' + u.id + ':' + i, de: v[0], en: v[1], ex: v[2] || '', unit: u })));
GT.vocabById = {};
GT.allVocab.forEach((v) => (GT.vocabById[v.id] = v));

/* ---------------- Spaced repetition (SM-2 variant) ----------------
   Card: {e: ease, i: interval days, d: due timestamp, r: successful reps, l: lapses, s: seen count}
   Grade: 0 = again, 1 = hard, 2 = good, 3 = easy */
GT.srs = {
  get(id) { return GT.state.cards[id]; },
  ensure(id, firstDueDays) {
    if (!GT.state.cards[id]) GT.state.cards[id] = { e: 2.5, i: 0, d: GT.startOfDay() + (firstDueDays || 1) * GT.DAY, r: 0, l: 0, s: 0 };
    return GT.state.cards[id];
  },
  grade(id, g) {
    const c = GT.srs.ensure(id, 0);
    c.s++;
    if (g === 0) {
      c.l++; c.r = 0; c.e = Math.max(1.3, c.e - 0.2); c.i = 0;
      c.d = Date.now() + 10 * 60 * 1000; // relearn in 10 min (same day)
    } else {
      if (c.r === 0) c.i = g === 3 ? 3 : 1;
      else if (c.r === 1) c.i = g === 1 ? 3 : g === 3 ? 8 : 6;
      else c.i = Math.round(c.i * (g === 1 ? 1.2 : g === 3 ? c.e * 1.3 : c.e));
      c.i = Math.min(c.i, 365);
      c.e = Math.max(1.3, c.e + (g === 1 ? -0.15 : g === 3 ? 0.15 : 0));
      c.r++;
      // small fuzz spreads reviews out and avoids "review avalanches"
      const fuzz = c.i > 4 ? Math.round((Math.random() - 0.5) * c.i * 0.1) : 0;
      c.d = GT.startOfDay() + (c.i + fuzz) * GT.DAY;
    }
    return c;
  },
  due(limit) {
    const now = Date.now();
    const ids = Object.keys(GT.state.cards).filter((id) => GT.state.cards[id].d <= now && GT.srs.valid(id));
    // most overdue + weakest first
    ids.sort((a, b) => (GT.state.cards[a].d - GT.state.cards[b].d) || (GT.state.cards[a].e - GT.state.cards[b].e));
    return limit ? ids.slice(0, limit) : ids;
  },
  valid(id) {
    if (id.startsWith('v:')) return !!GT.vocabById[id];
    if (id.startsWith('x:')) return !!GT.mistakeItem(id);
    return false;
  },
  status(id) {
    const c = GT.state.cards[id];
    if (!c || !c.s) return 'new';
    return c.i >= 21 ? 'known' : 'learning';
  },
  nextDue() {
    let m = Infinity;
    for (const id in GT.state.cards) if (GT.srs.valid(id)) m = Math.min(m, GT.state.cards[id].d);
    return m;
  },
};
/** Mistake cards point at a unit exercise: x:<unitId>:<exerciseIndex> */
GT.mistakeItem = function (id) {
  const p = id.split(':');
  const u = GT.unitById[p[1]];
  return u && u.exercises && u.exercises[+p[2]] ? Object.assign({ _unit: u }, u.exercises[+p[2]]) : null;
};

/* ---------------- Answer checking ---------------- */
GT.norm = (s) => String(s || '')
  .replace(/[„“”"«»‚‘’]/g, '').replace(/[´`']/g, "'")
  .replace(/\s+/g, ' ').replace(/\s*([,;:])\s*/g, '$1 ')
  .replace(/[.!?…]+$/g, '').trim();
GT.fold = (s) => s.toLowerCase().replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss').replace(/[,;:]/g, '').replace(/\s+/g, ' ');
GT.lev = function (a, b) {
  if (a === b) return 0;
  const m = a.length, n = b.length;
  if (!m) return n; if (!n) return m;
  let prev = Array.from({ length: n + 1 }, (_, j) => j), cur = new Array(n + 1);
  for (let i = 1; i <= m; i++) {
    cur[0] = i;
    for (let j = 1; j <= n; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    [prev, cur] = [cur, prev];
  }
  return prev[n];
};
/**
 * Compare user input against accepted answers.
 * Returns {res: 'right'|'typo'|'wrong', best, note}
 */
GT.check = function (input, answers, opts) {
  opts = opts || {};
  answers = [].concat(answers);
  const inp = GT.norm(input);
  if (!inp) return { res: 'wrong', best: answers[0], note: '' };
  const fi = GT.fold(inp);
  // strictest match first, across all accepted answers
  for (const a of answers) if (GT.norm(a) === inp) return { res: 'right', best: a };
  for (const a of answers) if (GT.norm(a).toLowerCase() === inp.toLowerCase()) return { res: 'right', best: a, note: 'Achte auf Groß- und Kleinschreibung.' };
  for (const a of answers) if (GT.fold(GT.norm(a)) === fi) return { res: 'typo', best: a, note: 'Fast! Achte auf Umlaute, ß und Kommas.' };
  if (!opts.noTypos) for (const a of answers) if (GT.wordTypo(fi, GT.fold(GT.norm(a)))) return { res: 'typo', best: a, note: 'Kleiner Tippfehler – richtig ist:' };
  let best = answers[0], bestD = Infinity;
  for (const a of answers) { const d = GT.lev(fi, GT.fold(GT.norm(a))); if (d < bestD) { bestD = d; best = a; } }
  return { res: 'wrong', best };
};
/**
 * Word-level typo tolerance. In German a single letter is often grammar
 * (den/dem, klein-e/-en, habe/hat), so only accept slips inside the stem of
 * longer words: same word count, short words exact, word endings identical.
 */
GT.wordTypo = function (x, y) {
  const xs = x.split(' '), ys = y.split(' ');
  if (xs.length !== ys.length) return false;
  let typos = 0;
  for (let i = 0; i < xs.length; i++) {
    const a = xs[i], b = ys[i];
    if (a === b) continue;
    const len = Math.min(a.length, b.length);
    if (len < 7 || a.slice(-2) !== b.slice(-2)) return false;
    if (GT.lev(a, b) > (len >= 11 ? 2 : 1)) return false;
    typos++;
  }
  return typos > 0 && typos <= (xs.length > 6 ? 2 : 1);
};
/** RegExp with a Unicode-aware \b (JS \b only knows ASCII letters) */
GT.UB = '(?:(?<=[\\p{L}\\d])(?![\\p{L}\\d])|(?<![\\p{L}\\d])(?=[\\p{L}\\d]))';
GT.uRe = (src, flags) => new RegExp(src.replace(/\\b/g, GT.UB), flags || 'giu');
/** Check a noun with article: wrong article = wrong, missing article = typo */
GT.checkNoun = function (input, de, alts) {
  const g = GT.genderOf(de);
  const r = GT.check(input, [de].concat(alts || []));
  if (r.res !== 'wrong' || !g) return r;
  const inp = GT.norm(input);
  const ia = GT.genderOf(inp);
  const bare = GT.check(inp.replace(/^(der|die|das)\s+/i, ''), GT.stripArticle(de));
  if (bare.res !== 'wrong') {
    if (!ia) return { res: 'typo', best: de, note: 'Artikel nicht vergessen! Lerne Nomen immer mit Artikel:' };
    return { res: 'wrong', best: de, note: 'Falscher Artikel.' };
  }
  return r;
};

/* ---------------- Speech (Web Speech API) ---------------- */
GT.speech = {
  voices: [],
  init() {
    if (!('speechSynthesis' in window)) return;
    const load = () => { GT.speech.voices = speechSynthesis.getVoices().filter((v) => /^de(-|_|$)/i.test(v.lang)); };
    load();
    speechSynthesis.onvoiceschanged = load;
  },
  voice() {
    const vs = GT.speech.voices;
    if (!vs.length) return null;
    const want = GT.state.settings.voice;
    return vs.find((v) => v.name === want) ||
      vs.find((v) => /de-DE/i.test(v.lang) && /google|natural|neural|premium|enhanced/i.test(v.name)) ||
      vs.find((v) => /de-DE/i.test(v.lang)) || vs[0];
  },
  available: () => 'speechSynthesis' in window,
  say(text, opts) {
    opts = opts || {};
    if (!('speechSynthesis' in window)) { GT.toast('Sprachausgabe wird von diesem Browser nicht unterstützt'); return; }
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(String(text).replace(/_{2,}/g, '…'));
    u.lang = 'de-DE';
    const v = GT.speech.voice(); if (v) u.voice = v;
    u.rate = (opts.rate || 1) * GT.state.settings.rate;
    if (opts.onend) u.onend = opts.onend;
    speechSynthesis.speak(u);
  },
  recAvailable: () => !!(window.SpeechRecognition || window.webkitSpeechRecognition),
  listen(onResult, onEnd) {
    const R = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!R) { GT.toast('Spracherkennung: bitte Chrome oder Edge verwenden'); onEnd && onEnd(); return null; }
    const r = new R();
    r.lang = 'de-DE'; r.interimResults = true; r.maxAlternatives = 3;
    r.onresult = (e) => {
      let txt = ''; let fin = false;
      for (let i = 0; i < e.results.length; i++) { txt += e.results[i][0].transcript; if (e.results[i].isFinal) fin = true; }
      onResult(txt, fin, e);
    };
    r.onerror = (e) => { if (e.error !== 'no-speech' && e.error !== 'aborted') GT.toast('Mikrofon: ' + e.error); };
    r.onend = () => onEnd && onEnd();
    r.start();
    return r;
  },
};
GT.speakBtn = (text, cls, rate) => GT.h('button.speak' + (cls ? '.' + cls : ''), {
  type: 'button', title: 'Anhören', 'aria-label': 'Anhören',
  onclick: (e) => { e.stopPropagation(); GT.speech.say(text, { rate }); },
}, '🔊');

/** Compare spoken transcript with target, word by word. Returns {score 0..1, html} */
GT.compareSpeech = function (target, heard) {
  const tw = GT.norm(target).split(' ');
  const hw = GT.fold(GT.norm(heard)).replace(/[^a-z0-9 ]/g, '').split(' ');
  let ok = 0;
  const html = tw.map((w) => {
    const f = GT.fold(w).replace(/[^a-z0-9]/g, '');
    const hit = hw.some((h) => h === f || (f.length > 4 && GT.lev(h, f) <= 1));
    if (hit) ok++;
    return '<span class="' + (hit ? 'word-ok' : 'word-miss') + '">' + GT.esc(w) + '</span>';
  }).join(' ');
  return { score: tw.length ? ok / tw.length : 0, html };
};

/* ---------------- Sound effects (tiny WebAudio beeps) ---------------- */
GT.sfx = (function () {
  let ctx = null;
  function tone(freqs, dur) {
    if (!GT.state.settings.sound) return;
    try {
      ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
      freqs.forEach((f, i) => {
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.type = 'sine'; o.frequency.value = f;
        const t0 = ctx.currentTime + i * dur * 0.6;
        g.gain.setValueAtTime(0.0001, t0);
        g.gain.exponentialRampToValueAtTime(0.12, t0 + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
        o.connect(g).connect(ctx.destination); o.start(t0); o.stop(t0 + dur + 0.02);
      });
    } catch (e) { /* audio not available */ }
  }
  return { ok: () => tone([660, 880], 0.14), bad: () => tone([300, 220], 0.18), done: () => tone([523, 659, 784, 1047], 0.16) };
})();

/* ---------------- Theme ---------------- */
GT.applyTheme = function () {
  const t = GT.state.settings.theme;
  if (t === 'auto') document.documentElement.removeAttribute('data-theme');
  else document.documentElement.setAttribute('data-theme', t);
};
