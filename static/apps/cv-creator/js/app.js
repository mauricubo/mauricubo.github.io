import {
  TEMPLATES, SECTION_TYPES, LIMITS, emptyCV, sanitizeCV, newSection, newItem,
  isHexColor, safeFileName,
} from './model.js?v=6bb2890';
import { SAMPLE } from './sample.js?v=6bb2890';
import { renderCV, el } from './render.js?v=6bb2890';
import { buildDocx } from './docx.js?v=6bb2890';
import { processPhoto, reencodeDataUrl, dataUrlBytes, circlePng, placeholderAvatar } from './photo.js?v=6bb2890';

const STORAGE_KEY = 'cv-creator:data:v1';
const STORAGE_PREF = 'cv-creator:remember';
const MAX_IMPORT = 6 * 1024 * 1024;

const $ = (id) => document.getElementById(id);

// ---- Persistence -------------------------------------------------------------
// localStorage on github.io is shared by every project page of the same user,
// so the key is namespaced and whatever is read back is sanitized again.

function storageGet(key) {
  try { return localStorage.getItem(key); } catch { return null; }
}
function storageSet(key, value) {
  try { localStorage.setItem(key, value); return true; } catch { return false; }
}
function storageRemove(key) {
  try { localStorage.removeItem(key); } catch { /* ignore */ }
}

let remember = storageGet(STORAGE_PREF) !== 'off';

function loadSaved() {
  const raw = storageGet(STORAGE_KEY);
  if (!raw) return null;
  try { return sanitizeCV(JSON.parse(raw)); } catch { return null; }
}

let saveTimer = 0;
function scheduleSave() {
  if (!remember) return;
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    if (!storageSet(STORAGE_KEY, JSON.stringify(cv))) toast('Could not save in this browser (storage full or blocked).');
  }, 400);
}

// ---- State -------------------------------------------------------------------

const saved = loadSaved();
let cv = saved || emptyCV();
const collapsed = new Set();

function changed() {
  schedulePreview();
  scheduleSave();
}
function structural() {
  buildForm();
  changed();
}

// ---- Small UI helpers --------------------------------------------------------

