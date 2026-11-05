import assert from 'node:assert/strict';
import { test } from 'node:test';
import { buildStories, cleanUrl, sectionFromUrl } from '../lib/stories.mjs';

const now = new Date('2026-11-05T03:00:00Z');
const hoursAgo = (hours) => new Date(now.getTime() - hours * 3_600_000).toISOString();
const paper = { id: 'mint' };
const item = (url, title, age = 1) => ({ url, title, summary: '', author: '', publishedAt: hoursAgo(age) });

test('strips tracking and refuses unsafe links', () => {
  assert.equal(cleanUrl('http://x.com/a?utm_source=rss&id=7#top'), 'https://x.com/a?id=7');
  assert.equal(cleanUrl('javascript:alert(1)'), null);
  assert.equal(cleanUrl('not a url'), null);
});

test('sorts mixed-feed stories by URL', () => {
  assert.equal(sectionFromUrl('https://x.com/opinion/editorials/a'), 'opinion');
  assert.equal(sectionFromUrl('https://x.com/market/stock-market-news/a'), 'markets');
  assert.equal(sectionFromUrl('https://x.com/sports/cricket/a'), 'sport');
  assert.equal(sectionFromUrl('https://x.com/news/national/a'), 'nation');
});

test('a named section beats a mixed feed, in either order', () => {
  const mixed = { paper, feed: { section: 'top', label: 'Latest' }, items: [item('https://x.com/a', 'Same story')] };
  const named = { paper, feed: { section: 'opinion', label: 'Editorial' }, items: [item('https://x.com/a', 'Same story')] };

  for (const results of [[mixed, named], [named, mixed]]) {
    const stories = buildStories(results, now);
    assert.equal(stories.length, 1);
    assert.equal(stories[0].section, 'opinion');
    assert.equal(stories[0].desk, 'Editorial');
  }
});

test('drops old news but keeps a recent-enough column', () => {
  const stories = buildStories([
    { paper, feed: { section: 'nation', label: 'India' }, items: [item('https://x.com/old', 'Old', 40)] },
    { paper, feed: { section: 'opinion', label: 'Column' }, items: [item('https://x.com/col', 'Column', 40)] },
  ], now);
  assert.deepEqual(stories.map((story) => story.title), ['Column']);
});

test('leaves out galleries and horoscopes', () => {
  const stories = buildStories([{ paper, feed: { section: 'top', label: 'Latest' }, items: [
    item('https://x.com/photos/a', 'Pictures of the day'),
    item('https://x.com/news/b', 'Horoscope for Thursday'),
    item('https://x.com/news/c', 'A real story'),
  ] }], now);
  assert.deepEqual(stories.map((story) => story.title), ['A real story']);
});

test('one headline under two URLs in a paper appears once', () => {
  const stories = buildStories([{ paper, feed: { section: 'nation', label: 'India' }, items: [
    item('https://x.com/a', 'Same headline'),
    item('https://x.com/b', 'Same headline!'),
  ] }], now);
  assert.equal(stories.length, 1);
});

test('a search result from another site is left out', () => {
  const found = (source) => ({ ...item(`https://news.google.com/${source}`, source), source: `https://www.${source}` });
  const stories = buildStories([{
    paper: { id: 'mint', domain: 'livemint.com' },
    feed: { section: 'nation', label: 'India' },
    items: [found('livemint.com'), found('example.com')],
  }], now);
  assert.deepEqual(stories.map((story) => story.title), ['livemint.com']);
});

test('the same story from both indexes becomes one, with a summary and a direct link', () => {
  const stories = buildStories([
    { paper: { id: 'ie', domain: 'indianexpress.com' }, feed: { section: 'nation', label: 'India' }, items: [
      { ...item('https://news.google.com/rss/articles/abc?oc=5', 'Rupee holds steady'), source: 'https://indianexpress.com' },
    ] },
    { paper: { id: 'ie', domain: 'indianexpress.com' }, feed: { section: 'nation', label: 'India' }, items: [
      { ...item('https://indianexpress.com/article/rupee/', 'Rupee holds steady!', 3), summary: 'Closed flat.', source: 'https://indianexpress.com/article/rupee/' },
    ] },
  ], now);
  assert.equal(stories.length, 1);
  assert.equal(stories[0].url, 'https://indianexpress.com/article/rupee/');
  assert.equal(stories[0].summary, 'Closed flat.');
});
