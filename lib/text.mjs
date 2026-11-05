// Feed text arrives with HTML, entities and boilerplate mixed in.
// These helpers turn it into plain text that is safe to show.

const NAMED_ENTITIES = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ',
  rsquo: '’', lsquo: '‘', rdquo: '”', ldquo: '“', ndash: '–', mdash: '—',
  hellip: '…', rupee: '₹', eacute: 'é', middot: '·', bull: '•',
};

export function decodeEntities(text) {
  return text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (match, code) => {
    if (code[0] === '#') {
      const isHex = code[1] === 'x' || code[1] === 'X';
      const point = parseInt(code.slice(isHex ? 2 : 1), isHex ? 16 : 10);
      const valid = Number.isInteger(point) && point > 0 && point <= 0x10ffff;
      return valid ? String.fromCodePoint(point) : '';
    }
    return NAMED_ENTITIES[code.toLowerCase()] ?? match;
  });
}

export function toPlainText(value) {
  if (value === undefined || value === null) return '';
  // Some feeds double-encode, so "&amp;#8217;" needs two passes.
  let text = decodeEntities(decodeEntities(String(value)));
  text = text
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<[^>]*>/g, ' ');
  text = decodeEntities(text);
  return text.replace(/\s+/g, ' ').trim();
}

const SUMMARY_TAILS = [
  /\s*The post .* appeared first on .*$/i,
  /\s*\[?(…|\.\.\.)\]?\s*(read more|continue reading).*$/i,
  /\s*(read more|continue reading|click here).*$/i,
  /\s*\[(…|\.\.\.)\]\s*$/,
];

export const SUMMARY_LIMIT = 230;

// Summaries stay short on purpose: the site points to the article, it does
// not replace it.
export function toSummary(value, title = '') {
  let text = toPlainText(value);
  for (const tail of SUMMARY_TAILS) text = text.replace(tail, '');
  text = text.trim();

  if (!text) return '';
  if (normalizeTitle(text) === normalizeTitle(title)) return '';
  if (text.length <= SUMMARY_LIMIT) return text;

  const clipped = text.slice(0, SUMMARY_LIMIT);
  const lastStop = Math.max(clipped.lastIndexOf('. '), clipped.lastIndexOf('? '));
  if (lastStop > 90) return clipped.slice(0, lastStop + 1);
  return `${clipped.slice(0, clipped.lastIndexOf(' '))}…`;
}

export function normalizeTitle(title) {
  return title
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
}

// Feeds add a label before the headline or the paper's name after it.
export function cleanTitle(value) {
  return toPlainText(value)
    .replace(/^(opinion|editorial)\s*[.:|]\s*/i, '')
    .replace(/\s+[-|–]\s+(the hindu|mint|livemint|the economic times|the indian express)$/i, '')
    .trim();
}
