// Data model, validation and shared helpers.
// Everything that comes from the user (form, imported JSON, localStorage) goes
// through sanitizeCV() so the rest of the app can trust the shape and types.

export const LIMITS = Object.freeze({
  short: 150,      // names, titles, labels, dates
  medium: 400,     // links
  long: 5000,      // paragraphs and bullet blocks
  links: 6,
  sections: 20,
  items: 40,
  photoChars: 3_000_000, // base64 data URL length cap
});

export const SECTION_TYPES = Object.freeze({
  text: 'Paragraph',
  labeled: 'Label + text lines',
  entries: 'Entries (jobs, studies…)',
  list: 'Bullet list',
});

export const TEMPLATES = Object.freeze({
  professional: {
    name: 'Professional',
    desc: 'Single column with photo, accent headings with a rule and right-aligned dates.',
    tags: ['Photo', 'Accent colour'],
    photo: true, accent: true, sidebar: false,
  },
  classic: {
    name: 'Classic',
    desc: 'Traditional serif layout with a centred header. Common in law, finance and academia.',
    tags: ['No photo', 'Serif'],
    photo: false, accent: true, sidebar: false,
  },
  modern: {
    name: 'Modern',
    desc: 'Two columns: a tinted sidebar for contact details and skills, experience on the right.',
    tags: ['Photo', 'Two columns'],
    photo: true, accent: true, sidebar: true,
  },
  ats: {
    name: 'ATS Simple',
    desc: 'Plain single column with no colour, photo or tables. Best for applicant tracking systems.',
    tags: ['ATS friendly', 'No photo'],
    photo: false, accent: false, sidebar: false,
  },
});

export const DEFAULT_ACCENT = '#1F4E79';

export function uid() {
  const a = new Uint32Array(2);
  crypto.getRandomValues(a);
  return a[0].toString(36) + a[1].toString(36);
}

// Control characters (except tab/newline) are never useful in a CV and some are
// invalid in XML, so they are stripped at the boundary.
const CTRL = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;

export function cleanStr(v, max) {
  if (typeof v !== 'string') return '';
  return v.replace(/\r\n?/g, '\n').replace(CTRL, '').slice(0, max);
}

export function oneLine(v, max) {
  return cleanStr(v, max).replace(/[\n\t]+/g, ' ');
}

export function isHexColor(v) {
  return typeof v === 'string' && /^#[0-9a-f]{6}$/i.test(v);
}

const PHOTO_RE = /^data:image\/jpeg;base64,[A-Za-z0-9+/]+={0,2}$/;
export function isPhotoDataUrl(v) {
  return typeof v === 'string' && v.length <= LIMITS.photoChars && PHOTO_RE.test(v);
}

export function newSection(type, title = '') {
  const s = { id: uid(), type, title, sidebar: false };
  if (type === 'text' || type === 'list') s.content = '';
  else s.items = [];
  return s;
}

export function newItem(type) {
  if (type === 'labeled') return { id: uid(), label: '', text: '' };
  return { id: uid(), title: '', org: '', location: '', start: '', end: '', bullets: '' };
}

export function emptyCV() {
  const sec = (type, title, sidebar = false) => ({ ...newSection(type, title), sidebar });
  return {
    version: 1,
    template: 'professional',
    accent: DEFAULT_ACCENT,
    paper: 'a4',
    showFooter: true,
    showPhoto: true,
    contactTitle: 'Contact',
    personal: { name: '', title: '', email: '', phone: '', location: '', links: [], photo: '' },
    sections: [
      sec('text', 'Profile'),
      sec('labeled', 'Core strengths', true),
      sec('entries', 'Experience'),
      sec('entries', 'Education'),
      sec('labeled', 'Certifications and training', true),
      sec('text', 'Languages', true),
    ],
  };
}

const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const arr = (v, max) => (Array.isArray(v) ? v.slice(0, max).filter(isObj) : []);

function sanitizeSection(s) {
  if (!isObj(s) || typeof s.type !== 'string' || !Object.hasOwn(SECTION_TYPES, s.type)) return null;
  const out = { id: uid(), type: s.type, title: oneLine(s.title, LIMITS.short), sidebar: s.sidebar === true };
  if (s.type === 'text' || s.type === 'list') {
    out.content = cleanStr(s.content, LIMITS.long);
  } else if (s.type === 'labeled') {
    out.items = arr(s.items, LIMITS.items).map((i) => ({
      id: uid(),
      label: oneLine(i.label, LIMITS.short),
      text: cleanStr(i.text, LIMITS.long),
    }));
  } else {
    out.items = arr(s.items, LIMITS.items).map((i) => ({
      id: uid(),
      title: oneLine(i.title, LIMITS.short),
      org: oneLine(i.org, LIMITS.short),
      location: oneLine(i.location, LIMITS.short),
      start: oneLine(i.start, 40),
      end: oneLine(i.end, 40),
      bullets: cleanStr(i.bullets, LIMITS.long),
    }));
  }
  return out;
}

