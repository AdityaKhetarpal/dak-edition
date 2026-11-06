// The weather box in the masthead. It is a nicety, so a failure here never
// stops the edition: the box falls back to the day's story count.
import { fetchText } from './http.mjs';

const DELHI = 'latitude=28.61&longitude=77.21';
const FORECAST = `https://api.open-meteo.com/v1/forecast?${DELHI}&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=Asia%2FKolkata&forecast_days=1`;

// Open-Meteo reports the standard WMO weather codes.
const SKIES = [
  [[0], 'Clear'],
  [[1, 2], 'Partly cloudy'],
  [[3], 'Overcast'],
  [[45, 48], 'Fog'],
  [[51, 53, 55, 56, 57], 'Drizzle'],
  [[61, 63, 65, 66, 67, 80, 81, 82], 'Rain'],
  [[71, 73, 75, 77, 85, 86], 'Snow'],
  [[95, 96, 99], 'Thunderstorms'],
];

export function readForecast(json) {
  const { weather_code: codes, temperature_2m_max: highs, temperature_2m_min: lows } = json?.daily ?? {};
  if (!Number.isFinite(highs?.[0]) || !Number.isFinite(lows?.[0])) return null;

  const sky = SKIES.find(([list]) => list.includes(codes?.[0]))?.[1];
  return { city: 'Delhi', sky: sky ?? null, high: Math.round(highs[0]), low: Math.round(lows[0]) };
}

export async function fetchWeather() {
  try {
    const { text } = await fetchText(FORECAST, { attempts: 2 });
    return readForecast(JSON.parse(text));
  } catch (error) {
    console.log(`Weather unavailable: ${error.message}`);
    return null;
  }
}
