// Shared with the client-side highlighting logic in public/javascripts/ui-controls.js
// -- keep the pattern identical there so what gets highlighted while typing is
// exactly what gets extracted and saved.
const HASHTAG_PATTERN = /#[\w]+/g;

// Extracts #hashtag tokens from post text, lowercased, '#' stripped, and
// deduplicated (case-insensitively) while preserving first-seen order.
function extractHashtags(text) {
  if (!text) return [];

  const seen = new Set();
  const tags = [];
  let match;

  HASHTAG_PATTERN.lastIndex = 0;
  while ((match = HASHTAG_PATTERN.exec(text)) !== null) {
    const tag = match[0].slice(1).toLowerCase();
    if (!seen.has(tag)) {
      seen.add(tag);
      tags.push(tag);
    }
  }

  return tags;
}

function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Renders a post/comment message as safe HTML, escaping ordinary text and
// wrapping each #hashtag in a clickable span. `tag-filter-btn` is the same
// class the sidebar's tag buttons use, so the existing click-to-filter
// listener in ui-controls.js (which queries for that class at page load)
// picks these up too, with no separate wiring needed. `hashtag-link` is
// purely for CSS -- see style.css for why it overrides tag-filter-btn's
// full-width sidebar-button layout back to inline text.
function renderMessageWithHashtags(message) {
  if (!message) return '';

  let html = '';
  let lastIndex = 0;
  let match;

  HASHTAG_PATTERN.lastIndex = 0;
  while ((match = HASHTAG_PATTERN.exec(message)) !== null) {
    html += escapeHtml(message.slice(lastIndex, match.index));
    const tag = match[0].slice(1).toLowerCase();
    html += `<span class="hashtag-link tag-filter-btn" data-tag="${escapeHtml(tag)}">${escapeHtml(match[0])}</span>`;
    lastIndex = match.index + match[0].length;
  }
  html += escapeHtml(message.slice(lastIndex));

  return html;
}

module.exports = { extractHashtags, renderMessageWithHashtags };
