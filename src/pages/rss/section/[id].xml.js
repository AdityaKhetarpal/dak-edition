import { SECTIONS, dealByPaper, inSection, opinionStories } from '../../../lib/edition.js';
import { MOST_PER_FEED, feedResponse, storyItem } from '../../../lib/feeds.js';

export function getStaticPaths() {
  return SECTIONS.map((section) => ({ params: { id: section.id }, props: { section } }));
}

export function GET({ site, props: { section } }) {
  const pool = section.id === 'opinion' ? opinionStories() : inSection(section.id);

  return feedResponse(site, `/rss/section/${section.id}.xml`, {
    title: section.name,
    description: `${section.name} from today's Indian newspapers.`,
    link: `/section/${section.id}/`,
    items: dealByPaper(pool, MOST_PER_FEED).map(storyItem),
  });
}
