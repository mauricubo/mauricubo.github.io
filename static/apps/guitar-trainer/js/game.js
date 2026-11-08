/* game.js — XP, levels, daily goal, practice streak and badges shared by every section */
(function () {
  'use strict';
  const GT = window.GT;
  const { $, store, esc } = GT;

  const TITLES = ['Newcomer', 'Strummer', 'Picker', 'Riff maker', 'Groove keeper', 'Changes player', 'Arpeggio adept', 'Harmony hacker', 'Session player', 'Fretboard master', 'Virtuoso'];
  const BADGES = [
    { id: 'first-xp', icon: '🎸', name: 'First steps', desc: 'Earn your first XP.' },
    { id: 'mic', icon: '🎤', name: 'Plugged in', desc: 'Let the app listen to your guitar.' },
    { id: 'harmony-unit', icon: '🎓', name: 'Unit cleared', desc: 'Complete a Harmony unit.' },
    { id: 'harmony-perfect', icon: '💯', name: 'Perfect check', desc: 'Score 8/8 on a Harmony check.' },
    { id: 'harmony-half', icon: '🧭', name: 'Halfway there', desc: 'Complete 6 Harmony units.' },
    { id: 'harmony-all', icon: '🏆', name: 'Harmony graduate', desc: 'Complete all 12 Harmony units.' },
    { id: 'arp-first', icon: '🔁', name: 'First arpeggio', desc: 'Finish an arpeggio workout.' },
    { id: 'arp-positions', icon: '🗺️', name: 'Five positions', desc: 'Finish all 5 vertical positions of one chord.' },
    { id: 'arp-types', icon: '🎨', name: 'Colour collector', desc: 'Finish workouts with 4 different chord types.' },
    { id: 'arp-changes', icon: '🔗', name: 'Through the changes', desc: 'Finish an arpeggio workout over a progression.' },
    { id: 'arp-clean', icon: '🎯', name: 'Clean run', desc: 'Finish a microphone workout with 90%+ accuracy.' },
    { id: 'arp-speed', icon: '⚡', name: 'Speed builder', desc: 'Reach 120 bpm with the speed trainer.' },
    { id: 'improv-targets', icon: '🏹', name: 'Target practice', desc: 'Land 25 chord tones on the beat in the Improvise lab.' },
    { id: 'streak-3', icon: '🔥', name: 'On fire', desc: 'Practise 3 days in a row.' },
    { id: 'streak-7', icon: '🌟', name: 'One-week streak', desc: 'Practise 7 days in a row.' },
    { id: 'level-5', icon: '🚀', name: 'Level 5', desc: 'Reach level 5.' },
  ];
  const DAILY_GOAL = 100;

  const st = Object.assign({ xp: 0, badges: {}, days: {}, counters: {} }, store.get('game', {}));
  const save = () => store.set('game', st);

  const today = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  /** XP needed to reach a level: 0, 100, 300, 600, 1000, 1500… */
  const xpFor = (lv) => 50 * lv * (lv - 1);
  function levelOf(xp) {
    let lv = 1;
    while (xpFor(lv + 1) <= xp) lv++;
    return lv;
  }
  function streak() {
    const d = new Date();
    if (!st.days[today(d)]) d.setDate(d.getDate() - 1); // today not started yet: count up to yesterday
    let n = 0;
    while (st.days[today(d)]) {
      n++;
      d.setDate(d.getDate() - 1);
    }
    return n;
  }

  /* ---------- floating "+XP" notes ---------- */
  function float(html, cls = '') {
    let box = $('#xpFloat');
    if (!box) {
      box = GT.h('<div id="xpFloat" aria-live="polite"></div>');
      document.body.appendChild(box);
    }
    const el = GT.h(`<div class="xp-float ${cls}">${html}</div>`);
    box.appendChild(el);
    setTimeout(() => el.classList.add('out'), cls.includes('big') ? 3200 : 1600);
    setTimeout(() => el.remove(), cls.includes('big') ? 3800 : 2200);
  }

  const G = (GT.game = {
    BADGES,
    get xp() {
      return st.xp;
    },
    get level() {
      return levelOf(st.xp);
    },
    streak,
    has: (id) => !!st.badges[id],
    count(key, by = 1) {
      st.counters[key] = (st.counters[key] || 0) + by;
      save();
      return st.counters[key];
    },
    counter: (key) => st.counters[key] || 0,
    /** Add XP with a short reason; handles level-ups, streaks and daily goal */
    award(n, reason = '') {
      if (!n) return;
      const before = levelOf(st.xp);
      const d = today();
      const wasToday = st.days[d] || 0;
      st.xp += n;
      st.days[d] = wasToday + n;
      // keep ~2 months of history
      Object.keys(st.days)
        .sort()
        .slice(0, -70)
        .forEach((k) => delete st.days[k]);
      save();
      float(`+${n} XP${reason ? ` <span>${esc(reason)}</span>` : ''}`);
      if (wasToday < DAILY_GOAL && wasToday + n >= DAILY_GOAL) float('🎯 Daily goal reached!', 'big');
      const after = levelOf(st.xp);
      if (after > before) {
        float(`⬆️ Level ${after}: ${TITLES[Math.min(after - 1, TITLES.length - 1)]}`, 'big level');
        if (GT.audio) GT.audio.bell();
      }
      G.unlock('first-xp');
      const s = streak();
      if (s >= 3) G.unlock('streak-3');
      if (s >= 7) G.unlock('streak-7');
      if (after >= 5) G.unlock('level-5');
      render();
    },
    /** Unlock a badge once (+25 XP) */
    unlock(id) {
      if (st.badges[id]) return false;
      const b = BADGES.find((x) => x.id === id);
      if (!b) return false;
      st.badges[id] = today();
      save();
      float(`${b.icon} Badge: <strong>${esc(b.name)}</strong>`, 'big badge');
      setTimeout(() => G.award(25, 'badge'), 400);
      return true;
    },
  });

  /* ---------- header pill + panel ---------- */
  let pill, panel;
  function render() {
    if (!pill) return;
    const lv = levelOf(st.xp);
    const lo = xpFor(lv);
    const hi = xpFor(lv + 1);
    const pct = Math.round(((st.xp - lo) / (hi - lo)) * 100);
    const s = streak();
    pill.innerHTML = `<span class="xp-lv">Lv ${lv}</span><span class="xp-bar"><i style="width:${pct}%"></i></span>${s ? `<span class="xp-streak">🔥${s}</span>` : ''}`;
    pill.title = `Level ${lv} · ${st.xp} XP · ${hi - st.xp} XP to level ${lv + 1}`;
    if (panel && !panel.hidden) renderPanel();
  }
  function renderPanel() {
    const lv = levelOf(st.xp);
    const lo = xpFor(lv);
    const hi = xpFor(lv + 1);
    const todayXp = st.days[today()] || 0;
    const goalPct = Math.min(100, Math.round((todayXp / DAILY_GOAL) * 100));
    const got = BADGES.filter((b) => st.badges[b.id]).length;
    panel.innerHTML = `
      <div class="xp-head">
        <div class="xp-ring" style="--p:${goalPct}"><span>${todayXp}<small>/${DAILY_GOAL}</small></span></div>
        <div><p class="eyebrow">Level ${lv} · ${TITLES[Math.min(lv - 1, TITLES.length - 1)]}</p>
          <strong>${st.xp} XP</strong><span class="muted small"> · ${hi - st.xp} to level ${lv + 1}</span>
          <div class="hm-meter"><i style="width:${Math.round(((st.xp - lo) / (hi - lo)) * 100)}%"></i></div>
          <span class="muted small">Daily goal ${DAILY_GOAL} XP · 🔥 ${streak()}-day streak</span></div>
      </div>
      <p class="xp-sub">Badges <span class="muted">${got}/${BADGES.length}</span></p>
      <div class="xp-badges">${BADGES.map(
        (b) => `<div class="xp-badge ${st.badges[b.id] ? 'on' : ''}" title="${esc(b.desc)}"><span>${b.icon}</span><strong>${esc(b.name)}</strong><small>${esc(b.desc)}</small></div>`
      ).join('')}</div>
      <p class="muted small xp-how">Earn XP by answering questions, finishing exercises and workouts, and landing chord tones in time.</p>`;
  }

  document.addEventListener('DOMContentLoaded', () => {
    const bar = $('.top-actions');
    if (!bar) return;
    pill = GT.h('<button class="xp-pill" type="button" aria-haspopup="dialog" aria-label="Your progress"></button>');
    panel = GT.h('<div class="xp-panel" role="dialog" aria-label="Your progress" hidden></div>');
    bar.prepend(pill);
    document.body.appendChild(panel);
    pill.addEventListener('click', (e) => {
      e.stopPropagation();
      panel.hidden = !panel.hidden;
      if (!panel.hidden) renderPanel();
    });
    document.addEventListener('click', (e) => {
      if (!panel.hidden && !e.target.closest('.xp-panel')) panel.hidden = true;
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') panel.hidden = true;
    });
    render();
  });
})();
