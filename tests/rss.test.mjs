import assert from 'node:assert/strict';
import { test } from 'node:test';
import { parseFeed } from '../lib/feed.mjs';
import { buildRss, escapeXml } from '../lib/rss.mjs';

test('escapes everything that would break the XML', () => {
  assert.equal(escapeXml(`A & B <c> "d" 'e'`), 'A &amp; B &lt;c&gt; &quot;d&quot; &apos;e&apos;');
  assert.equal(escapeXml('bad\u0007char'), 'badchar');
});

test('a built feed can be read back by a feed parser', () => {
  const xml = buildRss({
    title: 'Paper & Co',
    description: 'Test',
    link: 'https://example.com/',
    selfUrl: 'https://example.com/rss.xml',
    updated: '2026-11-05T03:00:00Z',
    items: [{
      title: 'M&M profit <up>',
      link: 'https://example.com/a?x=1&y=2',
      guid: 'abc',
      description: 'Rose 5% & more',
      category: 'Business',
      pubDate: '2026-11-05T02:30:00Z',
      source: 'Mint',
      sourceUrl: 'https://www.livemint.com/',
    }],
  });
  const [item] = parseFeed(xml);
  assert.equal(item.title, 'M&M profit');
  assert.equal(item.url, 'https://example.com/a?x=1&y=2');
  assert.equal(item.publishedAt, '2026-11-05T02:30:00.000Z');
});
