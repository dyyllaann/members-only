// Dependencies
const express = require('express');
const router = express.Router();
const passport = require("passport");
const Post = require("../models/post");
const { body } = require('express-validator');

/* GET home page. */
router.get('/', async (req, res, next) => {
  try {
    const contentType = req.query.view || 'text';
    const criteria = {};

    if (contentType && [ 'image', 'text' ].includes(contentType)) {
      criteria.contentType = contentType;
    }

    const list_posts = await Post.findWithUser(criteria);
    // Sort by timestamp in descending order (newest first)
    list_posts.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    res.render("index", { 
      user: req.user, 
      title: "MembersOnly", 
      post_list: list_posts,
      activeView: contentType || 'text' 
    });
  } catch (err) {
    return next(err);
  }
});

/* GET guest page. */
router.get('/guest', async (req, res, next) => {
  try {
    const list_posts = await Post.find();
    // Sort by timestamp in descending order (newest first)
    list_posts.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    res.render("guest", { user: 'Guest', title: "MembersOnly - Guest", post_list: list_posts });
  } catch (err) {
    return next(err);
  }
});

/* POST login */
router.post(
	"/login",
	passport.authenticate("local", {
		successRedirect: "/",
		failureRedirect: "/",
	})
);

/* POST logout */
router.get("/logout", function (req, res, next) {
	req.logout(function (err) {
		if (err) {
			return next(err);
		}
		res.redirect("/");
	});
});

/* POST post (message) */
router.post(
    "/post", [
  // Validate and sanitize message
  body('message', 'Message must not be empty.').trim().isLength({ min: 1 }),
    async (req, res, next) => {
    try {
      const message = new Post({
        user: req.user._id,
        message: req.body.message,
      });
      await message.save();
      res.redirect("/");
    } catch (err) {
      return next(err);
    }
    }]
);

/* POST like/unlike a post */
router.post('/post/:id/like', async (req, res, next) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }
    
    const likeCount = await post.toggleLike(req.user._id);
    res.json({ likeCount, liked: post.hasUserLiked(req.user._id) });
  } catch (err) {
    return next(err);
  }
});

/* GET forgot password page. */
router.get('/forgot-password', (req, res) => res.render("forgotPassword", { message: "Bummer, dude." }));

module.exports = router;
