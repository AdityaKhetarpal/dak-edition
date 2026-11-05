// Checks every feed and link in config/papers.mjs and prints what works.
// Run it from the "Check sources" workflow, or with `npm run probe`.
import { PAPERS } from '../config/papers.mjs';
import { parseFeed } from '../lib/feed.mjs';
import { fetchText, mapLimit } from '../lib/http.mjs';

// Extra addresses to try while looking for a feed that isn't listed yet.
const CANDIDATES = (process.env.PROBE_URLS ?? '').split(/\s+/).filter(Boolean);

const hoursAgo = (iso) => (iso ? Math.round((Date.now() - Date.parse(iso)) / 3_600_000) : '?');

async function probeFeed(url) {
  try {
    const { text } = await fetchText(url, { attempts: 2 });
    const items = parseFeed(text);
    const withSummary = items.filter((item) => item.summary).length;
    const newest = items.map((item) => item.publishedAt).filter(Boolean).sort().at(-1);
    const sample = process.env.PROBE_SAMPLES
      ? `\n       e.g. ${items[0]?.title}\n       ${items[0]?.url?.slice(0, 130)}\n       ${(items.find((item) => item.summary)?.summary ?? 'no summary').slice(0, 140)}`
      : '';
    return `ok   ${String(items.length).padStart(3)} items, ${String(withSummary).padStart(3)} summaries, newest ${hoursAgo(newest)}h ago${sample}`;
  } catch (error) {
    return `FAIL ${error.message}`;
  }
}

async function probePage(url) {
  try {
    const { status, finalUrl } = await fetchText(url, { attempts: 1 });
    return `ok   ${status}${finalUrl === url ? '' : ` -> ${finalUrl}`}`;
  } catch (error) {
    return `FAIL ${error.message}`;
  }
}

const feeds = PAPERS.flatMap((paper) => paper.feeds.map((feed) => ({ paper: paper.id, label: feed.label, url: feed.url })));
const pages = PAPERS.flatMap((paper) => [
  { paper: paper.id, label: 'home', url: paper.home },
  { paper: paper.id, label: 'e-paper', url: paper.epaper },
  ...paper.desks.map((desk) => ({ paper: paper.id, label: desk.label, url: desk.url })),
]);

console.log('\n== Feeds ==');
const feedLines = await mapLimit(feeds, 6, async (feed) => `${await probeFeed(feed.url)}  ${feed.paper} / ${feed.label}  ${feed.url}`);
console.log(feedLines.join('\n'));

if (CANDIDATES.length) {
  console.log('\n== Candidates ==');
  const lines = await mapLimit(CANDIDATES, 3, async (url) => `${url}\n  ${await probeFeed(url)}`);
  console.log(lines.join('\n'));
}

console.log('\n== Pages ==');
const pageLines = await mapLimit(pages, 6, async (page) => `${await probePage(page.url)}  ${page.paper} / ${page.label}  ${page.url}`);
console.log(pageLines.join('\n'));
