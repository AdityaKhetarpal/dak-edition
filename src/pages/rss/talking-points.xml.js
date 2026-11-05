import { PAPERS, edition, storyById } from '../../lib/edition.js';
import { feedResponse } from '../../lib/feeds.js';

export function GET({ site }) {
  const items = edition.topics.map((topic) => {
    const lead = storyById(topic.lead);
    const names = PAPERS.filter((paper) => topic.papers.includes(paper.id)).map((paper) => paper.name);
    return {
      title: `${topic.name}: ${lead.title}`,
      link: new URL(`/topic/${topic.slug}/`, site).href,
      guid: `${edition.editionDate}-${topic.slug}`,
      description: `In ${names.join(', ')}.`,
      pubDate: lead.publishedAt,
    };
  });

  return feedResponse(site, '/rss/talking-points.xml', {
    title: 'Talking points',
    description: 'The stories that the most papers ran today.',
    link: '/talking-points/',
    items,
  });
}
