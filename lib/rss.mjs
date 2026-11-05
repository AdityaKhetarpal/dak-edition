// Writes an RSS 2.0 document. Everything from a feed is escaped here, because a
// stray "&" in one headline would otherwise break the whole file.

const XML_ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' };

export function escapeXml(value) {
  return String(value ?? '')
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '')
    .replace(/[&<>"']/g, (character) => XML_ESCAPES[character]);
}

const tag = (name, value) => (value ? `<${name}>${escapeXml(value)}</${name}>` : '');

function itemXml(item) {
  const parts = [
    tag('title', item.title),
    tag('link', item.link),
    `<guid isPermaLink="false">${escapeXml(item.guid)}</guid>`,
    tag('description', item.description),
    tag('category', item.category),
    item.pubDate ? tag('pubDate', new Date(item.pubDate).toUTCString()) : '',
    item.source ? `<source url="${escapeXml(item.sourceUrl)}">${escapeXml(item.source)}</source>` : '',
  ];
  return `<item>${parts.join('')}</item>`;
}

export function buildRss({ title, description, link, selfUrl, updated, items }) {
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
    '<channel>',
    tag('title', title),
    tag('link', link),
    tag('description', description),
    '<language>en-in</language>',
    updated ? tag('lastBuildDate', new Date(updated).toUTCString()) : '',
    `<atom:link href="${escapeXml(selfUrl)}" rel="self" type="application/rss+xml"/>`,
    ...items.map(itemXml),
    '</channel>',
    '</rss>',
    '',
  ].join('\n');
}
