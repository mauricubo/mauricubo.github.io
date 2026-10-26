/* fretboard.js — reusable SVG fretboard renderer */
(function () {
  'use strict';
  const GT = (window.GT = window.GT || {});
  const { pretty, SHARPS } = GT.theory;
  const NS = 'http://www.w3.org/2000/svg';
  const INLAYS = [3, 5, 7, 9, 15, 17, 19, 21];

  class Fretboard {
    constructor(el, opts = {}) {
      this.el = el;
      this.opts = Object.assign({ frets: 15, tuning: [40, 45, 50, 55, 59, 64], lefty: false, onClick: null }, opts);
      this.notes = [];
      el.classList.add('fretboard');
      el.addEventListener('click', (e) => {
        const hit = e.target.closest('[data-hit]');
        if (hit && this.opts.onClick) this.opts.onClick(+hit.dataset.s, +hit.dataset.f, e);
      });
      this.render();
    }

    set(opts) {
      const geomChanged = ['frets', 'tuning', 'lefty'].some((k) => k in opts && String(opts[k]) !== String(this.opts[k]));
      Object.assign(this.opts, opts);
      if (geomChanged) this.render();
      return this;
    }

    geom() {
      const F = this.opts.frets;
      const n = this.opts.tuning.length;
      const W = 1200;
      const padL = 62;
      const padR = 16;
      const padT = 22;
      const gap = 34;
      const boardH = gap * (n - 1);
      const H = padT + boardH + 44;
      const usable = W - padL - padR;
      const realDen = 1 - Math.pow(2, -F / 12);
      const xs = [];
      for (let f = 0; f <= F; f++) {
        const real = (1 - Math.pow(2, -f / 12)) / realDen;
        xs.push(padL + usable * (0.62 * real + 0.38 * (f / F)));
      }
      const lefty = this.opts.lefty;
      const X = (x) => (lefty ? W - x : x);
      const noteX = (f) => X(f === 0 ? xs[0] - 24 : (xs[f - 1] + xs[f]) / 2);
      const y = (s) => padT + (n - 1 - s) * gap;
      return { F, n, W, H, xs, X, noteX, y, gap, padT, boardH };
    }

    render() {
      const g = (this.g = this.geom());
      const { F, n, W, H, xs, X, y, gap, padT, boardH } = g;
      let svg = `<svg viewBox="0 0 ${W} ${H}" xmlns="${NS}" role="img" aria-label="Guitar fretboard">`;
      const bx1 = Math.min(X(xs[0]), X(xs[F]));
      const bw = Math.abs(X(xs[F]) - X(xs[0]));
      svg += `<rect class="fb-board" x="${bx1}" y="${padT - 12}" width="${bw}" height="${boardH + 24}" rx="4"/>`;
      // inlays
      const mid = padT + boardH / 2;
      for (let f = 1; f <= F; f++) {
        const cx = (X(xs[f - 1]) + X(xs[f])) / 2;
        if (f % 12 === 0) {
          svg += `<circle class="fb-inlay" cx="${cx}" cy="${padT + gap * 1.5}" r="6"/><circle class="fb-inlay" cx="${cx}" cy="${padT + boardH - gap * 1.5}" r="6"/>`;
        } else if (INLAYS.includes(f)) {
          svg += `<circle class="fb-inlay" cx="${cx}" cy="${mid}" r="6"/>`;
        }
      }
      // frets
      for (let f = 1; f <= F; f++) {
        svg += `<line class="fb-fret" x1="${X(xs[f])}" y1="${padT - 12}" x2="${X(xs[f])}" y2="${padT + boardH + 12}"/>`;
      }
      svg += `<rect class="fb-nut" x="${X(xs[0]) - 3}" y="${padT - 12}" width="6" height="${boardH + 24}" rx="2"/>`;
      // strings
      for (let s = 0; s < n; s++) {
        const w = (1 + (n - 1 - s) * 0.32).toFixed(2);
        svg += `<line class="fb-string" x1="${X(xs[0] - 44)}" y1="${y(s)}" x2="${X(xs[F])}" y2="${y(s)}" stroke-width="${w}"/>`;
        const name = pretty(SHARPS[this.opts.tuning[s] % 12]);
        svg += `<text class="fb-tuning" x="${X(14)}" y="${y(s)}" dy="0.35em">${name}</text>`;
      }
      // fret numbers
      for (let f = 1; f <= F; f++) {
        if (INLAYS.includes(f) || f % 12 === 0 || f === 1) {
          const cx = (X(xs[f - 1]) + X(xs[f])) / 2;
          svg += `<text class="fb-fretnum" x="${cx}" y="${padT + boardH + 32}">${f}</text>`;
        }
      }
      // hit zones
      svg += '<g class="fb-hits">';
      for (let s = 0; s < n; s++) {
        for (let f = 0; f <= F; f++) {
          const xa = f === 0 ? xs[0] - 44 : xs[f - 1];
          const xb = f === 0 ? xs[0] - 4 : xs[f];
          const x1 = Math.min(X(xa), X(xb));
          svg += `<rect data-hit="1" data-s="${s}" data-f="${f}" x="${x1}" y="${y(s) - gap / 2}" width="${Math.abs(X(xb) - X(xa))}" height="${gap}"/>`;
        }
      }
      svg += '</g><g class="fb-notes"></g><g class="fb-fx"></g></svg>';
      this.el.innerHTML = svg;
      this.svg = this.el.querySelector('svg');
      this.layer = this.el.querySelector('.fb-notes');
      this.fx = this.el.querySelector('.fb-fx');
      this.draw(this.notes);
    }

    noteSVG(nt, extraCls = '') {
      const { noteX, y } = this.g;
      const label = nt.label ?? '';
      const len = [...String(label)].length;
      const fs = len >= 4 ? 8.5 : len === 3 ? 9.5 : 11.5;
      const r = nt.small ? 8 : 12.5;
      const cls = ['fb-note', nt.cls || '', extraCls].join(' ').trim();
      return `<g class="${cls}" data-k="${nt.s}-${nt.f}" transform="translate(${noteX(nt.f).toFixed(1)},${y(nt.s)})"><circle r="${r}"/>${
        label !== '' ? `<text dy="0.36em" font-size="${fs}">${label}</text>` : ''
      }</g>`;
    }

    /** notes: [{s, f, label, cls}] */
    draw(notes) {
      this.notes = notes || [];
      if (!this.layer) return;
      if (this.opts.frets !== undefined) this.notes = this.notes.filter((n) => n.f <= this.opts.frets && n.s < this.opts.tuning.length);
      // ghosts first so active notes sit on top
      const sorted = this.notes.slice().sort((a, b) => (a.cls || '').includes('ghost') ? -1 : (b.cls || '').includes('ghost') ? 1 : 0);
      this.layer.innerHTML = sorted.map((n) => this.noteSVG(n)).join('');
    }

    /** temporary highlight */
    flash(s, f, cls = 'playing', ms = 260, label) {
      if (!this.layer || f > this.opts.frets) return;
      const el = this.layer.querySelector(`[data-k="${s}-${f}"]`);
      if (el && label === undefined) {
        el.classList.add(cls);
        setTimeout(() => el.classList.remove(cls), ms);
        return;
      }
      const wrap = document.createElementNS(NS, 'g');
      wrap.innerHTML = this.noteSVG({ s, f, label: label ?? '' }, 'fx ' + cls);
      const node = wrap.firstChild;
      this.fx.appendChild(node);
      setTimeout(() => node.remove(), ms);
    }

    clearFx() {
      if (this.fx) this.fx.innerHTML = '';
    }

    midiAt(s, f) {
      return this.opts.tuning[s] + f;
    }
  }

  GT.Fretboard = Fretboard;
})();
