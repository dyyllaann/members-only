# Product Requirements Document: Hashtag Detection and Tagging

## Problem Statement
#### What user problems are we solving?
Users lack a lightweight way to categorize their thoughts, contribute to, or surface trending discussions. Current rigid category selectors create friction during authoring, which prevents emergent campus conversations (e.g., `#midterms`, `#dubhacks2026`, `#redsquare`) from naturally surfacing across feeds.

## Proposed Solution
#### What are we building?

**1. Real-Time Client-Side Tag Highlighting**
In the post creation interface, as the user types, a Vanilla JS text-processing utility detects words prefixed with `#` and dynamically styles the symbol and text with `--color-accent` to provide immediate visual confirmation that the token will be registered as a tag.

**2. Automated Ingestion & Tag Extraction Pipeline**
On form submission, the server extracts all hashtagged terms (`/#[\w]+/g`), normalizes them (lowercasing, deduplicating instances within the same post, and stripping the `#` symbol), and stores them directly in the document's `tags` array.

**3. Cross-Collection Tag Persistence**
Support hashtag tagging identically across both standard persistent posts and ephemeral nearby posts, ensuring both communication channels can be cataloged and filtered by topic.

### Data Model Updates
Update both the `posts` and `nearby_posts` collections to include a dedicated `tags` field:

**`posts` Collection Schema:**
* `_id`: ObjectId
* `authorId`: ObjectId (Reference to `users` collection)
* `content`: String
* `tags`: Array of Strings (e.g., `["finals", "cse311", "studygroup"]`)
* `createdAt`: Date / ISO String
* *(Existing fields: `likes`, `commentCount`, etc.)*

**`nearby_posts` Collection Schema:**
* `_id`: ObjectId
* `authorId`: ObjectId (Reference to `users` collection)
* `content`: String
* `location`: GeoJSON Point Object
* `tags`: Array of Strings (e.g., `["odegaard", "coffee"]`)
* `createdAt`: Date / ISO String (TTL index: 24-hour expiration)
* *(Existing fields: `likes`, `distanceLabel`, etc.)*

*Note: Both collections maintain a multikey index on `{ tags: 1 }` to support low-latency array lookup queries.*

## Acceptance Criteria
#### How do we test that this works?
* [ ] Typing a hashtag (`#`) followed by alphanumeric characters in the post composer immediately applies `--color-accent` styling to the token in real time.
* [ ] Submitting a standard post containing hashtags parses, lowercases, and saves the tokens into the `tags` array in the `posts` collection.
* [ ] Submitting an ephemeral post via `/api/nearby` parses and saves the tokens into the `tags` array in the `nearby_posts` collection.
* [ ] Multiple identical hashtags in a single post (e.g., `#dawgs ... #dawgs`) are deduplicated into a single entry in `tags`.
* [ ] Posts with no hashtags initialize with an empty array (`tags: []`) rather than `null` or `undefined`.
* [ ] Rendered post cards display detected tags as distinct highlighted text (`--color-accent`) linking to/filtering by that tag.

## Success Metrics (Theoretical)
#### How do we know this feature is valuable?
* **Adoption:** Posts created on both standard and nearby feeds contain at least one valid hashtag within 14 days of deployment.

## Out of Scope
#### What are we deliberately NOT building right now?
* **Post Editing & Tag Removal:** Since post editing is not yet implemented, removing or modifying tags post-publication is deferred to a future post-management release.
* **Decay & Trending Scoring Algorithm:** Background jobs calculating 7-day momentum and gravity decay are deferred to the Discovery Engine Technical Spec.
* **Unsupervised NLP Topic Extraction:** Parsing non-hashtagged contextual keywords will be handled in a later phase.
* **Tag Autocomplete / Typeahead:** Suggesting existing tags while typing `#` will be handled after tag usage volume justifies an index search endpoint.