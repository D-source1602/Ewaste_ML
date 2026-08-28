/**
 * pdf.ts — a tiny, dependency-free PDF writer.
 *
 * The npm registry is unreachable in this project, so a library like jsPDF is
 * off the table. A PDF is a plain-text object graph, though, so a real, valid
 * document can be assembled by hand: a catalog, a page, two of the built-in
 * Base-14 fonts (no font file to embed), and one content stream of text and
 * line-drawing operators. The byte offsets in the xref table are computed as
 * the file is assembled, which is the only fiddly part.
 *
 * The file is emitted one byte per character (charCodeAt & 0xff), so every
 * character that reaches the stream must live in the single-byte WinAnsi space
 * the standard Helvetica uses — see toWinAnsi(). The rupee sign is not in
 * WinAnsi, so callers should pass "Rs" via money().
 */

/* ── Page + layout geometry (A4, in PDF points) ───────────────────────────── */

const PAGE_W = 595.28;
const PAGE_H = 841.89;
const MARGIN = 56;
const CONTENT_W = PAGE_W - MARGIN * 2;

/** A single laid-out instruction the writer knows how to render. */
export type PdfBlock =
  | { kind: 'title'; text: string }
  | { kind: 'subtitle'; text: string }
  | { kind: 'heading'; text: string }
  | { kind: 'row'; label: string; value: string }
  | { kind: 'para'; text: string }
  | { kind: 'rule' }
  | { kind: 'gap'; h: number };

/* ── Text helpers ──────────────────────────────────────────────────────────── */

/**
 * Maps the "smart" Unicode punctuation the app's copy uses onto the WinAnsi
 * bytes the standard Helvetica carries (em dash U+2014 -> 0x97, etc.). Anything
 * still outside Latin-1 afterwards is dropped to '?' so it can never desync the
 * one-byte-per-character emission.
 */
const WINANSI: Record<number, number> = {
  0x2013: 0x96, // en dash
  0x2014: 0x97, // em dash
  0x2018: 0x91, // left single quote
  0x2019: 0x92, // right single quote / apostrophe
  0x201c: 0x93, // left double quote
  0x201d: 0x94, // right double quote
  0x2022: 0x95, // bullet
  0x2026: 0x85, // ellipsis
};

function toWinAnsi(text: string): string {
  let out = '';
  for (const ch of text) {
    const code = ch.codePointAt(0) ?? 0;
    const mapped = WINANSI[code];
    if (mapped !== undefined) out += String.fromCharCode(mapped);
    else if (code <= 0xff) out += ch;
    else out += '?';
  }
  return out;
}

/** Escapes the three characters that are special inside a PDF string literal. */
function esc(text: string): string {
  return toWinAnsi(text)
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)');
}

/**
 * Approximate width of a Helvetica string in points. The Base-14 metrics vary
 * per glyph, but ~0.5em is close enough for wrapping and right-alignment at the
 * sizes used here, and it never over-runs the margin because it slightly
 * over-estimates narrow text.
 */
function textWidth(text: string, size: number): number {
  return text.length * size * 0.5;
}

/** Greedy word-wrap to a pixel width, so paragraphs never spill the margin. */
function wrap(text: string, size: number, maxW: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = '';
  for (const word of words) {
    const trial = line ? `${line} ${word}` : word;
    if (textWidth(trial, size) > maxW && line) {
      lines.push(line);
      line = word;
    } else {
      line = trial;
    }
  }
  if (line) lines.push(line);
  return lines.length ? lines : [''];
}

/** Formats a rupee amount for the PDF, where the rupee glyph is unavailable. */
export function money(amount: number): string {
  return `Rs ${amount.toLocaleString('en-IN')}`;
}

/* ── Content-stream builder ────────────────────────────────────────────────── */

const ACCENT = '0.09 0.79 0.39'; // leaf green, matching the app's --leaf token
const INK = '0.09 0.11 0.10';
const MUTED = '0.36 0.41 0.39';

function streamFor(blocks: PdfBlock[]): string {
  const ops: string[] = [];
  let y = PAGE_H - MARGIN;

  const line = (x: number, text: string, size: number, font: string, color: string) => {
    ops.push(
      `BT ${color} rg /${font} ${size} Tf 1 0 0 1 ${x.toFixed(2)} ${y.toFixed(2)} Tm (${esc(text)}) Tj ET`,
    );
  };

  for (const b of blocks) {
    switch (b.kind) {
      case 'title':
        y -= 24;
        line(MARGIN, b.text, 22, 'F2', INK);
        y -= 4;
        break;
      case 'subtitle':
        y -= 15;
        line(MARGIN, b.text, 10.5, 'F1', MUTED);
        break;
      case 'heading':
        y -= 26;
        line(MARGIN, b.text.toUpperCase(), 9, 'F2', ACCENT);
        y -= 6;
        break;
      case 'row': {
        y -= 17;
        line(MARGIN, b.label, 10.5, 'F1', MUTED);
        const vw = textWidth(b.value, 10.5);
        line(PAGE_W - MARGIN - vw, b.value, 10.5, 'F2', INK);
        break;
      }
      case 'para': {
        for (const wl of wrap(b.text, 10, CONTENT_W)) {
          y -= 15;
          line(MARGIN, wl, 10, 'F1', INK);
        }
        break;
      }
      case 'rule':
        y -= 12;
        ops.push(
          `0.82 0.85 0.84 RG 0.8 w ${MARGIN} ${y.toFixed(2)} m ${(PAGE_W - MARGIN).toFixed(2)} ${y.toFixed(2)} l S`,
        );
        break;
      case 'gap':
        y -= b.h;
        break;
    }
  }

  return ops.join('\n');
}

/* ── Document assembly ─────────────────────────────────────────────────────── */

/** Builds a complete, valid single-page PDF from laid-out blocks. */
export function buildPdf(blocks: PdfBlock[]): Blob {
  const content = streamFor(blocks);

  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_W} ${PAGE_H}] ` +
      `/Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>',
    `<< /Length ${content.length} >>\nstream\n${content}\nendstream`,
  ];

  let file = '%PDF-1.4\n%\xE2\xE3\xCF\xD3\n';
  const offsets: number[] = [];

  objects.forEach((body, i) => {
    offsets.push(file.length);
    file += `${i + 1} 0 obj\n${body}\nendobj\n`;
  });

  const xrefStart = file.length;
  const count = objects.length + 1;
  let xref = `xref\n0 ${count}\n0000000000 65535 f \n`;
  for (const off of offsets) {
    xref += `${off.toString().padStart(10, '0')} 00000 n \n`;
  }
  file +=
    xref +
    `trailer\n<< /Size ${count} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;

  // Emit one byte per character. Every character in `file` is < U+0100 by
  // construction (see toWinAnsi and the escaped binary header), so the offsets
  // computed from string length above stay exact in the produced bytes.
  const bytes = new Uint8Array(file.length);
  for (let i = 0; i < file.length; i++) bytes[i] = file.charCodeAt(i) & 0xff;
  return new Blob([bytes], { type: 'application/pdf' });
}

/** Triggers a browser download of a blob under the given filename. */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Revoke on the next tick so the click has committed to the download.
  setTimeout(() => URL.revokeObjectURL(url), 0);
}
