// Finds the day's talking points without any paid AI service.
//
// The idea: if several papers independently write about the same thing, their
// headlines share rare words. So:
//   1. Turn each story into weighted words (TF-IDF), where rare words count more.
//   2. Group stories whose words overlap strongly.
//   3. Rank the groups by how many different papers ran them.
//   4. Name each group after the phrase most of its headlines share.

const STOP_WORDS = new Set(`
a about above across after again against all almost also am among amid an and any are around as at
back be because been before being below between both but by came can cannot could did do does doing
done down during each either even ever every few for from further get gets getting give given gives go
goes going got had has have having he her here hers him his how however i if in into is it its itself
just keep know last least less let like likely made make makes making many may me might more most much
must my near need needs never new next no nor not now of off on once one only onto or other our out over
own past per put said same say saying says see seen set she should show shows since so some still such
take takes taken than that the their them then there these they this those through to told too took
toward under until up upon us use used using very via want wants was way we well were what when where
which while who whom whose why will with within without would year years yet you your
today tomorrow yesterday tonight morning evening night week weeks month months day days time times
monday tuesday wednesday thursday friday saturday sunday
january february march april june july august september october november december
news live update updates latest report reports reported breaking exclusive explained watch read top big
key major amid first second third two three four five six seven eight nine ten
india indian indians nation national country state states govt government centre central official
officials minister ministers people man woman men women lakh crore rs per cent percent million billion
`.trim().split(/\s+/));

// Words common in headlines but too vague to name a topic on their own.
const WEAK_LABEL_WORDS = new Set(`
delhi mumbai court police bjp congress modi pm cm sc hc rbi stock stocks market markets share shares
company companies bank banks price prices sensex nifty case cases plan deal talks meet call calls
`.trim().split(/\s+/));

const SIMILARITY_NEEDED = 0.3;
const SHARED_TITLE_WORDS_NEEDED = 2;

function stem(word) {
  if (word.length > 4 && word.endsWith('ies')) return `${word.slice(0, -3)}y`;
  if (word.length > 4 && word.endsWith('s') && !/(ss|us|is)$/.test(word)) return word.slice(0, -1);
  return word;
}

