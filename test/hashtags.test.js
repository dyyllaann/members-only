const { test } = require('node:test');
const assert = require('node:assert/strict');
const { extractHashtags } = require('../utils/hashtags');

test('extracts a single hashtag, stripped and lowercased', () => {
  assert.deepEqual(extractHashtags('hello #World test'), ['world']);
});

test('extracts multiple hashtags in order', () => {
  assert.deepEqual(extractHashtags('two #Tags in #One message'), ['tags', 'one']);
});

test('deduplicates repeated hashtags case-insensitively', () => {
  assert.deepEqual(extractHashtags('#dawgs go #dawgs go #DAWGS'), ['dawgs']);
});

test('returns an empty array when there are no hashtags', () => {
  assert.deepEqual(extractHashtags('no hashtags here'), []);
});

test('returns an empty array for empty/undefined input', () => {
  assert.deepEqual(extractHashtags(''), []);
  assert.deepEqual(extractHashtags(undefined), []);
});

test('a bare "#" with no following word characters is not a tag', () => {
  assert.deepEqual(extractHashtags('just a # by itself'), []);
});

test('matches a hashtag directly adjacent to other characters, same as the client-side regex', () => {
  assert.deepEqual(extractHashtags('a#notatag'), ['notatag']);
});
