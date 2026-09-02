// Dependencies
const express = require('express');
const router = express.Router();
const Post = require("../models/post");
const suggestedCourses = require("../data/suggestedCourses.json");

/* GET home page. */
router.get('/', async (req, res, next) => {
  try {
    const contentType = req.query.view || 'text';
    const criteria = {};

    if (contentType && [ 'image', 'text' ].includes(contentType)) {
      criteria.contentType = contentType;
    }

    // Personalized home feed: show posts from subscribed courses
    if (req.user && req.user.subscribedCourses && req.user.subscribedCourses.length > 0) {
      criteria.courseId = { $in: req.user.subscribedCourses };
    } else {
      // If the user is logged in but hasn't subscribed to any courses yet,
      // default to showing their own major's content as a gentle onboarding step.
      if (req.user && req.user.major) {
        criteria.tags = req.user.major;
      }
    }

    // const list_posts = await Post.findWithUser(criteria);
    const list_posts = await Post.findWithUser({});
    list_posts.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    res.render("index", {
      user: req.user,
      title: "IvyLink",
      post_list: list_posts,
      activeView: contentType || 'text',
      suggestedCourses: suggestedCourses
    });
  } catch (err) {
    return next(err);
  }
});

/* GET Explore page. */
router.get('/explore', async (req, res, next) => {
  try {
    const list_posts = await Post.findWithUser({});
    list_posts.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    res.render("explore", {
      user: req.user,
      title: "IvyLink - Explore",
      post_list: list_posts
    });
  } catch (err) {
    return next(err);
  }
});

/* GET Notifications page. */
router.get('/notifications', async (req, res, next) => {
  if (!req.isAuthenticated()) {
    return res.redirect('/');
  }

  try {
    // const Notification = require('../models/notification');
    // const notifications = await Notification.findByUserId(req.user._id);
    // notifications.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    res.render("notifications", {
      user: req.user,
      title: "IvyLink - Notifications",
      notifications: []
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

    res.render("guest", { user: null, title: "IvyLink - Guest", post_list: list_posts });
  } catch (err) {
    return next(err);
  }
});

/* GET forgot password page. */
router.get('/forgot-password', (req, res) => res.render("forgotPassword", { message: "Bummer, dude." }));

module.exports = router;
