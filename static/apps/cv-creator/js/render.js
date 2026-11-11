// Renders a CV as DOM for the live preview and for printing to PDF.
// Only createElement / textContent / validated attributes are used — never
// innerHTML — so user text is always treated as text, never as markup.

import {
  TEMPLATES, parseRich, lines, bulletLines, dateRange, contactList,
  isSectionEmpty, photoFor, accentFor,
} from './model.js?v=6bb2890';

export function el(tag, cls, ...kids) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  for (const k of kids) if (k) e.append(k); // skips null/false/''/0
  return e;
}

function rich(tag, cls, text) {
  const e = el(tag, cls);
  for (const r of parseRich(text)) e.append(r.bold ? el('strong', null, r.text) : r.text);
  return e;
}

function linkOrText(item, cls) {
  if (!item.href) return el('span', cls, item.text);
  const a = el('a', cls, item.text);
  a.href = item.href; // already validated by safeHref()
  a.rel = 'noopener noreferrer';
  a.target = '_blank';
  return a;
}

function joined(cls, items) {
  const p = el('p', cls);
  items.forEach((it, i) => {
    if (i) p.append(el('span', 'cv-sep', '   |   '));
    p.append(linkOrText(it, it.href ? 'cv-link' : null));
  });
  return p;
}

function photoImg(cv) {
  const src = photoFor(cv);
  if (!src) return null;
  const img = el('img', 'cv-photo');
  img.src = src; // validated data:image/jpeg;base64 URL
  img.alt = 'Profile photo';
  return img;
}

function section(sec, narrow) {
  if (isSectionEmpty(sec)) return null;
  const s = el('section', `cv-sec cv-sec-${sec.type}`, el('h2', 'cv-sec-title', sec.title));

  if (sec.type === 'text') {
    for (const l of lines(sec.content)) s.append(rich('p', 'cv-text', l));
  } else if (sec.type === 'list') {
    const ul = el('ul', 'cv-bullets');
    for (const l of bulletLines(sec.content)) ul.append(rich('li', null, l));
    s.append(ul);
  } else if (sec.type === 'labeled') {
    for (const it of sec.items) {
      const label = it.label.trim();
      const text = it.text.trim();
      if (!label && !text) continue;
      const p = rich('p', 'cv-labeled', text);
      if (label) p.prepend(el('strong', 'cv-label', label), narrow ? '' : '  ');
      s.append(p);
    }
  } else {
    for (const it of sec.items) {
      const role = it.title.trim();
      const org = it.org.trim();
      const loc = it.location.trim();
      const dates = dateRange(it);
      const bullets = bulletLines(it.bullets);
      if (!role && !org && !loc && !dates && !bullets.length) continue;

      const head = el('div', 'cv-entry-head',
        role && el('span', 'cv-role', role),
        role && org && el('span', 'cv-sep', '  |  '),
        org && el('span', 'cv-org', org),
        dates && el('span', 'cv-dates', dates),
      );
      const entry = el('div', 'cv-entry', head, loc && el('div', 'cv-loc', loc));
      if (bullets.length) {
        const ul = el('ul', 'cv-bullets');
        for (const b of bullets) ul.append(rich('li', null, b));
        entry.append(ul);
      }
      s.append(entry);
    }
  }
  return s;
}

function singleColumn(cv, page) {
  const p = cv.personal;
  const { line1, line2 } = contactList(p);
  const head = el('header', 'cv-head',
    el('div', 'cv-head-main',
      p.name.trim() && el('h1', 'cv-name', p.name.trim()),
      p.title.trim() && el('p', 'cv-title', p.title.trim()),
      line1.length && joined('cv-contact', line1),
      line2.length && joined('cv-contact', line2),
    ),
    photoImg(cv),
  );
  page.append(head);
  for (const sec of cv.sections) {
    const s = section(sec, false);
    if (s) page.append(s);
  }
}

function modern(cv, page) {
  const p = cv.personal;
  const aside = el('aside', 'cv-aside');
  const img = photoImg(cv);
  if (img) aside.append(el('div', 'cv-photo-wrap', img));

  const { line1, line2 } = contactList(p);
  const contacts = [...line1, ...line2];
  if (contacts.length) {
    const s = el('section', 'cv-sec', el('h2', 'cv-sec-title', cv.contactTitle || 'Contact'));
    for (const it of contacts) s.append(el('p', 'cv-contact-item', linkOrText(it, it.href ? 'cv-link' : null)));
    aside.append(s);
  }
  const main = el('div', 'cv-main',
    p.name.trim() && el('h1', 'cv-name', p.name.trim()),
    p.title.trim() && el('p', 'cv-title', p.title.trim()),
  );
  for (const sec of cv.sections) {
    const s = section(sec, sec.sidebar);
    if (s) (sec.sidebar ? aside : main).append(s);
  }
  page.append(el('div', 'cv-grid', aside, main));
}

export function renderCV(cv) {
  const page = el('article', `cv-page tpl-${cv.template} paper-${cv.paper}`);
  if (TEMPLATES[cv.template].accent) page.style.setProperty('--accent', accentFor(cv));
  if (cv.template === 'modern') modern(cv, page);
  else singleColumn(cv, page);
  return page;
}
