import { dealByPaper, edition, storyById } from '../lib/edition.js';
import { MOST_PER_FEED, feedResponse, storyItem } from '../lib/feeds.js';

export function GET({ site }) {
  const leads = edition.topics.map((topic) => storyById(topic.lead));
  const rest = edition.stories.filter((story) => !leads.includes(story));
  const stories = [...leads, ...dealByPaper(rest, MOST_PER_FEED - leads.length)];

  return feedResponse(site, '/rss.xml', {
    title: "Today's edition",
    description: "Every morning's Indian newspapers, on one sheet.",
    items: stories.map(storyItem),
  });
}
