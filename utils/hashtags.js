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

module.exports = { extractHashtags };
