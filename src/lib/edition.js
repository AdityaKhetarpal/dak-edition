// Everything the pages need from data/edition.json.
import edition from '../../data/edition.json';
import { PAPERS, SECTIONS } from '../../config/papers.mjs';

export { edition, PAPERS, SECTIONS };

const TIME_ZONE = 'Asia/Kolkata';
const PAPER_BY_ID = new Map(PAPERS.map((paper) => [paper.id, paper]));
const STORY_BY_ID = new Map(edition.stories.map((story) => [story.id, story]));

export const paperOf = (story) => PAPER_BY_ID.get(story.paper);
export const storyById = (id) => STORY_BY_ID.get(id);
export const reportFor = (paperId) => edition.papers.find((paper) => paper.id === paperId);

export function longDate(isoDate) {
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: 'UTC',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(`${isoDate}T00:00:00Z`));
}

export function clockTime(iso) {
  if (!iso) return '';
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: TIME_ZONE,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
    .format(new Date(iso))
    .replace(/\s?(am|pm)/i, (match) => ` ${match.trim().toUpperCase()}`);
}

// Today's stories show the time; older columns show the date.
export function storyTime(iso) {
  if (!iso) return '';
  const day = new Intl.DateTimeFormat('en-CA', { timeZone: TIME_ZONE }).format(new Date(iso));
  if (day === edition.editionDate) return clockTime(iso);
  return new Intl.DateTimeFormat('en-IN', { timeZone: TIME_ZONE, day: 'numeric', month: 'short' }).format(new Date(iso));
}

// Deals stories out one paper at a time, so no single paper fills a column.
export function dealByPaper(stories, limit = Infinity) {
  const piles = PAPERS.map((paper) => stories.filter((story) => story.paper === paper.id));
  const dealt = [];

  for (let round = 0; dealt.length < limit; round += 1) {
    const hand = piles.map((pile) => pile[round]).filter(Boolean);
    if (hand.length === 0) break;
    dealt.push(...hand);
  }
  return dealt.slice(0, limit);
}

export const inSection = (sectionId) => edition.stories.filter((story) => story.section === sectionId);

// Editorials lead the opinion page, then columns by date.
export function opinionStories() {
  const isEditorial = (story) => /editorial/i.test(story.desk);
  const stories = inSection('opinion');
  return [...stories.filter(isEditorial), ...stories.filter((story) => !isEditorial(story))];
}

export function frontPage() {
  const used = new Set();
  const take = (stories, limit) => {
    const picked = dealByPaper(stories.filter((story) => !used.has(story.id)), limit);
    picked.forEach((story) => used.add(story.id));
    return picked;
  };

  const topics = edition.topics.map((topic) => ({
    ...topic,
    leadStory: storyById(topic.lead),
    coverage: PAPERS.filter((paper) => topic.papers.includes(paper.id)).map((paper) => ({
      paper,
      story: topic.stories.map(storyById).find((story) => story.paper === paper.id),
    })),
  }));

  // Sport can dominate the count, but it rarely deserves the banner.
  const banner = topics.find((topic) => topic.leadStory.section !== 'sport') ?? topics[0];
  const lead = banner?.leadStory ?? edition.stories[0];
  if (lead) used.add(lead.id);

  const seconds = topics
    .filter((topic) => topic !== banner)
    .slice(0, 3)
    .map((topic) => topic.leadStory);
  seconds.forEach((story) => used.add(story.id));

  // The rest of the front page: other talking points, then the day's hard news.
  const moreLeads = topics
    .filter((topic) => topic !== banner)
    .slice(3)
    .map((topic) => topic.leadStory)
    .filter((story) => story.summary);
  moreLeads.forEach((story) => used.add(story.id));

  const hardNews = edition.stories.filter(
    (story) => story.summary && ['nation', 'world', 'business'].includes(story.section),
  );
  const thirds = [...moreLeads, ...take(hardNews, Math.max(0, 12 - moreLeads.length))];

  return {
    banner,
    lead,
    seconds,
    thirds,
    topics: topics.slice(0, 8),
    allTopics: topics,
    opinion: take(opinionStories(), 12),
    business: take(inSection('business'), 9),
    markets: take(inSection('markets'), 6),
    nation: take(inSection('nation'), 7),
    world: take(inSection('world'), 7),
    tech: take(inSection('tech'), 7),
    sport: take(inSection('sport'), 7),
  };
}
