/* ==========================================================================
   DeutschWeg – session engine + exercise renderers
   A session is a queue of items. Each item has a `kind` that maps to a
   renderer. Renderers call ctx.done(result, info) where result is
   'right' | 'typo' | 'wrong' | 'info'.
   ========================================================================== */
(function () {
  const { h, esc, shuffle, sample, pick } = GT;

  const KIND_LABEL = {
    intro: 'Neues Wort', mc: 'Wähle die richtige Antwort', gap: 'Ergänze die Lücke', order: 'Bilde den Satz',
    tr: 'Übersetze ins Deutsche', fix: 'Korrigiere den Fehler', vmc: 'Was bedeutet das?', vmcr: 'Wie sagt man auf Deutsch?',
    vtype: 'Schreib das deutsche Wort', gender: 'der, die oder das?', match: 'Finde die Paare', listen: 'Hör zu und schreib mit',
    speak: 'Sprich nach (Shadowing)', vlisten: 'Hör zu: welches Wort?',
  };
  const PRAISE = ['Richtig!', 'Super!', 'Genau!', 'Sehr gut!', 'Klasse!', 'Perfekt!', 'Prima!', 'Ausgezeichnet!'];

  /* ---------------- Item factories ---------------- */
  const F = (GT.items = {});
  /** Vocab-based items. v = {id, de, en, ex} */
  F.intro = (v) => ({ kind: 'intro', v, skill: 'vocab' });
  F.vmc = (v, pool) => ({ kind: 'vmc', v, pool, srs: v.id, skill: 'vocab' });
  F.vmcr = (v, pool) => ({ kind: 'vmcr', v, pool, srs: v.id, skill: 'vocab' });
  F.vtype = (v) => ({ kind: 'vtype', v, srs: v.id, skill: 'vocab' });
  F.vlisten = (v, pool) => ({ kind: 'vlisten', v, pool, srs: v.id, skill: 'listening' });
  F.gender = (v) => ({ kind: 'gender', v, skill: 'gender' });
  F.match = (vs) => ({ kind: 'match', vs, skill: 'vocab' });
  F.listen = (text, en) => ({ kind: 'listen', text, en, skill: 'listening' });
  F.speak = (text, en) => ({ kind: 'speak', text, en, skill: 'speaking' });
  /** Unit exercise → item (keeps a reference for the mistake bank) */
  F.fromExercise = (u, i) => Object.assign({ kind: u.exercises[i].t, ref: 'x:' + u.id + ':' + i, skill: 'grammar', _unit: u }, u.exercises[i]);
  /** Choose a review exercise style for a vocab card, harder as it matures */
  F.forCard = function (id) {
    if (id.startsWith('x:')) { const ex = GT.mistakeItem(id); return Object.assign({ kind: ex.t, ref: id, srs: id, skill: 'grammar' }, ex); }
    const v = GT.vocabById[id], c = GT.state.cards[id] || { r: 0 };
    const pool = GT.allVocab.filter((x) => x.unit.level === v.unit.level);
    if (c.r === 0) return F.vmc(v, pool);
    if (c.r === 1) return pick([F.vmcr(v, pool), F.vtype(v)]);
    if (c.r >= 3 && GT.speech.available() && Math.random() < 0.3) return F.vlisten(v, pool);
    return F.vtype(v);
  };

  /* ---------------- Session engine ---------------- */
  const S = (GT.Session = {});
  /** Navigate even if the hash does not change */
  GT.goto = (hash) => { if (location.hash === hash) GT.route(); else location.hash = hash; };
  let cur = null;

  S.start = function (opts) {
    cur = {
      title: opts.title || 'Übung', items: opts.items.slice(), requeue: opts.requeue !== false,
      mode: opts.mode || 'practice', onFinish: opts.onFinish, exitTo: opts.exitTo || '#/path',
      idx: 0, graded: 0, right: 0, xp: 0, combo: 0, bestCombo: 0, mistakes: [], log: [], t0: Date.now(),
      total: opts.items.filter((i) => i.kind !== 'intro').length,
    };
    document.body.classList.add('focus');
    S.render();
  };
  S.active = () => !!cur;
  S.abort = function () {
    if (!cur) return;
    GT.addTime((Date.now() - cur.t0) / 1000);
    GT.save();
    cur = null;
    document.body.classList.remove('focus');
    GT.$('#feedback') && GT.$('#feedback').remove();
  };

  S.render = function () {
    const view = GT.$('#view');
    view.innerHTML = '';
    GT.$('#feedback') && GT.$('#feedback').remove();
    GT.$('#checkbar') && GT.$('#checkbar').remove();
    if (cur.idx >= cur.items.length) return S.finish();
    const item = cur.items[cur.idx];
    const pct = cur.total ? Math.min(100, (cur.graded / cur.total) * 100) : 0;
    view.appendChild(h('div.session-top',
      h('button.x', { title: 'Beenden (Esc)', onclick: () => S.confirmExit() }, '✕'),
      h('div.progress', h('span', { style: { width: pct + '%' } })),
      h('span.combo', cur.combo >= 3 ? '🔥 ' + cur.combo : '')));
    const area = h('div.ex');
    view.appendChild(area);
    if (item.retry) area.appendChild(h('div.ex-kind', { style: { color: 'var(--warn)' } }, '↻ Noch einmal'));
    else area.appendChild(h('div.ex-kind', KIND_LABEL[item.kind] || ''));

    const ctx = {
      area, item, answered: false,
      checkBtn: null,
      done: (res, info) => S.answer(item, res, info || {}),
      setCheck(fn, label) {
        const bar = h('div.check-bar#checkbar', h('div.inner',
          h('button.btn.ghost', { onclick: () => ctx.done('wrong', { skipped: true }) }, 'Weiß nicht'),
          ctx.checkBtn = h('button.btn.primary.lg', { onclick: () => !ctx.answered && fn() }, label || 'Prüfen')));
        document.body.appendChild(bar);
        ctx.onEnter = () => !ctx.answered && fn();
      },
    };
    cur.ctx = ctx;
    const r = R[item.kind];
    if (!r) { console.warn('Unknown item kind', item.kind); cur.idx++; return S.render(); }
    r(item, ctx);
  };

  S.answer = function (item, res, info) {
    const ctx = cur.ctx;
    if (ctx.answered) return;
    ctx.answered = true;
    GT.$('#checkbar') && GT.$('#checkbar').remove();
    GT.$$('.choice, .tile, input, textarea', ctx.area).forEach((e) => (e.disabled = true));
    if (res === 'info') { cur.idx++; return S.render(); }

    const first = !item.retry;
    const ok = res !== 'wrong';
    if (first) {
      cur.graded++;
      if (ok) cur.right++;
      GT.logSkill(item.skill || 'grammar', ok);
      cur.log.push({ item, ok, res });
      if (item.srs) GT.srs.grade(item.srs, res === 'right' ? 2 : res === 'typo' ? 1 : 0);
      if (!ok && item.ref && !item.srs) { // into the mistake bank
        if (GT.state.cards[item.ref]) GT.srs.grade(item.ref, 0); else GT.srs.ensure(item.ref, 1);
      }
      if (!ok) cur.mistakes.push(item);
    }
    if (ok) {
      cur.combo++; cur.bestCombo = Math.max(cur.bestCombo, cur.combo);
      const gain = first ? (res === 'right' ? 10 : 7) + (cur.combo >= 5 ? 2 : 0) : 3;
      cur.xp += gain; GT.addXP(gain);
      GT.sfx.ok();
    } else {
      cur.combo = 0;
      GT.sfx.bad();
      if (cur.requeue && first) {
        const pos = Math.min(cur.items.length, cur.idx + 3 + Math.floor(Math.random() * 3));
        cur.items.splice(pos, 0, Object.assign({}, item, { retry: true }));
      }
    }
    if (info.say && GT.state.settings.autoplay !== false) setTimeout(() => GT.speech.say(info.say), 150);
    S.showFeedback(res, info, item);
  };

  S.showFeedback = function (res, info, item) {
    const title = res === 'right' ? pick(PRAISE) : res === 'typo' ? (info.noteTitle || 'Fast richtig!') : (info.skipped ? 'Kein Problem – merk dir:' : 'Leider falsch');
    const msg = h('div.msg', h('b', (res === 'right' ? '✅ ' : res === 'typo' ? '🟡 ' : '❌ ') + title));
    if (info.note) msg.appendChild(h('div', info.note));
    if (info.solution && res !== 'right') msg.appendChild(h('div.sol', { html: info.solution }));
    if (info.why) msg.appendChild(h('div.why', { html: '💡 ' + info.why }));
    if (info.say) msg.appendChild(h('div', { style: { marginTop: '6px' } }, GT.speakBtn(info.say)));
    if (res === 'wrong' && info.overridable) {
      msg.appendChild(h('button.override', {
        onclick: () => {
          // learner disputes: treat as correct, undo penalties
          if (!item.retry) {
            cur.right++; cur.mistakes.pop(); GT.logSkill(item.skill || 'grammar', true);
            if (item.srs) GT.srs.grade(item.srs, 2);
          }
          const i = cur.items.findIndex((x, k) => k > cur.idx && x.retry && x.kind === item.kind && x.q === item.q && x.v === item.v && x.text === item.text && x.en === item.en);
          if (i > -1) cur.items.splice(i, 1);
          cur.xp += 8; GT.addXP(8); GT.toast('Als richtig gewertet 👍');
          S.next();
        },
      }, 'Meine Antwort war auch richtig'));
    }
    const fb = h('div.feedback#feedback.' + res, h('div.inner', msg,
      h('button.btn.lg.' + (res === 'wrong' ? 'bad' : 'ok'), { onclick: () => S.next() }, 'Weiter')));
    document.body.appendChild(fb);
    requestAnimationFrame(() => fb.classList.add('show'));
  };

  S.next = function () { if (!cur) return; cur.idx++; S.render(); };

  S.confirmExit = function () {
    if (cur.graded < 2 || confirm('Übung beenden? Dein bisheriger Fortschritt (XP, Wiederholungen) bleibt gespeichert.')) {
      const to = cur.exitTo; S.abort(); GT.goto(to);
    }
  };

  S.finish = function () {
    const c = cur;
    const secs = (Date.now() - c.t0) / 1000;
    const acc = c.graded ? Math.round((c.right / c.graded) * 100) : 100;
    const bonus = c.graded >= 5 ? (acc === 100 ? 15 : 5) : 0;
    if (bonus) GT.addXP(bonus);
    S.abort();
    GT.sfx.done();
    const result = { acc, right: c.right, total: c.graded, xp: c.xp + bonus, secs, mistakes: c.mistakes, bestCombo: c.bestCombo, log: c.log };
    const extra = c.onFinish ? c.onFinish(result) : null;
    GT.save();
    const view = GT.$('#view');
    view.innerHTML = '';
    const emoji = acc >= 90 ? '🏆' : acc >= 75 ? '🎉' : acc >= 50 ? '💪' : '🌱';
    view.appendChild(h('div.result.card',
      h('div.big', emoji),
      h('h1', (extra && extra.title) || (acc >= 80 ? 'Toll gemacht!' : 'Übung beendet')),
      extra && extra.text ? h('p', { html: extra.text }) : null,
      h('div.result-stats',
        h('div', h('b', acc + ' %'), h('small', 'Genauigkeit')),
        h('div', h('b', '+' + result.xp), h('small', 'XP')),
        h('div', h('b', Math.max(1, Math.round(secs / 60)) + ' min'), h('small', 'Zeit')),
        c.bestCombo >= 3 ? h('div', h('b', '🔥 ' + c.bestCombo), h('small', 'Beste Serie')) : null),
      c.mistakes.length ? h('details.acc', { style: { textAlign: 'left', marginTop: '10px' } },
        h('summary', '📝 Deine Fehler (' + c.mistakes.length + ') – landen in der Wiederholung'),
        h('div.acc-body', h('ul', c.mistakes.map((m) => h('li', { html: S.describe(m) }))))) : null,
      h('div.row', { style: { justifyContent: 'center', marginTop: '20px' } },
        (extra && extra.actions) || null,
        h('button.btn.primary.lg', { onclick: () => GT.goto(c.exitTo) }, 'Weiter'))));
  };

  /** Short description of an item for the mistakes list */
  S.describe = function (m) {
    if (m.v) return GT.deHtml(m.v.de) + ' – ' + esc(m.v.en);
    if (m.kind === 'gap') return esc(m.q.replace(/_{2,}/, '[' + [].concat(m.a)[0] + ']'));
    if (m.kind === 'mc') return esc(m.q) + ' → <b>' + esc(m.o[m.a]) + '</b>';
    if (m.kind === 'order') return esc(m.a);
    if (m.kind === 'tr' || m.kind === 'fix') return esc([].concat(m.a)[0]);
    if (m.text) return esc(m.text);
    return KIND_LABEL[m.kind] || m.kind;
  };

  /* Keyboard: Enter = check / continue, 1-9 = choose, Esc = exit */
  document.addEventListener('keydown', (e) => {
    if (!cur) return;
    const ctx = cur.ctx;
    if (e.key === 'Escape') { e.preventDefault(); return S.confirmExit(); }
    if (e.key === 'Enter') {
      if (GT.$('#feedback')) { e.preventDefault(); return S.next(); }
      if (ctx && ctx.onEnter && !(e.target.tagName === 'TEXTAREA')) { e.preventDefault(); return ctx.onEnter(); }
    }
    if (/^[1-9]$/.test(e.key) && e.target.tagName !== 'INPUT' && !GT.$('#feedback')) {
      const btns = GT.$$('[data-key]', ctx.area).filter((b) => !b.disabled);
      const b = btns.find((x) => x.dataset.key === e.key);
      if (b) { e.preventDefault(); b.click(); }
    }
  });

  /* ---------------- Shared UI pieces ---------------- */
  function choiceList(options, onPick, cls) {
    const wrap = h('div.choices' + (cls ? '.' + cls : ''));
    options.forEach((o, i) => {
      const b = h('button.choice', { type: 'button', 'data-key': String(i + 1), onclick: () => onPick(i, b, wrap) },
        h('span.k', String(i + 1)), h('span', { html: o.html || esc(o) }));
      wrap.appendChild(b);
    });
    return wrap;
  }
  function textInput(ctx, placeholder) {
    const inp = h('input', { type: 'text', placeholder: placeholder || 'Antwort eingeben…', autocomplete: 'off', autocapitalize: 'off', spellcheck: 'false', lang: 'de' });
    const um = h('div.umlauts', ['ä', 'ö', 'ü', 'ß', 'Ä', 'Ö', 'Ü'].map((c) => h('button', {
      type: 'button', tabindex: '-1',
      onclick: () => { const s = inp.selectionStart, e = inp.selectionEnd; inp.value = inp.value.slice(0, s) + c + inp.value.slice(e); inp.focus(); inp.setSelectionRange(s + 1, s + 1); },
    }, c)));
    ctx.area.appendChild(h('div', h('div.answer-row', inp), um));
    setTimeout(() => inp.focus(), 50);
    return inp;
  }
  function distractors(v, pool, n, field) {
    const seen = new Set([v[field]]);
    const out = [];
    for (const x of shuffle(pool)) {
      if (x.id !== v.id && !seen.has(x[field])) { seen.add(x[field]); out.push(x); }
      if (out.length >= n) break;
    }
    if (out.length < n) for (const x of shuffle(GT.allVocab)) { if (!seen.has(x[field])) { seen.add(x[field]); out.push(x); } if (out.length >= n) break; }
    return out;
  }
  const fullGap = (q, a) => q.replace(/_{2,}/, a);
  const wordsOf = (s) => s.replace(/[.!?]$/, '').split(/\s+/);

  /* ---------------- Renderers ---------------- */
  const R = (GT.renderers = {});

  R.intro = function (item, ctx) {
    const v = item.v;
    ctx.area.appendChild(h('div.card.flash',
      h('div.new-tag', 'NEU'),
      h('div.row', { style: { justifyContent: 'center' } }, h('div.de', { html: GT.deHtml(v.de) }), GT.speakBtn(v.de)),
      h('div.en', v.en),
      v.ex ? h('div.ex', GT.speakBtn(v.ex), h('span', v.ex)) : null,
      GT.genderOf(v.de) ? h('p.muted', { style: { marginTop: '14px', fontSize: '.9rem' } }, GT.genderHint(v.de)) : null));
    setTimeout(() => GT.speech.say(v.de), 200);
    const bar = h('div.check-bar#checkbar', h('div.inner', h('span.muted', 'Sprich das Wort laut nach.'),
      h('button.btn.primary.lg', { onclick: () => ctx.done('info') }, 'Verstanden')));
    document.body.appendChild(bar);
    ctx.onEnter = () => ctx.done('info');
  };

  R.mc = function (item, ctx) {
    ctx.area.appendChild(h('div.ex-q', { html: esc(item.q).replace(/_{2,}/, '<span class="gap">&nbsp;</span>') }));
    if (item.h) ctx.area.appendChild(h('p.ex-sub', item.h));
    const order = shuffle(item.o.map((o, i) => i));
    if (item.idk) order.push(-1);
    ctx.area.appendChild(choiceList(order.map((i) => (i < 0 ? '🤷 Weiß ich nicht' : item.o[i])), (k, btn, wrap) => {
      const chosen = order[k];
      const ok = chosen === item.a;
      btn.classList.add(ok ? 'right' : 'wrong');
      if (!ok) wrap.children[order.indexOf(item.a)].classList.add('right');
      const say = /_{2,}/.test(item.q) ? fullGap(item.q, item.o[item.a]) : null;
      ctx.done(ok ? 'right' : 'wrong', { solution: 'Richtig: <b>' + esc(item.o[item.a]) + '</b>', why: item.e, say });
    }));
  };

  R.gap = function (item, ctx) {
    ctx.area.appendChild(h('div.ex-q', { html: esc(item.q).replace(/_{2,}/, '<span class="gap">&nbsp;</span>') }));
    if (item.h) ctx.area.appendChild(h('p.ex-sub', '💡 ' + item.h));
    const inp = textInput(ctx, 'Lücke ergänzen…');
    const answers = [].concat(item.a);
    ctx.setCheck(() => {
      // allow typing the whole sentence too
      let r = GT.check(inp.value, answers, { noTypos: answers[0].length < 6 });
      if (r.res === 'wrong') { const r2 = GT.check(inp.value, answers.map((a) => fullGap(item.q, a))); if (r2.res !== 'wrong') r = { res: r2.res, best: answers[0], note: r2.note }; }
      inp.classList.add(r.res === 'wrong' ? 'wrong' : 'right');
      ctx.done(r.res, { solution: esc(fullGap(item.q, '<b>' + r.best + '</b>')).replace(/&lt;(\/?)b&gt;/g, '<$1b>'), note: r.note, why: item.e, say: fullGap(item.q, r.best), overridable: true });
    });
  };

  R.fix = function (item, ctx) {
    ctx.area.appendChild(h('div.ex-q', '„' + item.q + '“'));
    ctx.area.appendChild(h('p.ex-sub', 'Dieser Satz enthält einen Fehler. Schreib ihn korrekt.'));
    const inp = textInput(ctx, 'Korrigierter Satz…');
    inp.value = item.q;
    ctx.setCheck(() => {
      const r = GT.check(inp.value, item.a, { noTypos: true });
      ctx.done(r.res, { solution: 'Richtig: <b>' + esc(r.best) + '</b>', note: r.note, why: item.e, say: r.best, overridable: true });
    });
  };

  R.tr = function (item, ctx) {
    ctx.area.appendChild(h('div.ex-q', '„' + item.en + '“'));
    if (item.h) ctx.area.appendChild(h('p.ex-sub', '💡 ' + item.h));
    const inp = textInput(ctx, 'Auf Deutsch…');
    ctx.setCheck(() => {
      const r = GT.check(inp.value, item.a);
      ctx.done(r.res, { solution: 'Zum Beispiel: <b>' + esc(r.best) + '</b>', note: r.note, why: item.e, say: r.best, overridable: true });
    });
  };

  R.order = function (item, ctx) {
    if (item.en) ctx.area.appendChild(h('div.ex-q', '„' + item.en + '“'));
    const words = wordsOf(item.a);
    let order = shuffle(words.map((w, i) => i));
    for (let k = 0; k < 5 && order.every((x, i) => x === i) && words.length > 1; k++) order = shuffle(order);
    const ans = h('div.tiles-answer'), bank = h('div.tiles-bank');
    const chosen = [];
    order.forEach((wi) => {
      const t = h('button.tile', { type: 'button', onclick: () => {
        if (t.classList.contains('used')) return;
        t.classList.add('used');
        const a = h('button.tile', { type: 'button', onclick: () => { a.remove(); t.classList.remove('used'); chosen.splice(chosen.indexOf(wi2), 1); } }, words[wi]);
        const wi2 = { wi, el: a };
        chosen.push(wi2);
        ans.appendChild(a);
      } }, words[wi]);
      bank.appendChild(t);
    });
    ctx.area.appendChild(ans); ctx.area.appendChild(bank);
    ctx.setCheck(() => {
      const built = chosen.map((c) => words[c.wi]).join(' ');
      const r = GT.check(built, [item.a].concat(item.alt || []), { noTypos: true });
      ctx.done(r.res, { solution: 'Richtig: <b>' + esc(item.a) + '</b>', why: item.e, say: item.a });
    });
  };

  R.vmc = function (item, ctx) {
    const v = item.v;
    ctx.area.appendChild(h('div.row', { style: { justifyContent: 'center' } }, h('div.big-word', { html: GT.deHtml(v.de) }), GT.speakBtn(v.de)));
    const opts = shuffle([v].concat(distractors(v, item.pool || GT.allVocab, 3, 'en')));
    ctx.area.appendChild(choiceList(opts.map((o) => o.en), (k, btn, wrap) => {
      const ok = opts[k].id === v.id;
      btn.classList.add(ok ? 'right' : 'wrong');
      if (!ok) wrap.children[opts.indexOf(v)].classList.add('right');
      ctx.done(ok ? 'right' : 'wrong', { solution: GT.deHtml(v.de) + ' = <b>' + esc(v.en) + '</b>', why: v.ex ? esc(v.ex) : null, say: v.de });
    }));
  };

  R.vmcr = function (item, ctx) {
    const v = item.v;
    ctx.area.appendChild(h('div.big-word', v.en));
    const opts = shuffle([v].concat(distractors(v, item.pool || GT.allVocab, 3, 'de')));
    ctx.area.appendChild(choiceList(opts.map((o) => ({ html: GT.deHtml(o.de) })), (k, btn, wrap) => {
      const ok = opts[k].id === v.id;
      btn.classList.add(ok ? 'right' : 'wrong');
      if (!ok) wrap.children[opts.indexOf(v)].classList.add('right');
      ctx.done(ok ? 'right' : 'wrong', { solution: '<b>' + GT.deHtml(v.de) + '</b>', say: v.de });
    }));
  };

  R.vlisten = function (item, ctx) {
    const v = item.v;
    ctx.area.appendChild(h('div.listen-box', GT.speakBtn(v.de, 'big'), GT.speakBtn(v.de, 'big', 0.6)));
    setTimeout(() => GT.speech.say(v.de), 250);
    const opts = shuffle([v].concat(distractors(v, item.pool || GT.allVocab, 3, 'en')));
    ctx.area.appendChild(choiceList(opts.map((o) => o.en), (k, btn, wrap) => {
      const ok = opts[k].id === v.id;
      btn.classList.add(ok ? 'right' : 'wrong');
      if (!ok) wrap.children[opts.indexOf(v)].classList.add('right');
      ctx.done(ok ? 'right' : 'wrong', { solution: GT.deHtml(v.de) + ' = <b>' + esc(v.en) + '</b>' });
    }));
  };

  R.vtype = function (item, ctx) {
    const v = item.v;
    ctx.area.appendChild(h('div.big-word', v.en));
    const g = GT.genderOf(v.de);
    if (g) ctx.area.appendChild(h('p.ex-sub', { style: { textAlign: 'center' } }, 'Nomen – mit Artikel schreiben (der/die/das)'));
    const inp = textInput(ctx, g ? 'z. B. der Tisch' : 'Auf Deutsch…');
    ctx.setCheck(() => {
      const alts = v.de.split(/\s*\/\s*|,\s*(?=[a-zäöü])/).concat([v.de.replace(/\s*\(.*?\)/g, '')]).filter((x) => x && x !== v.de);
      const r = g ? GT.checkNoun(inp.value, v.de) : GT.check(inp.value, [v.de].concat(alts, [v.de.replace(/^sich\s+/, '')]));
      ctx.done(r.res, { solution: '<b>' + GT.deHtml(v.de) + '</b>' + (v.ex ? '<br><small>' + esc(v.ex) + '</small>' : ''), note: r.note, say: v.de, overridable: !g });
    });
  };

  R.gender = function (item, ctx) {
    const v = item.v, g = GT.genderOf(v.de);
    ctx.area.appendChild(h('div.row', { style: { justifyContent: 'center' } }, h('div.big-word', GT.stripArticle(v.de)), GT.speakBtn(v.de)));
    ctx.area.appendChild(h('p.ex-sub', { style: { textAlign: 'center' } }, v.en));
    const wrap = h('div.gender-choices');
    ['der', 'die', 'das'].forEach((x, i) => wrap.appendChild(h('button.choice', {
      type: 'button', 'data-key': String(i + 1), 'data-g': x,
      onclick: (e) => {
        const ok = x === g;
        e.currentTarget.classList.add(ok ? 'right' : 'wrong');
        if (!ok) wrap.children[['der', 'die', 'das'].indexOf(g)].classList.add('right');
        ctx.done(ok ? 'right' : 'wrong', { solution: '<b>' + GT.deHtml(v.de) + '</b>', why: GT.genderHint(v.de), say: v.de });
      },
    }, x)));
    ctx.area.appendChild(wrap);
  };

  R.match = function (item, ctx) {
    const vs = item.vs;
    const left = shuffle(vs), right = shuffle(vs);
    let sel = null, errors = 0, matched = 0;
    const grid = h('div.match-grid');
    const L = left.map((v) => h('button.choice', { type: 'button', html: GT.deHtml(v.de), onclick: () => choose('L', v, L[left.indexOf(v)]) }));
    const Rr = right.map((v) => h('button.choice', { type: 'button', onclick: () => choose('R', v, Rr[right.indexOf(v)]) }, v.en));
    for (let i = 0; i < vs.length; i++) { grid.appendChild(L[i]); grid.appendChild(Rr[i]); }
    ctx.area.appendChild(grid);
    function choose(side, v, el) {
      if (side === 'L') GT.speech.say(v.de, { rate: 1.1 });
      if (!sel || sel.side === side) { GT.$$('.sel', grid).forEach((e) => e.classList.remove('sel')); sel = { side, v, el }; el.classList.add('sel'); return; }
      if (sel.v.id === v.id) {
        [sel.el, el].forEach((e) => { e.classList.remove('sel'); e.classList.add('right'); setTimeout(() => e.classList.add('gone'), 250); });
        matched++;
        if (matched === vs.length) setTimeout(() => ctx.done(errors === 0 ? 'right' : errors <= 2 ? 'typo' : 'wrong', { noteTitle: 'Geschafft – mit ' + errors + ' Fehler' + (errors === 1 ? '' : 'n') }), 350);
      } else {
        errors++;
        [sel.el, el].forEach((e) => { e.classList.remove('sel'); e.classList.add('wrong'); setTimeout(() => e.classList.remove('wrong'), 450); });
        GT.sfx.bad();
      }
      sel = null;
    }
  };

  R.listen = function (item, ctx) {
    ctx.area.appendChild(h('div.listen-box', GT.speakBtn(item.text, 'big'), GT.speakBtn(item.text, 'big', 0.6)));
    ctx.area.appendChild(h('p.ex-sub', { style: { textAlign: 'center', marginTop: '0' } }, '🔊 normal · 🐢 langsam (zweiter Knopf)'));
    setTimeout(() => GT.speech.say(item.text), 300);
    const inp = textInput(ctx, 'Schreib, was du hörst…');
    ctx.setCheck(() => {
      const r = GT.check(inp.value, item.text);
      ctx.done(r.res, { solution: '<b>' + esc(item.text) + '</b>' + (item.en && GT.state.settings.english ? '<br><small>' + esc(item.en) + '</small>' : ''), note: r.note });
    });
  };

  R.speak = function (item, ctx) {
    ctx.area.appendChild(h('div.card', { style: { textAlign: 'center' } },
      h('div.ex-q', { style: { marginBottom: '6px' } }, item.text),
      item.en && GT.state.settings.english ? h('p.muted', item.en) : null,
      h('div.row', { style: { justifyContent: 'center' } }, GT.speakBtn(item.text), GT.speakBtn(item.text, null, 0.6))));
    setTimeout(() => GT.speech.say(item.text), 300);
    if (!GT.speech.recAvailable()) {
      ctx.area.appendChild(h('p', { style: { textAlign: 'center', marginTop: '18px' } }, 'Hör zu und sprich den Satz laut nach (2–3 Mal). Wie lief es?'));
      ctx.area.appendChild(h('div.row', { style: { justifyContent: 'center' } },
        h('button.btn.ok', { 'data-key': '1', onclick: () => ctx.done('right', {}) }, '1 · Gut gelungen'),
        h('button.btn.ghost', { 'data-key': '2', onclick: () => ctx.done('typo', { noteTitle: 'Weiter üben!', note: 'Tipp: Sprich zuerst langsam, dann im normalen Tempo.' }) }, '2 · Noch unsicher')));
      return;
    }
    const heard = h('div.heard.muted', 'Tippe auf das Mikrofon und sprich den Satz.');
    let rec = null, best = { score: 0 };
    const mic = h('button.mic-btn', { type: 'button', title: 'Aufnehmen', onclick: () => {
      if (rec) { rec.stop(); return; }
      mic.classList.add('rec'); heard.textContent = '…';
      rec = GT.speech.listen((txt) => {
        const c = GT.compareSpeech(item.text, txt);
        heard.innerHTML = c.html + '<br><small class="muted">Gehört: „' + esc(txt) + '“</small>';
        if (c.score >= best.score) best = c;
      }, () => {
        rec = null; mic.classList.remove('rec');
        if (best.score >= 0.75) ctx.done('right', { note: 'Aussprache: ' + Math.round(best.score * 100) + ' % erkannt' });
        else if (best.score > 0) heard.insertAdjacentHTML('beforeend', '<br><b>' + Math.round(best.score * 100) + ' %</b> – versuch es noch einmal (rote Wörter beachten).');
      });
    } }, '🎤');
    ctx.area.appendChild(h('div', { style: { textAlign: 'center', marginTop: '22px' } }, mic, heard));
    const bar = h('div.check-bar#checkbar', h('div.inner',
      h('button.btn.ghost', { onclick: () => ctx.done('typo', { noteTitle: 'Übersprungen', note: 'Shadowing später nochmal probieren.' }) }, 'Jetzt nicht sprechen'),
      h('button.btn.primary', { onclick: () => mic.click() }, '🎤 Aufnehmen')));
    document.body.appendChild(bar);
  };

  /* ---------------- Gender hints (rules of thumb) ---------------- */
  GT.genderHint = function (de) {
    const g = GT.genderOf(de), w = GT.stripArticle(de).toLowerCase();
    const rules = [
      [/(ung|heit|keit|schaft|ion|tät|ik|ur|enz|anz|ie)$/, 'die', 'Endungen -ung, -heit, -keit, -schaft, -ion, -tät, -ik, -ur, -enz, -anz, -ie → fast immer „die“.'],
      [/(chen|lein)$/, 'das', 'Verkleinerungen auf -chen/-lein → immer „das“.'],
      [/(ment|um|tum|nis|ma)$/, 'das', 'Endungen -ment, -um, -tum, -ma (und oft -nis) → meist „das“.'],
      [/(ling|ismus|or|ich|ig|ner|ant|ist|eur)$/, 'der', 'Endungen -ling, -ismus, -or, -ig, -ich, -ant, -ist, -eur → meist „der“.'],
      [/^ge.+e$/, 'das', 'Ge-…-e (Gebäude, Gebirge) → oft „das“.'],
      [/e$/, 'die', 'Nomen auf -e sind meist feminin (≈ 90 %).'],
      [/(er|en|el)$/, 'der', 'Viele Nomen auf -er, -en, -el sind maskulin (aber nicht alle!).'],
    ];
    for (const [re, rg, txt] of rules) if (re.test(w)) return (rg === g ? '✔ Regel: ' : '⚠ Ausnahme zur Regel: ') + txt;
    if (/-/.test(w) || w.length > 10) return 'Bei Komposita bestimmt das letzte Wort den Artikel.';
    return 'Tipp: Lerne jedes Nomen mit Artikel und Farbe (der = blau, die = rot, das = grün).';
  };
})();
