/* ==========================================================================
   DeutschWeg – the most frequent German words
   · GT.freq        mastery per word (Leitner boxes 0–5), links, word pools
   · #/words/netz   Wortnetz: themed word map (size = frequency, colour =
                    gender / word type, lines = word families & opposites)
   · #/words/liste  Rangliste: frequency ladder heatmap + searchable list
   · #/words/spiel  Wortregen: arcade game – catch falling words by meaning
   ========================================================================== */
(function () {
  const { h, esc, shuffle, sample } = GT;
  const S = () => GT.state;
  const go = (hash) => GT.goto(hash);
  const W = GT.freqWords, N = W.length, BAND = 50;
  const BY = {};
  W.forEach((w) => (BY[w.de] = w));
  const THEMES = GT.FREQ_THEMES;
  const POS = { art: 'Artikel', pron: 'Pronomen', prep: 'Präposition', konj: 'Konjunktion', adv: 'Adverb', part: 'Partikel', v: 'Verb', n: 'Nomen', npl: 'Nomen (Plural)', adj: 'Adjektiv', num: 'Zahlwort' };

  /* ---------------- Links: word families & opposites ---------------- */
  const LINKS = {};
  function link(a, b, type) {
    if (!BY[a] || !BY[b]) { console.warn('freq link: unknown word', a, b); return; }
    (LINKS[a] || (LINKS[a] = [])).push({ to: b, type });
    (LINKS[b] || (LINKS[b] = [])).push({ to: a, type });
  }
  GT.FREQ_FAMILIES.forEach((f) => { for (let i = 0; i < f.length; i++) for (let j = i + 1; j < f.length; j++) link(f[i], f[j], 'fam'); });
  GT.FREQ_OPPOSITES.forEach(([a, b]) => link(a, b, 'opp'));

  /* ---------------- Mastery: Leitner box 0–5 per word ----------------
     record: [box, seen, right, lastTs]. Right → one box up, wrong → back to 1
     (or 0). Box ≥ 3 counts as "sicher". */
  const F = (GT.freq = {});
  const store = () => S().freq || (S().freq = {});
  F.rec = (de) => store()[de];
  F.box = (de) => (store()[de] || [0])[0];
  F.seen = (de) => !!store()[de];
  F.grade = function (de, ok) {
    const r = store()[de] || (store()[de] = [0, 0, 0, 0]);
    r[1]++; r[3] = Date.now();
    if (ok) { r[2]++; r[0] = Math.min(5, r[0] + 1); } else r[0] = Math.min(r[0], 1);
  };
  F.level = (de) => {
    if (!F.seen(de)) return 0;
    const b = F.box(de);
    return b >= 5 ? 4 : b >= 3 ? 3 : b === 2 ? 2 : 1;
  };
  F.LEVELS = ['neu', 'wackelig', 'lernend', 'sicher', 'gemeistert'];
  F.known = (list) => (list || W).filter((w) => F.box(w.de) >= 3).length;
  /** First word (by rank) that is not yet "sicher": the learner's frontier */
  F.frontier = () => W.find((w) => F.box(w.de) < 3) || W[N - 1];

  /** Word pool for a game: {type: 'smart' | 'band' | 'theme', val} */
  F.pool = function (spec) {
    spec = spec || { type: 'smart' };
    if (spec.type === 'band') return W.slice(spec.val * BAND, spec.val * BAND + BAND);
    if (spec.type === 'theme') return W.filter((w) => w.theme === spec.val);
    // smart: the next 24 words to learn from the frontier on, plus a few known ones to keep them fresh
    const todo = W.filter((w) => F.box(w.de) < 3).slice(0, 24);
    const known = W.filter((w) => F.box(w.de) >= 3).sort((a, b) => (F.rec(a.de)[3] || 0) - (F.rec(b.de)[3] || 0)).slice(0, 30);
    const out = todo.concat(sample(known, Math.max(6, 30 - todo.length)));
    return out.length >= 8 ? out : W.slice(0, 30);
  };
  F.poolName = (spec) => !spec || spec.type === 'smart' ? 'Deine Lernkante' : spec.type === 'band' ? 'Rang ' + (spec.val * BAND + 1) + '–' + Math.min(N, spec.val * BAND + BAND) : THEMES[spec.val].icon + ' ' + THEMES[spec.val].name;

  /** English glosses as a set of tokens (so near-synonyms are never offered as distractors) */
  const tokens = (en) => en.toLowerCase().replace(/\(.*?\)/g, ' ').split(/[,;/]|\s+…\s+/).map((t) => t.trim()).filter(Boolean);
  const clash = (a, b) => { const ta = tokens(a.en); return tokens(b.en).some((t) => ta.includes(t)); };
  F.distractors = function (w, n) {
    const ok = (x) => x !== w && !clash(x, w);
    const same = shuffle(W.filter((x) => x.pos === w.pos && ok(x)));
    const near = same.filter((x) => Math.abs(x.rank - w.rank) < 150);
    const out = near.slice(0, n);
    for (const x of same.concat(shuffle(W.filter(ok)))) {
      if (out.length >= n) break;
      if (!out.includes(x) && !out.some((o) => clash(o, x))) out.push(x);
    }
    return out;
  };

  /** Word label with coloured article */
  const deNode = (w) => h('span', { html: GT.deHtml(w.de) });
  const posClass = (w) => w.pos === 'n' ? 'w-' + GT.genderOf(w.de) : w.pos === 'npl' ? 'w-pl' : w.pos === 'v' ? 'w-v' : w.pos === 'adj' ? 'w-adj' : 'w-x';
  const wordRow = (w) => h('div.frow', h('span.fr-rank', w.rank), h('span.fr-emo', w.emoji || ''),
    h('a.fr-de', { href: '#/words/netz/' + w.theme + '/' + w.rank }, deNode(w)), h('span.fr-en', w.en), dots(w.de), GT.speakBtn(w.de, 'small'));
  const dots = (de) => {
    const b = F.box(de);
    return h('span.fdots', { title: 'Lernstand: ' + F.LEVELS[F.level(de)] }, [0, 1, 2, 3, 4].map((i) => h('i' + (i < b ? '.on' : ''))));
  };

  /* ======================================================================
     View shell
     ====================================================================== */
  const X = GT.xviews;
  X.words = function (tab, a, b) {
    tab = ['netz', 'liste', 'spiel'].includes(tab) ? tab : 'netz';
    const v = GT.$('#view');
    if (tab === 'spiel' && a === 'los') return Rain.start(GT.$('#view'));
    v.appendChild(h('div.row', h('h1', { style: { margin: 0 } }, '🔤 Die ' + N + ' häufigsten Wörter'), h('span.spacer'),
      h('span.chip', { title: 'Wörter mit Lernstand „sicher“ oder besser' }, '✅ ' + F.known() + ' / ' + N)));
    v.appendChild(h('p.muted', 'Etwa 100 Wörter machen schon rund die Hälfte jedes deutschen Textes aus, 500 Wörter einen großen Teil des Alltags. Lerne sie zuerst – zusammen mit ihren Verwandten und Gegenteilen.'));
    const tabs = [['netz', '🕸️ Wortnetz'], ['liste', '🪜 Liste'], ['spiel', '🌧️ Wortregen']];
    v.appendChild(h('div.tabs.wtabs', tabs.map(([k, n]) => h('button' + (k === tab ? '.active' : ''), { onclick: () => go('#/words/' + k) }, n))));
    const body = h('div');
    v.appendChild(body);
    ({ netz: () => viewNet(body, a, b), liste: () => viewLadder(body), spiel: () => Rain.setup(body) })[tab]();
  };

  /* ======================================================================
     Wortnetz – force-directed word map per theme
     ====================================================================== */
  function layout(nodes, edges) {
    const idx = {};
    nodes.forEach((n, i) => (idx[n.w.de] = i));
    const E = edges.map((e) => [idx[e.a], idx[e.b]]);
    // each node occupies a box: circle on top, label underneath
    nodes.forEach((n) => { n.hw = n.cr + 4; n.hh = n.r + 11; n.oy = 9; });
    // deterministic start: golden-angle spiral (most frequent words in the middle);
    // a word linked to an already placed word starts right beside its partner
    let slot = 0;
    nodes.forEach((n, i) => {
      const partner = E.filter((e) => e.includes(i)).map((e) => nodes[e[0] === i ? e[1] : e[0]]).find((p) => p.x != null);
      if (partner) { const s = i % 2 ? 1 : -1; n.x = partner.x + s * (partner.hw + n.hw + 6); n.y = partner.y + (i % 3 - 1) * 8; return; }
      const a = slot * 2.39996, d = 52 * Math.sqrt(slot++);
      n.x = Math.cos(a) * d; n.y = Math.sin(a) * d;
    });
    for (let it = 0; it < 360; it++) {
      const alpha = 1 - it / 360;
      // springs: related words (families, opposites) want to sit side by side
      E.forEach(([i, j]) => {
        const p = nodes[i], q = nodes[j];
        const dx = q.x - p.x, dy = q.y - p.y, d = Math.hypot(dx, dy) || 1;
        const want = p.hw + q.hw + 6, f = (d - want) / d * 0.3 * alpha;
        p.x += dx * f; p.y += dy * f; q.x -= dx * f; q.y -= dy * f;
      });
      // gravity: frequent words pulled harder to the centre (a bit flatter than tall)
      nodes.forEach((n) => { const g = 0.006 + 0.02 * n.weight; n.x -= n.x * g * alpha; n.y -= n.y * g * 1.4 * alpha; });
      // box collisions, resolved along the axis of least overlap
      for (let i = 0; i < nodes.length; i++) for (let j = i + 1; j < nodes.length; j++) {
        const p = nodes[i], q = nodes[j];
        const dx = q.x - p.x, dy = (q.y + q.oy) - (p.y + p.oy);
        const ox = p.hw + q.hw + 4 - Math.abs(dx), oy = p.hh + q.hh + 4 - Math.abs(dy);
        if (ox <= 0 || oy <= 0) continue;
        if (ox < oy) { const s = (dx || Math.random() - 0.5) > 0 ? 1 : -1; p.x -= s * ox / 2; q.x += s * ox / 2; }
        else { const s = (dy || Math.random() - 0.5) > 0 ? 1 : -1; p.y -= s * oy / 2; q.y += s * oy / 2; }
      }
    }
  }

  function viewNet(body, themeId, rankSel) {
    const counts = {};
    W.forEach((w) => { const c = counts[w.theme] || (counts[w.theme] = [0, 0]); c[0]++; if (F.box(w.de) >= 3) c[1]++; });
    if (!THEMES[themeId]) themeId = F.frontier().theme;
    body.appendChild(h('div.theme-chips', Object.keys(THEMES).map((k) => h('button.theme-chip' + (k === themeId ? '.active' : ''), { onclick: () => go('#/words/netz/' + k), title: counts[k][1] + ' von ' + counts[k][0] + ' sicher' },
      h('span', THEMES[k].icon + ' ' + THEMES[k].name), h('i', { style: { width: (counts[k][1] / counts[k][0]) * 100 + '%' } })))));

    const words = W.filter((w) => w.theme === themeId);
    const nodes = words.map((w) => {
      const r = 11 + 19 * Math.pow(1 - (w.rank - 1) / N, 2);
      const label = w.pos === 'n' || w.pos === 'npl' ? GT.stripArticle(w.de) : w.de;
      const lw = label.length * 7.1;
      return { w, r, label, cr: Math.max(r + 9, lw / 2 + 3), weight: 1 - (w.rank - 1) / N };
    });
    const inTheme = new Set(words.map((w) => w.de));
    const edges = [];
    words.forEach((w) => (LINKS[w.de] || []).forEach((l) => { if (inTheme.has(l.to) && w.de < l.to) edges.push({ a: w.de, b: l.to, type: l.type }); }));
    layout(nodes, edges);
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    nodes.forEach((n) => { x0 = Math.min(x0, n.x - n.cr); x1 = Math.max(x1, n.x + n.cr); y0 = Math.min(y0, n.y - n.r - 6); y1 = Math.max(y1, n.y + n.r + 20); });
    const pad = 8;
    const NS = 'http://www.w3.org/2000/svg';
    const el = (tag, attrs, text) => { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); if (text != null) e.textContent = text; return e; };
    const vbW = x1 - x0 + 2 * pad;
    const svg = el('svg', { viewBox: [x0 - pad, y0 - pad, vbW, y1 - y0 + 2 * pad].map((n) => n.toFixed(1)).join(' '), class: 'wn-svg', role: 'group', 'aria-label': 'Wortnetz: ' + THEMES[themeId].name });
    // never shrink labels below ~10 px: on narrow screens the map pans sideways instead
    svg.style.minWidth = Math.round(vbW * 0.8) + 'px';
    const byDe = {};
    nodes.forEach((n) => (byDe[n.w.de] = n));
    const gE = el('g', { class: 'wn-edges' });
    edges.forEach((e) => {
      const p = byDe[e.a], q = byDe[e.b];
      const line = el('line', { x1: p.x.toFixed(1), y1: p.y.toFixed(1), x2: q.x.toFixed(1), y2: q.y.toFixed(1), class: 'wn-e e-' + e.type });
      line.dataset.a = e.a; line.dataset.b = e.b;
      gE.appendChild(line);
    });
    svg.appendChild(gE);
    const gN = el('g', { class: 'wn-nodes' });
    nodes.forEach((n) => {
      const g = el('g', { class: 'wn-node ' + posClass(n.w), transform: 'translate(' + n.x.toFixed(1) + ' ' + n.y.toFixed(1) + ')', tabindex: '0', role: 'button', 'aria-label': n.w.de + ': ' + n.w.en });
      g.dataset.de = n.w.de;
      g.appendChild(el('title', {}, '#' + n.w.rank + ' ' + n.w.de + ' – ' + n.w.en));
      g.appendChild(el('circle', { r: n.r.toFixed(1), class: 'wn-c' }));
      const box = F.box(n.w.de);
      if (F.seen(n.w.de)) {
        const rr = n.r + 3.5, c = 2 * Math.PI * rr;
        g.appendChild(el('circle', { r: rr.toFixed(1), class: 'wn-ring', 'stroke-dasharray': (c * Math.max(0.06, box / 5)).toFixed(1) + ' ' + c.toFixed(1), transform: 'rotate(-90)' }));
      }
      if (n.w.emoji) g.appendChild(el('text', { class: 'wn-emo', 'font-size': (n.r * 0.95).toFixed(1), dy: '.35em' }, n.w.emoji));
      else g.appendChild(el('text', { class: 'wn-rank', 'font-size': Math.max(8, n.r * 0.6).toFixed(1), dy: '.35em' }, n.w.rank));
      g.appendChild(el('text', { class: 'wn-l', y: (n.r + 14).toFixed(1) }, n.label));
      const pickIt = () => {
        select(n.w.de);
        // on phones the detail card sits below the map
        if (window.matchMedia('(max-width: 900px)').matches) panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      };
      g.addEventListener('click', pickIt);
      g.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pickIt(); } });
      gN.appendChild(g);
    });
    svg.appendChild(gN);

    const panel = h('div.card.wn-panel');
    body.appendChild(h('div.wn-layout', h('div.card.wn-stage', svg, legend()), panel));

    function select(de) {
      svg.classList.toggle('focus', !!de);
      const rel = new Set(de ? [de].concat((LINKS[de] || []).map((l) => l.to)) : []);
      GT.$$('.wn-node', svg).forEach((g) => { g.classList.toggle('sel', g.dataset.de === de); g.classList.toggle('hl', rel.has(g.dataset.de)); });
      GT.$$('.wn-e', svg).forEach((l) => l.classList.toggle('hl', l.dataset.a === de || l.dataset.b === de));
      panel.innerHTML = '';
      if (!de) return panelIntro();
      wordPanel(panel, BY[de], select, themeId);
    }
    function panelIntro() {
      const t = THEMES[themeId], c = counts[themeId];
      panel.appendChild(h('h3', t.icon + ' ' + t.name));
      panel.appendChild(h('p.muted', words.length + ' Wörter, ' + c[1] + ' davon sicher. Tippe auf ein Wort: Bedeutung, Beispiel, Aussprache und seine Verwandten erscheinen hier.'));
      panel.appendChild(h('p.muted', { style: { fontSize: '.88rem' } }, 'Große Kreise = häufige Wörter. Lerne vom Zentrum nach außen. Ein grüner Ring zeigt deinen Lernstand.'));
      panel.appendChild(h('button.btn.primary.block', { onclick: () => Rain.play({ type: 'theme', val: themeId }) }, '🌧️ Dieses Thema spielen'));
    }
    const pre = rankSel && W[+rankSel - 1];
    select(pre && pre.theme === themeId ? pre.de : null);
  }

  function legend() {
    const sw = (cls, t) => h('span', h('i.lg-dot.' + cls), t);
    return h('div.wn-legend',
      sw('w-der', 'der'), sw('w-die', 'die'), sw('w-das', 'das'), sw('w-pl', 'Plural'), sw('w-v', 'Verb'), sw('w-adj', 'Adjektiv'), sw('w-x', 'andere'),
      h('span', h('i.lg-line.fam'), 'Wortfamilie'), h('span', h('i.lg-line.opp'), 'Gegenteil'), h('span', h('i.lg-ring'), 'Lernstand'));
  }

  /** Detail card of one word (used by the map) */
  function wordPanel(panel, w, select, themeId) {
    const t = THEMES[w.theme];
    panel.appendChild(h('div.wp-head',
      w.emoji ? h('span.wp-emo', w.emoji) : h('span.wp-emo.rank', '#' + w.rank),
      h('div', h('div.wp-de', deNode(w), ' ', GT.speakBtn(w.de)), h('div.wp-en', w.en))));
    panel.appendChild(h('div.wp-meta', h('span.chip', '#' + w.rank), h('span.chip', POS[w.pos]), h('span.chip', t.icon + ' ' + t.name)));
    if (w.ex) panel.appendChild(h('p.wp-ex', GT.speakBtn(w.ex, 'small'), ' ', w.ex));
    panel.appendChild(h('div.row', { style: { margin: '6px 0 12px' } }, h('small', 'Lernstand: ', h('b', F.LEVELS[F.level(w.de)])), dots(w.de)));
    const rels = LINKS[w.de] || [];
    [['fam', '🌳 Wortfamilie'], ['opp', '↔️ Gegenteil']].forEach(([type, name]) => {
      const list = rels.filter((l) => l.type === type).map((l) => BY[l.to]);
      if (!list.length) return;
      panel.appendChild(h('div.wp-rel', h('small', name), h('div.row', list.map((x) => h('button.rel-chip.' + type, {
        onclick: () => (x.theme === themeId ? select(x.de) : go('#/words/netz/' + x.theme + '/' + x.rank)),
        title: x.en + (x.theme !== themeId ? ' · Thema: ' + THEMES[x.theme].name : ''),
      }, (x.emoji ? x.emoji + ' ' : '') + x.de + (x.theme !== themeId ? ' ↗' : ''))))));
    });
    // own mnemonic (generation effect): shares the notes store with the dashboard
    const key = 'f:' + w.de;
    let tm;
    panel.appendChild(h('label.wp-note', h('small', '💡 Deine Eselsbrücke'),
      h('textarea', { rows: 2, placeholder: 'Ein Bild, ein Reim, ein Satz über dich …', oninput: (e) => { clearTimeout(tm); const val = e.target.value; tm = setTimeout(() => { if (val.trim()) S().notes[key] = val.trim(); else delete S().notes[key]; GT.save(); }, 400); } }, S().notes[key] || '')));
    panel.appendChild(h('button.btn.ghost.small', { onclick: () => select(null) }, '✕ Auswahl aufheben'));
  }

  /* ======================================================================
     Rangliste – frequency ladder
     ====================================================================== */
  function viewLadder(body) {
    const fr = F.frontier();
    const seen = W.filter((w) => F.seen(w.de)).length;
    body.appendChild(h('div.kpis',
      h('div.kpi', h('b', F.known() + ' / ' + N), h('span', 'Wörter sicher')),
      h('div.kpi', h('b', seen), h('span', 'schon gesehen')),
      h('div.kpi', h('b', '#' + fr.rank), h('span', 'Deine Lernkante: ', h('span', { html: GT.deHtml(fr.de) }))),
      h('div.kpi', h('b', (S().counters.rainBest || 0).toLocaleString('de-DE')), h('span', 'Wortregen-Rekord'))));

    const lad = h('div.card.ladder');
    lad.appendChild(h('div.row', h('h3', { style: { margin: 0 } }, '🪜 Die Leiter'), h('span.spacer'),
      h('span.ladder-key', F.LEVELS.map((n, i) => h('span', h('i.lv' + i), n)))));
    lad.appendChild(h('p.muted', { style: { fontSize: '.9rem' } }, 'Jedes Kästchen ist ein Wort, sortiert nach Häufigkeit. Arbeite dich von oben nach unten – tippe auf ein Kästchen, um das Wort im Wortnetz zu sehen.'));
    for (let b = 0; b * BAND < N; b++) {
      const band = W.slice(b * BAND, b * BAND + BAND);
      const k = F.known(band), pct = Math.round((k / band.length) * 100);
      lad.appendChild(h('div.band' + (band.includes(fr) ? '.here' : ''),
        h('div.band-l', h('b', (b * BAND + 1) + '–' + (b * BAND + band.length)), h('small', pct + ' %')),
        h('div.cells', band.map((w) => h('button.cell.lv' + F.level(w.de) + (w === fr ? '.fr' : ''), { title: '#' + w.rank + ' ' + w.de + ' – ' + w.en, 'aria-label': w.de, onclick: () => go('#/words/netz/' + w.theme + '/' + w.rank) }))),
        h('button.btn.small' + (band.includes(fr) ? '.primary' : '.ghost'), { onclick: () => Rain.play({ type: 'band', val: b }), title: 'Wortregen mit diesen Wörtern' }, '▶')));
    }
    body.appendChild(lad);

    // searchable list
    const list = h('div.flist');
    const input = h('input.input', { type: 'search', placeholder: 'Suchen: Wort oder Übersetzung …', 'aria-label': 'Wörter suchen' });
    let all = false;
    const render = () => {
      const q = GT.fold(input.value.trim());
      list.innerHTML = '';
      const hits = q ? W.filter((w) => GT.fold(w.de).includes(q) || w.en.toLowerCase().includes(q)) : W;
      hits.slice(0, q || all ? N : 100).forEach((w) => list.appendChild(wordRow(w)));
      if (!q && !all) list.appendChild(h('button.btn.ghost.block', { onclick: () => { all = true; render(); } }, 'Alle ' + N + ' anzeigen'));
      if (!hits.length) list.appendChild(h('p.muted', 'Nichts gefunden.'));
    };
    input.addEventListener('input', render);
    body.appendChild(h('div.card', { style: { marginTop: '16px' } }, h('h3', '📋 Liste'), input, list));
    render();
  }

  /* ======================================================================
     Wortregen – the game
     Words fall from the sky. Pick the right meaning for the lowest word
     before it lands. Three lives; speed rises every 8 hits; a 15-combo
     gives back a life. Mastery and XP feed the rest of the app.
     ====================================================================== */
  const Rain = {};
  const prefs = () => S().freqPrefs || (S().freqPrefs = { dir: 'de', pool: { type: 'smart' }, say: true });
  let G = null;

  Rain.play = function (pool) { prefs().pool = pool; GT.save(); go('#/words/spiel/los'); };

  Rain.setup = function (body) {
    const p = prefs();
    const best = S().counters.rainBest || 0;
    const opt = (label, on, fn) => h('button.seg' + (on ? '.on' : ''), { onclick: fn }, label);
    const card = h('div.card.rain-setup');
    const draw = () => {
      card.innerHTML = '';
      card.appendChild(h('h2', '🌧️ Wortregen'));
      card.appendChild(h('p.muted', 'Wörter fallen vom Himmel. Tippe die richtige Bedeutung, bevor das unterste Wort landet. Drei Leben – alle 8 Treffer wird es schneller. Eine Serie von 15 schenkt dir ein Leben zurück.'));
      card.appendChild(h('div.rain-opt-row', h('small', 'Richtung'), h('div.segs',
        opt('🇩🇪 → 🇬🇧  Bedeutung finden', p.dir === 'de', () => { p.dir = 'de'; draw(); }),
        opt('🇬🇧 → 🇩🇪  Deutsches Wort finden', p.dir === 'en', () => { p.dir = 'en'; draw(); }))));
      const bands = [];
      for (let b = 0; b * BAND < N; b++) bands.push(b);
      card.appendChild(h('div.rain-opt-row', h('small', 'Wörter'), h('div.segs.wrap',
        opt('🎯 Deine Lernkante (ab #' + F.frontier().rank + ')', p.pool.type === 'smart', () => { p.pool = { type: 'smart' }; draw(); }),
        bands.map((b) => opt((b * BAND + 1) + '–' + Math.min(N, b * BAND + BAND), p.pool.type === 'band' && p.pool.val === b, () => { p.pool = { type: 'band', val: b }; draw(); })),
        p.pool.type === 'theme' ? opt(F.poolName(p.pool), true, () => {}) : null)));
      if (GT.speech.available()) card.appendChild(h('div.rain-opt-row', h('small', 'Aussprache'), h('div.segs',
        opt('🔊 an', p.say, () => { p.say = true; draw(); }), opt('🔇 aus', !p.say, () => { p.say = false; draw(); }))));
      card.appendChild(h('div.row', { style: { marginTop: '16px' } },
        h('button.btn.primary.lg', { onclick: () => { GT.save(); go('#/words/spiel/los'); } }, '▶ Los geht’s'),
        best ? h('span.muted', '🏆 Rekord: ' + best.toLocaleString('de-DE') + ' Punkte') : null));
      card.appendChild(h('p.muted', { style: { fontSize: '.85rem', marginTop: '12px' } }, '⌨️ Tasten 1–4 wählen eine Antwort, P oder Esc pausiert.'));
    };
    draw();
    body.appendChild(card);
  };

  Rain.start = function (v) {
    const p = prefs();
    stop();
    document.body.classList.add('focus');
    const pool = F.pool(p.pool);
    G = {
      dir: p.dir, say: p.say && GT.speech.available(), poolSpec: p.pool, pool,
      lives: 3, score: 0, right: 0, wrong: 0, combo: 0, bestCombo: 0, level: 1,
      drops: [], target: null, recent: [], missed: [], seenWords: new Set(),
      spawnIn: 0.3, last: 0, raf: 0, paused: false, over: false, t0: Date.now(), shownAt: 0,
    };
    const hud = h('div.rain-hud',
      h('span.rh-lives', { id: 'rh-lives' }), h('span', '⭐ ', h('b', { id: 'rh-score' }, '0')), h('span', 'Level ', h('b', { id: 'rh-level' }, '1')),
      h('span.rh-combo', { id: 'rh-combo' }), h('span.spacer'),
      h('button.icon-btn', { onclick: () => pause(!G.paused), title: 'Pause (P)', 'aria-label': 'Pause' }, '⏸'),
      h('button.icon-btn', { onclick: () => { stop(); go('#/words/spiel'); }, title: 'Beenden', 'aria-label': 'Beenden' }, '✕'));
    G.field = h('div.rain-field', { 'aria-live': 'polite' }, h('div.rain-ground'));
    G.opts = h('div.rain-opts');
    G.wrap = h('div.rain-wrap', h('div.rain-title', h('b', '🌧️ Wortregen'), h('small', F.poolName(G.poolSpec) + ' · ' + (G.dir === 'de' ? 'Deutsch → Englisch' : 'Englisch → Deutsch'))), hud, G.field, G.opts);
    v.innerHTML = '';
    v.appendChild(G.wrap);
    hudUpdate();
    G.H = G.field.clientHeight; G.Wd = G.field.clientWidth;
    document.addEventListener('keydown', onKey);
    document.addEventListener('visibilitychange', onVis);
    window.addEventListener('resize', onResize);
    G.last = performance.now();
    G.raf = requestAnimationFrame(tick);
  };

  function stop() {
    if (!G) return;
    cancelAnimationFrame(G.raf);
    document.removeEventListener('keydown', onKey);
    document.removeEventListener('visibilitychange', onVis);
    window.removeEventListener('resize', onResize);
    if (!G.over && G.right + G.wrong) GT.save();
    G.over = true;
    G = null;
  }
  // leaving the page (router) ends a running game
  window.addEventListener('hashchange', () => { if (G && !/^#\/words\/spiel\/los/.test(location.hash)) stop(); });

  const onResize = () => { if (G) { G.H = G.field.clientHeight; G.Wd = G.field.clientWidth; } };
  const onVis = () => { if (document.hidden && G && !G.paused) pause(true); };
  function onKey(e) {
    if (!G || G.over) return;
    if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') { e.preventDefault(); return pause(!G.paused); }
    if (G.paused) return;
    const n = +e.key;
    if (n >= 1 && n <= 4) { const b = G.opts.children[n - 1]; if (b) { e.preventDefault(); b.click(); } }
  }
  function pause(on) {
    G.paused = on;
    const ov = GT.$('.rain-pause', G.field);
    if (on && !ov) G.field.appendChild(h('div.rain-pause', h('div', h('b', '⏸ Pause'), h('button.btn.primary', { onclick: () => pause(false) }, '▶ Weiter'))));
    if (!on) { ov && ov.remove(); G.last = performance.now(); }
  }

  const speeds = () => ({
    fall: Math.max(4.2, 10.5 - G.level * 0.75),       // seconds from top to ground
    every: Math.max(1.05, 3.1 - G.level * 0.24),      // seconds between drops
    max: Math.min(5, 2 + Math.floor(G.level / 2)),    // words in the air at once
  });

  function pickWord() {
    const busy = new Set(G.drops.map((d) => d.w).concat(G.recent));
    const cand = G.pool.filter((w) => !busy.has(w));
    const list = cand.length ? cand : G.pool;
    // weaker words come more often
    let sum = 0;
    const wts = list.map((w) => (sum += 6 - F.box(w.de) + (F.seen(w.de) ? 0 : 1)));
    const r = Math.random() * sum;
    return list[wts.findIndex((x) => x >= r)] || list[0];
  }

  function spawn() {
    const w = pickWord();
    G.recent.push(w); if (G.recent.length > 6) G.recent.shift();
    const el = h('div.rain-drop', G.dir === 'de' ? h('span', { html: GT.deHtml(w.de) }) : w.en);
    G.field.appendChild(el);
    const bw = el.offsetWidth, bh = el.offsetHeight;
    // pick the x position farthest from words near the top
    let bestX = 8, bestD = -1;
    for (let i = 0; i < 6; i++) {
      const x = 8 + Math.random() * Math.max(1, G.Wd - bw - 16);
      const d = Math.min(...G.drops.filter((o) => o.y < 140).map((o) => Math.abs(o.x + o.w2 - (x + bw / 2))), 9999);
      if (d > bestD) { bestD = d; bestX = x; }
    }
    const drop = { w, el, x: bestX, y: -bh, h: bh, w2: bw / 2, born: performance.now() };
    el.style.transform = 'translate(' + drop.x + 'px,' + drop.y + 'px)';
    G.drops.push(drop);
    G.seenWords.add(w.de);
  }

  function tick(now) {
    if (!G || G.over) return;
    const dt = Math.min(0.05, (now - G.last) / 1000);
    G.last = now;
    if (!G.paused && !G.ending) {
      const sp = speeds();
      G.spawnIn -= dt;
      if (G.spawnIn <= 0 && G.drops.length < sp.max) { spawn(); G.spawnIn = sp.every; }
      if (!G.drops.length && G.spawnIn > 0.4) G.spawnIn = 0.4;
      const v = G.H / sp.fall;
      for (const d of G.drops.slice()) {
        d.y += v * dt;
        d.el.style.transform = 'translate(' + d.x + 'px,' + d.y + 'px)';
        if (d.y + d.h >= G.H - 6) miss(d, null);
        if (!G) return;
      }
      retarget();
    }
    G.raf = requestAnimationFrame(tick);
  }

  function retarget() {
    let t = null;
    for (const d of G.drops) if (!t || d.y > t.y) t = d;
    if (t === G.target) return;
    if (G.target) G.target.el.classList.remove('target');
    G.target = t;
    if (!t) { G.opts.innerHTML = ''; return; }
    t.el.classList.add('target');
    G.shownAt = Date.now();
    const choices = shuffle([t.w].concat(F.distractors(t.w, 3)));
    G.opts.innerHTML = '';
    choices.forEach((c, i) => {
      const b = h('button.rain-opt', { onclick: () => answer(t, c) }, h('kbd', i + 1), G.dir === 'de' ? h('span', c.en) : h('span', { html: GT.deHtml(c.de) }));
      b._w = c;
      G.opts.appendChild(b);
    });
  }

  function logAnswer(w, ok) {
    F.grade(w.de, ok);
    GT.logSkill('vocab', ok);
    GT.track('answer', { ok, res: ok ? 'right' : 'wrong', kind: 'rain', skill: 'vocab', review: false, ms: Date.now() - G.shownAt, tag: 'rain' });
  }

  function answer(drop, choice) {
    if (!G || G.paused || G.ending || G.over || G.target !== drop) return;
    if (choice === drop.w) {
      G.right++; G.combo++; G.bestCombo = Math.max(G.bestCombo, G.combo);
      G.score += 10 * G.level + Math.min(G.combo, 20) * 2;
      G.level = 1 + Math.floor(G.right / 8);
      logAnswer(drop.w, true);
      if (G.combo >= 3) GT.track('combo', { n: G.combo });
      if (G.combo % 15 === 0 && G.lives < 5) { G.lives++; flash('❤️ +1 Leben!'); }
      GT.sfx.ok();
      if (G.say) GT.speech.say(drop.w.de, { rate: 1.05 });
      remove(drop, 'pop');
      reveal(drop, true);
    } else {
      const btn = GT.$$('.rain-opt', G.opts).find((b) => b._w === choice);
      btn && btn.classList.add('bad');
      miss(drop, choice);
    }
    hudUpdate();
  }

  function miss(drop, choice) {
    G.wrong++; G.combo = 0; G.lives--;
    logAnswer(drop.w, false);
    if (!G.missed.includes(drop.w)) G.missed.push(drop.w);
    GT.sfx.bad();
    G.field.classList.remove('hit'); void G.field.offsetWidth; G.field.classList.add('hit');
    remove(drop, 'burst');
    reveal(drop, false);
    hudUpdate();
    if (G.lives <= 0) { G.ending = true; setTimeout(gameOver, 650); }
  }

  function remove(drop, cls) {
    G.drops = G.drops.filter((d) => d !== drop);
    if (G.target === drop) { G.target = null; G.opts.innerHTML = ''; }
    drop.el.classList.remove('target');
    drop.el.style.setProperty('--t', drop.el.style.transform);
    drop.el.classList.add(cls);
    setTimeout(() => drop.el.remove(), 380);
    retarget();
  }

  /** Show the pair (with emoji) where the word was – the association moment */
  function reveal(drop, ok) {
    const w = drop.w;
    const el = h('div.rain-reveal' + (ok ? '.ok' : '.bad'), (w.emoji ? w.emoji + ' ' : ''), h('span', { html: GT.deHtml(w.de) }), ' = ', w.en);
    el.style.transform = 'translate(' + Math.max(4, Math.min(drop.x, G.Wd - 220)) + 'px,' + Math.max(4, Math.min(drop.y, G.H - 40)) + 'px)';
    G.field.appendChild(el);
    setTimeout(() => el.remove(), ok ? 1100 : 2200);
  }

  function flash(msg) {
    const el = h('div.rain-flash', msg);
    G.field.appendChild(el);
    setTimeout(() => el.remove(), 1300);
  }

  function hudUpdate() {
    if (!G) return;
    GT.$('#rh-lives').textContent = '❤️'.repeat(Math.max(0, G.lives)) + '🤍'.repeat(Math.max(0, 3 - G.lives));
    GT.$('#rh-score').textContent = G.score.toLocaleString('de-DE');
    GT.$('#rh-level').textContent = G.level;
    GT.$('#rh-combo').textContent = G.combo >= 3 ? '🔥 ' + G.combo + 'er-Serie' : '';
  }

  function gameOver() {
    if (!G || G.over) return;
    const g = G;
    g.over = true;
    cancelAnimationFrame(g.raf);
    document.removeEventListener('keydown', onKey);
    document.removeEventListener('visibilitychange', onVis);
    window.removeEventListener('resize', onResize);
    G = null;
    document.body.classList.remove('focus');
    const graded = g.right + g.wrong, acc = graded ? Math.round((g.right / graded) * 100) : 0;
    const c = S().counters, prev = c.rainBest || 0;
    c.rainBest = Math.max(prev, g.score);
    const xp = Math.min(80, g.right * 3);
    if (xp) GT.addXP(xp);
    GT.addTime((Date.now() - g.t0) / 1000);
    GT.track('session', { acc, graded, right: g.right, secs: Math.round((Date.now() - g.t0) / 1000), tag: 'rain', quick: true, bestCombo: g.bestCombo });
    GT.save();
    GT.sfx.done();
    const v = GT.$('#view');
    v.innerHTML = '';
    const record = g.score > prev && prev > 0;
    v.appendChild(h('div.card.rain-over',
      h('div.rain-big', record ? '🏆' : '🌧️'),
      h('h1', g.score.toLocaleString('de-DE') + ' Punkte' + (record ? ' – neuer Rekord!' : '')),
      h('div.kpis',
        h('div.kpi', h('b', g.right), h('span', 'gefangen')),
        h('div.kpi', h('b', acc + ' %'), h('span', 'Genauigkeit')),
        h('div.kpi', h('b', g.bestCombo), h('span', 'beste Serie')),
        h('div.kpi', h('b', '+' + xp), h('span', 'XP'))),
      g.missed.length ? h('div', { style: { marginTop: '18px' } },
        h('h3', '🔁 Diese Wörter sind dir entwischt'),
        h('p.muted', { style: { fontSize: '.9rem' } }, 'Sprich sie einmal laut nach und schau dir ihre Verwandten im Wortnetz an – Verbindungen machen Wörter haftbar.'),
        h('div.flist', g.missed.map(wordRow))) : h('p', '💎 Kein einziges Wort verpasst!'),
      h('div.row', { style: { marginTop: '18px' } },
        h('button.btn.primary.lg', { onclick: () => GT.goto('#/words/spiel/los') }, '↻ Nochmal'),
        h('a.btn.ghost.lg', { href: '#/words/spiel' }, '⚙️ Einstellungen'),
        h('a.btn.ghost.lg', { href: '#/words/liste' }, '🪜 Rangliste'))));
  }

  /* ---------------- Quick start tile ---------------- */
  if (GT.quick) {
    GT.quick.push({ id: 'rain', icon: '🌧️', name: 'Wortregen', time: '≈ 2 Min', desc: 'Arcade-Spiel mit den 500 häufigsten Wörtern', go: '#/words/spiel/los' });
    const startQuick = GT.startQuick;
    GT.startQuick = function (id) {
      const q = GT.quick.find((x) => x.id === id);
      return q && q.go ? go(q.go) : startQuick(id);
    };
  }
})();
