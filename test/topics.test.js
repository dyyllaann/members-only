const { test } = require('node:test');
const assert = require('node:assert/strict');
const { tokenizeMessage, extractTopics, canonicalTopics, singularCandidates } = require('../utils/topics');

test('drops stopwords, short tokens, numbers, URLs, and hashtags', () => {
  const tokens = tokenizeMessage("Anyone else studying for the midterm? Don't forget: room 204 https://x.co/abc #coffee");
  assert.deepEqual(tokens.sort(), ['forget', 'midterm', 'room', 'studying']);
});

test('keeps alphanumeric course codes', () => {
  assert.deepEqual(tokenizeMessage('CSE452 lab is brutal'), ['cse452', 'lab', 'brutal']);
});

test('lists each token once per post', () => {
  assert.deepEqual(tokenizeMessage('coffee coffee COFFEE'), ['coffee']);
});

test('a word used as both hashtag and plain text counts once, as a hashtag', () => {
  const topics = extractTopics('coffee at the hub #coffee', ['coffee']);
  assert.deepEqual(topics, [
    { topic: 'coffee', isHashtag: true },
    { topic: 'hub', isHashtag: false },
  ]);
});

test('handles empty input', () => {
  assert.deepEqual(extractTopics('', []), []);
  assert.deepEqual(extractTopics(undefined), []);
});

test('singularCandidates covers -ies, -es, and -s, but not -ss', () => {
  assert.deepEqual(singularCandidates('parties'), ['party', 'parti', 'partie']);
  assert.deepEqual(singularCandidates('classes'), ['class', 'classe']);
  assert.deepEqual(singularCandidates('internships'), ['internship']);
  assert.deepEqual(singularCandidates('glass'), []);
});

test('canonicalTopics merges a plural only into a singular that was used', () => {
  const canonical = canonicalTopics(['internships', 'internship', 'parties', 'party', 'classes', 'class', 'boxes', 'box']);
  assert.equal(canonical.get('internships'), 'internship');
  assert.equal(canonical.get('parties'), 'party');
  assert.equal(canonical.get('classes'), 'class');
  assert.equal(canonical.get('boxes'), 'box');
  assert.equal(canonical.get('internship'), 'internship');
});

test('canonicalTopics leaves words alone when no singular was used', () => {
  const canonical = canonicalTopics(['campus', 'courses', 'news', 'internships']);
  assert.equal(canonical.get('campus'), 'campus');
  assert.equal(canonical.get('courses'), 'courses');
  assert.equal(canonical.get('news'), 'news');
  assert.equal(canonical.get('internships'), 'internships');
});
