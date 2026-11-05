// Reads RSS 2.0 and Atom into one simple item shape.
import { XMLParser } from 'fast-xml-parser';
import { cleanTitle, toPlainText, toSummary } from './text.mjs';

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  // Entities are decoded by lib/text.mjs, so a feed can't expand them here.
  processEntities: false,
  htmlEntities: false,
  trimValues: true,
  parseTagValue: false,
});

const asList = (value) => (value === undefined ? [] : Array.isArray(value) ? value : [value]);

const textOf = (value) => {
  if (value === undefined || value === null) return '';
  if (typeof value === 'object') return String(value['#text'] ?? '');
  return String(value);
};

function atomLink(entry) {
  const links = asList(entry.link);
  const alternate = links.find((link) => !link['@_rel'] || link['@_rel'] === 'alternate');
  return alternate?.['@_href'] ?? textOf(links[0]);
}

function authorOf(item) {
  const creator = textOf(asList(item['dc:creator'])[0]);
  const author = item.author?.name ? textOf(item.author.name) : textOf(asList(item.author)[0]);
  const name = toPlainText(creator || author);
  // RSS <author> is often an email address or a desk name, not a byline.
  if (!name || name.includes('@') || name.length > 60) return '';
  return name;
}

function stripSource(title, source) {
  const text = toPlainText(title);
  const suffix = ` - ${source}`;
  return source && text.endsWith(suffix) ? text.slice(0, -suffix.length) : text;
}

export function parseFeed(xml) {
  const doc = parser.parse(xml);
  const rawItems = doc?.rss?.channel?.item ?? doc?.['rdf:RDF']?.item ?? doc?.feed?.entry;

  if (!doc?.rss && !doc?.feed && !doc?.['rdf:RDF']) {
    throw new Error('Not an RSS or Atom document');
  }

  return asList(rawItems)
    .map((item) => {
      // News-index feeds name the publisher in <source>, add it to the end of
      // the headline, and carry no real summary.
      const source = toPlainText(textOf(item.source));
      const title = cleanTitle(stripSource(textOf(item.title), source));
      return {
        title,
        source: item.source?.['@_url'] ?? '',
        // <content:encoded> can hold the whole article, so it is never read.
        summary: source ? '' : toSummary(textOf(item.description ?? item.summary), title),
        url: textOf(item.link).trim() || atomLink(item),
        author: authorOf(item),
        publishedAt: parseDate(
          textOf(item.pubDate) || textOf(item['dc:date']) || textOf(item.published) || textOf(item.updated),
        ),
      };
    })
    .filter((item) => item.title && item.url);
}

export function parseDate(value, now = new Date()) {
  if (!value) return null;
  const date = new Date(value.trim());
  if (Number.isNaN(date.getTime())) return null;
  // A clock a few minutes ahead shouldn't place a story in the future.
  return (date > now ? now : date).toISOString();
}
