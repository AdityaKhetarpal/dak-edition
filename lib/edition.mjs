// Fetches every feed and assembles one day's edition.
import { FIRST_ISSUE_DATE, MINIMUM_EDITION, PAPERS } from '../config/papers.mjs';
import { parseFeed } from './feed.mjs';
import { fetchText, mapLimit } from './http.mjs';
import { buildStories } from './stories.mjs';
import { findTopics } from './topics.mjs';

const MAX_ITEMS_PER_FEED = 40;

export const istDate = (date) =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(date);

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
  return mapLimit(jobs, 6, ({ paper, feed }) => readFeed(paper, feed));
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
