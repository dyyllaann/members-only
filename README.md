# IvyLink

IvyLink is a college-focused social-feed application. Registered users can create an account, sign in with a local username and password, publish tagged text posts, like and comment on posts, and view member profiles. Visitors can use the guest view to browse an anonymized, read-only feed.

## Preview

<img src="public/resources/ivylink-preview_2026_08_02.png" alt="IvyLink feed preview" />

## Features

- Local account registration and sign-in with Passport's local strategy
- Password hashing with `bcryptjs`
- Session-based authentication with `express-session` and Passport
- A chronological member feed, with server-side filtering for text or image posts
- Text-post creation with **General** and major-specific tags
- Client-side tag filtering in the feed
- Authenticated post likes with an immediate JSON response
- Authenticated comments that load and update without a full page refresh
- Member profile pages showing profile details and that member's posts
- A guest route that allows browsing without post interactions or member identity links
- Responsive Pug templates, static assets, security headers, compression, and request logging

## Tech stack

| Area | Technology |
| --- | --- |
| Runtime | Node.js 16.17.1 (declared in `package.json`) |
| Web framework | Express 4 |
| Views | Pug |
| Database | MongoDB, accessed through the official MongoDB Node.js driver |
| Authentication | Passport, `passport-local`, and `express-session` |
| Password hashing | `bcryptjs` |
| Validation | `express-validator` |
| Dates | Luxon |
| Development reload | Nodemon |

> The application uses session-based authentication.

## Prerequisites

- Node.js **16.17.1** or a compatible version
- npm
- A MongoDB deployment that the application can reach, such as MongoDB Atlas or a local MongoDB server

## Getting started

1. Clone the repository and enter the project directory.

	```bash
	git clone <repository-url>
	cd members-only
	```

2. Install the locked dependency versions.

	```bash
	npm ci
	```

3. Create a `.env` file in the project root. It is already excluded from version control.

	```dotenv
	ATLAS_URI=mongodb+srv://<username>:<password>@<cluster>/?retryWrites=true&w=majority
	PORT=3000
	```

	`ATLAS_URI` is required. Although the variable name references Atlas, a standard MongoDB connection URI also works. The application always uses the `members_only` database after connecting. If the username or password contains URI-reserved characters, URL-encode them.

4. Start the development server.

	```bash
	npm run devstart
	```

5. Open [http://localhost:3000](http://localhost:3000).

## Available scripts

| Command | Description |
| --- | --- |
| `npm start` | Start the HTTP server through `bin/www`. |
| `npm run devstart` | Start the server with Nodemon and reload on file changes. |
| `npm run serverstart` | Start Nodemon with the `members-only:*` debug namespace enabled. |

The server listens on `PORT` when supplied, or port `3000` by default.

## Application routes

| Method | Route | Description |
| --- | --- | --- |
| `GET` | `/` | Show the sign-in landing page or the authenticated feed. Accepts `?view=text` or `?view=image` to filter by post content type. |
| `POST` | `/login` | Authenticate a user with Passport's local strategy. |
| `GET` | `/logout` | End the current session and return to the landing page. |
| `GET` | `/guest` | Show the browse-only guest feed. |
| `GET` | `/create-account` | Show the account-registration form. |
| `POST` | `/create-account` | Validate form input, hash the password, and create a user. |
| `POST` | `/post` | Create a text post for the authenticated user. Unauthenticated visitors are redirected to `/`. |
| `POST` | `/post/:id/like` | Toggle the authenticated user's like. Returns `{ likeCount, liked }`. |
| `GET` | `/post/:postId/comments` | Return up to 10 comments for a post as JSON. |
| `POST` | `/post/:postId/comment` | Create an authenticated user's comment and return the new comment as JSON. |
| `GET` | `/profile` | Redirect an authenticated user to their own profile. |
| `GET` | `/profile/:username` | Render a member profile and its posts for an authenticated view. |
| `GET` | `/forgot-password` | Show the current password-recovery placeholder page. |

## Data model

The project uses lightweight model classes over MongoDB collections rather than an ORM.

| Collection | Main fields | Notes |
| --- | --- | --- |
| `users` | `firstName`, `lastName`, `username`, `password`, `major`, `graduation`, `location`, `icon`, `colorPreference`, `member`, `likedPosts` | Passwords are stored as bcrypt hashes. |
| `posts` | `user`, `message`, `contentType`, `postImage`, `timestamp`, `tags`, `likes`, `likeCount`, `commentCount`, `private`, `allowedUsers` | The current UI creates text posts; existing image-post records can be rendered. |
| `comments` | `postId`, `userId`, `text`, `timestamp`, `likes`, `likeCount`, `parentCommentId` | Comments are loaded oldest first, with a default limit of 10. |

## Project structure

```text
.
├── app.js                  # Express middleware, Passport setup, and route mounting
├── bin/www                 # HTTP server entry point and port handling
├── db/conn.js              # MongoDB connection helper
├── models/                 # User, post, and comment data-access classes
├── routes/                 # Feed, authentication, registration, and guest routes
├── views/                  # Pug layouts, pages, and shared partials
└── public/                 # CSS, browser-side interactions, and image assets
```

## How it works

1. `app.js` loads the environment, connects to MongoDB, configures Express middleware, and initializes Passport.
2. Passport's local strategy looks up a user by `username` and compares the submitted password with the stored bcrypt hash.
3. Passport serializes the user ID into the session and restores the corresponding user on later requests.
4. Feed routes join post records with their authors, then render Pug templates with newest posts first.
5. Browser-side code in `public/javascripts/ui-controls.js` sends `fetch()` requests for likes and comments, updates the page, and filters visible posts by tag.

## Development notes

- There is no test script or test suite configured at present.
- Registration validates `major` and `graduation`, but the current registration handler does not pass those values into the new `User` object, so they are not persisted for newly created accounts.
- The UI supports displaying image-post records, but it does not provide image upload or image-post creation.
- Password recovery is currently a placeholder route only.

## Production considerations

Do not treat the current configuration as production-ready. Before deploying, at minimum:

- Replace the hard-coded session secret with an environment-provided secret.
- Use a persistent session store and configure secure cookies for HTTPS.
- Restrict CORS to the intended origin instead of accepting the default broad configuration.
- Add uniqueness enforcement for usernames and stronger validation for posts and comments.
- Add rate limiting, CSRF protection, logging/monitoring, error handling suitable for production, and automated tests.
- Review MongoDB indexes and access controls, then keep `ATLAS_URI` only in secure environment configuration.

## License

**Proprietary — All Rights Reserved.**

IvyLink is proprietary software and is not offered under an open-source license. Except with prior written permission from the copyright holder, no permission is granted to use, copy, modify, distribute, sublicense, or create derivative works from this source code or its owned assets.

This notice applies only to IvyLink-owned code and assets; third-party dependencies remain subject to their respective licenses. Before commercial release, use an attorney-reviewed end-user license agreement and terms of service that identify the copyright owner and the rights granted to customers.
