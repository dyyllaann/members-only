// Dependencies
const express = require('express');
const router = express.Router();
const User = require('../models/user');
const Post = require('../models/post');

/* GET user profile */
router.get('/:username', async (req, res, next) => {
  try {
    // Find user by username
    const profileUser = await User.findByUsername(req.params.username);

    if (!profileUser) {
      return res.status(404).render('error', {
        message: 'User not found',
        error: { status: 404 }
      });
    }

    // Get user's posts
    const userPosts = await Post.findWithUser({ user: profileUser._id });
    userPosts.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    res.render('profile', {
      user: req.user, // Current logged-in user
      profileUser: profileUser, // User being viewed
      post_list: userPosts,
      title: `${profileUser.firstName} ${profileUser.lastName}`
    });

  } catch (err) {
    return next(err);
  }
});

/* GET own profile (shortcut) */
router.get('/', (req, res, next) => {
  if (!req.isAuthenticated()) {
    return res.redirect('/');
  }
  res.redirect(`/profile/${req.user.username}`);
});

module.exports = router;
