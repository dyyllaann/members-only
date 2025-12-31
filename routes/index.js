// Dependencies
const express = require('express');
const router = express.Router();
const passport = require("passport");
const Post = require("../models/post");
const { body, validationResult } = require('express-validator');

/* GET home page. */
router.get('/', async (req, res, next) => {
  try {
    const list_posts = await Post.findWithUser()
      .sort({ timestamp: -1 });
      
    res.render("index", { 
      user: req.user, 
      title: "MembersOnly", 
      post_list: list_posts 
    });
  } catch (err) {
    return next(err);
  }
});

/* GET guest page. */
router.get('/guest', async (req, res, next) => {
  try {
    const list_posts = await Post.find()
      .sort({ timestamp: -1 });

    res.render("guest", { 
      user: 'Guest', 
      title: "MembersOnly - Guest", 
      post_list: list_posts 
    });
  } catch (err) {
    return next(err);
  }
});

/* POST login */
router.post(
  "/login",
  passport.authenticate("local", {
    successRedirect: "/",
    failureRedirect: "/", // Consider adding failureFlash: true to show error messages
  })
);

/* POST logout */
router.get("/logout", (req, res, next) => {
  req.logout((err) => {
    if (err) {
      return next(err);
    }
    res.redirect("/");
  });
});

/* POST post (message) */
router.post(
  "/post",
  // Add authentication middleware
  (req, res, next) => {
    if (!req.isAuthenticated()) {
      return res.redirect("/");
    }
    next();
  },
  // Validate and sanitize message
  body('message', 'Message must not be empty.')
    .trim()
    .isLength({ min: 1, max: 500 }) // Add max length
    .withMessage('Message must be between 1 and 500 characters'),
  async (req, res, next) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      // Re-render with errors instead of just redirecting
      const list_posts = await Post.findWithUser().sort({ timestamp: -1 });
      return res.render("index", {
        user: req.user,
        title: "MembersOnly",
        post_list: list_posts,
        errors: errors.array(),
        message: req.body.message // Keep user's input
      });
    }

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
  }
);

/* GET forgot password page. */
router.get('/forgot-password', (req, res) => {
  res.render("forgotPassword", { 
    title: "Forgot Password",
    message: "Bummer, dude." 
  });
});

module.exports = router;