// Builds a brand-new object from known keys only. Unknown keys (including
// "__proto__" / "constructor") are ignored, types are coerced, lengths capped.
export function sanitizeCV(raw) {
  const out = emptyCV();
  if (!isObj(raw)) return out;

  if (typeof raw.template === 'string' && Object.hasOwn(TEMPLATES, raw.template)) out.template = raw.template;
  if (isHexColor(raw.accent)) out.accent = raw.accent.toUpperCase();
  out.paper = raw.paper === 'letter' ? 'letter' : 'a4';
  out.showFooter = raw.showFooter !== false;
  out.showPhoto = raw.showPhoto !== false;
  if (typeof raw.contactTitle === 'string') out.contactTitle = oneLine(raw.contactTitle, LIMITS.short);

  const p = isObj(raw.personal) ? raw.personal : {};
  out.personal = {
    name: oneLine(p.name, LIMITS.short),
    title: oneLine(p.title, LIMITS.short),
    email: oneLine(p.email, LIMITS.short),
    phone: oneLine(p.phone, LIMITS.short),
    location: oneLine(p.location, LIMITS.short),
    links: Array.isArray(p.links)
      ? p.links.slice(0, LIMITS.links).filter((l) => typeof l === 'string').map((l) => oneLine(l, LIMITS.medium))
      : [],
    photo: isPhotoDataUrl(p.photo) ? p.photo : '',
  };

  if (Array.isArray(raw.sections)) {
    out.sections = raw.sections.slice(0, LIMITS.sections).map(sanitizeSection).filter(Boolean);
  }
  return out;
}

// ---- Links -----------------------------------------------------------------

// Returns a safe href or '' if the value cannot be turned into one.
// Only http(s) and mailto are produced, so "javascript:", "data:" etc. never
// reach an href in the preview, the PDF or the DOCX.
export function safeHref(input, kind = 'url') {
  const s = String(input ?? '').trim();
  if (!s) return '';
  if (kind === 'email') {
    return /^[^\s@<>()"'`,;:?&\\/]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(s) ? 'mailto:' + s : '';
  }
  const withScheme = /^[a-z][a-z0-9+.-]*:/i.test(s) ? s : 'https://' + s;
  let u;
  try { u = new URL(withScheme); } catch { return ''; }
  if (u.protocol !== 'https:' && u.protocol !== 'http:') return '';
  if (!u.hostname || !u.hostname.includes('.') || u.username || u.password) return '';
  return u.href;
}

// ---- Text helpers shared by the HTML and DOCX renderers -----------------------

// "**bold** rest" -> [{text:'bold', bold:true}, {text:' rest', bold:false}]
export function parseRich(s) {
  const runs = [];
  const re = /\*\*(.+?)\*\*/g;
  let last = 0;
  let m;
  while ((m = re.exec(s))) {
    if (m.index > last) runs.push({ text: s.slice(last, m.index), bold: false });
    runs.push({ text: m[1], bold: true });
    last = re.lastIndex;
  }
  if (last < s.length) runs.push({ text: s.slice(last), bold: false });
  return runs;
}

export const lines = (text) => String(text || '').split('\n').map((l) => l.trim()).filter(Boolean);

// Accept bullets typed as "- foo", "• foo" or "* foo" (but keep "**bold**").
export const bulletLines = (text) => lines(text).map((l) => l.replace(/^(?:[-•–·]|\*(?!\*))\s*/, '')).filter(Boolean);

export function dateRange(item) {
  const a = item.start.trim();
  const b = item.end.trim();
  if (a && b) return `${a} – ${b}`;
  return a || b;
}

export function contactList(p) {
  const line1 = [];
  const line2 = [];
  if (p.email.trim()) line1.push({ text: p.email.trim(), href: safeHref(p.email, 'email'), kind: 'email' });
  if (p.phone.trim()) line1.push({ text: p.phone.trim(), href: '', kind: 'phone' });
  if (p.location.trim()) line1.push({ text: p.location.trim(), href: '', kind: 'location' });
  for (const l of p.links) {
    if (l.trim()) line2.push({ text: l.trim(), href: safeHref(l, 'url'), kind: 'link' });
  }
  return { line1, line2 };
}

export function isSectionEmpty(sec) {
  if (sec.type === 'text' || sec.type === 'list') return lines(sec.content).length === 0;
  if (sec.type === 'labeled') return !sec.items.some((i) => i.label.trim() || i.text.trim());
  return !sec.items.some((i) => [i.title, i.org, i.location, i.start, i.end, i.bullets].some((v) => v.trim()));
}

export function photoFor(cv) {
  const t = TEMPLATES[cv.template];
  return t.photo && cv.showPhoto && cv.personal.photo ? cv.personal.photo : '';
}

export function accentFor(cv) {
  return TEMPLATES[cv.template].accent ? cv.accent : '#000000';
}

// Mix the accent with white: used for the Modern sidebar background.
export function tint(hex, amount = 0.1) {
  const n = parseInt(hex.slice(1), 16);
  const mix = (c) => Math.round(c * amount + 255 * (1 - amount));
  const r = mix((n >> 16) & 255);
  const g = mix((n >> 8) & 255);
  const b = mix(n & 255);
  return ((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1).toUpperCase();
}

export function safeFileName(name) {
  const base = String(name || '')
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^A-Za-z0-9._-]+/g, '_')
    .replace(/^[_.]+|[_.]+$/g, '')
    .slice(0, 60);
  return (base ? base + '_' : '') + 'CV';
}
