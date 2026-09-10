const { test } = require('node:test');
const assert = require('node:assert/strict');
const { renderMessageWithHashtags } = require('../utils/hashtags');

test('wraps a single hashtag in a clickable span', () => {
  const html = renderMessageWithHashtags('hello #world test');
  assert.equal(
    html,
    'hello <span class="hashtag-link tag-filter-btn" data-tag="world">#world</span> test'
  );
});

test('wraps multiple hashtags, preserving case in the display text but lowercasing data-tag', () => {
  const html = renderMessageWithHashtags('two #Tags in #One message');
  assert.equal(
    html,
    'two <span class="hashtag-link tag-filter-btn" data-tag="tags">#Tags</span> in ' +
    '<span class="hashtag-link tag-filter-btn" data-tag="one">#One</span> message'
  );
});

test('escapes HTML in the surrounding text so it cannot execute', () => {
  const html = renderMessageWithHashtags('<script>alert(1)</script> #xss');
  assert.equal(
    html,
    '&lt;script&gt;alert(1)&lt;/script&gt; <span class="hashtag-link tag-filter-btn" data-tag="xss">#xss</span>'
  );
  assert.ok(!html.includes('<script>'));
});

test('returns escaped plain text unchanged when there are no hashtags', () => {
  assert.equal(renderMessageWithHashtags('no hashtags here'), 'no hashtags here');
});

test('returns empty string for empty/undefined input', () => {
  assert.equal(renderMessageWithHashtags(''), '');
  assert.equal(renderMessageWithHashtags(undefined), '');
});
