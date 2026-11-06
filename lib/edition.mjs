// Fetches every feed and assembles one day's edition.
import { FIRST_ISSUE_DATE, MINIMUM_EDITION, PAPERS } from '../config/papers.mjs';
import { parseFeed } from './feed.mjs';
import { fetchText, mapLimit } from './http.mjs';
import { buildStories } from './stories.mjs';
import { findTopics } from './topics.mjs';

const MAX_ITEMS_PER_FEED = 40;

export const istDate = (date) =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(date);

const MORNING_RUN_STARTS_AT_HOUR = 7;

const istHour = (date) =>
  Number(new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Kolkata', hour: '2-digit', hour12: false }).format(date));

// True once an edition has been filed this morning, India time.
export function isFiledThisMorning(filedAt, now) {
  if (!filedAt) return false;
  const filed = new Date(filedAt);
  return istDate(filed) === istDate(now) && istHour(filed) >= MORNING_RUN_STARTS_AT_HOUR;
}

export function issueNumber(editionDate) {
  const days = (Date.parse(editionDate) - Date.parse(FIRST_ISSUE_DATE)) / 86_400_000;
  return Math.max(1, Math.round(days) + 1);
}

async function readFeed(paper, feed) {
  try {
    const { text } = await fetchText(feed.url);
    const items = parseFeed(text).slice(0, MAX_ITEMS_PER_FEED);
    return { paper, feed, items, error: null };
  } catch (error) {
    return { paper, feed, items: [], error: error.message };
  }
}

export async function fetchAllFeeds(papers = PAPERS) {
  const jobs = papers.flatMap((paper) => paper.feeds.map((feed) => ({ paper, feed })));
  const isOn = (host) => ({ feed }) => feed.url.startsWith(`https://${host}/`);
  const onGoogle = isOn('news.google.com');
  const onBing = isOn('www.bing.com');
  const read = ({ paper, feed }) => readFeed(paper, feed);

  // Dozens of searches land on each index, so those go a few at a time.
  const [direct, google, bing] = await Promise.all([
    mapLimit(jobs.filter((job) => !onGoogle(job) && !onBing(job)), 6, read),
    mapLimit(jobs.filter(onGoogle), 2, read),
    mapLimit(jobs.filter(onBing), 2, read),
  ]);
  return [...direct, ...google, ...bing];
}

export function assembleEdition(results, now = new Date()) {
  const stories = buildStories(results, now);
  const topics = findTopics(stories);
  const editionDate = istDate(now);

  const papers = PAPERS.map((paper) => {
    const feeds = results.filter((result) => result.paper.id === paper.id);
    return {
      id: paper.id,
      stories: stories.filter((story) => story.paper === paper.id).length,
      feedsRead: feeds.filter((result) => !result.error).length,
      feedsTotal: feeds.length,
      failed: feeds.filter((result) => result.error).map((result) => `${result.feed.label}: ${result.error}`),
    };
  });

  return {
    editionDate,
    issue: issueNumber(editionDate),
    filedAt: now.toISOString(),
    papers,
    topics,
    stories,
  };
}

export function isFitToPrint(edition) {
  const papersWithStories = edition.papers.filter((paper) => paper.stories > 0).length;
  return (
    papersWithStories >= MINIMUM_EDITION.papers &&
    edition.stories.length >= MINIMUM_EDITION.stories
  );
}
