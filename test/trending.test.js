const { test } = require('node:test');
const assert = require('node:assert/strict');
const { mergeTagCounts } = require('../utils/trending');

test('merges a single count list unchanged', () => {
  const result = mergeTagCounts([{ _id: 'midterms', count: 3 }, { _id: 'coffee', count: 1 }]);
  assert.deepEqual(Object.fromEntries(result), { midterms: 3, coffee: 1 });
});

test('sums counts for the same tag across multiple lists', () => {
  const posts = [{ _id: 'midterms', count: 3 }];
  const nearby = [{ _id: 'midterms', count: 2 }, { _id: 'coffee', count: 1 }];
  const result = mergeTagCounts(posts, nearby);
  assert.deepEqual(Object.fromEntries(result), { midterms: 5, coffee: 1 });
});

test('handles empty lists', () => {
  const result = mergeTagCounts([], []);
  assert.equal(result.size, 0);
});

test('handles no arguments', () => {
  const result = mergeTagCounts();
  assert.equal(result.size, 0);
});