let toastTimer = 0;
function toast(msg) {
  const t = $('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 3500);
}

function button(label, onClick, { cls = 'btn small ghost', aria, disabled } = {}) {
  const b = el('button', cls, label);
  b.type = 'button';
  if (aria) b.setAttribute('aria-label', aria);
  if (aria) b.title = aria;
  if (disabled) b.disabled = true;
  b.addEventListener('click', onClick);
  return b;
}

function field(label, value, onInput, opts = {}) {
  const { multiline = false, max = LIMITS.short, placeholder = '', type = 'text', rows = 3, hint = '', wide = false } = opts;
  const wrap = el('label', wide ? 'field wide' : 'field', el('span', 'field-label', label));
  const input = document.createElement(multiline ? 'textarea' : 'input');
  if (!multiline) input.type = type;
  else input.rows = rows;
  input.value = value;
  input.maxLength = max;
  input.spellcheck = multiline;
  if (placeholder) input.placeholder = placeholder;
  input.addEventListener('input', () => { onInput(input.value); changed(); });
  wrap.append(input);
  if (hint) wrap.append(el('span', 'field-hint', hint));
  return wrap;
}

function checkbox(label, checked, onChange) {
  const input = document.createElement('input');
  input.type = 'checkbox';
  input.checked = checked;
  input.addEventListener('change', () => onChange(input.checked));
  return el('label', 'check', input, el('span', null, label));
}

function move(list, i, delta) {
  const j = i + delta;
  if (j < 0 || j >= list.length) return;
  [list[i], list[j]] = [list[j], list[i]];
  structural();
}

function card(key, title, subtitle, ...body) {
  const d = el('details', 'card');
  d.open = !collapsed.has(key);
  d.addEventListener('toggle', () => { if (d.open) collapsed.delete(key); else collapsed.add(key); });
  const titleEl = el('span', 'card-title', title);
  const summary = el('summary', null, titleEl, subtitle && el('span', 'card-sub', subtitle));
  d.append(summary, el('div', 'card-body', ...body));
  d.titleEl = titleEl;
  return d;
}

// ---- Form ----------------------------------------------------------------------

function personalCard() {
  const p = cv.personal;
  const tpl = TEMPLATES[cv.template];

  const links = el('div', 'links');
  p.links.forEach((l, i) => {
    const row = el('div', 'link-row',
      field(`Link ${i + 1}`, l, (v) => { p.links[i] = v; }, { max: LIMITS.medium, placeholder: 'linkedin.com/in/your-name' }),
      button('Remove', () => { p.links.splice(i, 1); structural(); }, { aria: `Remove link ${i + 1}` }),
    );
    links.append(row);
  });
  if (p.links.length < LIMITS.links) {
    links.append(button('+ Add link', () => { p.links.push(''); structural(); }, { cls: 'btn small' }));
  }

  // Photo
  const photoBox = el('div', 'photo-box');
  if (!tpl.photo) {
    photoBox.append(el('p', 'field-hint', `The ${tpl.name} format doesn't show a photo.`));
  } else {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/jpeg,image/png,image/webp';
    input.hidden = true;
    input.addEventListener('change', async () => {
      const file = input.files && input.files[0];
      input.value = '';
      if (!file) return;
      try {
        p.photo = await processPhoto(file);
        structural();
      } catch (e) {
        toast(e instanceof Error ? e.message : 'Could not read that image.');
      }
    });
    if (p.photo) {
      const img = el('img', 'photo-thumb');
      img.src = p.photo;
      img.alt = 'Your photo';
      photoBox.append(img);
    }
    photoBox.append(
      el('div', 'photo-actions',
        button(p.photo ? 'Replace photo' : 'Add photo', () => input.click(), { cls: 'btn small' }),
        p.photo && button('Remove photo', () => { p.photo = ''; structural(); }),
        input,
      ),
      el('p', 'field-hint', 'JPEG, PNG or WebP. It is cropped to a square and its metadata is removed.'),
    );
  }

  return card('personal', 'Personal details', null,
    el('div', 'grid2',
      field('Full name', p.name, (v) => { p.name = v; }, { placeholder: 'Jane Doe', wide: true }),
      field('Job title', p.title, (v) => { p.title = v; }, { placeholder: 'Software Engineer', wide: true }),
      field('Email', p.email, (v) => { p.email = v; }, { type: 'email', placeholder: 'jane@example.com' }),
      field('Phone', p.phone, (v) => { p.phone = v; }, { type: 'tel', placeholder: '+00 000 000 000' }),
      field('Location', p.location, (v) => { p.location = v; }, { placeholder: 'City, Country', wide: true }),
    ),
    links,
    photoBox,
  );
}

function settingsCard() {
  const tpl = TEMPLATES[cv.template];
  const color = document.createElement('input');
  color.type = 'color';
  color.value = cv.accent.toLowerCase();
  color.disabled = !tpl.accent;
  color.addEventListener('input', () => {
    if (isHexColor(color.value)) { cv.accent = color.value.toUpperCase(); changed(); }
  });

  const paper = document.createElement('select');
  for (const [v, label] of [['a4', 'A4 (210 × 297 mm)'], ['letter', 'US Letter (8.5 × 11 in)']]) {
    const o = el('option', null, label);
    o.value = v;
    o.selected = cv.paper === v;
    paper.append(o);
  }
  paper.addEventListener('change', () => { cv.paper = paper.value === 'letter' ? 'letter' : 'a4'; changed(); });

  const body = [
    el('div', 'grid2',
      el('label', 'field', el('span', 'field-label', 'Accent colour'), color,
        !tpl.accent && el('span', 'field-hint', `${tpl.name} is always black and white.`)),
      el('label', 'field', el('span', 'field-label', 'Paper size'), paper),
    ),
    checkbox('Page footer with name and page numbers', cv.showFooter, (v) => { cv.showFooter = v; changed(); }),
  ];
  if (tpl.photo) body.push(checkbox('Show photo', cv.showPhoto, (v) => { cv.showPhoto = v; changed(); }));
  if (tpl.sidebar) {
    body.push(field('Sidebar contact heading', cv.contactTitle, (v) => { cv.contactTitle = v; }, { placeholder: 'Contact' }));
  }
  body.push(checkbox('Remember my CV in this browser', remember, (v) => {
    remember = v;
    storageSet(STORAGE_PREF, v ? 'on' : 'off');
    if (v) scheduleSave();
    else { storageRemove(STORAGE_KEY); toast('Saved copy removed from this browser.'); }
  }));
  return card('settings', 'Layout and options', TEMPLATES[cv.template].name, ...body);
}

function itemTools(list, i, noun, onRemove) {
  return el('div', 'item-tools',
    button('↑', () => move(list, i, -1), { aria: `Move ${noun} up`, disabled: i === 0 }),
    button('↓', () => move(list, i, 1), { aria: `Move ${noun} down`, disabled: i === list.length - 1 }),
    button('Remove', onRemove, { aria: `Remove ${noun}` }),
  );
}

function labeledEditor(sec) {
  const box = el('div', 'items');
  sec.items.forEach((it, i) => {
    box.append(el('div', 'item',
      el('div', 'item-head', el('span', 'item-title', `Line ${i + 1}`),
        itemTools(sec.items, i, 'line', () => { sec.items.splice(i, 1); structural(); })),
      field('Label (shown in bold)', it.label, (v) => { it.label = v; }, { placeholder: 'e.g. Cloud platforms' }),
      field('Text', it.text, (v) => { it.text = v; }, { multiline: true, rows: 2, max: LIMITS.long }),
    ));
  });
  if (sec.items.length < LIMITS.items) {
    box.append(button('+ Add line', () => { sec.items.push(newItem('labeled')); structural(); }, { cls: 'btn small' }));
  }
  return box;
}

function entriesEditor(sec) {
  const box = el('div', 'items');
  sec.items.forEach((it, i) => {
    box.append(el('div', 'item',
      el('div', 'item-head', el('span', 'item-title', it.title || it.org || `Entry ${i + 1}`),
        itemTools(sec.items, i, 'entry', () => {
          if (window.confirm('Remove this entry?')) { sec.items.splice(i, 1); structural(); }
        })),
      el('div', 'grid2',
        field('Role / degree', it.title, (v) => { it.title = v; }, { placeholder: 'Software Engineer' }),
        field('Organisation', it.org, (v) => { it.org = v; }, { placeholder: 'Company or school' }),
        field('Start', it.start, (v) => { it.start = v; }, { max: 40, placeholder: '01/2020' }),
        field('End', it.end, (v) => { it.end = v; }, { max: 40, placeholder: 'Present' }),
        field('Location', it.location, (v) => { it.location = v; }, { placeholder: 'City, Country', wide: true }),
      ),
      field('Bullet points (one per line)', it.bullets, (v) => { it.bullets = v; }, {
        multiline: true, rows: 4, max: LIMITS.long,
        placeholder: '**Achievement:** what you did and the result.\nAnother bullet point.',
      }),
    ));
  });
  if (sec.items.length < LIMITS.items) {
    box.append(button('+ Add entry', () => { sec.items.push(newItem('entries')); structural(); }, { cls: 'btn small' }));
  }
  return box;
}

function sectionCard(sec, idx) {
  const tpl = TEMPLATES[cv.template];
  const c = card(sec.id, sec.title || 'Untitled section', SECTION_TYPES[sec.type]);
  const body = c.querySelector('.card-body');

  body.append(
    el('div', 'section-tools',
      button('↑ Move up', () => move(cv.sections, idx, -1), { disabled: idx === 0 }),
      button('↓ Move down', () => move(cv.sections, idx, 1), { disabled: idx === cv.sections.length - 1 }),
      button('Delete section', () => {
        if (window.confirm(`Delete the section "${sec.title || 'Untitled'}"?`)) { cv.sections.splice(idx, 1); structural(); }
      }, { cls: 'btn small ghost danger' }),
    ),
    field('Section title', sec.title, (v) => { sec.title = v; c.titleEl.textContent = v || 'Untitled section'; }),
  );
  if (tpl.sidebar) {
    body.append(checkbox('Place in the sidebar', sec.sidebar, (v) => { sec.sidebar = v; changed(); }));
  }
  if (sec.type === 'text') {
    body.append(field('Text', sec.content, (v) => { sec.content = v; }, { multiline: true, rows: 5, max: LIMITS.long }));
  } else if (sec.type === 'list') {
    body.append(field('Items (one per line)', sec.content, (v) => { sec.content = v; }, { multiline: true, rows: 5, max: LIMITS.long }));
  } else if (sec.type === 'labeled') {
    body.append(labeledEditor(sec));
  } else {
    body.append(entriesEditor(sec));
  }
  return c;
}

function addSectionCard() {
  const select = document.createElement('select');
  for (const [k, v] of Object.entries(SECTION_TYPES)) {
    const o = el('option', null, v);
    o.value = k;
    select.append(o);
  }
  const title = document.createElement('input');
  title.type = 'text';
  title.maxLength = LIMITS.short;
  title.placeholder = 'e.g. Projects';
  return el('div', 'card add-section',
    el('h2', 'card-title', 'Add a section'),
    el('div', 'grid2',
      el('label', 'field', el('span', 'field-label', 'Title'), title),
      el('label', 'field', el('span', 'field-label', 'Type'), select),
    ),
    button('+ Add section', () => {
      if (cv.sections.length >= LIMITS.sections) { toast(`You can have up to ${LIMITS.sections} sections.`); return; }
      const type = Object.hasOwn(SECTION_TYPES, select.value) ? select.value : 'text';
      cv.sections.push(newSection(type, title.value.trim() || 'New section'));
      structural();
    }, { cls: 'btn small' }),
  );
}

function buildForm() {
  const pane = $('form-pane');
  const scroll = pane.scrollTop;
  $('form').replaceChildren(
    el('p', 'tip', 'Tip: wrap words in ', el('code', null, '**double asterisks**'), ' to make them bold.'),
    personalCard(),
    settingsCard(),
    ...cv.sections.map(sectionCard),
    addSectionCard(),
  );
  pane.scrollTop = scroll;
}

// ---- Preview -------------------------------------------------------------------

let raf = 0;
function schedulePreview() {
  if (raf) return;
  raf = requestAnimationFrame(() => { raf = 0; renderPreview(); });
}

function renderPreview() {
  const page = renderCV(cv);
  $('preview-host').replaceChildren(page);
  $('preview-template').textContent = `Format: ${TEMPLATES[cv.template].name}`;
  fitPreview();
  updatePrintRules();
}

function fitPreview() {
  const host = $('preview-host');
  const page = host.firstElementChild;
  if (!page) return;
  page.style.zoom = '1';
  const available = host.clientWidth - 32;
  const z = Math.min(1, available / page.offsetWidth);
  page.style.zoom = String(Math.max(0.3, z));
}

new ResizeObserver(() => fitPreview()).observe($('preview-host'));

// @page rules depend on the CV (paper size, footer name), so they live in a
// constructable stylesheet (CSSOM, allowed by the CSP). The name is escaped as
// a CSS string so it cannot break out of the rule.
const printSheet = new CSSStyleSheet();
document.adoptedStyleSheets = [...document.adoptedStyleSheets, printSheet];

function cssString(s) {
  return '"' + String(s).replace(/[\u0000-\u001F\u007F]/g, ' ').replace(/[\\"]/g, '\\$&') + '"';
}

function updatePrintRules() {
  const size = cv.paper === 'letter' ? 'letter' : 'A4';
  let rules = `@page { size: ${size}; margin: 45pt 51pt; }`;
  if (cv.showFooter) {
    const name = cv.personal.name.trim();
    const font = cv.template === 'classic' ? 'Georgia, serif' : 'Arial, sans-serif';
    rules += `@page { @bottom-center { content: ${cssString(name ? name + '   |   ' : '')} counter(page) " / " counter(pages);` +
      ` font: 8pt ${font}; color: #595959; white-space: pre; } }`;
  }
  try { printSheet.replaceSync(rules); } catch { printSheet.replaceSync(`@page { size: ${size}; margin: 45pt 51pt; }`); }
}

// ---- Views ---------------------------------------------------------------------

function showChooser() {
  $('view-editor').hidden = true;
  $('editor-actions').hidden = true;
  $('view-chooser').hidden = false;
  $('resume-row').hidden = !(saved || started);
  buildChooser();
  window.scrollTo(0, 0);
}

let started = false;
function showEditor() {
  started = true;
  $('view-chooser').hidden = true;
  $('view-editor').hidden = false;
  $('editor-actions').hidden = false;
  buildForm();
  renderPreview();
}

function buildChooser() {
  const grid = $('tpl-grid');
  const demo = sanitizeCV(SAMPLE);
  demo.personal.photo = placeholderAvatar();
  grid.replaceChildren(...Object.entries(TEMPLATES).map(([id, t]) => {
    const thumb = el('div', 'tpl-thumb', renderCV({ ...demo, template: id }));
    thumb.setAttribute('aria-hidden', 'true');
    thumb.inert = true;
    const b = el('button', 'tpl-card' + (id === cv.template && (saved || started) ? ' current' : ''),
      thumb,
      el('span', 'tpl-name', t.name),
      el('span', 'tpl-desc', t.desc),
      el('span', 'tpl-tags', ...t.tags.map((tag) => el('span', 'tag', tag))),
    );
    b.type = 'button';
    b.addEventListener('click', () => {
      cv.template = id;
      scheduleSave();
      showEditor();
    });
    return b;
  }));
}

// ---- Toolbar actions -------------------------------------------------------------

function download(data, type, filename) {
  const url = URL.createObjectURL(new Blob([data], { type }));
  const a = el('a');
  a.href = url;
  a.download = filename;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

$('btn-templates').addEventListener('click', showChooser);
$('btn-resume').addEventListener('click', showEditor);

$('btn-example').addEventListener('click', () => {
  if (!window.confirm('Replace your current content with example content?')) return;
  const template = cv.template;
  cv = sanitizeCV(SAMPLE);
  cv.template = template;
  structural();
});

$('btn-clear').addEventListener('click', () => {
  if (!window.confirm('Delete everything and start from an empty CV? This cannot be undone.')) return;
  const template = cv.template;
  cv = emptyCV();
  cv.template = template;
  storageRemove(STORAGE_KEY);
  structural();
  toast('All data cleared.');
});

$('btn-save-json').addEventListener('click', () => {
  download(JSON.stringify(cv, null, 2), 'application/json', `${safeFileName(cv.personal.name)}_data.json`);
  toast('Data saved. Use Import to load it again later.');
});

$('btn-import').addEventListener('click', () => $('import-file').click());
$('import-file').addEventListener('change', async (e) => {
  const input = e.target;
  const file = input.files && input.files[0];
  input.value = '';
  if (!file) return;
  if (file.size > MAX_IMPORT) { toast('That file is too large.'); return; }
  try {
    const next = sanitizeCV(JSON.parse(await file.text()));
    if (next.personal.photo) {
      try { next.personal.photo = await reencodeDataUrl(next.personal.photo); } catch { next.personal.photo = ''; }
    }
    cv = next;
    structural();
    toast('Data imported.');
  } catch {
    toast('That file is not a valid CV data file.');
  }
});

$('btn-docx').addEventListener('click', async () => {
  const btn = $('btn-docx');
  btn.disabled = true;
  try {
    let photo;
    if (cv.personal.photo && cv.showPhoto && TEMPLATES[cv.template].photo) {
      photo = cv.template === 'modern'
        ? { bytes: await circlePng(cv.personal.photo), ext: 'png' }
        : { bytes: dataUrlBytes(cv.personal.photo), ext: 'jpeg' };
    }
    const bytes = buildDocx(cv, { photo });
    download(bytes, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', `${safeFileName(cv.personal.name)}.docx`);
  } catch (e) {
    console.error(e);
    toast('Could not create the DOCX file.');
  } finally {
    btn.disabled = false;
  }
});

const pdfDialog = $('pdf-dialog');
let originalTitle = document.title;
$('btn-pdf').addEventListener('click', () => pdfDialog.showModal());
$('btn-print-cancel').addEventListener('click', () => pdfDialog.close());
$('btn-print').addEventListener('click', () => {
  pdfDialog.close();
  originalTitle = document.title;
  document.title = safeFileName(cv.personal.name); // default PDF file name
  renderPreview();
  setTimeout(() => window.print(), 50);
});
window.addEventListener('afterprint', () => { document.title = originalTitle; });

// ---- Start -----------------------------------------------------------------------
showChooser();
