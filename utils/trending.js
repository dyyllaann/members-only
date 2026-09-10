const dbo = require('../db/conn');

// Counts how many times each hashtag appears across a collection's
// `hashtags` arrays. No date filter -- this is a plain frequency count,
// not a time-decayed trending score.
async function getHashtagCounts(collectionName) {
  const db = dbo.getDb();
  return db.collection(collectionName).aggregate([
    { $unwind: '$hashtags' },
    { $group: { _id: '$hashtags', count: { $sum: 1 } } },
  ]).toArray();
}

// Merges any number of [{ _id: tag, count }] lists (as returned by
// getHashtagCounts) into a single tag -> total-count map. Pure and DB-free,
// so it's the part of this module worth unit testing directly.
function mergeTagCounts(...countLists) {
  const totals = new Map();
  for (const counts of countLists) {
    for (const { _id: tag, count } of counts) {
      totals.set(tag, (totals.get(tag) || 0) + count);
    }
  }
  return totals;
}

// Returns the top `limit` most-used hashtags across posts and nearby_posts,
// as [{ tag, count }], most-used first.
async function getTrendingTags(limit = 3) {
  const [postCounts, nearbyCounts] = await Promise.all([
    getHashtagCounts('posts'),
    getHashtagCounts('nearby_posts'),
  ]);

  const totals = mergeTagCounts(postCounts, nearbyCounts);

  return [...totals.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([tag, count]) => ({ tag, count }));
}

module.exports = { getTrendingTags, mergeTagCounts };
