// Turns raw feed items into the edition's story list.
import { createHash } from 'node:crypto';
import { MAX_AGE_HOURS } from '../config/papers.mjs';
import { normalizeTitle } from './text.mjs';

const TRACKING_PARAMS = /^(utm_|fbclid$|gclid$|ref$|ref_src$|from$|ncid$|cmp$|cmpid$)/i;

export function cleanUrl(raw) {
  let url;
  try {
    url = new URL(String(raw).trim());
  } catch {
    return null;
  }
  // Only ordinary web links reach the page.
  if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;
  url.protocol = 'https:';
  url.hash = '';
  for (const key of [...url.searchParams.keys()]) {
    if (TRACKING_PARAMS.test(key)) url.searchParams.delete(key);
  }
  return url.toString();
}

const SECTION_BY_PATH = [
  [/\/(opinion|opinions|editorials?|columns?|blogs?|commentary)(\/|$)/, 'opinion'],
  [/\/(markets?|stocks?|ipos?|mutual-funds?|commodities|forex)(\/|$)/, 'markets'],
  [/\/(business|economy|companies|industry|money|finance|personal-finance|wealth|banking|policy|real-estate|auto)(\/|$)/, 'business'],
  [/\/(technology|tech|gadgets|sci-tech|science|ai)(\/|$)/, 'tech'],
  [/\/(sports?|cricket|football|tennis|hockey)(\/|$)/, 'sport'],
  [/\/(world|world-news|international|us-news|asia|europe|middle-east)(\/|$)/, 'world'],
];

// Mixed feeds don't say which page a story belongs on. Its URL usually does.
export function sectionFromUrl(url) {
  let path;
  try {
    path = new URL(url).pathname.toLowerCase();
  } catch {
    return 'nation';
  }
  return SECTION_BY_PATH.find(([pattern]) => pattern.test(path))?.[1] ?? 'nation';
}

const SKIP_PATHS = /\/(web-stories|webstories|photos?|photogallery|videos?|video-news|podcasts?|horoscope|astrology|entertainment|lifestyle|bollywood|hollywood|tv|etimes|education\/results|crossword)(\/|$)/i;
const SKIP_TITLES = /\b(horoscope|wordle|crossword|lottery|winning numbers|gold rate today|silver rate today|petrol.*price today)\b/i;

function belongsInEdition(item) {
  return !SKIP_PATHS.test(item.url) && !SKIP_TITLES.test(item.title);
}

const storyId = (url) => createHash('sha1').update(url).digest('hex').slice(0, 10);

function isFresh(publishedAt, section, now) {
  if (!publishedAt) return true;
  const hours = MAX_AGE_HOURS[section] ?? MAX_AGE_HOURS.default;
  return now.getTime() - new Date(publishedAt).getTime() <= hours * 3_600_000;
}

// One story often sits in several feeds of a paper. A named section such as
// "Editorial" beats a mixed "Latest" feed.
export function buildStories(results, now = new Date()) {
  const byUrl = new Map();

  for (const { paper, feed, items } of results) {
    for (const item of items) {
      const url = cleanUrl(item.url);
      if (!url) continue;

      const candidate = { ...item, url };
      if (!belongsInEdition(candidate)) continue;
      // A news-index search can return another site; keep only this paper's.
      if (item.source && !item.source.includes(paper.domain)) continue;

      const fromMixedFeed = feed.section === 'top';
      const section = fromMixedFeed ? sectionFromUrl(url) : feed.section;
      if (!isFresh(item.publishedAt, section, now)) continue;

      const existing = byUrl.get(url);
      if (existing && (fromMixedFeed || !existing.fromMixedFeed)) continue;

      byUrl.set(url, {
        id: storyId(url),
        paper: paper.id,
        section,
        desk: feed.label,
        title: item.title,
        summary: item.summary || existing?.summary || '',
        author: item.author || existing?.author || '',
        url,
        publishedAt: item.publishedAt ?? existing?.publishedAt ?? null,
        fromMixedFeed,
      });
    }
  }

  // The same headline can run under two URLs in one paper.
  const seen = new Set();
  const stories = [];
  const newestFirst = [...byUrl.values()].sort(
    (a, b) => new Date(b.publishedAt ?? 0) - new Date(a.publishedAt ?? 0),
  );

  for (const { fromMixedFeed, ...story } of newestFirst) {
    const key = `${story.paper}:${normalizeTitle(story.title)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    stories.push(story);
  }
  return stories;
}
