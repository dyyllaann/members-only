# Left Sidebar Navigation
## Problem Statement
#### What user problems are we solving?
The home feed currently serves all content. As the product expands to more users, content will become increasingly irrelevant. Therefore, the Home feed must serve content that the user is subscribed to, while the Explore feed will serve content that the user is likely to engage with.

## Proposed Solution
#### What are we building?
Provide an Explore page that surfaces posts from organizations.

## Success Metrics
#### How do we know this worked?
* Explore view is navigable via the left sidebar navigation element. 
* Explore view serves posts from users where { "accountType": "organization" }

Theoretical examples:
* Increased visits to public profiles from Explore.
* Increased follows or connection actions originating from Explore.
* Users view multiple posts or remain on Explore beyond an initial glance.
* A measurable share of posts receive engagement after being discovered in Explore.

## Out of Scope
#### What are we not building right now?
* A personalized recommendation algorithm. Explore should primarily present posts based on users' interests. For example, what are other CS students engaging with?
* Topic-specific Explore feeds.
* Ranking based on user history, social graph, or machine learning.
* Organization verification and moderation workflows.
* Suggested-user cards. Consider users choosing to make their profiles discoverable.