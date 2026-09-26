const dbo = require('../db/conn');
const { extractTopics, canonicalTopics } = require('./topics');

// A topic's contribution to trending halves every 12h. Tunable once real
// usage data exists -- see design doc "Integrate NLP tokenization",
// Section 9, open question: decay rate lambda.
const DEFAULT_HALF_LIFE_HOURS = 12;

// Only posts from the last 7 days count at all. Long enough that a
// slow-building topic (e.g. an announced event, low volume on day 1)
// survives to be seen -- see design doc Section 5, Model 4 (multi-day
// persistence).
const DEFAULT_WINDOW_HOURS = 24 * 7;

// Hashtags are explicit, user-declared topics; free-text tokens are
// inferred. The multiplier keeps that advantage -- design doc Section 6,
// Stage 3.
const HASHTAG_WEIGHT = 1.5;

// A free-text topic must appear in at least this many distinct posts to
// rank. Filters one-off words. Hashtags are exempt: they are explicit, and
// exempting them preserves the sidebar's behavior from before free-text
// topics existed.
const DEFAULT_MIN_TEXT_POSTS = 2;

// Returns { topic, isHashtag, timestamp } for every topic in every post
// within `windowHours` of `now`, in a given collection. Tokenization runs
// here, in the job, rather than at post creation: no schema change, and
// posts written before this feature existed are covered too.
async function getTopicOccurrences(collectionName, windowHours = DEFAULT_WINDOW_HOURS, now = new Date()) {
  const db = dbo.getDb();
  const since = new Date(now.getTime() - windowHours * 60 * 60 * 1000);
  const posts = await db.collection(collectionName).find(
    { timestamp: { $gte: since } },
    { projection: { _id: 0, message: 1, hashtags: 1, timestamp: 1 } }
  ).toArray();

  return posts.flatMap((post) =>
    extractTopics(post.message, post.hashtags || []).map(({ topic, isHashtag }) => ({
      topic,
      isHashtag,
      timestamp: post.timestamp,
    }))
  );
}

// Merges any number of occurrence lists (as returned by
// getTopicOccurrences) into topic -> { score, postCount, isHashtag,
// variants }. Each occurrence contributes weight * e^(-ln2/halfLifeHours *
// ageHours). Plurals are counted under their singular when both appear
// (see canonicalTopics); `variants` holds every form merged into a topic.
// extractTopics already lists each topic once per post, so postCount is a
// count of distinct posts -- except a post using both "internship" and
// "internships" counts twice, which is rare enough to leave alone. Pure
// and DB-free, so it's the part of this module worth unit testing directly.
function scoreTopics(occurrenceLists = [], opts = {}) {
  const halfLifeHours = opts.halfLifeHours ?? DEFAULT_HALF_LIFE_HOURS;
  const minTextPosts = opts.minTextPosts ?? DEFAULT_MIN_TEXT_POSTS;
  const now = opts.now ?? new Date();
  const lambda = Math.LN2 / halfLifeHours;

  const canonical = canonicalTopics(occurrenceLists.flat().map((o) => o.topic));

  const totals = new Map();
  for (const occurrences of occurrenceLists) {
    for (const { topic, isHashtag, timestamp } of occurrences) {
      const ageHours = (now - new Date(timestamp)) / (1000 * 60 * 60);
      const decay = Math.exp(-lambda * Math.max(ageHours, 0));
      const weight = isHashtag ? HASHTAG_WEIGHT : 1;
      const key = canonical.get(topic);

      const entry = totals.get(key) || { score: 0, postCount: 0, isHashtag: false, variants: new Set() };
      entry.score += weight * decay;
      entry.postCount += 1;
      entry.isHashtag = entry.isHashtag || isHashtag;
      entry.variants.add(topic);
      totals.set(key, entry);
    }
  }

  for (const [topic, entry] of totals) {
    if (!entry.isHashtag && entry.postCount < minTextPosts) totals.delete(topic);
  }
  return totals;
}

// Returns the top `limit` trending topics across posts and nearby_posts,
// ranked by decayed, weighted frequency, as [{ tag, score, isHashtag,
// variants }], highest first. The key stays `tag` so the sidebar
// template's existing `t.tag` reads keep working; `variants` lets its
// click-to-filter match every merged form (e.g. #internships under
// #internship).
async function getTrendingTags(limit = 3, opts = {}) {
  const windowHours = opts.windowHours ?? DEFAULT_WINDOW_HOURS;
  const now = opts.now ?? new Date();

  const [postOccurrences, nearbyOccurrences] = await Promise.all([
    getTopicOccurrences('posts', windowHours, now),
    getTopicOccurrences('nearby_posts', windowHours, now),
  ]);

  const totals = scoreTopics([postOccurrences, nearbyOccurrences], { ...opts, now });

  return [...totals.entries()]
    .sort((a, b) => b[1].score - a[1].score)
    .slice(0, limit)
    .map(([tag, { score, isHashtag, variants }]) => ({ tag, score, isHashtag, variants: [...variants].sort() }));
}

module.exports = { getTrendingTags, scoreTopics, getTopicOccurrences, HASHTAG_WEIGHT };
