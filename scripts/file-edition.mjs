// Runs each morning from .github/workflows/morning-edition.yml.
// Fetches the feeds and writes data/edition.json, which the site is built from.
import { readFile, writeFile } from 'node:fs/promises';
import { assembleEdition, fetchAllFeeds, isFiledThisMorning, isFitToPrint } from '../lib/edition.mjs';
import { fetchWeather } from '../lib/weather.mjs';

const EDITION_FILE = new URL('../data/edition.json', import.meta.url);
// The schedule has several runs a day as a safety net. Only the first one that
// works should file; the others stop here. An edition filed by hand late last
// night doesn't count as today's.
async function alreadyFiled() {
  if (process.env.SKIP_IF_FILED_TODAY !== 'true') return false;
  try {
    const { filedAt } = JSON.parse(await readFile(EDITION_FILE, 'utf8'));
    return isFiledThisMorning(filedAt, new Date());
  } catch {
    return false;
  }
}

if (await alreadyFiled()) {
  console.log("Today's edition is already filed. Nothing to do.");
  process.exit(0);
}

const results = await fetchAllFeeds();
const edition = { ...assembleEdition(results), weather: await fetchWeather() };

for (const paper of edition.papers) {
  const note = paper.failed.length ? `  failed: ${paper.failed.join('; ')}` : '';
  console.log(`${paper.id}: ${paper.stories} stories, ${paper.feedsRead}/${paper.feedsTotal} feeds${note}`);
}
console.log(`Total: ${edition.stories.length} stories, ${edition.topics.length} talking points`);
for (const topic of edition.topics) {
  console.log(`  ${topic.name}: ${topic.papers.length} papers, ${topic.stories.length} stories`);
}

if (!isFitToPrint(edition)) {
  console.error('Too few stories came through, so the previous edition stays up.');
  process.exit(1);
}

await writeFile(EDITION_FILE, `${JSON.stringify(edition, null, 1)}\n`);
console.log(`Filed the edition of ${edition.editionDate}.`);
