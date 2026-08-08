# Right Sidebar Discovery
## Problem Statement
#### What user problems are we solving?
Users need lightweight discovery opportunities while browsing the feed, including current campus conversation themes, relevant discussion topics, and potentially useful courses.

## Proposed Solution
#### What are we building?
Provide a right sidebar containing three modules:

1. Trending — currently prominent hashtags or campus discussions.
2. Suggested Topics — tags that let users filter or explore posts.
3. Suggested Courses — course-specific discussion destinations and a future path to browse more courses.

Keep the sidebar visible while users scroll on desktop layouts and hide it on small screens to preserve feed space.

## Success Metrics
#### How do we know this worked?
* Clicking on any button in the discovery panel will filter all posts matching the query.

To explore as ADR:
As post count grows, filtering all matching documents will become inefficient. We will likely want to navigate to a new page containing query matches.

Theoretical examples:
* Click-through rate for Trending hashtags.
* Click-through rate for Suggested Topic filters.
* Click-through rate for Suggested Courses.
* Increased post discovery or engagement after sidebar interactions.
* No meaningful negative impact on feed performance or mobile usability.

## Out of Scope
#### What are we not building right now?
* Personalized topic or course recommendations.
* Real-time trending calculations.
* A complete course catalog or registration integration.
* Saving, pinning, or dismissing suggestions.
* Showing these modules on narrow/mobile viewports.