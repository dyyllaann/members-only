const cron = require('node-cron');
const dbo = require('../db/conn');
const { getTrendingTags } = require('../utils/trending');
const { coalesce } = require('../utils/coalesce');

// How often the trending computation re-runs. Candidate default from the
// design doc (Section 7) -- adjust based on observed load and how quickly
// trends need to surface.
const DEFAULT_SCHEDULE = '*/30 * * * *'; // every 30 minutes

// trending_topics has exactly one document: a cache of the latest
// computation, keyed by a fixed _id so reads are a point lookup ($findOne
// by _id, already indexed) instead of the $unwind/$group aggregation this
// replaces. No new index needed.
const CACHE_DOC_ID = 'current';

// Runs the trending computation once and writes the result to
// trending_topics. Exported separately from startTrendingJob so it can be
// called directly (on startup, or from a one-off script/route) without
// waiting for the next cron tick.
async function runTrendingJob(limit = 3) {
  const db = dbo.getDb();
  const tags = await getTrendingTags(limit);

  await db.collection('trending_topics').updateOne(
    { _id: CACHE_DOC_ID },
    { $set: { tags, computedAt: new Date() } },
    { upsert: true }
  );

  return tags;
}

// Refreshes the cache right after a new post, so it shows up in the
// sidebar on the page the poster is redirected to, instead of at the next
// cron tick. Coalesced: a burst of posts triggers at most one extra run.
// Never rejects -- a failure is logged, not surfaced to the poster, and
// the cron job still catches up.
const refreshTrending = coalesce(() => runTrendingJob());

function requestTrendingRefresh() {
  return refreshTrending().catch((err) => {
    console.error('Post-triggered trending refresh failed:', err.message);
  });
}

// Reads the cached result. This is what app.js's per-request middleware
// should call instead of getTrendingTags directly -- O(1) instead of a
// full aggregation on every GET.
async function getCachedTrendingTags() {
  const db = dbo.getDb();
  const doc = await db.collection('trending_topics').findOne({ _id: CACHE_DOC_ID });
  return doc ? doc.tags : [];
}

// Starts the recurring job. Call once at server startup, after the DB
// connection succeeds (see app.js). Also runs once immediately so the
// cache isn't empty for up to `schedule`'s interval after a fresh deploy.
function startTrendingJob(schedule = DEFAULT_SCHEDULE) {
  runTrendingJob().catch((err) => {
    console.error('Initial trending job run failed:', err.message);
  });

  return cron.schedule(schedule, () => {
    runTrendingJob().catch((err) => {
      console.error('Scheduled trending job run failed:', err.message);
    });
  });
}

module.exports = { runTrendingJob, requestTrendingRefresh, getCachedTrendingTags, startTrendingJob, CACHE_DOC_ID };
