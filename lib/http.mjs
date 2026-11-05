// Polite fetching: an honest client name, a few requests at a time, and
// a short retry for the odd failed connection.

export const USER_AGENT =
  'DakEdition/1.0 (personal newspaper reader; +https://github.com/AdityaKhetarpal/dak-edition)';

const TIMEOUT_MS = 20_000;
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export async function fetchText(url, { attempts = 3, method = 'GET' } = {}) {
  let lastError;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const response = await fetch(url, {
        method,
        redirect: 'follow',
        signal: AbortSignal.timeout(TIMEOUT_MS),
        headers: {
          'User-Agent': USER_AGENT,
          Accept: 'application/rss+xml, application/atom+xml, application/xml, text/xml;q=0.9, */*;q=0.8',
        },
      });

      if (!response.ok) {
        const error = new Error(`HTTP ${response.status}`);
        error.status = response.status;
        throw error;
      }
      return { text: await response.text(), status: response.status, finalUrl: response.url };
    } catch (error) {
      lastError = error;
      // A 4xx will say the same thing next time, so don't ask again.
      if (error.status >= 400 && error.status < 500 && error.status !== 429) break;
      if (attempt < attempts) await wait(1_500 * attempt);
    }
  }
  throw lastError;
}

export async function mapLimit(items, limit, worker) {
  const results = new Array(items.length);
  let next = 0;

  const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) {
      const index = next;
      next += 1;
      results[index] = await worker(items[index], index);
    }
  });

  await Promise.all(runners);
  return results;
}
