// End-to-end check of tokenize -> score -> rank on the 40-post fixture
// (design doc Section 8). Asserts the shape of the ranking, not exact
// scores, so tuning the half-life doesn't break it.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { NOW, posts } = require('./fixtures/seedPosts');
const { extractTopics, STOPWORDS } = require('../utils/topics');
const { scoreTopics } = require('../utils/trending');

function rank(opts = {}) {
  const occurrences = posts.flatMap((p) =>
    extractTopics(p.message, p.hashtags).map((t) => ({ ...t, timestamp: p.timestamp }))
  );
  return [...scoreTopics([occurrences], { now: NOW, ...opts }).entries()]
    .sort((a, b) => b[1].score - a[1].score);
}

test('the recent burst ranks first', () => {
  assert.equal(rank()[0][0], 'midterm');
});

test('the multi-day hashtag event ranks second', () => {
  assert.equal(rank()[1][0], 'careerfair');
  assert.equal(rank()[1][1].isHashtag, true);
});

test('a larger but older burst ranks below the multi-day event', () => {
  const topics = rank().map(([t]) => t);
  assert.ok(topics.indexOf('coffee') > topics.indexOf('careerfair'));
});

test('no single-post free-text word and no stopword ranks', () => {
  for (const [topic, entry] of rank()) {
    assert.ok(entry.isHashtag || entry.postCount >= 2, `${topic} ranked from one post`);
    assert.ok(!STOPWORDS.has(topic), `${topic} is a stopword`);
  }
});
