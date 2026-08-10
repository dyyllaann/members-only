# Product Requirements Document: Course Selection and Filtering

## Problem Statement
#### What user problems are we solving?
Users currently lack a focused way to browse and engage with course-specific content. Presenting a raw, unfiltered list of a university's entire course catalog is overwhelming and creates severe friction in finding relevant communities.

## Proposed Solution
#### What are we building?

**1. Course Hubs (The Destination)**
Create a `/courses/:courseId` route serving as a centralized resource. This page will display static course metadata (Title, Department) fetched from the `Courses` collection, followed by a chronological feed of posts tagged with that specific course.

**2. Dual-Feed System (The Stream)**
*   **Home Feed:** A personalized stream on the root index querying only posts associated with the Course `_id`s present in the user's `subscribedCourses` array.
*   **Explore Feed:** A global campus stream featuring content across all departments, acting as a discovery engine for new communities.

**3. Course Discovery Interface**
Create a `/courses/` index route. To prevent information overload, the initial page load will be pre-filtered using the constraints: `organization: user.organizationId` and `department: user.major`. 

### Data Model Updates
Introduce a new `Courses` collection in MongoDB with the following schema:
*   `_id`: ObjectId
*   `organizationId`: ObjectId (Reference to Organizations collection)
*   `department`: String
*   `courseCode`: String (e.g., "CSE 311")
*   `title`: String

Introduce a new `Organizations` collection in MongoDB. Since this collection relies on a polymorphic design via the native MongoDB driver, documents where `orgType === 'university'` will follow this schema:

*   `_id`: ObjectId
*   `name`: String (e.g., "University of Washington")
*   `orgType`: String (e.g., "university")
*   `allowedDomains`: Array of Strings (e.g., `["uw.edu", "washington.edu"]`)
*   `location`: Object
    *   `city`: String
    *   `state`: String
    *   `stateIsoCode`: String (e.g., "WA")
*   `departments`: Array of Strings (Used to populate filtering UI)
*   `themeColor`: String (Hex color code for UI rendering, e.g., "#4b2e83")

## Acceptance Criteria
#### How do we test that this works?
*   [ ] Clicking the 'Browse more courses' button in `.right-sidebar` navigates the user to `/courses/`.
*   [ ] The `/courses/` view defaults to showing only courses matching the user's declared major.
*   [ ] Clicking on any specific course navigates to its dedicated Course Hub.
*   [ ] Clicking "Follow" on a Course Hub successfully pushes the course's `_id` into the user's `subscribedCourses` array in the database.

## Success Metrics
#### How do we know this feature is valuable?
*   **Adoption:** 40% of active users subscribe to at least one course within 7 days of launch.
*   **Engagement:** A 15% increase in the average number of posts read per session, driven by the personalized Home Feed.

## Out of Scope
#### What are we deliberately NOT building right now?
*   Automated course suggestions using Machine Learning algorithms.
*   Live syncing with external university registrar APIs (V1 course data will be seeded manually or via static CSV).
*   Additonal course details are included on the course's page (must make layout decisions first)