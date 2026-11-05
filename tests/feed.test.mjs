import assert from 'node:assert/strict';
import { test } from 'node:test';
import { parseDate, parseFeed } from '../lib/feed.mjs';

const RSS = `<?xml version="1.0"?>
<rss version="2.0" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:content="http://purl.org/rss/1.0/modules/content/">
<channel><title>Paper</title>
<item>
  <title><![CDATA[RBI keeps repo rate &amp; stance unchanged]]></title>
  <link>https://example.com/business/rbi-repo?utm_source=rss</link>
  <description><![CDATA[<p>The panel voted <b>5-1</b>.</p> The post RBI appeared first on Paper.]]></description>
  <content:encoded><![CDATA[<p>SECRET FULL ARTICLE TEXT</p>]]></content:encoded>
  <dc:creator>Asha Rao</dc:creator>
  <pubDate>Thu, 05 Nov 2026 08:00:00 +0530</pubDate>
</item>
<item><title>No link here</title></item>
</channel></rss>`;

const ATOM = `<?xml version="1.0"?>
<feed xmlns="http://www.w3.org/2005/Atom"><title>Paper</title>
<entry><title>Atom story</title><link rel="alternate" href="https://example.com/atom"/>
<summary>Short.</summary><updated>2026-11-05T02:30:00Z</updated><author><name>Dev Sen</name></author></entry>
</feed>`;

test('reads an RSS item and cleans its text', () => {
  const [item, ...rest] = parseFeed(RSS);
  assert.equal(rest.length, 0, 'items with no link are dropped');
  assert.equal(item.title, 'RBI keeps repo rate & stance unchanged');
  assert.equal(item.summary, 'The panel voted 5-1 .');
  assert.equal(item.author, 'Asha Rao');
  assert.equal(item.publishedAt, '2026-11-05T02:30:00.000Z');
});

test('never picks up the full article text', () => {
  assert.ok(!JSON.stringify(parseFeed(RSS)).includes('SECRET FULL ARTICLE TEXT'));
});

test('reads Atom', () => {
  const [item] = parseFeed(ATOM);
  assert.equal(item.url, 'https://example.com/atom');
  assert.equal(item.author, 'Dev Sen');
});

test('rejects a page that is not a feed', () => {
  assert.throws(() => parseFeed('<html><body>Blocked</body></html>'), /Not an RSS/);
});

test('a future date is held to the current time and a bad date is null', () => {
  const now = new Date('2026-11-05T00:00:00Z');
  assert.equal(parseDate('2027-01-01T00:00:00Z', now), now.toISOString());
  assert.equal(parseDate('not a date', now), null);
});

test('a news-index item loses its publisher suffix and fake summary', () => {
  const xml = `<rss version="2.0"><channel><item>
    <title>Budget talks begin - Business Standard</title>
    <link>https://news.google.com/rss/articles/abc?oc=5</link>
    <description>&lt;a href="https://news.google.com/x"&gt;Budget talks begin&lt;/a&gt;&amp;nbsp;&lt;font&gt;Business Standard&lt;/font&gt;</description>
    <source url="https://www.business-standard.com">Business Standard</source>
    <pubDate>Thu, 05 Nov 2026 10:00:00 GMT</pubDate>
  </item></channel></rss>`;
  const [item] = parseFeed(xml);
  assert.equal(item.title, 'Budget talks begin');
  assert.equal(item.summary, '');
  assert.equal(item.source, 'https://www.business-standard.com');
});

test('a Bing result gives the real article link and keeps its summary', () => {
  const xml = `<rss version="2.0" xmlns:News="https://www.bing.com/news/search?q=x&amp;format=rss"><channel><item>
    <title>Rupee holds steady</title>
    <link>http://www.bing.com/news/apiclick.aspx?ref=FexRss&amp;aid=&amp;url=https%3a%2f%2findianexpress.com%2farticle%2fbusiness%2frupee-1%2f&amp;c=123&amp;mkt=en-in</link>
    <description>The currency closed flat on Thursday.</description>
    <pubDate>Thu, 05 Nov 2026 10:00:00 GMT</pubDate>
    <News:Source>The Indian Express</News:Source>
  </item></channel></rss>`;
  const [item] = parseFeed(xml);
  assert.equal(item.url, 'https://indianexpress.com/article/business/rupee-1/');
  assert.equal(item.source, 'https://indianexpress.com/article/business/rupee-1/');
  assert.equal(item.summary, 'The currency closed flat on Thursday.');
});

test('entities in a link are decoded', () => {
  const xml = `<rss version="2.0"><channel><item><title>A story</title><link>https://example.com/a?x=1&amp;y=2</link></item></channel></rss>`;
  assert.equal(parseFeed(xml)[0].url, 'https://example.com/a?x=1&y=2');
});
