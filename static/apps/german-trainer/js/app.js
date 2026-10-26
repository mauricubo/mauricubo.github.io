/* ==========================================================================
   DeutschWeg – app shell: router + views
   ========================================================================== */
(function () {
  const { h, esc, shuffle, sample, pick } = GT;
  const view = () => GT.$('#view');
  const S = () => GT.state;
  const go = (hash) => { location.hash = hash; };

  /* ---------------- Topbar ---------------- */
  GT.updateTopbar = function () {
    GT.$('#chip-level').textContent = GT.currentLevel();
    GT.$('#chip-level').className = 'chip lvl lvl-' + GT.currentLevel();
    const st = GT.streakAlive();
    GT.$('#chip-streak').textContent = (st ? '🔥 ' : '🩶 ') + st;
    GT.$('#chip-streak').title = st + ' Tage in Folge' + (S().streak.last !== GT.dateKey() ? ' – heute noch lernen!' : '');
    const today = GT.todayXP(), goal = S().profile.goal;
    GT.$('#goal-ring').style.strokeDashoffset = 94.25 * (1 - Math.min(1, today / goal));
    GT.$('#goal-text').textContent = today >= goal ? '✓' : today;
    GT.$('#chip-goal').title = 'Tagesziel: ' + today + ' / ' + goal + ' XP';
    const due = GT.srs.due().length;
    const b = GT.$('#badge-review');
    b.hidden = !due; b.textContent = due > 99 ? '99+' : due;
  };

  /* ---------------- Router ---------------- */
  GT.route = function (force) {
    const hash = location.hash || '#/path';
    if (GT.Session.active()) {
      if (!force) GT.Session.abort();
      else return;
    }
    document.body.classList.remove('focus');
    GT.$('#feedback') && GT.$('#feedback').remove();
    GT.$('#checkbar') && GT.$('#checkbar').remove();
    const parts = hash.replace(/^#\/?/, '').split('/');
    if (!S().onboarded && parts[0] !== 'placement') return V.onboard();
    GT.$$('.nav a').forEach((a) => a.classList.toggle('active', a.dataset.nav === parts[0] || (parts[0] === 'unit' && a.dataset.nav === 'path') || (parts[0] === 'drill' && a.dataset.nav === 'practice')));
    view().innerHTML = '';
    window.scrollTo(0, 0);
    const fn = {
      path: V.path, unit: () => (parts[2] ? V.activity(parts[1], parts[2]) : V.unit(parts[1])), exam: () => V.exam(parts[1]),
      review: V.review, practice: V.practice, drill: () => V.drill(parts[1]), library: () => V.library(parts[1] || 'grammar'),
      stats: V.stats, settings: V.settings, placement: V.placement,
    }[parts[0]] || V.path;
    fn();
    GT.updateTopbar();
  };
  window.addEventListener('hashchange', () => GT.route());

  const V = (GT.views = {});

  /* ---------------- Onboarding ---------------- */
  V.onboard = function () {
    document.body.classList.add('focus');
    let goal = 50;
    const goals = [[20, 'Locker', '≈ 5 Min./Tag'], [50, 'Regelmäßig', '≈ 10–15 Min./Tag'], [100, 'Intensiv', '≈ 25 Min./Tag'], [150, 'Turbo', '≈ 40 Min./Tag']];
    const v = view();
    v.innerHTML = '';
    const step1 = h('div.onboard',
      h('div.big', '🇩🇪'),
      h('h1', 'Willkommen bei DeutschWeg'),
      h('p.muted', 'Dein klarer Weg von A2 bis C2 – mit den Methoden, die in der Lernforschung am besten funktionieren.'),
      h('div.grid.grid-3', { style: { textAlign: 'left', margin: '22px 0' } },
        h('div.card', h('b', '🧠 Wiederholen mit System'), h('p.muted', { style: { margin: 0 } }, 'Spaced Repetition zeigt dir jedes Wort genau dann, bevor du es vergisst.')),
        h('div.card', h('b', '🎯 Aktiv statt passiv'), h('p.muted', { style: { margin: 0 } }, 'Du rufst Wissen ab, schreibst, hörst und sprichst – das verankert es.')),
        h('div.card', h('b', '🗺️ Klarer Lernpfad'), h('p.muted', { style: { margin: 0 } }, '30 Lektionen, jede mit 6 Schritten. Ein Test schaltet die nächste frei.'))),
      h('h3', 'Wie viel Zeit möchtest du täglich investieren?'),
      (function () {
        const wrap = h('div.option-cards');
        goals.forEach(([g, n, d]) => {
          const b = h('button.choice' + (g === goal ? '.sel' : ''), { type: 'button', onclick: () => { goal = g; GT.$$('.choice', wrap).forEach((x) => x.classList.remove('sel')); b.classList.add('sel'); } },
            h('span', h('b', n + ' · ' + g + ' XP'), h('small', d)));
          wrap.appendChild(b);
        });
        return wrap;
      })(),
      h('label.field', { style: { textAlign: 'left' } }, h('span', 'Wie heißt du? (optional)'), h('input#ob-name', { type: 'text', placeholder: 'Vorname' })),
      h('button.btn.primary.lg.block', { onclick: () => { S().profile.goal = goal; S().profile.name = GT.$('#ob-name').value.trim(); step2(); } }, 'Weiter'));
    v.appendChild(step1);

    function step2() {
      v.innerHTML = '';
      v.appendChild(h('div.onboard',
        h('div.big', '🧭'),
        h('h1', 'Wo fängst du an?'),
        h('p.muted', 'Du kannst später jederzeit in frühere Lektionen zurückgehen.'),
        h('div.option-cards',
          h('button.choice', { onclick: () => go('#/placement') }, h('span', h('b', '📋 Einstufungstest (empfohlen)'), h('small', '25 Fragen, ca. 6 Minuten. Wir schalten alles frei, was du schon kannst.'))),
          h('button.choice', { onclick: () => finish('A2') }, h('span', h('b', '🌱 Bei A2 beginnen'), h('small', 'Grundlagen festigen: Perfekt, Dativ, Nebensätze …'))),
          h('div.choice', { style: { cursor: 'default' } }, h('span', { style: { flex: 1 } }, h('b', '🎓 Ich kenne mein Niveau'),
            h('div.row', { style: { marginTop: '8px' } }, GT.LEVELS.map((l) => h('button.btn.small.lvl.lvl-' + l, { onclick: () => finish(l) }, l))))))));
    }
    function finish(level) {
      GT.setStartLevel(level);
      S().onboarded = true; GT.save();
      document.body.classList.remove('focus');
      go('#/path'); GT.route();
      GT.toast(level === 'A2' ? 'Los geht’s! 🚀' : 'Alles bis ' + level + ' freigeschaltet 🚀');
    }
  };

  GT.setStartLevel = function (level) {
    S().startLevel = level;
    const li = GT.LEVELS.indexOf(level);
    GT.units.forEach((u) => { if (GT.LEVELS.indexOf(u.level) < li || (u.level === level && u.n === 1)) S().unlocked[u.id] = true; });
    GT.save();
  };

  /* ---------------- Placement test ---------------- */
  V.placement = function () {
    const items = [];
    GT.LEVELS.forEach((l) => sample(GT.ref.placement.filter((p) => p.lvl === l), 5).forEach((p) => items.push(Object.assign({ kind: 'mc', skill: 'placement', idk: true }, p))));
    GT.Session.start({
      title: 'Einstufungstest', items, requeue: false, mode: 'placement', exitTo: '#/path',
      onFinish(r) {
        const per = {};
        r.log.forEach((x) => { const l = x.item.lvl; per[l] = per[l] || [0, 0]; per[l][1]++; if (x.ok) per[l][0]++; });
        let start = 'A2';
        for (const l of GT.LEVELS) { const [ok, n] = per[l] || [0, 1]; if (ok / n >= 0.8) { const nx = GT.LEVELS[GT.LEVELS.indexOf(l) + 1]; if (nx) start = nx; else start = 'C2'; } else break; }
        GT.setStartLevel(start);
        S().onboarded = true; GT.save();
        return {
          title: 'Dein Startniveau: ' + start,
          text: GT.LEVELS.map((l) => '<span class="pill lvl lvl-' + l + '">' + l + '</span> ' + (per[l] ? per[l][0] + '/' + per[l][1] : '–')).join(' &nbsp; ') +
            '<br><br>Alle Lektionen unter ' + start + ' sind freigeschaltet – zum Auffrischen oder Lücken schließen.',
        };
      },
    });
  };

  /* ---------------- Path (home) ---------------- */
  V.path = function () {
    const v = view();
    const u = GT.currentUnit();
    const due = GT.srs.due().length;
    const act = GT.nextActivity(u);
    const actInfo = GT.ACTIVITIES.find((a) => a.key === act) || GT.ACTIVITIES[0];
    const name = S().profile.name;
    const hour = new Date().getHours();
    const greet = (hour < 11 ? 'Guten Morgen' : hour < 18 ? 'Hallo' : 'Guten Abend') + (name ? ', ' + name : '') + '!';

    const hero = h('div.card.hero',
      h('div',
        h('div.kicker', greet),
        due >= 5
          ? [h('h1', '🔁 ' + due + ' Wiederholungen fällig'), h('p', 'Erst wiederholen, dann Neues lernen – so bleibt alles im Langzeitgedächtnis.')]
          : [h('h1', actInfo.icon + ' ' + actInfo.name + ': ' + u.title), h('p', u.level + ' · Lektion ' + u.n + ' · ' + u.topic)]),
      h('div.row',
        due >= 5 ? h('button.btn.lg', { onclick: () => go('#/review') }, 'Wiederholen') : null,
        h('button.btn.lg', { onclick: () => go('#/unit/' + u.id + (act ? '/' + act : '')), style: due >= 5 ? { background: 'rgba(255,255,255,.2)', color: '#fff' } : null }, due >= 5 ? 'Lektion' : 'Los geht’s →')));
    v.appendChild(hero);

    // Today plan
    const today = GT.todayXP(), goal = S().profile.goal;
    v.appendChild(h('div.grid.grid-3', { style: { marginTop: '16px' } },
      h('div.card', h('small', 'Tagesziel'), h('h2', { style: { margin: '4px 0 8px' } }, today + ' / ' + goal + ' XP'), h('div.progress' + (today >= goal ? '.ok' : ''), h('span', { style: { width: Math.min(100, (today / goal) * 100) + '%' } }))),
      h('div.card', { style: { cursor: 'pointer' }, onclick: () => go('#/review') }, h('small', 'Wiederholungen'), h('h2', { style: { margin: '4px 0 0' } }, due ? due + ' fällig' : 'Alles erledigt ✓'), h('small', 'Spaced Repetition')),
      h('div.card', h('small', 'Serie'), h('h2', { style: { margin: '4px 0 0' } }, '🔥 ' + GT.streakAlive() + ' Tage'), h('small', 'Rekord: ' + S().streak.best))));

    // Levels
    GT.levels.forEach((lvl) => {
      const passed = lvl.units.filter(GT.unitPassed).length;
      const block = h('section.level-block',
        h('div.level-head',
          h('div.level-badge', { style: { background: 'var(--' + lvl.id + ')' } }, lvl.id),
          h('div', { style: { flex: 1 } }, h('h2', lvl.name), h('small', lvl.desc)),
          h('div', { style: { textAlign: 'right' } }, h('small', passed + ' / ' + lvl.units.length), h('div.progress.ok', h('span', { style: { width: (passed / lvl.units.length) * 100 + '%' } })))));
      const grid = h('div.units');
      lvl.units.forEach((un) => {
        const unlocked = GT.isUnlocked(un), done = GT.unitPassed(un), isCur = un === u;
        const prog = GT.unitProgress(un);
        grid.appendChild(h('button.unit-card' + (unlocked ? '' : '.locked') + (done ? '.done' : '') + (isCur ? '.current' : ''), {
          onclick: () => (unlocked ? go('#/unit/' + un.id) : V.lockedDialog(un)),
        },
          h('span.state', done ? '✅' : unlocked ? (isCur ? '▶️' : '') : '🔒'),
          h('span.num', 'Lektion ' + un.n),
          h('h3', un.title),
          h('span.topic', un.topic),
          h('div.pips', GT.ACTIVITIES.map((a, i) => h('i' + (i < prog ? '.on' : ''))))));
      });
      const best = S().exams[lvl.id];
      grid.appendChild(h('button.unit-card.exam-card' + (best >= GT.PASS ? '.done' : ''), { onclick: () => go('#/exam/' + lvl.id) },
        h('div', { style: { fontSize: '1.8rem' } }, best >= GT.PASS ? '🏅' : '🎓'),
        h('h3', lvl.id + '-Prüfung'),
        h('span.topic', best != null ? 'Bestes Ergebnis: ' + best + ' %' : 'Gemischter Test über alle Lektionen. Bestehen = nächstes Niveau frei.')));
      block.appendChild(grid);
      v.appendChild(block);
    });
  };

  V.lockedDialog = function (u) {
    if (confirm('🔒 „' + u.title + '“ ist noch gesperrt.\n\nDu kannst den Abschlusstest dieser Lektion direkt machen. Mit ≥ 80 % springst du hierher.\n\nTest jetzt starten?')) {
      startTest(u, true);
    }
  };

  /* ---------------- Unit overview ---------------- */
  V.unit = function (id) {
    const u = GT.unitById[id];
    if (!u) return go('#/path');
    if (!GT.isUnlocked(u)) { go('#/path'); return V.lockedDialog(u); }
    const st = GT.unitState(u.id);
    const next = GT.nextActivity(u);
    const v = view();
    v.appendChild(h('a.back', { href: '#/path' }, '← Lernpfad'));
    v.appendChild(h('div.unit-head',
      h('div.level-badge', { style: { background: 'var(--' + u.level + ')' } }, u.level),
      h('div', h('small', 'Lektion ' + u.n + ' · ' + u.topic), h('h1', { style: { margin: '2px 0' } }, u.title), h('small', '📘 ' + u.grammar.title + ' · 🗂️ ' + u.vocab.length + ' Wörter'))));
    const acts = h('div.acts');
    GT.ACTIVITIES.forEach((a, i) => {
      const done = a.key === 'test' ? (st.test || 0) >= GT.PASS : st[a.key];
      const sub = a.key === 'test' && st.test != null ? 'Bestes Ergebnis: ' + st.test + ' %' : a.desc;
      acts.appendChild(h('button.act' + (done ? '.done' : '') + (a.key === next ? '.next' : ''), { onclick: () => go('#/unit/' + u.id + '/' + a.key) },
        h('span.ai', done ? '✅' : a.icon),
        h('span', h('small', 'Schritt ' + (i + 1)), h('b', a.name), h('small.muted', sub))));
    });
    v.appendChild(acts);
    v.appendChild(h('div.card', { style: { marginTop: '20px' } },
      h('h3', '💡 So lernst du am effektivsten'),
      h('p.muted', { style: { margin: 0 } }, 'Folge den Schritten in Reihenfolge. Fehler sind gut: Alles, was du falsch beantwortest, kommt automatisch in deine Wiederholungen. Bestehe den Abschlusstest mit ≥ 80 %, um die nächste Lektion freizuschalten.')));
  };

  V.activity = function (id, key) {
    const u = GT.unitById[id];
    if (!u || !GT.isUnlocked(u)) return go('#/path');
    ({ learn: V.learn, practice: startPractice, read: V.read, listen: startListen, write: V.write, test: (x) => startTest(x, false) }[key] || V.unit)(u);
  };

  function markDone(u, key, xp) {
    const st = GT.unitState(u.id);
    if (!st[key]) { st[key] = true; if (xp) GT.addXP(xp); }
    GT.save();
  }
  const unitVocab = (u) => u.vocab.map((_, i) => GT.vocabById['v:' + u.id + ':' + i]);

  /* ---------------- Learn: grammar + vocab ---------------- */
  GT.renderGrammar = function (g) {
    const box = h('div.prose');
    if (g.intro) box.appendChild(h('div', { html: g.intro }));
    if (g.table) box.appendChild(h('div.table-wrap', h('table', h('thead', h('tr', g.table[0].map((c) => h('th', { html: c })))), h('tbody', g.table.slice(1).map((r) => h('tr', r.map((c) => h('td', { html: c }))))))));
    if (g.points) box.appendChild(h('ul', g.points.map((p) => h('li', { html: p }))));
    if (g.examples) box.appendChild(h('div.examples', g.examples.map(([de, en]) => h('div.example', GT.speakBtn(de), h('div', h('span.say', { onclick: () => GT.speech.say(de) }, de), GT.state.settings.english ? h('small.muted', en) : null)))));
    if (g.tip) box.appendChild(h('div.tip', { html: '💡 ' + g.tip }));
    return box;
  };
  GT.vocabRow = function (v) {
    return h('div.vocab-item', GT.speakBtn(v.de),
      h('div', h('div.w', { html: GT.deHtml(v.de) }), h('div', v.en), v.ex ? h('div.ex', h('span.say', { onclick: () => GT.speech.say(v.ex) }, v.ex)) : null),
      h('span.status-dot.' + GT.srs.status(v.id), { title: { new: 'neu', learning: 'in Arbeit', known: 'gefestigt' }[GT.srs.status(v.id)] }));
  };

  V.learn = function (u) {
    const v = view();
    v.appendChild(h('a.back', { href: '#/unit/' + u.id }, '← ' + u.title));
    v.appendChild(h('h1', '📖 ' + u.grammar.title));
    v.appendChild(h('div.card', GT.renderGrammar(u.grammar)));
    v.appendChild(h('div.section-title', h('h2', '🗂️ Wortschatz'), h('button.btn.small.ghost', { onclick: () => playAll(unitVocab(u).map((x) => x.de)) }, '▶ Alle anhören')));
    v.appendChild(h('div.vocab-list', unitVocab(u).map(GT.vocabRow)));
    v.appendChild(h('p.muted', { style: { marginTop: '14px' } }, 'Tipp: Lies jedes Beispiel laut. Nomen immer mit Artikel lernen – die Farben helfen: der = blau, die = rot, das = grün.'));
    v.appendChild(h('div.row', { style: { marginTop: '20px', justifyContent: 'flex-end' } },
      h('button.btn.primary.lg', { onclick: () => { markDone(u, 'learn', 5); go('#/unit/' + u.id + '/practice'); } }, 'Verstanden – jetzt üben →')));
  };
  function playAll(list) {
    let i = 0;
    const next = () => { if (i < list.length) GT.speech.say(list[i++], { onend: () => setTimeout(next, 350) }); };
    next();
  }

  /* ---------------- Practice session ---------------- */
  function startPractice(u) {
    const words = unitVocab(u);
    const pool = GT.allVocab.filter((x) => x.unit.level === u.level);
    const fresh = words.filter((w) => !GT.state.cards[w.id]);
    const ex = u.exercises.map((_, i) => i);
    const items = [];
    const chunks = [];
    for (let i = 0; i < words.length; i += 4) chunks.push(words.slice(i, i + 4));
    const per = Math.ceil(ex.length / Math.max(1, chunks.length));
    chunks.forEach((ch, ci) => {
      ch.forEach((w) => items.push(fresh.includes(w) ? GT.items.intro(w) : GT.items.vmc(w, pool)));
      if (ch.length >= 3) items.push(GT.items.match(ch));
      else ch.forEach((w) => items.push(GT.items.vmc(w, pool)));
      ex.slice(ci * per, ci * per + per).forEach((i) => items.push(GT.items.fromExercise(u, i)));
    });
    sample(words, 3).forEach((w) => items.push(GT.items.vtype(w)));
    sample(words.filter((w) => GT.genderOf(w.de)), 2).forEach((w) => items.push(GT.items.gender(w)));
    const exs = words.filter((w) => w.ex);
    if (exs.length && GT.speech.available()) { const w = pick(exs); items.push(GT.items.listen(w.ex, '')); }
    GT.Session.start({
      title: u.title, items, exitTo: '#/unit/' + u.id,
      onFinish(r) {
        words.forEach((w) => { const c = GT.srs.ensure(w.id, 1); c.s = Math.max(c.s, 1); });
        markDone(u, 'practice', 10);
        return { text: r.acc >= 80 ? 'Die Wörter sind jetzt in deinem Wiederholungsplan.' : 'Wiederhole die Übung oder mach weiter – Fehler kommen in die Wiederholung.', actions: [h('button.btn.ghost.lg', { onclick: () => startPractice(u) }, '↻ Nochmal')] };
      },
    });
  }

  /* ---------------- Listening & speaking ---------------- */
  function startListen(u) {
    const words = unitVocab(u);
    const items = [];
    if (!GT.speech.available()) { GT.toast('Dein Browser unterstützt keine Sprachausgabe 😕'); return go('#/unit/' + u.id); }
    sample(words, 3).forEach((w) => items.push(GT.items.vlisten(w, GT.allVocab.filter((x) => x.unit.level === u.level))));
    sample(words.filter((w) => w.ex), 3).forEach((w) => items.push(GT.items.listen(w.ex)));
    (u.speaking || []).forEach((s) => items.push(GT.items.speak(s)));
    GT.Session.start({ title: 'Hören & Sprechen', items, exitTo: '#/unit/' + u.id, onFinish: () => { markDone(u, 'listen', 10); return { text: 'Shadowing verbessert Aussprache, Rhythmus und Hörverstehen gleichzeitig.' }; } });
  }

  /* ---------------- Unit test ---------------- */
  function testItems(u, nEx, nVoc) {
    const words = unitVocab(u);
    const items = sample(u.exercises.map((_, i) => i), nEx).map((i) => GT.items.fromExercise(u, i));
    sample(words, nVoc).forEach((w) => items.push(GT.items.vtype(w)));
    return items;
  }
  function startTest(u, testOut) {
    const items = shuffle(testItems(u, 12, 4).concat(sample(unitVocab(u).filter((w) => GT.genderOf(w.de)), 2).map(GT.items.gender)));
    GT.Session.start({
      title: 'Abschlusstest', items, requeue: false, mode: 'test', exitTo: testOut ? '#/path' : '#/unit/' + u.id,
      onFinish(r) {
        const st = GT.unitState(u.id);
        const prev = st.test || 0;
        st.test = Math.max(prev, r.acc);
        const pass = r.acc >= GT.PASS;
        if (pass) {
          S().unlocked[u.id] = true;
          if (prev < GT.PASS) GT.addXP(25);
          unitVocab(u).forEach((w) => GT.srs.ensure(w.id, 2));
        }
        GT.save();
        const nx = GT.units[u.idx + 1];
        return pass ? {
          title: '🎉 Bestanden mit ' + r.acc + ' %!',
          text: nx ? 'Neue Lektion freigeschaltet: <b>' + esc(nx.title) + '</b>' : 'Du hast den gesamten Lernpfad abgeschlossen. Herzlichen Glückwunsch! 🏆',
          actions: nx ? [h('button.btn.ok.lg', { onclick: () => go('#/unit/' + nx.id) }, 'Nächste Lektion →')] : null,
        } : {
          title: r.acc + ' % – noch nicht ganz',
          text: 'Du brauchst ' + GT.PASS + ' %. Wiederhole die Übungen dieser Lektion und versuch es nochmal – deine Fehler findest du unten.',
          actions: [h('button.btn.ghost.lg', { onclick: () => go('#/unit/' + u.id + '/practice') }, '🧠 Nochmal üben')],
        };
      },
    });
  }

  /* ---------------- Level exam ---------------- */
  V.exam = function (lvlId) {
    const lvl = GT.levelById(lvlId);
    if (!lvl) return go('#/path');
    const v = view();
    const best = S().exams[lvlId];
    v.appendChild(h('a.back', { href: '#/path' }, '← Lernpfad'));
    v.appendChild(h('div.card', { style: { textAlign: 'center' } },
      h('div', { style: { fontSize: '3rem' } }, '🎓'),
      h('h1', lvl.id + '-Prüfung'),
      h('p', 'Ca. ' + lvl.units.length * 4 + ' gemischte Aufgaben aus allen Lektionen dieses Niveaus. Mit ≥ ' + GT.PASS + ' % gilt das Niveau als bestanden und das nächste wird freigeschaltet.'),
      best != null ? h('p.muted', 'Bestes Ergebnis: ' + best + ' %') : null,
      h('button.btn.primary.lg', { onclick: () => {
        let items = [];
        lvl.units.forEach((u) => (items = items.concat(testItems(u, 3, 1))));
        GT.Session.start({
          title: lvl.id + '-Prüfung', items: shuffle(items), requeue: false, mode: 'test', exitTo: '#/path',
          onFinish(r) {
            S().exams[lvlId] = Math.max(S().exams[lvlId] || 0, r.acc);
            const pass = r.acc >= GT.PASS;
            if (pass) {
              lvl.units.forEach((u) => (S().unlocked[u.id] = true));
              const ni = GT.LEVELS.indexOf(lvlId) + 1;
              if (ni < GT.LEVELS.length) {
                const nl = GT.LEVELS[ni];
                if (GT.LEVELS.indexOf(S().startLevel) < ni) GT.setStartLevel(nl);
              }
              GT.addXP(50);
            }
            GT.save();
            return pass ? { title: '🏅 ' + lvlId + ' bestanden: ' + r.acc + ' %', text: 'Ausgezeichnet! Das nächste Niveau ist freigeschaltet.' } : { title: r.acc + ' %', text: 'Für das Bestehen brauchst du ' + GT.PASS + ' %. Arbeite die Lektionen durch und versuch es erneut.' };
          },
        });
      } }, 'Prüfung starten')));
  };

  /* ---------------- Reading ---------------- */
  V.read = function (u) {
    const r = u.reading;
    const v = view();
    v.appendChild(h('a.back', { href: '#/unit/' + u.id }, '← ' + u.title));
    v.appendChild(h('div.row', h('h1', { style: { margin: 0 } }, '📰 ' + r.title), h('span.spacer'),
      h('button.btn.small.ghost', { onclick: () => readAloud(GT.$$('.sent', v)) }, '▶ Vorlesen'),
      h('button.btn.small.ghost', { onclick: () => speechSynthesis.cancel() }, '■ Stopp')));
    v.appendChild(h('p.muted', 'Tippe auf einen Satz, um ihn zu hören. Unterstrichene Wörter: tippe/zeige darauf für die Übersetzung.'));
    // glossary from all vocab up to this level
    const gl = [];
    GT.allVocab.forEach((x) => { if (GT.LEVELS.indexOf(x.unit.level) <= GT.LEVELS.indexOf(u.level)) { const w = GT.stripArticle(x.de).replace(/\s*\(.*?\)/, ''); if (!/[\s.!?,]/.test(w) && w.length > 3) gl.push([w, x.en]); } });
    const glMap = new Map(gl.map(([w, en]) => [w.toLowerCase(), en]));
    const glossify = (s) => esc(s).replace(/[\p{L}]+/gu, (w) => { const en = glMap.get(w.toLowerCase()); return en ? '<span class="gloss" title="' + esc(en) + '">' + w + '</span>' : w; });
    const text = h('div.card.reading-text');
    r.text.split(/\n\n+/).forEach((para) => {
      const p = h('p');
      (para.match(/[^.!?]+[.!?]+[“”"]?\s*|[^.!?]+$/g) || [para]).forEach((s) => {
        p.appendChild(h('span.sent', { html: glossify(s), onclick: (e) => { if (e.target.classList.contains('gloss')) return GT.toast(e.target.textContent + ' = ' + e.target.title); GT.speech.say(s); } }));
      });
      text.appendChild(p);
    });
    v.appendChild(text);
    v.appendChild(h('h2', { style: { marginTop: '24px' } }, '❓ Verständnisfragen'));
    let answered = 0, correct = 0;
    r.questions.forEach((q, qi) => {
      const box = h('div.card');
      box.appendChild(h('p', h('b', (qi + 1) + '. ' + q.q)));
      const ch = h('div.choices');
      q.o.forEach((o, oi) => ch.appendChild(h('button.choice', { onclick: (e) => {
        if (box.dataset.done) return;
        box.dataset.done = 1; answered++;
        const ok = oi === q.a;
        if (ok) { correct++; GT.addXP(5); GT.sfx.ok(); } else GT.sfx.bad();
        GT.logSkill('reading', ok);
        e.currentTarget.classList.add(ok ? 'right' : 'wrong');
        ch.children[q.a].classList.add('right');
        if (q.e) box.appendChild(h('p.muted', { style: { marginTop: '10px' } }, '💡 ' + q.e));
        if (answered === r.questions.length) {
          markDone(u, 'read', 10);
          v.appendChild(h('div.card', { style: { textAlign: 'center' } }, h('h2', correct + ' / ' + r.questions.length + ' richtig'),
            h('p.muted', 'Tipp: Lies den Text morgen noch einmal laut – wiederholtes Lesen verbessert Flüssigkeit und Wortschatz.'),
            h('button.btn.primary', { onclick: () => go('#/unit/' + u.id) }, 'Zurück zur Lektion')));
        }
      } }, h('span.k', String.fromCharCode(65 + oi)), h('span', o))));
      box.appendChild(ch);
      v.appendChild(box);
    });
  };
  function readAloud(spans) {
    let i = 0;
    const next = () => {
      GT.$$('.sent.playing').forEach((s) => s.classList.remove('playing'));
      if (i >= spans.length) return;
      const s = spans[i++]; s.classList.add('playing');
      GT.speech.say(s.textContent, { onend: next });
    };
    next();
  }

  /* ---------------- Writing ---------------- */
  V.write = function (u) {
    const w = u.writing;
    const st = GT.unitState(u.id);
    const v = view();
    v.appendChild(h('a.back', { href: '#/unit/' + u.id }, '← ' + u.title));
    v.appendChild(h('h1', '✍️ Schreiben'));
    v.appendChild(h('div.card', h('p', { html: '<b>Aufgabe:</b> ' + esc(w.prompt) }), w.en && S().settings.english ? h('p.muted', w.en) : null, h('small', 'Umfang: ' + w.words + ' Wörter')));
    const checks = (w.check || []).map((c) => ({ label: c[0], re: c[1] ? GT.uRe(c[1]) : null, n: c[2] || 1 }));
    const list = h('ul.checklist');
    checks.forEach((c) => { c.el = h('li', h('span.dot', '✓'), h('span', c.label + (c.re ? '' : ' (selbst prüfen)'))); list.appendChild(c.el); if (!c.re) c.el.onclick = () => c.el.classList.toggle('met'); });
    const ta = h('textarea', { placeholder: 'Schreib hier deinen Text…', lang: 'de', spellcheck: 'false' });
    ta.value = st.writing || '';
    const count = h('small');
    const update = () => {
      const t = ta.value;
      const n = (t.match(/[\p{L}\d]+/gu) || []).length;
      count.textContent = n + ' Wörter';
      checks.forEach((c) => { if (c.re) c.el.classList.toggle('met', (t.match(c.re) || []).length >= c.n); });
      st.writing = t; GT.save();
    };
    ta.addEventListener('input', update);
    const um = h('div.umlauts', ['ä', 'ö', 'ü', 'ß', 'Ä', 'Ö', 'Ü', '„', '“'].map((c) => h('button', { type: 'button', onclick: () => { const s = ta.selectionStart; ta.setRangeText(c, s, ta.selectionEnd, 'end'); ta.focus(); update(); } }, c)));
    v.appendChild(h('div.card', h('h3', 'Checkliste'), list, ta, h('div.row', um, h('span.spacer'), count)));
    const model = h('div.card', { hidden: true }, h('h3', '📄 Mustertext'), h('div.model', w.model), h('div.row', { style: { marginTop: '10px' } }, GT.speakBtn(w.model), h('small.muted', 'Vergleiche: Welche Strukturen kannst du übernehmen? Schreib 1–2 Sätze daraus in dein Notizbuch.')),
      h('h3', { style: { marginTop: '18px' } }, 'Wie zufrieden bist du mit deinem Text?'),
      h('div.row', [['😀 Sehr', 20], ['🙂 Okay', 15], ['😕 Unsicher', 10]].map(([l, xp]) => h('button.btn.ghost', { onclick: () => { markDone(u, 'write', xp); GT.toast('+' + xp + ' XP – gespeichert'); go('#/unit/' + u.id); } }, l))));
    v.appendChild(h('div.row', { style: { marginTop: '16px', justifyContent: 'flex-end' } },
      h('button.btn.primary.lg', { onclick: (e) => {
        const n = (ta.value.match(/[\p{L}\d]+/gu) || []).length;
        if (n < 15 && !confirm('Dein Text ist sehr kurz. Trotzdem den Mustertext anzeigen?')) return;
        model.hidden = false; e.currentTarget.hidden = true; model.scrollIntoView({ behavior: 'smooth' });
      } }, 'Fertig – Mustertext zeigen')));
    v.appendChild(model);
    v.appendChild(h('p.muted', { style: { marginTop: '14px' } }, '💡 Tipp: Lass deinen Text von einer Muttersprachlerin, einem Tandempartner oder einer KI korrigieren und schreib die korrigierte Version noch einmal ab – das ist eine der effektivsten Schreibübungen.'));
    update();
  };

  /* ---------------- Review (SRS) ---------------- */
  V.review = function () {
    const v = view();
    const due = GT.srs.due();
    const cards = Object.keys(S().cards).filter(GT.srs.valid);
    v.appendChild(h('h1', '🔁 Wiederholen'));
    v.appendChild(h('p.muted', 'Spaced Repetition: Jede richtige Antwort verlängert den Abstand bis zur nächsten Wiederholung (1 → 6 → 15 → 40 Tage …). Fehler kommen schnell wieder.'));
    if (!cards.length) {
      v.appendChild(h('div.card.empty', h('div.big', '🌱'), h('h2', 'Noch keine Karten'), h('p.muted', 'Schließe die Übung einer Lektion ab – dann landen die Wörter hier.'), h('button.btn.primary', { onclick: () => go('#/path') }, 'Zum Lernpfad')));
      return;
    }
    const vd = due.filter((x) => x.startsWith('v:')).length, xd = due.length - vd;
    if (due.length) {
      v.appendChild(h('div.card.hero',
        h('div', h('div.kicker', 'Heute fällig'), h('h1', due.length + ' Karten'), h('p', vd + ' Wörter · ' + xd + ' Fehler aus Übungen')),
        h('button.btn.lg', { onclick: () => startReview(due.slice(0, 25)) }, due.length > 25 ? '25 wiederholen' : 'Starten')));
    } else {
      const nd = GT.srs.nextDue();
      const hrs = Math.max(1, Math.round((nd - Date.now()) / 3600000));
      v.appendChild(h('div.card.empty', h('div.big', '🎉'), h('h2', 'Alles erledigt!'), h('p.muted', 'Nächste Wiederholung in ' + (hrs < 24 ? hrs + ' Std.' : Math.round(hrs / 24) + ' Tagen') + '.')));
    }
    // forecast
    const days = Array.from({ length: 7 }, (_, i) => GT.startOfDay() + (i + 1) * GT.DAY);
    const counts = days.map((d) => cards.filter((id) => S().cards[id].d > d - GT.DAY && S().cards[id].d <= d && S().cards[id].d > Date.now()).length);
    const max = Math.max(1, ...counts);
    v.appendChild(h('div.card', h('h3', 'Vorschau: nächste 7 Tage'),
      h('div.bars', counts.map((c, i) => h('div.bar', h('small', c), h('i', { style: { height: (c / max) * 100 + '%' } }), h('small', new Date(days[i] - 1).toLocaleDateString('de-DE', { weekday: 'short' })))))));
    const learnt = cards.filter((id) => id.startsWith('v:'));
    const known = learnt.filter((id) => GT.srs.status(id) === 'known').length;
    v.appendChild(h('div.grid.grid-2', { style: { marginTop: '16px' } },
      h('div.card', h('h3', '⚡ Blitzrunde'), h('p.muted', '15 zufällige Wörter, die du schon gelernt hast – auch wenn sie nicht fällig sind.'), h('button.btn', { onclick: () => startReview(sample(learnt, 15), true) }, 'Starten')),
      h('div.card', h('h3', '📊 Dein Wortschatz'), h('p', h('b', learnt.length), ' Wörter im System · ', h('b', known), ' gefestigt (≥ 21 Tage)'), h('a', { href: '#/library/vocab' }, 'Alle Wörter ansehen →'))));
  };
  function startReview(ids, cram) {
    const items = ids.map((id) => {
      const it = GT.items.forCard(id);
      if (cram) delete it.srs;
      return it;
    });
    GT.Session.start({ title: 'Wiederholung', items: shuffle(items), exitTo: '#/review', onFinish: () => ({ text: cram ? 'Blitzrunde beendet.' : 'Die Intervalle wurden angepasst. Komm morgen wieder! 📅' }) });
  }

  /* ---------------- Practice hub ---------------- */
  V.practice = function () {
    const v = view();
    v.appendChild(h('h1', '🏋️ Training'));
    v.appendChild(h('p.muted', 'Gezielte Drills für die typischen Stolpersteine des Deutschen. Unbegrenzt – jede Runde ist neu generiert.'));
    const grid = h('div.grid.grid-2');
    const mistakes = Object.keys(S().cards).filter((id) => id.startsWith('x:') && GT.srs.valid(id));
    grid.appendChild(h('div.card', h('h3', '🎯 Fehler-Training'), h('p.muted', 'Alle Aufgaben, die du in Lektionen falsch beantwortet hast (' + mistakes.length + ').'),
      h('button.btn' + (mistakes.length ? '.primary' : ''), { disabled: !mistakes.length, onclick: () => GT.Session.start({ title: 'Fehler-Training', items: shuffle(mistakes).slice(0, 15).map(GT.items.forCard), exitTo: '#/practice' }) }, 'Starten')));
    GT.drills.catalogue.forEach((d) => {
      grid.appendChild(h('div.card', h('h3', d.icon + ' ' + d.name), h('p.muted', d.desc),
        h('button.btn.primary', { onclick: () => go('#/drill/' + d.id), disabled: d.needsSpeech && !GT.speech.available() }, 'Starten')));
    });
    v.appendChild(grid);
  };
  V.drill = function (id) {
    const d = GT.drills.catalogue.find((x) => x.id === id);
    if (!d) return go('#/practice');
    const items = d.make(12).filter(Boolean);
    if (!items.length) { GT.toast('Noch keine Inhalte – schalte zuerst Lektionen frei.'); return go('#/practice'); }
    GT.Session.start({ title: d.name, items, exitTo: '#/practice', onFinish: () => ({ actions: [h('button.btn.ghost.lg', { onclick: () => V.drill(id) }, '↻ Neue Runde')] }) });
  };

  /* ---------------- Library ---------------- */
  V.library = function (tab) {
    const v = view();
    v.appendChild(h('h1', '📚 Bibliothek'));
    const tabs = [['grammar', 'Grammatik'], ['vocab', 'Wortschatz'], ['reference', 'Tabellen'], ['method', 'Methode & Tipps']];
    v.appendChild(h('div.tabs', tabs.map(([k, n]) => h('button' + (k === tab ? '.active' : ''), { onclick: () => go('#/library/' + k) }, n))));
    const body = h('div');
    v.appendChild(body);
    ({ grammar: libGrammar, vocab: libVocab, reference: libReference, method: libMethod }[tab] || libGrammar)(body);
  };
  function libGrammar(body) {
    const q = h('input', { type: 'search', placeholder: 'Grammatik suchen… (z. B. Konjunktiv, Passiv, Relativsatz)' });
    const list = h('div', { style: { marginTop: '14px' } });
    body.appendChild(q); body.appendChild(list);
    const render = () => {
      list.innerHTML = '';
      const s = q.value.toLowerCase();
      GT.levels.forEach((lvl) => {
        const us = lvl.units.filter((u) => !s || (u.grammar.title + u.title + u.topic + (u.grammar.intro || '')).toLowerCase().includes(s));
        if (!us.length) return;
        list.appendChild(h('h3', { style: { marginTop: '18px' } }, h('span.pill.lvl.lvl-' + lvl.id, lvl.id), ' ', lvl.name));
        us.forEach((u) => {
          const d = h('details.acc', h('summary', h('span', u.grammar.title), h('small.muted', '· ' + u.title)));
          d.addEventListener('toggle', () => { if (d.open && !d.dataset.r) { d.dataset.r = 1; d.appendChild(h('div.acc-body', GT.renderGrammar(u.grammar))); } }, { once: false });
          list.appendChild(d);
        });
      });
    };
    q.addEventListener('input', render);
    render();
  }
  function libVocab(body) {
    const q = h('input', { type: 'search', placeholder: 'Wort suchen (Deutsch oder Englisch)…' });
    const filt = h('select', { style: { maxWidth: '200px' } }, h('option', { value: '' }, 'Alle Niveaus'), GT.LEVELS.map((l) => h('option', { value: l }, l)));
    const st = h('select', { style: { maxWidth: '200px' } }, h('option', { value: '' }, 'Jeder Status'), h('option', { value: 'new' }, 'Neu'), h('option', { value: 'learning' }, 'In Arbeit'), h('option', { value: 'known' }, 'Gefestigt'));
    const list = h('div.vocab-list', { style: { marginTop: '14px' } });
    const info = h('small.muted');
    body.appendChild(h('div.row', h('div', { style: { flex: '2 1 260px' } }, q), filt, st));
    body.appendChild(h('div', { style: { marginTop: '8px' } }, info));
    body.appendChild(list);
    const render = () => {
      const s = q.value.toLowerCase();
      const res = GT.allVocab.filter((x) => (!filt.value || x.unit.level === filt.value) && (!st.value || GT.srs.status(x.id) === st.value) && (!s || (x.de + ' ' + x.en).toLowerCase().includes(s)));
      info.textContent = res.length + ' Wörter · Punkt: grau = neu, orange = in Arbeit, grün = gefestigt';
      list.innerHTML = '';
      res.slice(0, 300).forEach((x) => list.appendChild(GT.vocabRow(x)));
    };
    [q, filt, st].forEach((e) => e.addEventListener('input', render));
    render();
  }
  function libReference(body) {
    const T = GT.drills.tables;
    const cases = ['Nominativ', 'Akkusativ', 'Dativ', 'Genitiv'];
    const tbl = (title, rows, head) => h('div.card', h('h3', title), h('div.table-wrap', h('table', { class: 'prose' }, h('thead', h('tr', head.map((x) => h('th', x)))), h('tbody', rows.map((r) => h('tr', r.map((c) => h('td', { html: c }))))))));
    const decl = (endings, arts, label) => cases.map((c, i) => [c].concat(['m', 'f', 'n', 'pl'].map((g) => (arts ? arts[g][i] + ' ' : '') + 'gut<b>-' + endings[g][i] + '</b>')));
    const head = ['', 'maskulin', 'feminin', 'neutral', 'Plural'];
    body.appendChild(h('div.tip', { html: 'Faustregel Adjektivendungen: <b>Zeigt der Artikel den Kasus schon klar, reicht -e/-en.</b> Fehlt diese Information (kein Artikel, oder „ein“ ohne Endung), übernimmt das Adjektiv die Endung des bestimmten Artikels (der → -er, das → -es, dem → -em …).' }));
    body.appendChild(tbl('Bestimmter Artikel → schwache Deklination', decl(T.WEAK, T.DEF), head));
    body.appendChild(tbl('ein / kein / mein → gemischte Deklination', decl(T.MIXED, T.INDEF), head));
    body.appendChild(tbl('Ohne Artikel → starke Deklination', decl(T.STRONG, null), head));
    const P = GT.ref.preps;
    const byCase = (c) => P.filter((p) => p[1] === c).map((p) => '<b>' + p[0] + '</b>').join(', ');
    body.appendChild(tbl('Präpositionen nach Kasus', [['Akkusativ', byCase('A')], ['Dativ', byCase('D')], ['Wechsel (Wo? → Dat. / Wohin? → Akk.)', byCase('W')], ['Genitiv', byCase('G')]], ['Kasus', 'Präpositionen']));
    body.appendChild(tbl('Genus-Regeln (Faustregeln)', GT.ref.genderRules, ['Artikel', 'Typisch für']));
    body.appendChild(tbl('Starke & unregelmäßige Verben (' + GT.ref.verbs.length + ')', GT.ref.verbs.map((x) => ['<b>' + x[0] + '</b>', x[1], x[2], x[3], '<small>' + x[4] + '</small>']), ['Infinitiv', 'er (Präsens)', 'Präteritum', 'Perfekt', 'Bedeutung']));
  }
  function libMethod(body) {
    body.appendChild(h('div.card.prose', { html: GT.ref.method }));
  }

  /* ---------------- Stats ---------------- */
  V.stats = function () {
    const v = view();
    const s = S();
    const vocabCards = Object.keys(s.cards).filter((id) => id.startsWith('v:') && GT.vocabById[id]);
    const known = vocabCards.filter((id) => GT.srs.status(id) === 'known').length;
    const passed = GT.units.filter(GT.unitPassed).length;
    const tot = Object.values(s.skills).reduce((a, b) => [a[0] + b.ok, a[1] + b.n], [0, 0]);
    const mins = Math.round(Object.values(s.minutes).reduce((a, b) => a + b, 0) / 60);
    v.appendChild(h('h1', '📈 Fortschritt'));
    v.appendChild(h('div.kpis',
      h('div.kpi', h('b', s.xp), h('span', 'XP gesamt')),
      h('div.kpi', h('b', '🔥 ' + GT.streakAlive()), h('span', 'Serie · Rekord ' + s.streak.best)),
      h('div.kpi', h('b', vocabCards.length), h('span', 'Wörter gelernt')),
      h('div.kpi', h('b', known), h('span', 'Wörter gefestigt')),
      h('div.kpi', h('b', passed + '/' + GT.units.length), h('span', 'Lektionen bestanden')),
      h('div.kpi', h('b', (tot[1] ? Math.round((tot[0] / tot[1]) * 100) : 0) + ' %'), h('span', 'Genauigkeit')),
      h('div.kpi', h('b', mins), h('span', 'Minuten in Übungen'))));
    // last 14 days
    const days = Array.from({ length: 14 }, (_, i) => GT.dateKey(Date.now() - (13 - i) * GT.DAY));
    const vals = days.map((d) => s.xpLog[d] || 0);
    const max = Math.max(s.profile.goal, ...vals);
    v.appendChild(h('div.card', { style: { marginTop: '16px' } }, h('h3', 'XP der letzten 14 Tage'),
      h('div.bars', vals.map((x, i) => h('div.bar', h('small', x || ''), h('i' + (x >= s.profile.goal ? '.met' : ''), { style: { height: (x / max) * 100 + '%' } }), h('small', days[i].slice(8)))))));
    // skills
    const names = { vocab: 'Wortschatz', grammar: 'Grammatik', gender: 'Artikel', listening: 'Hören', speaking: 'Sprechen', reading: 'Lesen', adjective: 'Adjektive', verbs: 'Verben', prepositions: 'Präpositionen', wordorder: 'Satzbau' };
    const sk = Object.keys(names).filter((k) => s.skills[k]);
    v.appendChild(h('div.card', h('h3', 'Fertigkeiten (Genauigkeit)'),
      sk.length ? sk.map((k) => { const p = Math.round((s.skills[k].ok / s.skills[k].n) * 100); return h('div.skill-row', h('span', names[k]), h('div.progress' + (p >= 80 ? '.ok' : ''), h('span', { style: { width: p + '%' } })), h('b', p + '%')); })
        : h('p.muted', 'Noch keine Daten – starte eine Übung!'),
      sk.length ? h('p.muted', { style: { marginTop: '10px' } }, 'Unter 70 %? Nutze das passende Training unter „Training“.') : null));
    // levels
    v.appendChild(h('div.card', h('h3', 'Niveaus'), GT.levels.map((l) => {
      const p = l.units.filter(GT.unitPassed).length / l.units.length * 100;
      return h('div.skill-row', h('span', h('span.pill.lvl.lvl-' + l.id, l.id), S().exams[l.id] >= GT.PASS ? ' 🏅' : ''), h('div.progress.ok', h('span', { style: { width: p + '%' } })), h('b', Math.round(p) + '%'));
    })));
  };

  /* ---------------- Settings ---------------- */
  V.settings = function () {
    const v = view(), s = S();
    const save = () => { GT.save(); GT.applyTheme(); GT.updateTopbar(); };
    v.appendChild(h('h1', '⚙️ Einstellungen'));
    const voices = GT.speech.voices;
    v.appendChild(h('div.card',
      h('label.field', h('span', 'Name'), h('input', { type: 'text', value: s.profile.name, oninput: (e) => { s.profile.name = e.target.value; save(); } })),
      h('label.field', h('span', 'Tagesziel'), h('select', { onchange: (e) => { s.profile.goal = +e.target.value; save(); } },
        [20, 50, 100, 150, 250].map((g) => h('option', { value: g, selected: g === s.profile.goal }, g + ' XP')))),
      h('label.field', h('span', 'Design'), h('select', { onchange: (e) => { s.settings.theme = e.target.value; save(); } },
        [['auto', 'Automatisch'], ['light', 'Hell'], ['dark', 'Dunkel']].map(([k, n]) => h('option', { value: k, selected: k === s.settings.theme }, n)))),
      toggle('Englische Übersetzungen anzeigen', 'english'),
      toggle('Soundeffekte', 'sound'),
      toggle('Lösungssatz automatisch vorlesen', 'autoplay')));
    v.appendChild(h('div.card',
      h('h3', '🔊 Sprachausgabe'),
      voices.length ? h('label.field', h('span', 'Stimme'), h('select', { onchange: (e) => { s.settings.voice = e.target.value; save(); GT.speech.say('Hallo! So klinge ich.'); } },
        h('option', { value: '' }, 'Automatisch (beste verfügbare)'), voices.map((vo) => h('option', { value: vo.name, selected: vo.name === s.settings.voice }, vo.name + ' (' + vo.lang + ')'))))
        : h('p.muted', 'Keine deutsche Stimme gefunden. Installiere eine deutsche Stimme in deinem Betriebssystem oder nutze Chrome/Edge.'),
      h('label.field', h('span', 'Tempo: ', h('b#rate-v', s.settings.rate.toFixed(2) + '×')),
        h('input', { type: 'range', min: '0.5', max: '1.3', step: '0.05', value: s.settings.rate, style: { padding: 0 }, oninput: (e) => { s.settings.rate = +e.target.value; GT.$('#rate-v').textContent = s.settings.rate.toFixed(2) + '×'; save(); } })),
      h('button.btn.small', { onclick: () => GT.speech.say('Die Würde des Menschen ist unantastbar.') }, '▶ Test'),
      h('p.muted', { style: { marginTop: '10px' } }, 'Spracherkennung (Sprechen-Übungen): ' + (GT.speech.recAvailable() ? '✅ verfügbar' : '❌ nicht verfügbar – nutze Chrome oder Edge. Du kannst dich dann selbst bewerten.'))));
    v.appendChild(h('div.card',
      h('h3', '💾 Daten'),
      h('p.muted', 'Dein Fortschritt wird nur lokal in diesem Browser gespeichert. Exportiere ihn, um ihn auf ein anderes Gerät zu übertragen.'),
      h('div.row',
        h('button.btn', { onclick: exportData }, '⬇ Exportieren'),
        h('label.btn', { style: { cursor: 'pointer' } }, '⬆ Importieren', h('input', { type: 'file', accept: '.json,application/json', hidden: true, onchange: importData })),
        h('button.btn.ghost', { onclick: () => go('#/placement') }, '📋 Einstufungstest wiederholen'),
        h('button.btn.bad', { onclick: () => { if (confirm('Wirklich ALLEN Fortschritt löschen? Das kann nicht rückgängig gemacht werden.')) { localStorage.removeItem(GT.STORE_KEY); GT.state = GT.defaultState(); location.hash = ''; location.reload(); } } }, '🗑 Zurücksetzen'))));
    function toggle(label, key) {
      return h('label.row', { style: { margin: '10px 0', cursor: 'pointer' } },
        h('input', { type: 'checkbox', checked: s.settings[key] !== false, style: { width: '20px', height: '20px' }, onchange: (e) => { s.settings[key] = e.target.checked; save(); } }), h('span', label));
    }
  };
  function exportData() {
    const blob = new Blob([JSON.stringify(S(), null, 1)], { type: 'application/json' });
    const a = h('a', { href: URL.createObjectURL(blob), download: 'deutschweg-' + GT.dateKey() + '.json' });
    document.body.appendChild(a); a.click(); a.remove();
  }
  function importData(e) {
    const f = e.target.files[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = () => {
      try {
        const data = JSON.parse(r.result);
        if (!data || data.v !== 1 || !data.cards) throw new Error('format');
        localStorage.setItem(GT.STORE_KEY, JSON.stringify(data));
        GT.state = GT.load();
        GT.toast('Import erfolgreich ✅'); GT.route();
      } catch (err) { GT.toast('Ungültige Datei'); }
    };
    r.readAsText(f);
  }

  /* ---------------- Boot ---------------- */
  GT.applyTheme();
  GT.speech.init();
  GT.route();
  // periodic refresh of the badge (cards become due during the day)
  setInterval(() => !GT.Session.active() && GT.updateTopbar(), 60000);
})();
