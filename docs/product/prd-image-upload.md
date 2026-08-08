# Image Upload for Posts
## Problem Statement
#### What user problems are we solving?
Text-only posts limit users’ ability to share campus moments, events, study resources, and visual updates. Users need a simple way to include an image without interrupting post creation.

## Proposed Solution
#### What are we building?
Add an image-upload action to the post composer. Users can select one image, preview it before posting, remove it if needed, and publish it with optional accompanying text. Metrics for upload speed, success rate, etc.

## Success Metrics
#### How do we know this worked?
* Clicking the image button opens a file selector.
* Selecting a file leads to an image preview in the post composer.
* Users can cancel the image and still continue with their post.
* After cancelling, users can still decide to upload an image.
* Successful upload and page is refreshed to show their post.
* Successfully measure metrics.

Theoretical examples:
* Image-post engagement compared with text-only posts.

## Out of Scope
#### What are we not building right now?
* Multiple images per post.
* Image editing, cropping, filters, or annotations.
* Video upload.
* Persistent media libraries or albums.
* Advanced image moderation, OCR, or automatic alt-text generation. This is huge. Without image moderation, users MUST be able to flag explicit images. Consider an image moderation API as a quick solution.