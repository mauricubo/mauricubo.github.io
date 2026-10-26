/* app.js — core: storage, helpers, navigation, theme, metronome, boot */
(function () {
  'use strict';
  const GT = (window.GT = window.GT || {});
  const T = GT.theory;

  /* ---------- storage ---------- */
  GT.store = {
    get(k, d) {
      try {
        let v = localStorage.getItem('maurifret:' + k);
        if (v === null) v = localStorage.getItem('fretwise:' + k); // keep progress saved under the old name
        return v === null ? d : JSON.parse(v);
      } catch (e) {
        return d;
      }
    },
    set(k, v) {
      try {
        localStorage.setItem('maurifret:' + k, JSON.stringify(v));
      } catch (e) {
        /* storage unavailable */
      }
    },
  };

  /* ---------- DOM helpers ---------- */
  GT.$ = (sel, root = document) => root.querySelector(sel);
  GT.$$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  GT.h = (html) => {
    const t = document.createElement('template');
    t.innerHTML = html.trim();
    return t.content.firstElementChild;
  };
  GT.rand = (arr) => arr[Math.floor(Math.random() * arr.length)];
  GT.randInt = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  GT.esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  /* ---------- global settings ---------- */
  GT.settings = Object.assign({ tuning: 'standard', frets: 15, lefty: false, labels: 'notes' }, GT.store.get('settings', {}));
  GT.saveSettings = () => GT.store.set('settings', GT.settings);
  GT.tuning = () => (T.TUNINGS[GT.settings.tuning] || T.TUNINGS.standard).notes;
  GT.fbOpts = () => ({ tuning: GT.tuning(), frets: +GT.settings.frets, lefty: !!GT.settings.lefty });

  /* ---------- shared UI builders ---------- */
  const ui = (GT.ui = {});

  /** key chips: 12 buttons */
  ui.keyChips = function (container, value, onChange) {
    container.classList.add('chips', 'keys');
    container.innerHTML = T.KEY_CHIPS.map((k, i) => `<button type="button" data-v="${i}">${k}</button>`).join('');
    const api = {
      value,
      set(v) {
        api.value = v;
        GT.$$('button', container).forEach((b) => b.classList.toggle('on', +b.dataset.v === v));
      },
    };
    container.addEventListener('click', (e) => {
      const b = e.target.closest('button');
      if (!b) return;
      api.set(+b.dataset.v);
      onChange(api.value);
    });
    api.set(value);
    return api;
  };

  /** segmented control: options [{v,label}] */
  ui.seg = function (container, options, value, onChange) {
    container.classList.add('seg');
    container.innerHTML = options.map((o) => `<button type="button" data-v="${o.v}">${o.label}</button>`).join('');
    const api = {
      value,
      set(v) {
        api.value = v;
        GT.$$('button', container).forEach((b) => b.classList.toggle('on', b.dataset.v === String(v)));
      },
    };
    container.addEventListener('click', (e) => {
      const b = e.target.closest('button');
      if (!b) return;
      const o = options.find((x) => String(x.v) === b.dataset.v);
      api.set(o.v);
      onChange(o.v);
    });
    api.set(value);
    return api;
  };

  /** multi-toggle chips: options [{v,label}], values = array */
  ui.multi = function (container, options, values, onChange) {
    container.classList.add('chips');
    container.innerHTML = options.map((o) => `<button type="button" data-v="${o.v}">${o.label}</button>`).join('');
    const api = {
      values: values.slice(),
      sync() {
        GT.$$('button', container).forEach((b) => b.classList.toggle('on', api.values.map(String).includes(b.dataset.v)));
      },
    };
    container.addEventListener('click', (e) => {
      const b = e.target.closest('button');
      if (!b) return;
      const o = options.find((x) => String(x.v) === b.dataset.v);
      const i = api.values.indexOf(o.v);
      if (i >= 0) {
        if (api.values.length > 1) api.values.splice(i, 1);
      } else api.values.push(o.v);
      api.sync();
      onChange(api.values);
    });
    api.sync();
    return api;
  };

  ui.scaleOptions = function (select, value, filter = () => true) {
    select.innerHTML = T.FAMILIES.map((fam) => {
      const opts = T.SCALES.filter((s) => s.family === fam && filter(s))
        .map((s) => `<option value="${s.id}">${s.name}</option>`)
        .join('');
      return opts ? `<optgroup label="${fam}">${opts}</optgroup>` : '';
    }).join('');
    select.value = value;
  };

  ui.toast = function (msg, ms = 2200) {
    let el = GT.$('#toast');
    if (!el) {
      el = GT.h('<div id="toast" role="status" aria-live="polite"></div>');
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(el._t);
    el._t = setTimeout(() => el.classList.remove('show'), ms);
  };

  /** label for a scale note given a label mode */
  ui.noteLabel = function (mode, name, deg) {
    if (mode === 'notes') return T.pretty(name);
    if (mode === 'intervals') return T.prettyDeg(deg);
    return '';
  };

  /** class list for a degree */
  ui.degCls = function (deg, charDegs = []) {
    return 'role-' + T.roleOf(deg) + (charDegs.includes(deg) ? ' char' : '');
  };

  /** pitch-class → spelled name map for a scale */
  ui.nameMap = function (rootPc, degs) {
    const sp = T.spell(rootPc, degs);
    const map = new Map();
    degs.forEach((d, i) => map.set(T.mod12(rootPc + T.DEG_SEMI[d]), sp.notes[i]));
    return { root: sp.root, map, notes: sp.notes };
  };

  /**
   * Guitar-like chord voicing as midi notes.
   * rooted: R–5–7–3 (drop-style) from E2 · rootless: 3–5–7(+9) from E3 for comping over a bass line.
   */
  ui.voicing = function (rootPc, q, opts = {}) {
    const degs = T.CHORDS[q].deg;
    const find = (n) => degs.find((d) => T.degNum(d) === n);
    const third = find(3);
    const fifth = find(5);
    const sev = find(7) || (degs.includes('6') ? '6' : null);
    const tens = degs.filter((d) => ![1, 3, 5, 7].includes(T.degNum(d)) && d !== '6');
    let order;
    if (opts.rootless) order = sev ? [third, fifth, sev, tens[0] || '1'] : [third, fifth, '1', third];
    else order = sev ? ['1', fifth, sev, third, tens[0]] : ['1', fifth, '1', third, fifth];
    order = order.filter(Boolean);
    const low = opts.rootless ? 52 : 40;
    const out = [];
    order.forEach((d, i) => {
      const pc = T.mod12(rootPc + T.DEG_SEMI[d]);
      if (i === 0) out.push(low + T.mod12(pc - low));
      else {
        const prev = out[i - 1];
        out.push(prev + (T.mod12(pc - prev) || 12));
      }
    });
    return out;
  };

  /** Play/Pause/Resume button + Stop button. state: 'idle' | 'running' | 'paused' */
  ui.syncTransport = function (playBtn, stopBtn, state, playLabel = 'Play') {
    playBtn.innerHTML =
      state === 'running' ? '<span class="ico">❚❚</span> Pause' : state === 'paused' ? '<span class="ico">▶</span> Resume' : `<span class="ico">▶</span> ${playLabel}`;
    playBtn.classList.toggle('active', state === 'running');
    playBtn.setAttribute('aria-pressed', state === 'running');
    if (stopBtn) stopBtn.hidden = state === 'idle';
  };
  /** state of a Clock for syncTransport */
  ui.clockState = (clock) => (!clock ? 'idle' : clock.running ? 'running' : clock.paused ? 'paused' : 'idle');

  /** Tiny sparkline svg */
  ui.sparkline = function (values, w = 220, h = 48) {
    if (!values.length) return '';
    const max = Math.max(...values);
    const min = Math.min(...values);
    const span = max - min || 1;
    const pts = values.map((v, i) => {
      const x = values.length === 1 ? w / 2 : (i / (values.length - 1)) * (w - 8) + 4;
      const y = h - 6 - ((v - min) / span) * (h - 14);
      return [x.toFixed(1), y.toFixed(1)];
    });
    return `<svg class="spark" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}"><polyline points="${pts.map((p) => p.join(',')).join(' ')}"/>${pts
      .map((p) => `<circle cx="${p[0]}" cy="${p[1]}" r="2.6"/>`)
      .join('')}</svg>`;
  };

  /* ---------- navigation ---------- */
  GT.views = GT.views || {};
  let current = null;
  GT.go = function (name, params) {
    const view = GT.views[name];
    if (!view) return;
    if (current && current !== name) {
      if (GT.views[current].hide) GT.views[current].hide();
      // nothing from the previous section may keep sounding
      GT.audio.stopAll();
    }
    GT.$$('.view').forEach((v) => v.classList.toggle('active', v.id === 'view-' + name));
    GT.$$('#tabs button').forEach((b) => b.classList.toggle('active', b.dataset.view === name));
    if (!view._inited) {
      view.init(GT.$('#view-' + name));
      view._inited = true;
    }
    current = name;
    if (view.show) view.show(params || {});
    if (location.hash !== '#' + name) history.replaceState(null, '', '#' + name);
    GT.store.set('view', name);
    window.scrollTo(0, 0);
  };

  /* ---------- theme ---------- */
  function initTheme() {
    const saved = GT.store.get('theme', null);
    if (saved) document.documentElement.dataset.theme = saved;
    GT.$('#themeToggle').addEventListener('click', () => {
      const isDark =
        document.documentElement.dataset.theme === 'dark' ||
        (!document.documentElement.dataset.theme && matchMedia('(prefers-color-scheme: dark)').matches);
      const next = isDark ? 'light' : 'dark';
      document.documentElement.dataset.theme = next;
      GT.store.set('theme', next);
    });
  }

  /* ---------- global metronome ---------- */
  function initMetronome() {
    const clock = new GT.audio.Clock();
    clock.persistent = true; // the header metronome survives navigation on purpose
    const btn = GT.$('#metroToggle');
    const bpmEl = GT.$('#metroBpm');
    const led = GT.$('#metroLed');
    let bpm = GT.store.get('metroBpm', 80);
    let beats = 4;
    bpmEl.value = bpm;
    const setBpm = (v) => {
      bpm = Math.max(30, Math.min(260, Math.round(v) || 80));
      bpmEl.value = bpm;
      clock.bpm = bpm;
      GT.store.set('metroBpm', bpm);
    };
    bpmEl.addEventListener('change', () => setBpm(+bpmEl.value));
    GT.$('#metroDown').addEventListener('click', () => setBpm(bpm - 2));
    GT.$('#metroUp').addEventListener('click', () => setBpm(bpm + 2));
    btn.addEventListener('click', () => {
      if (clock.running) {
        clock.stop();
        btn.classList.remove('on');
        return;
      }
      btn.classList.add('on');
      clock.start(
        bpm,
        (step, t) => {
          const beat = step % beats;
          GT.audio.click(t, beat === 0);
          GT.audio.at(t, () => {
            led.classList.toggle('accent', beat === 0);
            led.classList.add('on');
            setTimeout(() => led.classList.remove('on'), 90);
          });
        },
        { stepsPerBeat: 1 }
      );
    });
    // tap tempo
    let taps = [];
    GT.$('#metroTap').addEventListener('click', () => {
      const now = performance.now();
      taps = taps.filter((t) => now - t < 2500);
      taps.push(now);
      if (taps.length >= 2) {
        const diffs = taps.slice(1).map((t, i) => t - taps[i]);
        setBpm(60000 / (diffs.reduce((a, b) => a + b, 0) / diffs.length));
      }
    });
    GT.metronome = { clock, setBpm, get bpm() { return bpm; } };
  }

  function initVolume() {
    const v = GT.$('#volume');
    const saved = GT.store.get('volume', 0.8);
    v.value = saved;
    GT.audio.setVolume(saved);
    v.addEventListener('input', () => {
      GT.audio.setVolume(+v.value);
      GT.store.set('volume', +v.value);
    });
  }

  /* ---------- boot ---------- */
  document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initMetronome();
    initVolume();
    GT.$('#tabs').addEventListener('click', (e) => {
      const b = e.target.closest('button[data-view]');
      if (b) GT.go(b.dataset.view);
    });
    GT.$('.brand').addEventListener('click', () => GT.go('explore'));
    document.addEventListener('click', (e) => {
      const a = e.target.closest('[data-go]');
      if (!a) return;
      e.preventDefault();
      const [view, q] = a.dataset.go.split('?');
      const params = Object.fromEntries(new URLSearchParams(q || ''));
      GT.go(view, params);
    });
    // Space = play / pause in the current section (unless typing or on a control that handles Space itself)
    document.addEventListener('keydown', (e) => {
      if (e.code !== 'Space' || e.repeat || e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.target.closest('input, textarea, select, button, summary, [contenteditable]')) return;
      const v = GT.views[current];
      if (v && v.transport) {
        e.preventDefault();
        v.transport();
      }
    });
    // unlock audio on first interaction (mobile)
    const unlock = () => {
      GT.audio.ensure();
      window.removeEventListener('pointerdown', unlock);
    };
    window.addEventListener('pointerdown', unlock);
    const start = (location.hash || '').slice(1) || GT.store.get('view', 'explore');
    GT.go(GT.views[start] ? start : 'explore');
    window.addEventListener('hashchange', () => {
      const v = location.hash.slice(1);
      if (GT.views[v] && v !== current) GT.go(v);
    });
  });
})();
