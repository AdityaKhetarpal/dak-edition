import assert from 'node:assert/strict';
import { test } from 'node:test';
import { findTopics, nameTopic, tokenize } from '../lib/topics.mjs';

let nextId = 0;
const story = (paper, title, summary = '') => {
  nextId += 1;
  return { id: `s${nextId}`, paper, title, summary, publishedAt: `2026-11-05T0${nextId % 9}:00:00Z`, section: 'nation' };
};

const pack = () => [
  story('mint', 'Bihar election: NDA seals seat-sharing deal ahead of Bihar polls'),
  story('the-hindu', 'NDA finalises Bihar seat-sharing deal for assembly election'),
  story('indian-express', 'Bihar election: How the NDA seat-sharing deal came together'),
  story('economic-times', 'Bihar polls: BJP, JD(U) to contest equal seats in NDA seat-sharing deal'),
  story('mint', 'Tata Motors reports higher quarterly profit on strong SUV demand'),
  story('economic-times', 'Tata Motors quarterly profit rises as SUV demand holds up'),
  story('the-hindu', 'Tata Motors posts strong quarterly profit, SUV demand helps'),
  story('mint', 'Heavy rain lashes Chennai, schools shut'),
  story('the-hindu', 'Scientists sequence a rare Himalayan orchid genome'),
  story('indian-express', 'Why the Supreme Court paused the new sedition hearing'),
  story('times-of-india', 'Virat Kohli returns to Ranji cricket for Delhi'),
];

test('ranks the story most papers ran first', () => {
  const topics = findTopics(pack());
  assert.equal(topics[0].papers.length, 4);
  assert.match(topics[0].name, /Bihar|seat-sharing/i);
  assert.equal(topics[1].papers.length, 3);
  assert.match(topics[1].name, /Tata Motors/);
});

test('a story only one paper ran is not a topic', () => {
  const names = findTopics(pack()).map((topic) => topic.name).join(' ');
  assert.doesNotMatch(names, /orchid|Kohli/);
});

test('every topic points to real stories and has a unique slug', () => {
  const stories = pack();
  const ids = new Set(stories.map((item) => item.id));
  const topics = findTopics(stories);
  assert.equal(new Set(topics.map((topic) => topic.slug)).size, topics.length);
  for (const topic of topics) {
    assert.ok(ids.has(topic.lead));
    assert.ok(topic.stories.every((id) => ids.has(id)));
  }
});

test('a quiet day gives no topics and no crash', () => {
  assert.deepEqual(findTopics([]), []);
  assert.deepEqual(findTopics([story('mint', 'A lone story')]), []);
});

test('plurals are treated as one word', () => {
  assert.deepEqual(tokenize('tariffs tariff'), ['tariff', 'tariff']);
});

test('prefers a proper name over a vague word', () => {
  const name = nameTopic([
    story('mint', 'Adani Green shares jump after court order'),
    story('the-hindu', 'Court order lifts Adani Green shares'),
    story('indian-express', 'Adani Green rally: what the court order means'),
  ]);
  assert.match(name, /Adani Green/);
});

test('a topic name never ends on a number', () => {
  const name = nameTopic([
    story('mint', 'Mahindra Q2 profit rises 20% on tractor sales'),
    story('the-hindu', 'Mahindra profit rises 20 per cent in second quarter'),
    story('indian-express', 'Mahindra profit rises 20%, tractors lead'),
  ]);
  assert.doesNotMatch(name, /\d$/);
});

test('a number never names a topic', () => {
  const name = nameTopic([
    story('mint', '24-hour bank strike hits Kerala branches'),
    story('the-hindu', '24-hour bank strike shuts Kerala branches'),
    story('indian-express', 'Kerala braces for 24-hour bank strike'),
  ]);
  assert.doesNotMatch(name, /^\d/);
});
