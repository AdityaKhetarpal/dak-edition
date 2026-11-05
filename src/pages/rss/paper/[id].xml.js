import { PAPERS, edition } from '../../../lib/edition.js';
import { MOST_PER_FEED, feedResponse, storyItem } from '../../../lib/feeds.js';

export function getStaticPaths() {
  return PAPERS.map((paper) => ({ params: { id: paper.id }, props: { paper } }));
}

export function GET({ site, props: { paper } }) {
  const stories = edition.stories.filter((story) => story.paper === paper.id).slice(0, MOST_PER_FEED);

  return feedResponse(site, `/rss/paper/${paper.id}.xml`, {
    title: paper.name,
    description: `Today's stories from ${paper.name}.`,
    link: `/paper/${paper.id}/`,
    items: stories.map(storyItem),
  });
}
