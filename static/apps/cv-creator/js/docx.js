// DOCX (Office Open XML) generator with no dependencies.
// Every piece of user text goes through esc(), which removes characters that
// are illegal in XML and escapes markup, so input can never alter the document
// structure. Hyperlink targets come only from safeHref() (http/https/mailto).

import {
  TEMPLATES, parseRich, lines, bulletLines, dateRange, contactList,
  isSectionEmpty, accentFor, tint,
} from './model.js?v=77311bf';
import { zip } from './zip.js?v=77311bf';

const NS = {
  w: 'http://schemas.openxmlformats.org/wordprocessingml/2006/main',
  r: 'http://schemas.openxmlformats.org/officeDocument/2006/relationships',
  wp: 'http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing',
  a: 'http://schemas.openxmlformats.org/drawingml/2006/main',
  pic: 'http://schemas.openxmlformats.org/drawingml/2006/picture',
};
const REL = {
  doc: 'http://schemas.openxmlformats.org/officeDocument/2006/relationships',
  pkg: 'http://schemas.openxmlformats.org/package/2006/relationships',
};
const XML_HEAD = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n';

const INVALID_XML = /[^\u0009\u000A\u000D -퟿-�\u{10000}-\u{10FFFF}]/gu;

export function esc(s) {
  return String(s)
    .replace(INVALID_XML, '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

const PAGE = {
  a4: { w: 11906, h: 16838 },
  letter: { w: 12240, h: 15840 },
};
const MARGIN = { top: 900, bottom: 900, side: 1020 };
const EMU_PER_PT = 12700;

// ---- Per-template styling (mirrors css/cv.css) ------------------------------

function styleFor(cv) {
  const accent = accentFor(cv).slice(1).toUpperCase();
  const gray = '595959';
  const base = {
    font: 'Arial', body: 20, accent, gray,
    name: { sz: 48, b: true }, nameAfter: 40,
    title: { sz: 26, color: accent }, titleAfter: 120,
    contact: 19, linkColor: accent, headerAlign: 'left',
    heading: { sz: 22, b: true, color: accent, caps: true, spacing: 30 },
    headingBorder: { color: accent, sz: 8 },
    role: { sz: 21, b: true },
    org: { sz: 21, b: true, color: accent },
    dates: { sz: 19, color: gray },
    loc: { sz: 18, i: true, color: gray },
    label: { b: true, color: accent },
  };
  switch (cv.template) {
    case 'classic':
      return {
        ...base, font: 'Georgia', gray: '444444',
        name: { sz: 44 }, title: { sz: 24, i: true, color: '333333' }, headerAlign: 'center',
        heading: { sz: 24, b: true, color: accent, smallCaps: true, spacing: 20 },
        headingBorder: { color: accent, sz: 6 },
        org: { sz: 21, i: true }, dates: { sz: 19, color: '444444' }, loc: { sz: 18, i: true, color: '444444' },
        label: { b: true },
      };
    case 'ats':
      return {
        ...base, gray: '333333', linkColor: '000000',
        name: { sz: 40, b: true }, title: { sz: 24 },
        heading: { sz: 22, b: true, caps: true },
        headingBorder: { color: '000000', sz: 6 },
        org: { sz: 21 }, dates: { sz: 19, color: '333333' }, loc: { sz: 18, i: true, color: '333333' },
        label: { b: true },
      };
    case 'modern':
      return { ...base, name: { sz: 44, b: true }, title: { sz: 24, color: accent }, contact: 18 };
    default:
      return base;
  }
}

// ---- XML builders ------------------------------------------------------------

function rPr(o, font) {
  let x = `<w:rFonts w:ascii="${font}" w:hAnsi="${font}" w:cs="${font}" w:eastAsia="${font}"/>`;
  if (o.b) x += '<w:b/><w:bCs/>';
  if (o.i) x += '<w:i/><w:iCs/>';
  if (o.caps) x += '<w:caps/>';
  if (o.smallCaps) x += '<w:smallCaps/>';
  if (o.color) x += `<w:color w:val="${o.color}"/>`;
  if (o.spacing) x += `<w:spacing w:val="${o.spacing}"/>`;
  if (o.sz) x += `<w:sz w:val="${o.sz}"/><w:szCs w:val="${o.sz}"/>`;
  return `<w:rPr>${x}</w:rPr>`;
}

function pPr(o = {}) {
  let x = '';
  if (o.keepNext) x += '<w:keepNext/>';
  if (o.numId) x += `<w:numPr><w:ilvl w:val="0"/><w:numId w:val="${o.numId}"/></w:numPr>`;
  if (o.border) x += `<w:pBdr><w:bottom w:val="single" w:sz="${o.border.sz}" w:space="3" w:color="${o.border.color}"/></w:pBdr>`;
  if (o.tabs) x += `<w:tabs>${o.tabs.map((t) => `<w:tab w:val="${t.val}" w:pos="${t.pos}"/>`).join('')}</w:tabs>`;
  x += `<w:spacing w:before="${o.before || 0}" w:after="${o.after || 0}" w:line="${o.line || 240}" w:lineRule="auto"/>`;
  if (o.jc && o.jc !== 'left') x += `<w:jc w:val="${o.jc}"/>`;
  return `<w:pPr>${x}</w:pPr>`;
}

const para = (content, o) => `<w:p>${pPr(o)}${content}</w:p>`;

class Ctx {
  constructor(st) {
    this.st = st;
    this.rels = [];
    this.media = [];
    this.next = 10;
    this.drawingId = 1;
  }
  rel(type, target, external = false) {
    const id = 'rId' + this.next++;
    this.rels.push({ id, type, target, external });
    return id;
  }
  run(text, o = {}) {
    const body = String(text).split(/(\t|\n)/).map((part) => {
      if (part === '\t') return '<w:tab/>';
      if (part === '\n') return '<w:br/>';
      return part ? `<w:t xml:space="preserve">${esc(part)}</w:t>` : '';
    }).join('');
    return `<w:r>${rPr(o, this.st.font)}${body}</w:r>`;
  }
  rich(text, o = {}) {
    return parseRich(text).map((r) => this.run(r.text, { ...o, b: o.b || r.bold })).join('');
  }
  link(href, inner) {
    if (!href) return inner;
    const id = this.rel(`${REL.doc}/hyperlink`, href, true);
    return `<w:hyperlink r:id="${id}" w:history="1">${inner}</w:hyperlink>`;
  }
  image(photo, sizePt, jc) {
    const name = `image${this.media.length + 1}.${photo.ext}`;
    this.media.push({ name, bytes: photo.bytes });
    const id = this.rel(`${REL.doc}/image`, `media/${name}`);
    const emu = Math.round(sizePt * EMU_PER_PT);
    const n = this.drawingId++;
    const drawing =
      `<w:r><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0">` +
      `<wp:extent cx="${emu}" cy="${emu}"/><wp:effectExtent l="0" t="0" r="0" b="0"/>` +
      `<wp:docPr id="${n}" name="Photo ${n}" descr="Profile photo"/>` +
      `<wp:cNvGraphicFramePr><a:graphicFrameLocks noChangeAspect="1"/></wp:cNvGraphicFramePr>` +
      `<a:graphic><a:graphicData uri="${NS.pic}"><pic:pic>` +
      `<pic:nvPicPr><pic:cNvPr id="${n}" name="${name}"/><pic:cNvPicPr/></pic:nvPicPr>` +
      `<pic:blipFill><a:blip r:embed="${id}"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill>` +
      `<pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${emu}" cy="${emu}"/></a:xfrm>` +
      `<a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr>` +
      `</pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r>`;
    return para(drawing, { jc });
  }
}

// ---- Content blocks ----------------------------------------------------------

function contactRuns(ctx, items) {
  const { st } = ctx;
  return items.map((it, i) => {
    const sep = i ? ctx.run('   |   ', { sz: st.contact, color: st.gray }) : '';
    const r = it.href
      ? ctx.link(it.href, ctx.run(it.text, { sz: st.contact, color: st.linkColor }))
      : ctx.run(it.text, { sz: st.contact, color: st.gray });
    return sep + r;
  }).join('');
}

function headerParas(cv, ctx, jc) {
  const { st } = ctx;
  const p = cv.personal;
  let x = '';
  if (p.name.trim()) x += para(ctx.run(p.name.trim(), st.name), { after: st.nameAfter, jc });
  if (p.title.trim()) x += para(ctx.run(p.title.trim(), st.title), { after: st.titleAfter, jc });
  const { line1, line2 } = contactList(p);
  if (line1.length) x += para(contactRuns(ctx, line1), { after: 30, jc });
  if (line2.length) x += para(contactRuns(ctx, line2), { jc });
  return x;
}

function heading(ctx, title) {
  return para(ctx.run(title, ctx.st.heading), {
    keepNext: true, border: ctx.st.headingBorder, before: 220, after: 100,
  });
}

function bullet(ctx, text) {
  return para(ctx.rich(text, { sz: ctx.st.body }), { numId: 1, after: 50, line: 264 });
}

function sectionXml(sec, ctx, width, narrow) {
  if (isSectionEmpty(sec)) return '';
  const { st } = ctx;
  let x = heading(ctx, sec.title);

  if (sec.type === 'text') {
    for (const l of lines(sec.content)) x += para(ctx.rich(l, { sz: st.body }), { after: 40, line: 276 });
  } else if (sec.type === 'list') {
    for (const l of bulletLines(sec.content)) x += bullet(ctx, l);
  } else if (sec.type === 'labeled') {
    for (const it of sec.items) {
      const label = it.label.trim();
      const text = it.text.trim();
      if (!label && !text) continue;
      const labelStyle = { ...st.label, sz: st.body };
      if (narrow) {
        if (label) x += para(ctx.run(label, labelStyle), { after: text ? 10 : 70, keepNext: !!text });
        if (text) x += para(ctx.rich(text, { sz: st.body }), { after: 70, line: 260 });
      } else {
        x += para((label ? ctx.run(label + '  ', labelStyle) : '') + ctx.rich(text, { sz: st.body }), { after: 70, line: 270 });
      }
    }
  } else {
    for (const it of sec.items) {
      const role = it.title.trim();
      const org = it.org.trim();
      const loc = it.location.trim();
      const dates = dateRange(it);
      const bullets = bulletLines(it.bullets);
      if (!role && !org && !loc && !dates && !bullets.length) continue;

      if (narrow) {
        if (role) x += para(ctx.run(role, st.role), { before: 120, keepNext: true });
        if (org) x += para(ctx.run(org, st.org), { before: role ? 0 : 120, keepNext: true });
        const meta = [dates, loc].filter(Boolean).join('  ·  ');
        if (meta) x += para(ctx.run(meta, st.dates), { after: 40, keepNext: bullets.length > 0 });
      } else {
        let head = role ? ctx.run(role, st.role) : '';
        if (org) head += (role ? ctx.run('  |  ', { sz: st.role.sz, color: st.gray }) : '') + ctx.run(org, st.org);
        if (dates) head += ctx.run('\t' + dates, st.dates);
        x += para(head, {
          before: 150, after: loc ? 0 : 60, keepNext: !!(loc || bullets.length),
          tabs: [{ val: 'right', pos: width }],
        });
        if (loc) x += para(ctx.run(loc, st.loc), { after: 60, keepNext: bullets.length > 0 });
      }
      for (const b of bullets) x += bullet(ctx, b);
    }
  }
  return x;
}

const NO_BORDERS =
  '<w:tblBorders>' +
  ['top', 'left', 'bottom', 'right', 'insideH', 'insideV'].map((s) => `<w:${s} w:val="nil"/>`).join('') +
  '</w:tblBorders>';

function table(widths, cells) {
  const total = widths.reduce((a, b) => a + b, 0);
  const tcs = cells.map((c, i) => {
    const mar = c.mar || [0, 0, 0, 0]; // top, left, bottom, right
    const shd = c.fill ? `<w:shd w:val="clear" w:color="auto" w:fill="${c.fill}"/>` : '';
    return `<w:tc><w:tcPr><w:tcW w:w="${widths[i]}" w:type="dxa"/>${shd}` +
      `<w:tcMar><w:top w:w="${mar[0]}" w:type="dxa"/><w:left w:w="${mar[1]}" w:type="dxa"/>` +
      `<w:bottom w:w="${mar[2]}" w:type="dxa"/><w:right w:w="${mar[3]}" w:type="dxa"/></w:tcMar>` +
      `<w:vAlign w:val="${c.valign || 'top'}"/></w:tcPr>${c.content || '<w:p/>'}</w:tc>`;
  }).join('');
  return `<w:tbl><w:tblPr><w:tblW w:w="${total}" w:type="dxa"/>${NO_BORDERS}<w:tblLayout w:type="fixed"/>` +
    `<w:tblCellMar><w:left w:w="0" w:type="dxa"/><w:right w:w="0" w:type="dxa"/></w:tblCellMar>` +
    `<w:tblLook w:val="0000"/></w:tblPr>` +
    `<w:tblGrid>${widths.map((w) => `<w:gridCol w:w="${w}"/>`).join('')}</w:tblGrid>` +
    `<w:tr>${tcs}</w:tr></w:tbl>`;
}

// ---- Layouts -----------------------------------------------------------------

function singleColumnBody(cv, ctx, width, photo) {
  const jc = ctx.st.headerAlign;
  let x;
  if (photo) {
    const photoCol = 1750;
    x = table([width - photoCol, photoCol], [
      { content: headerParas(cv, ctx, jc) || '<w:p/>', valign: 'center', mar: [0, 0, 0, 120] },
      { content: ctx.image(photo, 78, 'right'), valign: 'center' },
    ]);
  } else {
    x = headerParas(cv, ctx, jc);
  }
  for (const sec of cv.sections) x += sectionXml(sec, ctx, width, false);
  return x;
}

function modernBody(cv, ctx, width, photo) {
  const { st } = ctx;
  const side = Math.round(width * 0.3345);
  const main = width - side;
  const pad = 200;
  const gap = 240;

  let aside = '';
  if (photo) aside += ctx.image(photo, 86, 'center');
  const { line1, line2 } = contactList(cv.personal);
  const contacts = [...line1, ...line2];
  if (contacts.length) {
    aside += heading(ctx, cv.contactTitle || 'Contact');
    for (const it of contacts) {
      const style = { sz: st.contact, color: it.href ? st.linkColor : '333333' };
      aside += para(ctx.link(it.href, ctx.run(it.text, style)), { after: 60 });
    }
  }
  for (const sec of cv.sections) if (sec.sidebar) aside += sectionXml(sec, ctx, side - 2 * pad, true);

  let body = '';
  const p = cv.personal;
  if (p.name.trim()) body += para(ctx.run(p.name.trim(), st.name), { after: st.nameAfter });
  if (p.title.trim()) body += para(ctx.run(p.title.trim(), st.title), { after: 60 });
  for (const sec of cv.sections) if (!sec.sidebar) body += sectionXml(sec, ctx, main - gap, false);

  return table([side, main], [
    { content: aside, fill: tint('#' + st.accent, 0.1), mar: [pad, pad, pad, pad] },
    { content: body, mar: [0, gap, 0, 0] },
  ]) + para('', { line: 20 });
}

// ---- Package parts ---------------------------------------------------------------

function stylesXml(st) {
  const f = st.font;
  return XML_HEAD +
    `<w:styles xmlns:w="${NS.w}"><w:docDefaults><w:rPrDefault><w:rPr>` +
    `<w:rFonts w:ascii="${f}" w:hAnsi="${f}" w:cs="${f}" w:eastAsia="${f}"/>` +
    `<w:sz w:val="${st.body}"/><w:szCs w:val="${st.body}"/><w:lang w:val="en-US"/>` +
    `</w:rPr></w:rPrDefault><w:pPrDefault><w:pPr><w:spacing w:after="0" w:line="240" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults>` +
    `<w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/><w:qFormat/></w:style>` +
    `<w:style w:type="table" w:default="1" w:styleId="TableNormal"><w:name w:val="Normal Table"/><w:uiPriority w:val="99"/><w:semiHidden/>` +
    `<w:tblPr><w:tblInd w:w="0" w:type="dxa"/><w:tblCellMar><w:top w:w="0" w:type="dxa"/><w:left w:w="108" w:type="dxa"/>` +
    `<w:bottom w:w="0" w:type="dxa"/><w:right w:w="108" w:type="dxa"/></w:tblCellMar></w:tblPr></w:style>` +
    `</w:styles>`;
}

function numberingXml(st) {
  return XML_HEAD +
    `<w:numbering xmlns:w="${NS.w}"><w:abstractNum w:abstractNumId="0"><w:multiLevelType w:val="singleLevel"/>` +
    `<w:lvl w:ilvl="0"><w:start w:val="1"/><w:numFmt w:val="bullet"/><w:lvlText w:val="•"/><w:lvlJc w:val="left"/>` +
    `<w:pPr><w:ind w:left="340" w:hanging="220"/></w:pPr>` +
    `<w:rPr><w:rFonts w:ascii="${st.font}" w:hAnsi="${st.font}"/></w:rPr></w:lvl></w:abstractNum>` +
    `<w:num w:numId="1"><w:abstractNumId w:val="0"/></w:num></w:numbering>`;
}

function footerXml(cv, ctx) {
  const o = { sz: 16, color: '595959' };
  const r = rPr(o, ctx.st.font);
  const field = (instr) =>
    `<w:r>${r}<w:fldChar w:fldCharType="begin"/></w:r>` +
    `<w:r>${r}<w:instrText xml:space="preserve"> ${instr} </w:instrText></w:r>` +
    `<w:r>${r}<w:fldChar w:fldCharType="separate"/></w:r>` +
    `<w:r>${r}<w:t>1</w:t></w:r>` +
    `<w:r>${r}<w:fldChar w:fldCharType="end"/></w:r>`;
  const name = cv.personal.name.trim();
  return XML_HEAD +
    `<w:ftr xmlns:w="${NS.w}" xmlns:r="${NS.r}">` +
    para((name ? ctx.run(name + '   |   ', o) : '') + field('PAGE') + ctx.run(' / ', o) + field('NUMPAGES'), { jc: 'center' }) +
    `</w:ftr>`;
}

function relsXml(rels) {
  return XML_HEAD +
    `<Relationships xmlns="${REL.pkg}">` +
    rels.map((r) =>
      `<Relationship Id="${r.id}" Type="${r.type}" Target="${esc(r.target)}"${r.external ? ' TargetMode="External"' : ''}/>`,
    ).join('') +
    `</Relationships>`;
}

/**
 * @param {object} cv  sanitized CV
 * @param {{photo?: {bytes: Uint8Array, ext: 'jpeg'|'png'}}} opts
 * @returns {Uint8Array} the .docx file
 */
export function buildDocx(cv, opts = {}) {
  const st = styleFor(cv);
  const ctx = new Ctx(st);
  const page = PAGE[cv.paper] || PAGE.a4;
  const width = page.w - 2 * MARGIN.side;
  const photo = TEMPLATES[cv.template].photo ? opts.photo : null;

  let body = cv.template === 'modern'
    ? modernBody(cv, ctx, width, photo)
    : singleColumnBody(cv, ctx, width, photo);
  if (!body) body = '<w:p/>';

  const fixedRels = [
    { id: 'rId1', type: `${REL.doc}/styles`, target: 'styles.xml' },
    { id: 'rId2', type: `${REL.doc}/numbering`, target: 'numbering.xml' },
    { id: 'rId3', type: `${REL.doc}/settings`, target: 'settings.xml' },
  ];
  let footerRef = '';
  const files = [];
  if (cv.showFooter) {
    fixedRels.push({ id: 'rId4', type: `${REL.doc}/footer`, target: 'footer1.xml' });
    footerRef = '<w:footerReference w:type="default" r:id="rId4"/>';
    files.push({ name: 'word/footer1.xml', data: footerXml(cv, ctx) });
  }

  const documentXml = XML_HEAD +
    `<w:document xmlns:w="${NS.w}" xmlns:r="${NS.r}" xmlns:wp="${NS.wp}" xmlns:a="${NS.a}" xmlns:pic="${NS.pic}"><w:body>` +
    body +
    `<w:sectPr>${footerRef}<w:pgSz w:w="${page.w}" w:h="${page.h}"/>` +
    `<w:pgMar w:top="${MARGIN.top}" w:right="${MARGIN.side}" w:bottom="${MARGIN.bottom}" w:left="${MARGIN.side}" w:header="500" w:footer="400" w:gutter="0"/>` +
    `</w:sectPr></w:body></w:document>`;

  const contentTypes = XML_HEAD +
    `<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">` +
    `<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>` +
    `<Default Extension="xml" ContentType="application/xml"/>` +
    `<Default Extension="jpeg" ContentType="image/jpeg"/>` +
    `<Default Extension="png" ContentType="image/png"/>` +
    `<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>` +
    `<Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>` +
    `<Override PartName="/word/numbering.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.numbering+xml"/>` +
    `<Override PartName="/word/settings.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.settings+xml"/>` +
    (cv.showFooter ? `<Override PartName="/word/footer1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml"/>` : '') +
    `<Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>` +
    `<Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>` +
    `</Types>`;

  const now = new Date().toISOString().replace(/\.\d+Z$/, 'Z');
  const name = cv.personal.name.trim();
  const core = XML_HEAD +
    `<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" ` +
    `xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" ` +
    `xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">` +
    `<dc:title>${esc(name ? name + ' – CV' : 'CV')}</dc:title><dc:creator>${esc(name)}</dc:creator>` +
    `<dcterms:created xsi:type="dcterms:W3CDTF">${now}</dcterms:created>` +
    `<dcterms:modified xsi:type="dcterms:W3CDTF">${now}</dcterms:modified></cp:coreProperties>`;

  return zip([
    { name: '[Content_Types].xml', data: contentTypes },
    {
      name: '_rels/.rels', data: relsXml([
        { id: 'rId1', type: `${REL.doc}/officeDocument`, target: 'word/document.xml' },
        { id: 'rId2', type: `${REL.pkg}/metadata/core-properties`, target: 'docProps/core.xml' },
        { id: 'rId3', type: `${REL.doc}/extended-properties`, target: 'docProps/app.xml' },
      ]),
    },
    { name: 'docProps/core.xml', data: core },
    {
      name: 'docProps/app.xml',
      data: XML_HEAD + '<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties"><Application>CV Creator</Application></Properties>',
    },
    { name: 'word/document.xml', data: documentXml },
    { name: 'word/styles.xml', data: stylesXml(st) },
    { name: 'word/numbering.xml', data: numberingXml(st) },
    {
      name: 'word/settings.xml',
      data: XML_HEAD + `<w:settings xmlns:w="${NS.w}"><w:defaultTabStop w:val="720"/><w:compat>` +
        `<w:compatSetting w:name="compatibilityMode" w:uri="http://schemas.microsoft.com/office/word" w:val="15"/></w:compat></w:settings>`,
    },
    ...files,
    { name: 'word/_rels/document.xml.rels', data: relsXml([...fixedRels, ...ctx.rels]) },
    ...ctx.media.map((m) => ({ name: `word/media/${m.name}`, data: m.bytes })),
  ]);
}
