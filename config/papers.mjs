// The newsstand. Add a paper here and it appears everywhere on the site.
//
// Every feed has a `section`. Use "top" for a mixed feed: its stories are
// sorted into sections by their URL (see lib/stories.mjs).

// A few papers refuse automated requests for their own feeds. Their headlines
// come from Google News search instead, one search per section of the paper.
const viaGoogleNews = (path, days = 1) =>
  `https://news.google.com/rss/search?q=site:${path}+when:${days}d&hl=en-IN&gl=IN&ceid=IN:en`;

export const SECTIONS = [
  { id: 'nation', name: 'Nation' },
  { id: 'world', name: 'World' },
  { id: 'business', name: 'Business', pink: true },
  { id: 'markets', name: 'Markets', pink: true },
  { id: 'opinion', name: 'Editorials & columns' },
  { id: 'tech', name: 'Technology' },
  { id: 'sport', name: 'Sport' },
];

export const PAPERS = [
  {
    id: 'mint',
    name: 'Mint',
    sigil: 'Mint',
    domain: 'livemint.com',
    home: 'https://www.livemint.com/',
    epaper: 'https://epaper.livemint.com/',
    desks: [
      { label: 'Opinion', url: 'https://www.livemint.com/opinion' },
      { label: 'Markets', url: 'https://www.livemint.com/market' },
      { label: 'Companies', url: 'https://www.livemint.com/companies' },
      { label: 'Money', url: 'https://www.livemint.com/money' },
    ],
    feeds: [
      { url: 'https://www.livemint.com/rss/news', section: 'top', label: 'News' },
      { url: 'https://www.livemint.com/rss/opinion', section: 'opinion', label: 'Opinion' },
      { url: 'https://www.livemint.com/rss/markets', section: 'markets', label: 'Markets' },
      { url: 'https://www.livemint.com/rss/companies', section: 'business', label: 'Companies' },
      { url: 'https://www.livemint.com/rss/money', section: 'business', label: 'Money' },
      { url: 'https://www.livemint.com/rss/economy', section: 'business', label: 'Economy' },
      { url: 'https://www.livemint.com/rss/industry', section: 'business', label: 'Industry' },
      { url: 'https://www.livemint.com/rss/politics', section: 'nation', label: 'Politics' },
      { url: 'https://www.livemint.com/rss/technology', section: 'tech', label: 'Technology' },
      { url: 'https://www.livemint.com/rss/sports', section: 'sport', label: 'Sports' },
    ],
  },
  {
    id: 'indian-express',
    name: 'The Indian Express',
    sigil: 'IE',
    headlinesVia: 'Google News',
    domain: 'indianexpress.com',
    home: 'https://indianexpress.com/',
    epaper: 'https://epaper.indianexpress.com/',
    desks: [
      { label: 'Editorials', url: 'https://indianexpress.com/section/opinion/editorials/' },
      { label: 'Columns', url: 'https://indianexpress.com/section/opinion/columns/' },
      { label: 'Explained', url: 'https://indianexpress.com/section/explained/' },
      { label: 'Business', url: 'https://indianexpress.com/section/business/' },
    ],
    feeds: [
      { url: viaGoogleNews('indianexpress.com/article/opinion', 2), section: 'opinion', label: 'Opinion' },
      { url: viaGoogleNews('indianexpress.com/article/india'), section: 'nation', label: 'India' },
      { url: viaGoogleNews('indianexpress.com/article/explained', 2), section: 'nation', label: 'Explained' },
      { url: viaGoogleNews('indianexpress.com/article/world'), section: 'world', label: 'World' },
      { url: viaGoogleNews('indianexpress.com/article/business'), section: 'business', label: 'Business' },
      { url: viaGoogleNews('indianexpress.com/article/technology'), section: 'tech', label: 'Technology' },
      { url: viaGoogleNews('indianexpress.com/article/sports'), section: 'sport', label: 'Sports' },
    ],
  },
  {
    id: 'economic-times',
    name: 'The Economic Times',
    sigil: 'ET',
    domain: 'economictimes.indiatimes.com',
    home: 'https://economictimes.indiatimes.com/',
    epaper: 'https://epaper.indiatimes.com/',
    desks: [
      { label: 'Editorials', url: 'https://economictimes.indiatimes.com/opinion/et-editorial' },
      { label: 'Opinion', url: 'https://economictimes.indiatimes.com/opinion' },
      { label: 'Markets', url: 'https://economictimes.indiatimes.com/markets' },
      { label: 'Economy', url: 'https://economictimes.indiatimes.com/news/economy' },
    ],
    feeds: [
      { url: 'https://economictimes.indiatimes.com/rssfeedstopstories.cms', section: 'top', label: 'Top stories' },
      { url: 'https://economictimes.indiatimes.com/news/economy/rssfeeds/1373380680.cms', section: 'business', label: 'Economy' },
      { url: 'https://economictimes.indiatimes.com/industry/rssfeeds/13352306.cms', section: 'business', label: 'Industry' },
      { url: 'https://economictimes.indiatimes.com/markets/rssfeeds/1977021501.cms', section: 'markets', label: 'Markets' },
      { url: 'https://economictimes.indiatimes.com/opinion/et-editorial/rssfeeds/3376910.cms', section: 'opinion', label: 'Editorial' },
      { url: 'https://economictimes.indiatimes.com/opinion/rssfeeds/897228639.cms', section: 'opinion', label: 'Opinion' },
      { url: 'https://economictimes.indiatimes.com/news/politics-and-nation/rssfeeds/1052732854.cms', section: 'nation', label: 'Politics' },
      { url: 'https://economictimes.indiatimes.com/news/international/world-news/rssfeeds/858478126.cms', section: 'world', label: 'World' },
      { url: 'https://economictimes.indiatimes.com/tech/rssfeeds/13357270.cms', section: 'tech', label: 'Tech' },
    ],
  },
  {
    id: 'the-hindu',
    name: 'The Hindu',
    sigil: 'Hindu',
    domain: 'thehindu.com',
    home: 'https://www.thehindu.com/',
    epaper: 'https://epaper.thehindu.com/',
    desks: [
      { label: 'Editorial', url: 'https://www.thehindu.com/opinion/editorial/' },
      { label: 'Lead', url: 'https://www.thehindu.com/opinion/lead/' },
      { label: 'Op-Ed', url: 'https://www.thehindu.com/opinion/op-ed/' },
      { label: 'National', url: 'https://www.thehindu.com/news/national/' },
    ],
    feeds: [
      { url: 'https://www.thehindu.com/feeder/default.rss', section: 'top', label: 'Latest' },
      { url: 'https://www.thehindu.com/news/national/feeder/default.rss', section: 'nation', label: 'National' },
      { url: 'https://www.thehindu.com/news/international/feeder/default.rss', section: 'world', label: 'International' },
      { url: 'https://www.thehindu.com/business/feeder/default.rss', section: 'business', label: 'Business' },
      { url: 'https://www.thehindu.com/business/markets/feeder/default.rss', section: 'markets', label: 'Markets' },
      { url: 'https://www.thehindu.com/opinion/editorial/feeder/default.rss', section: 'opinion', label: 'Editorial' },
      { url: 'https://www.thehindu.com/opinion/lead/feeder/default.rss', section: 'opinion', label: 'Lead' },
      { url: 'https://www.thehindu.com/opinion/op-ed/feeder/default.rss', section: 'opinion', label: 'Op-Ed' },
      { url: 'https://www.thehindu.com/sci-tech/technology/feeder/default.rss', section: 'tech', label: 'Technology' },
      { url: 'https://www.thehindu.com/sport/feeder/default.rss', section: 'sport', label: 'Sport' },
    ],
  },
  {
    id: 'times-of-india',
    name: 'The Times of India',
    sigil: 'TOI',
    domain: 'timesofindia.indiatimes.com',
    home: 'https://timesofindia.indiatimes.com/',
    epaper: 'https://epaper.indiatimes.com/',
    desks: [
      { label: 'Blogs & edit page', url: 'https://timesofindia.indiatimes.com/blogs/' },
      { label: 'India', url: 'https://timesofindia.indiatimes.com/india' },
      { label: 'World', url: 'https://timesofindia.indiatimes.com/world' },
      { label: 'Business', url: 'https://timesofindia.indiatimes.com/business' },
    ],
    feeds: [
      { url: 'https://timesofindia.indiatimes.com/rssfeedstopstories.cms', section: 'top', label: 'Top stories' },
      { url: 'https://timesofindia.indiatimes.com/rssfeeds/-2128936835.cms', section: 'nation', label: 'India' },
      { url: 'https://timesofindia.indiatimes.com/rssfeeds/296589292.cms', section: 'world', label: 'World' },
      { url: 'https://timesofindia.indiatimes.com/rssfeeds/1898055.cms', section: 'business', label: 'Business' },
      { url: 'https://timesofindia.indiatimes.com/rssfeeds/-2128672765.cms', section: 'tech', label: 'Science' },
      { url: 'https://timesofindia.indiatimes.com/rssfeeds/4719148.cms', section: 'sport', label: 'Sports' },
    ],
  },
  {
    id: 'hindustan-times',
    name: 'Hindustan Times',
    sigil: 'HT',
    domain: 'hindustantimes.com',
    home: 'https://www.hindustantimes.com/',
    epaper: 'https://epaper.hindustantimes.com/',
    desks: [
      { label: 'Editorials', url: 'https://www.hindustantimes.com/editorials' },
      { label: 'Opinion', url: 'https://www.hindustantimes.com/opinion' },
      { label: 'India', url: 'https://www.hindustantimes.com/india-news' },
      { label: 'Business', url: 'https://www.hindustantimes.com/business' },
    ],
    feeds: [
      { url: 'https://www.hindustantimes.com/feeds/rss/latest/rssfeed.xml', section: 'top', label: 'Latest' },
      { url: 'https://www.hindustantimes.com/feeds/rss/india-news/rssfeed.xml', section: 'nation', label: 'India' },
      { url: 'https://www.hindustantimes.com/feeds/rss/world-news/rssfeed.xml', section: 'world', label: 'World' },
      { url: 'https://www.hindustantimes.com/feeds/rss/business/rssfeed.xml', section: 'business', label: 'Business' },
      { url: 'https://www.hindustantimes.com/feeds/rss/opinion/rssfeed.xml', section: 'opinion', label: 'Opinion' },
      { url: 'https://www.hindustantimes.com/feeds/rss/editorials/rssfeed.xml', section: 'opinion', label: 'Editorial' },
      { url: 'https://www.hindustantimes.com/feeds/rss/technology/rssfeed.xml', section: 'tech', label: 'Technology' },
      { url: 'https://www.hindustantimes.com/feeds/rss/sports/rssfeed.xml', section: 'sport', label: 'Sports' },
    ],
  },
  {
    id: 'business-standard',
    name: 'Business Standard',
    sigil: 'BS',
    headlinesVia: 'Google News',
    domain: 'business-standard.com',
    home: 'https://www.business-standard.com/',
    epaper: 'https://epaper.business-standard.com/',
    desks: [
      { label: 'Opinion', url: 'https://www.business-standard.com/opinion' },
      { label: 'Economy', url: 'https://www.business-standard.com/economy' },
      { label: 'Markets', url: 'https://www.business-standard.com/markets' },
      { label: 'Companies', url: 'https://www.business-standard.com/companies' },
    ],
    feeds: [
      { url: viaGoogleNews('business-standard.com/opinion', 2), section: 'opinion', label: 'Opinion' },
      { url: viaGoogleNews('business-standard.com/economy'), section: 'business', label: 'Economy' },
      { url: viaGoogleNews('business-standard.com/companies'), section: 'business', label: 'Companies' },
      { url: viaGoogleNews('business-standard.com/markets'), section: 'markets', label: 'Markets' },
      { url: viaGoogleNews('business-standard.com/india-news'), section: 'nation', label: 'India' },
      { url: viaGoogleNews('business-standard.com/world-news'), section: 'world', label: 'World' },
    ],
  },
  {
    id: 'financial-express',
    name: 'The Financial Express',
    sigil: 'FE',
    headlinesVia: 'Google News',
    domain: 'financialexpress.com',
    home: 'https://www.financialexpress.com/',
    epaper: 'https://epaper.financialexpress.com/',
    desks: [
      { label: 'Opinion', url: 'https://www.financialexpress.com/opinion/' },
      { label: 'Markets', url: 'https://www.financialexpress.com/market/' },
      { label: 'Economy', url: 'https://www.financialexpress.com/policy/economy/' },
      { label: 'Business', url: 'https://www.financialexpress.com/business/' },
    ],
    feeds: [
      { url: viaGoogleNews('financialexpress.com/opinion', 2), section: 'opinion', label: 'Opinion' },
      { url: viaGoogleNews('financialexpress.com/market'), section: 'markets', label: 'Markets' },
      { url: viaGoogleNews('financialexpress.com/business'), section: 'business', label: 'Business' },
      { url: viaGoogleNews('financialexpress.com/policy'), section: 'business', label: 'Policy' },
    ],
  },
  {
    id: 'businessline',
    name: 'The Hindu BusinessLine',
    sigil: 'BL',
    domain: 'thehindubusinessline.com',
    home: 'https://www.thehindubusinessline.com/',
    epaper: 'https://epaper.thehindubusinessline.com/',
    desks: [
      { label: 'Editorial', url: 'https://www.thehindubusinessline.com/opinion/editorial/' },
      { label: 'Opinion', url: 'https://www.thehindubusinessline.com/opinion/' },
      { label: 'Markets', url: 'https://www.thehindubusinessline.com/markets/' },
      { label: 'Economy', url: 'https://www.thehindubusinessline.com/economy/' },
    ],
    feeds: [
      { url: 'https://www.thehindubusinessline.com/opinion/editorial/feeder/default.rss', section: 'opinion', label: 'Editorial' },
      { url: 'https://www.thehindubusinessline.com/opinion/feeder/default.rss', section: 'opinion', label: 'Opinion' },
      { url: 'https://www.thehindubusinessline.com/markets/feeder/default.rss', section: 'markets', label: 'Markets' },
      { url: 'https://www.thehindubusinessline.com/economy/feeder/default.rss', section: 'business', label: 'Economy' },
      { url: 'https://www.thehindubusinessline.com/companies/feeder/default.rss', section: 'business', label: 'Companies' },
    ],
  },
  {
    id: 'deccan-herald',
    name: 'Deccan Herald',
    sigil: 'DH',
    domain: 'deccanherald.com',
    home: 'https://www.deccanherald.com/',
    epaper: 'https://epaper.deccanherald.com/',
    desks: [
      { label: 'Opinion', url: 'https://www.deccanherald.com/opinion' },
      { label: 'India', url: 'https://www.deccanherald.com/india' },
      { label: 'Business', url: 'https://www.deccanherald.com/business' },
      { label: 'World', url: 'https://www.deccanherald.com/world' },
    ],
    feeds: [
      { url: 'https://www.deccanherald.com/feed', section: 'top', label: 'Latest' },
    ],
  },
  {
    id: 'telegraph',
    name: 'The Telegraph',
    sigil: 'TT',
    headlinesVia: 'Google News',
    domain: 'telegraphindia.com',
    home: 'https://www.telegraphindia.com/',
    epaper: 'https://epaper.telegraphindia.com/',
    desks: [
      { label: 'Opinion', url: 'https://www.telegraphindia.com/opinion' },
      { label: 'India', url: 'https://www.telegraphindia.com/india' },
      { label: 'World', url: 'https://www.telegraphindia.com/world' },
      { label: 'Business', url: 'https://www.telegraphindia.com/business' },
    ],
    feeds: [
      { url: viaGoogleNews('telegraphindia.com/opinion', 2), section: 'opinion', label: 'Opinion' },
      { url: viaGoogleNews('telegraphindia.com/india'), section: 'nation', label: 'India' },
      { url: viaGoogleNews('telegraphindia.com/world'), section: 'world', label: 'World' },
      { url: viaGoogleNews('telegraphindia.com/business'), section: 'business', label: 'Business' },
    ],
  },
  {
    id: 'tribune',
    name: 'The Tribune',
    sigil: 'Trib',
    domain: 'tribuneindia.com',
    home: 'https://www.tribuneindia.com/',
    epaper: 'https://epaper.tribuneindia.com/',
    desks: [
      { label: 'Opinion', url: 'https://www.tribuneindia.com/opinion/' },
      { label: 'India', url: 'https://www.tribuneindia.com/news/india/' },
      { label: 'World', url: 'https://www.tribuneindia.com/news/world/' },
      { label: 'Business', url: 'https://www.tribuneindia.com/news/business/' },
    ],
    feeds: [
      { url: 'https://publish.tribuneindia.com/feed/', section: 'top', label: 'Latest' },
    ],
  },
  {
    id: 'new-indian-express',
    name: 'The New Indian Express',
    sigil: 'TNIE',
    domain: 'newindianexpress.com',
    home: 'https://www.newindianexpress.com/',
    epaper: 'https://epaper.newindianexpress.com/',
    desks: [
      { label: 'Opinion', url: 'https://www.newindianexpress.com/opinion' },
      { label: 'India', url: 'https://www.newindianexpress.com/india' },
      { label: 'World', url: 'https://www.newindianexpress.com/world' },
      { label: 'Business', url: 'https://www.newindianexpress.com/business' },
    ],
    feeds: [
      { url: 'https://www.newindianexpress.com/feed/', section: 'top', label: 'Latest' },
    ],
  },
];

// Stories older than this are left out of the edition. Columns run less often
// than news, so the opinion page looks back further.
export const MAX_AGE_HOURS = { default: 30, opinion: 72 };

// Below these numbers something is badly wrong, so yesterday's edition is kept.
export const MINIMUM_EDITION = { papers: 4, stories: 60 };

// The day the paper started. Used for the issue number in the masthead.
export const FIRST_ISSUE_DATE = '2026-11-05';
