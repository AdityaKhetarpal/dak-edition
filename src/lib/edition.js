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

// A story with a summary carries a big slot better than a bare headline.
const summaryFirst = (stories) => [
  ...stories.filter((story) => story.summary),
  ...stories.filter((story) => !story.summary),
];

export const isEditorial = (story) => /editorial/i.test(story.desk);

// Editorials lead the opinion page, then columns by date.
export function opinionStories() {
  const stories = inSection('opinion');
  return [...stories.filter(isEditorial), ...stories.filter((story) => !isEditorial(story))];
}

export function frontPage() {
  const used = new Set();
  const mark = (stories) => {
    stories.forEach((story) => used.add(story.id));
    return stories;
  };
  const take = (stories, limit) =>
    summaryFirst(mark(dealByPaper(stories.filter((story) => !used.has(story.id)), limit)));

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

  const others = topics.filter((topic) => topic !== banner);
  const seconds = others.slice(0, 2);
  mark(seconds.map((topic) => topic.leadStory));

  const thirdTopics = others.slice(2, 6).filter((topic) => topic.leadStory.summary);
  mark(thirdTopics.map((topic) => topic.leadStory));

  const isHardNews = (story) => ['nation', 'world', 'business'].includes(story.section);
  const fillers = take(edition.stories.filter((story) => story.summary && isHardNews(story)), Math.max(0, 6 - thirdTopics.length));
  const thirds = [
    ...thirdTopics.map((topic) => ({ story: topic.leadStory, kicker: topic.name })),
    ...fillers.map((story) => ({ story })),
  ];

  const briefs = take(edition.stories.filter(isHardNews), 9);

  const pages = [
    { id: 'nation', name: 'Nation', href: '/section/nation/', stories: take(inSection('nation'), 18) },
    { id: 'world', name: 'World', href: '/section/world/', stories: take(inSection('world'), 15) },
    { id: 'opinion', name: 'The editorial page', href: '/section/opinion/', stories: take(opinionStories(), 20) },
    {
      id: 'pink',
      name: 'The pink pages',
      href: '/section/business/',
      pink: true,
      business: take(inSection('business'), 15),
      markets: take(inSection('markets'), 7),
    },
    {
      id: 'back',
      name: 'Technology and sport',
      href: '/section/tech/',
      tech: take(inSection('tech'), 9),
      sport: take(inSection('sport'), 9),
    },
  ].map((page, index) => ({ ...page, number: index + 2 }));

  return {
    banner,
    lead,
    roundup: banner ? banner.coverage.filter(({ story }) => story.id !== lead.id).slice(0, 4) : [],
    seconds,
    thirds,
    briefs,
    topics: topics.slice(0, 7),
    allTopics: topics,
    pages,
    pageCount: pages.length + 1,
  };
}
