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

1. `.github/workflows/morning-edition.yml` has several chances between 7:50 AM and
   12:10 PM IST. GitHub's scheduler can be hours late or skip a new repo altogether, so
   a daily outside trigger at 8:08 AM IST also starts the workflow. The first run that
   works files the edition, and the rest stop straight away.
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
automated requests for their feeds. Those papers, and the sections other papers have no
feed for, are built from two public news indexes. Google News supplies the freshest
headlines and Bing News adds summaries and direct links. A story with no match in Bing
shows its headline alone and opens through Google News.

## RSS feeds

The site publishes its own feeds, rebuilt with each edition. `/feeds/` lists them all:
one for the whole edition, one for talking points, and one for each section and paper.

## Design and motion

The site is a six-page broadsheet: front page, Nation, World, the editorial page, the
pink pages, and a back page for Technology and Sport.

- [GSAP](https://github.com/greensock/GSAP) runs the opening print run and the way each
  page settles as it scrolls in. It is free under GreenSock's standard licence.
- [Lenis](https://github.com/darkroomengineering/lenis) smooths the scrolling.
- [Vanta](https://github.com/tengbao/vanta) draws the slow ink fog on the desk under the
  paper. It only loads on large screens.
- Internal links turn the page with the browser's own View Transitions.

All motion switches off for readers who ask for reduced motion, and every story works
with JavaScript turned off. The weather in the masthead comes from
[Open-Meteo](https://open-meteo.com/).

## Running it locally

```
npm install
npm test
npm run dev
```

`npm run file-edition` fetches a fresh edition. Add `npm run build` for the final site.
