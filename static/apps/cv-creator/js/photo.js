// Photo handling. Uploaded images are checked by their magic bytes, decoded by
// the browser and re-encoded through a canvas as a fresh JPEG. That strips
// EXIF/GPS metadata and anything else embedded in the original file, and SVG
// (which can carry scripts) is never accepted.

const MAX_UPLOAD = 8 * 1024 * 1024;
const OUT_SIZE = 480;

function sniff(bytes) {
  const b = bytes;
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'jpeg';
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return 'png';
  if (b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 &&
      b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50) return 'webp';
  return null;
}

const MIME = { jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp' };

async function squareCanvas(blob, size) {
  const bmp = await createImageBitmap(blob);
  try {
    if (bmp.width < 16 || bmp.height < 16) throw new Error('The image is too small.');
    const side = Math.min(bmp.width, bmp.height);
    const sx = (bmp.width - side) / 2;
    const sy = (bmp.height - side) / 2;
    const c = document.createElement('canvas');
    c.width = c.height = size;
    const g = c.getContext('2d');
    g.fillStyle = '#fff';
    g.fillRect(0, 0, size, size);
    g.imageSmoothingQuality = 'high';
    g.drawImage(bmp, sx, sy, side, side, 0, 0, size, size);
    return c;
  } finally {
    bmp.close();
  }
}

async function bytesToJpegDataUrl(bytes) {
  const kind = sniff(bytes);
  if (!kind) throw new Error('Only JPEG, PNG or WebP images are supported.');
  const canvas = await squareCanvas(new Blob([bytes], { type: MIME[kind] }), OUT_SIZE);
  return canvas.toDataURL('image/jpeg', 0.9);
}

/** File from <input type=file> -> sanitized square JPEG data URL. */
export async function processPhoto(file) {
  if (!file) throw new Error('No file selected.');
  if (file.size > MAX_UPLOAD) throw new Error('The image is larger than 8 MB.');
  const bytes = new Uint8Array(await file.arrayBuffer());
  return bytesToJpegDataUrl(bytes);
}

export function dataUrlBytes(dataUrl) {
  const b64 = dataUrl.slice(dataUrl.indexOf(',') + 1);
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

/** Re-encode a stored/imported data URL so its bytes are always our own. */
export async function reencodeDataUrl(dataUrl) {
  return bytesToJpegDataUrl(dataUrlBytes(dataUrl));
}

/** Round, transparent PNG for the Modern template's DOCX export. */
export async function circlePng(dataUrl, size = 360) {
  const src = await squareCanvas(new Blob([dataUrlBytes(dataUrl)], { type: 'image/jpeg' }), size);
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d');
  g.beginPath();
  g.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
  g.closePath();
  g.clip();
  g.drawImage(src, 0, 0);
  const blob = await new Promise((res) => c.toBlob(res, 'image/png'));
  if (!blob) throw new Error('Could not prepare the photo.');
  return new Uint8Array(await blob.arrayBuffer());
}

/** Neutral silhouette used only for template thumbnails. */
export function placeholderAvatar() {
  const s = 160;
  const c = document.createElement('canvas');
  c.width = c.height = s;
  const g = c.getContext('2d');
  g.fillStyle = '#d9dee5';
  g.fillRect(0, 0, s, s);
  g.fillStyle = '#9aa5b1';
  g.beginPath();
  g.arc(s / 2, s * 0.4, s * 0.18, 0, Math.PI * 2);
  g.fill();
  g.beginPath();
  g.ellipse(s / 2, s * 0.98, s * 0.36, s * 0.3, 0, 0, Math.PI * 2);
  g.fill();
  return c.toDataURL('image/jpeg', 0.85);
}
