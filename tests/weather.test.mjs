import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readForecast } from '../lib/weather.mjs';

test('reads a forecast', () => {
  const forecast = readForecast({ daily: { weather_code: [45], temperature_2m_max: [28.6], temperature_2m_min: [15.2] } });
  assert.deepEqual(forecast, { city: 'Delhi', sky: 'Fog', high: 29, low: 15 });
});

test('an unknown sky still gives temperatures', () => {
  assert.equal(readForecast({ daily: { weather_code: [999], temperature_2m_max: [30], temperature_2m_min: [20] } }).sky, null);
});

test('a broken reply gives nothing rather than wrong numbers', () => {
  assert.equal(readForecast({}), null);
  assert.equal(readForecast({ daily: { temperature_2m_max: [null], temperature_2m_min: [20] } }), null);
});
