// Shared pieces for the RSS endpoints in src/pages/rss.
import { buildRss } from '../../lib/rss.mjs';
import { SECTIONS, edition, paperOf } from './edition.js';

export const MOST_PER_FEED = 100;

const sectionName = (id) => SECTIONS.find((section) => section.id === id)?.name ?? '';

export function storyItem(story) {
  const paper = paperOf(story);
  return {
    title: story.title,
    link: story.url,
    guid: story.id,
    description: story.summary,
    category: sectionName(story.section),
    pubDate: story.publishedAt,
    source: paper.name,
    sourceUrl: paper.home,
  };
}

export function feedResponse(site, path, { title, description, items, link = '/' }) {
  const xml = buildRss({
    title: `${title} | The Dak Edition`,
    description,
    link: new URL(link, site).href,
    selfUrl: new URL(path, site).href,
    updated: edition.filedAt,
    items,
  });
  return new Response(xml, { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' } });
}
