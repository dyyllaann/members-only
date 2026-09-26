const { test } = require('node:test');
const assert = require('node:assert/strict');
const { tokenizeMessage, extractTopics } = require('../utils/topics');

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
