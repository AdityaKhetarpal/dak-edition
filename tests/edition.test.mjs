import assert from 'node:assert/strict';
import { test } from 'node:test';
import { PAPERS, SECTIONS } from '../config/papers.mjs';
import { assembleEdition, isFitToPrint, issueNumber, istDate } from '../lib/edition.mjs';

const now = new Date('2026-11-06T02:40:00Z');
const paper = PAPERS[0];
const feed = paper.feeds[1];
const items = (count) => Array.from({ length: count }, (_, n) => ({
  url: `https://example.com/news/story-${n}`,
  title: `Story number ${n}`,
  summary: '',
  author: '',
  publishedAt: now.toISOString(),
}));

test('the date follows India time, not UTC', () => {
  assert.equal(istDate(new Date('2026-11-05T20:00:00Z')), '2026-11-06');
});

test('issue numbers start at 1 and count days', () => {
  assert.equal(issueNumber('2026-11-05'), 1);
  assert.equal(issueNumber('2026-11-06'), 2);
});

test('failed feeds are recorded and do not stop the edition', () => {
  const edition = assembleEdition([
    { paper, feed, items: items(3), error: null },
    { paper, feed: paper.feeds[2], items: [], error: 'HTTP 403' },
  ], now);
  const report = edition.papers.find((item) => item.id === paper.id);
  assert.equal(report.stories, 3);
  assert.equal(report.feedsRead, 1);
  assert.match(report.failed[0], /HTTP 403/);
});

test('a thin edition is not fit to print', () => {
  const edition = assembleEdition([{ paper, feed, items: items(5), error: null }], now);
  assert.equal(isFitToPrint(edition), false);
});

test('every paper is set up completely', () => {
  const sections = new Set([...SECTIONS.map((section) => section.id), 'top']);
  const ids = new Set(PAPERS.map((item) => item.id));
  assert.equal(ids.size, PAPERS.length);
  for (const item of PAPERS) {
    assert.ok(item.name && item.sigil && item.home && item.epaper, item.id);
    assert.ok(item.feeds.length > 0, item.id);
    assert.ok(item.feeds.every((entry) => sections.has(entry.section)), item.id);
  }
});
