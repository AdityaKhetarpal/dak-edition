import assert from 'node:assert/strict';
import { test } from 'node:test';
import { SUMMARY_LIMIT, cleanTitle, toPlainText, toSummary } from '../lib/text.mjs';

test('decodes double-encoded entities and strips tags', () => {
  assert.equal(toPlainText('It&amp;#8217;s <em>fine</em> &#x20B9;5'), 'It’s fine ₹5');
});

test('removes scripts along with their contents', () => {
  assert.equal(toPlainText('Hello<script>alert(1)</script> there'), 'Hello there');
});

test('a summary that repeats the headline is dropped', () => {
  assert.equal(toSummary('RBI holds rates', 'RBI holds rates!'), '');
});

test('long summaries are cut to the limit', () => {
  const long = 'word '.repeat(200);
  const summary = toSummary(long);
  assert.ok(summary.length <= SUMMARY_LIMIT + 1);
  assert.ok(summary.endsWith('…'));
});

test('takes the label off an opinion headline', () => {
  assert.equal(cleanTitle('Opinion: Why the rupee matters'), 'Why the rupee matters');
  assert.equal(cleanTitle('Editorial. Green gridlock'), 'Green gridlock');
  assert.equal(cleanTitle('Exclusive: The inside story'), 'Exclusive: The inside story');
});
