const { test } = require('node:test');
const assert = require('node:assert/strict');
const { scoreTopics, HASHTAG_WEIGHT } = require('../utils/trending');

const NOW = new Date('2026-09-24T12:00:00Z');
const hoursAgo = (h) => new Date(NOW.getTime() - h * 60 * 60 * 1000);
const occ = (topic, isHashtag, timestamp = NOW) => ({ topic, isHashtag, timestamp });

test('free-text topics score 1 per post at age zero', () => {
  const result = scoreTopics([[occ('midterm', false), occ('midterm', false)]], { now: NOW });
  assert.equal(result.get('midterm').score, 2);
  assert.equal(result.get('midterm').postCount, 2);
});

test('hashtag occurrences are weighted by HASHTAG_WEIGHT', () => {
  const result = scoreTopics([[occ('coffee', true)]], { now: NOW });
  assert.equal(result.get('coffee').score, HASHTAG_WEIGHT);
});

test('sums across multiple lists and marks mixed topics as hashtags', () => {
  const posts = [occ('midterm', false)];
  const nearby = [occ('midterm', true)];
  const entry = scoreTopics([posts, nearby], { now: NOW }).get('midterm');
  assert.equal(entry.score, 1 + HASHTAG_WEIGHT);
  assert.equal(entry.isHashtag, true);
});

test('halves a contribution after one half-life', () => {
  const result = scoreTopics(
    [[occ('midterm', false), occ('midterm', false, hoursAgo(12))]],
    { now: NOW, halfLifeHours: 12 }
  );
  assert.ok(Math.abs(result.get('midterm').score - 1.5) < 0.001);
});

test('drops free-text topics below minTextPosts, keeps single-use hashtags', () => {
  const result = scoreTopics([[occ('random', false), occ('rare', true)]], { now: NOW });
  assert.equal(result.has('random'), false);
  assert.equal(result.has('rare'), true);
});

test('handles empty lists and no arguments', () => {
  assert.equal(scoreTopics([[], []]).size, 0);
  assert.equal(scoreTopics().size, 0);
});

test('merges a plural hashtag into its singular and records both variants', () => {
  const result = scoreTopics([[occ('internship', true), occ('internships', true)]], { now: NOW });
  assert.equal(result.has('internships'), false);
  const entry = result.get('internship');
  assert.equal(entry.score, 2 * HASHTAG_WEIGHT);
  assert.equal(entry.postCount, 2);
  assert.deepEqual([...entry.variants].sort(), ['internship', 'internships']);
});

test('merges across lists and lets a plural free-text word clear minTextPosts', () => {
  const result = scoreTopics([[occ('exam', false)], [occ('exams', false)]], { now: NOW });
  assert.equal(result.get('exam').postCount, 2);
  assert.equal(result.has('exams'), false);
});

test('a lone plural keeps its own form', () => {
  const result = scoreTopics([[occ('internships', true)]], { now: NOW });
  assert.deepEqual([...result.get('internships').variants], ['internships']);
});