export function tokenize(text) {
  return text
    .toLowerCase()
    .replace(/[’']s\b/g, '')
    .split(/[^\p{L}\p{N}]+/u)
    .filter((word) => word.length > 1 && !/^\d+$/.test(word) && !STOP_WORDS.has(word))
    .map(stem);
}

function buildVectors(stories) {
  const titleWords = stories.map((story) => new Set(tokenize(story.title)));
  const docFrequency = new Map();

  stories.forEach((story, index) => {
    const words = new Set([...titleWords[index], ...tokenize(story.summary)]);
    for (const word of words) docFrequency.set(word, (docFrequency.get(word) ?? 0) + 1);
  });

  const total = stories.length;
  const vectors = stories.map((story, index) => {
    const counts = new Map();
    // A headline says more about a story than its summary does.
    for (const word of titleWords[index]) counts.set(word, (counts.get(word) ?? 0) + 3);
    for (const word of tokenize(story.summary)) counts.set(word, (counts.get(word) ?? 0) + 1);

    const vector = new Map();
    for (const [word, count] of counts) {
      vector.set(word, (1 + Math.log(count)) * Math.log(1 + total / (docFrequency.get(word) ?? 1)));
    }
    return normalize(vector);
  });

  return { vectors, titleWords };
}

function normalize(vector) {
  const length = Math.sqrt([...vector.values()].reduce((sum, value) => sum + value * value, 0)) || 1;
  return new Map([...vector].map(([word, value]) => [word, value / length]));
}

function cosine(a, b) {
  const [small, large] = a.size < b.size ? [a, b] : [b, a];
  let sum = 0;
  for (const [word, value] of small) sum += value * (large.get(word) ?? 0);
  return sum;
}

function groupStories(stories, vectors, titleWords) {
  const groups = [];

  // Oldest first, so a running story grows one group through the day.
  const order = stories.map((_, index) => index).sort((a, b) =>
    (stories[a].publishedAt ?? '').localeCompare(stories[b].publishedAt ?? ''),
  );

  for (const index of order) {
    let best = null;
    let bestScore = 0;

    for (const group of groups) {
      const score = cosine(vectors[index], group.centroid);
      if (score <= bestScore || score < SIMILARITY_NEEDED) continue;
      const shared = [...titleWords[index]].filter((word) => group.titleWords.has(word)).length;
      if (shared >= SHARED_TITLE_WORDS_NEEDED) {
        best = group;
        bestScore = score;
      }
    }

    if (best) {
      best.members.push(index);
      best.centroid = normalize(mergeVectors(best.members, vectors));
      for (const word of titleWords[index]) best.titleWords.add(word);
    } else {
      groups.push({
        members: [index],
        centroid: vectors[index],
        titleWords: new Set(titleWords[index]),
      });
    }
  }
  return groups;
}

function mergeVectors(members, vectors) {
  const merged = new Map();
  for (const member of members) {
    for (const [word, value] of vectors[member]) merged.set(word, (merged.get(word) ?? 0) + value);
  }
  return merged;
}

function displayWords(title) {
  return title
    .replace(/[’']s\b/g, '')
    .split(/\s+/)
    .map((word) => word.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, ''))
    .filter(Boolean);
}

const isNameLike = (word) => /^[\p{Lu}\p{N}]/u.test(word);

// Names a group after the phrase that appears in the most papers' headlines.
export function nameTopic(members) {
  const phrases = new Map();

  for (const story of members) {
    const words = displayWords(story.title);
    const seenInStory = new Set();

    for (let size = 1; size <= 3; size += 1) {
      for (let start = 0; start + size <= words.length; start += 1) {
        const piece = words.slice(start, start + size);
        const lower = piece.map((word) => word.toLowerCase());
        if (STOP_WORDS.has(lower[0]) || STOP_WORDS.has(lower[size - 1])) continue;

        const key = lower.map(stem).join(' ');
        if (seenInStory.has(key)) continue;
        seenInStory.add(key);

        const entry = phrases.get(key) ?? { papers: new Set(), forms: new Map(), size, lower };
        entry.papers.add(story.paper);
        const form = piece.join(' ');
        entry.forms.set(form, (entry.forms.get(form) ?? 0) + 1);
        phrases.set(key, entry);
      }
    }
  }

  let best = null;
  let bestScore = -1;

  for (const entry of phrases.values()) {
    const form = [...entry.forms].sort((a, b) => b[1] - a[1])[0][0];
    const words = form.split(' ');
    const nameShare = words.filter(isNameLike).length / words.length;
    const onlyWeakWords = entry.lower.every((word) => WEAK_LABEL_WORDS.has(word));

    const score =
      entry.papers.size * (1 + 0.4 * (entry.size - 1)) * (0.5 + nameShare) * (onlyWeakWords ? 0.4 : 1);

    if (score > bestScore) {
      best = form;
      bestScore = score;
    }
  }

  if (!best) return members[0].title;
  return best[0].toLocaleUpperCase('en-IN') + best.slice(1);
}

function pickCentral(memberIndexes, stories, vectors) {
  let central = memberIndexes[0];
  let bestScore = -1;

  for (const candidate of memberIndexes) {
    const closeness = memberIndexes.reduce((sum, other) => sum + cosine(vectors[candidate], vectors[other]), 0);
    // Prefer a story that has a summary to show.
    const score = closeness + (stories[candidate].summary ? 0.25 : 0);
    if (score > bestScore) {
      central = candidate;
      bestScore = score;
    }
  }
  return central;
}

const slugify = (text) =>
  text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'topic';

export function findTopics(stories, { limit = 8 } = {}) {
  if (stories.length === 0) return [];

  const { vectors, titleWords } = buildVectors(stories);
  const groups = groupStories(stories, vectors, titleWords);

  const ranked = groups
    .map((group) => {
      const members = group.members.map((index) => stories[index]);
      const papers = [...new Set(members.map((story) => story.paper))];
      return { group, members, papers };
    })
    .filter(({ papers }) => papers.length >= 2)
    .sort(
      (a, b) =>
        b.papers.length - a.papers.length ||
        b.members.length - a.members.length,
    );

  // Prefer stories at least three papers ran. Use two-paper stories only to
  // fill a thin news day.
  const strong = ranked.filter(({ papers }) => papers.length >= 3);
  const chosen = (strong.length >= 4 ? strong : ranked).slice(0, limit);

  const usedSlugs = new Set();

  return chosen.map(({ group, members, papers }) => {
    const name = nameTopic(members);
    const leadIndex = pickCentral(group.members, stories, vectors);

    let slug = slugify(name);
    for (let n = 2; usedSlugs.has(slug); n += 1) slug = `${slugify(name)}-${n}`;
    usedSlugs.add(slug);

    return {
      slug,
      name,
      lead: stories[leadIndex].id,
      papers,
      stories: members
        .sort((a, b) => (b.publishedAt ?? '').localeCompare(a.publishedAt ?? ''))
        .map((story) => story.id),
    };
  });
}
