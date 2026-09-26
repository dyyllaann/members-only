// Deep imports on purpose: require('natural') loads natural's storage
// backends (mongoose, pg, redis, memjs) plus a second dotenv that logs on
// import. This project does not use mongoose. These two files load none of
// that. natural has no "exports" map, so these paths are reachable but not
// a stable public API -- the version is pinned exactly in package.json.
const { WordTokenizer } = require('natural/lib/natural/tokenizers/regexp_tokenizer');
const { words: NATURAL_STOPWORDS } = require('natural/lib/natural/util/stopwords');

const tokenizer = new WordTokenizer();

// natural's stopword list (170 words) misses contraction fragments and
// common chat filler. Additions here are the tunable noise filter -- add
// words as they show up in the trending sidebar without meaning anything.
const EXTRA_STOPWORDS = [
  // WordTokenizer splits "don't" into "don" + "t"; short fragments are
  // already dropped by MIN_TOKEN_LENGTH, these are the ones that survive.
  'don', 'didn', 'doesn', 'isn', 'wasn', 'aren', 'won', 'can', 'couldn',
  'wouldn', 'shouldn', 'haven', 'hasn', 'ain',
  // Chat filler
  'anyone', 'else', 'just', 'really', 'also', 'still', 'lol', 'yeah',
  'yes', 'okay', 'thanks', 'thank', 'please', 'guys', 'going', 'gonna',
  'wanna', 'got', 'know', 'think', 'want', 'need', 'today', 'tonight',
  'tomorrow', 'one', 'much', 'many', 'lot', 'something', 'anything',
];

const STOPWORDS = new Set([...NATURAL_STOPWORDS, ...EXTRA_STOPWORDS]);
const MIN_TOKEN_LENGTH = 3;

const URL_PATTERN = /https?:\/\/\S+|www\.\S+/gi;
// Same pattern as utils/hashtags.js. Hashtags are removed from the text
// before tokenizing because they already arrive via the post's `hashtags`
// array -- tokenizing them again would count them twice.
const HASHTAG_PATTERN = /#[\w]+/g;

// Free-text tokens from a message: URLs and hashtags removed, lowercased,
// stopwords and short/numeric-only tokens dropped, deduplicated. No
// stemming -- stems ("studi") can't be shown in the sidebar, and the
// sidebar's click-to-filter matches literal words in post text.
function tokenizeMessage(message) {
  if (!message) return [];

  const cleaned = message.replace(URL_PATTERN, ' ').replace(HASHTAG_PATTERN, ' ');
  const tokens = new Set();

  for (const raw of tokenizer.tokenize(cleaned)) {
    const token = raw.toLowerCase();
    if (token.length < MIN_TOKEN_LENGTH) continue;
    if (/^\d+$/.test(token)) continue;
    if (STOPWORDS.has(token)) continue;
    tokens.add(token);
  }

  return [...tokens];
}

// All topics for one post: its hashtags plus free-text tokens, each listed
// once. A word that appears both as a hashtag and in plain text counts
// once, as a hashtag -- the explicit signal wins.
function extractTopics(message, hashtags = []) {
  const topics = new Map();

  for (const tag of hashtags) {
    topics.set(tag.toLowerCase(), true);
  }
  for (const token of tokenizeMessage(message)) {
    if (!topics.has(token)) topics.set(token, false);
  }

  return [...topics.entries()].map(([topic, isHashtag]) => ({ topic, isHashtag }));
}

module.exports = { extractTopics, tokenizeMessage, STOPWORDS };
