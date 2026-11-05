// Runs each morning from .github/workflows/morning-edition.yml.
// Fetches the feeds and writes data/edition.json, which the site is built from.
import { readFile, writeFile } from 'node:fs/promises';
import { assembleEdition, fetchAllFeeds, isFitToPrint } from '../lib/edition.mjs';

const EDITION_FILE = new URL('../data/edition.json', import.meta.url);
const RECENT_MINUTES = 40;

// GitHub's schedule runs twice as a safety net. The second run stops here if
// the first one already worked.
async function alreadyFiled() {
  if (process.env.SKIP_IF_RECENT !== 'true') return false;
  try {
    const { filedAt } = JSON.parse(await readFile(EDITION_FILE, 'utf8'));
    return filedAt && Date.now() - Date.parse(filedAt) < RECENT_MINUTES * 60_000;
  } catch {
    return false;
  }
}

if (await alreadyFiled()) {
  console.log('An edition was filed in the last few minutes. Nothing to do.');
  process.exit(0);
}

const results = await fetchAllFeeds();
const edition = assembleEdition(results);

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
