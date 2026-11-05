# The Dak Edition

Every morning's Indian newspapers, on one sheet. A dak edition is the early run of a
newspaper, sent out by post to readers far from the press.

**Live site:** https://dak-edition.vercel.app

## What it does

- Collects the day's stories from 13 English dailies, sorted by paper and by section.
- Finds the talking points: the stories that the most papers ran that day. Each one
  links straight to every paper's own piece.
- Gives each paper its own page, with links to its e-paper, columns and sections.

Stories show a headline and a short summary. The full piece always opens on the paper's
own site, and some papers need a subscription. No PDFs or full articles are stored here.

## How the morning run works

1. `.github/workflows/morning-edition.yml` starts at 8:05 AM IST. GitHub often starts
   scheduled runs late, so this leaves room to be live by 8:30. A second run at 8:22 AM
   stops straight away if the first one worked.
2. `scripts/file-edition.mjs` reads the feeds and writes `data/edition.json`.
3. The workflow commits that file, and Vercel rebuilds the site from the commit.

If too few stories come through, the run fails and the previous edition stays up.

## Finding talking points

`lib/topics.mjs` uses no paid AI service. It scores each story's words with TF-IDF, so
rare words count for more. It then groups stories that share them, and ranks the groups
by how many different papers ran them.

## Changing the papers

Everything lives in `config/papers.mjs`. To check a new feed, run the **Check sources**
workflow from the Actions tab and paste the address in.

The Indian Express, Business Standard, The Financial Express and The Telegraph refuse
automated requests for their feeds, so their headlines come from Google News searches.
Those stories have no summaries.

## Running it locally

```
npm install
npm test
npm run dev
```

`npm run file-edition` fetches a fresh edition. Add `npm run build` for the final site.
