// Dependencies
const express = require('express');
const router = express.Router();
const passport = require("passport");
const Post = require("../models/post");
const { body } = require('express-validator');
const dbo = require("../db/conn");
const { ObjectId } = require("mongodb");

/* GET home page. */
router.get('/', async (req, res, next) => {
  try {
    const contentType = req.query.view || 'text';
    const criteria = {};

    if (contentType && [ 'image', 'text' ].includes(contentType)) {
      criteria.contentType = contentType;
    }

    const list_posts = await Post.findWithUser(criteria);
    list_posts.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    res.render("index", { 
      user: req.user, 
      title: "IvyLink", 
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

    res.render("guest", { user: 'Guest', title: "IvyLink - Guest", post_list: list_posts });
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
router.post('/post', async (req, res, next) => {
  if (!req.user) {
    return res.redirect('/');
  }

  try {
    const Post = require('../models/post');
    const { message, tags } = req.body;
    
    // Handle tags - can be string (single) or array (multiple)
    let tagArray = [];
    if (Array.isArray(tags)) {
      tagArray = tags;
    } else if (tags) {
      tagArray = [tags];
    } else {
      tagArray = ['General']; // Default
    }
    
    const post = new Post({
      user: req.user._id,
      message: message,
      tags: tagArray,
      contentType: 'text'
    });
    
    await post.save();
    res.redirect('/');
  } catch (err) {
    return next(err);
  }
});

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

/* POST comment on a post */
router.post('/post/:postId/comment', async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, error: 'Not authenticated' });
  }

  try {
    const Comment = require('../models/comment');
    const User = require('../models/user');
    const postId = req.params.postId;
    const { text } = req.body;
    
    if (!text || !text.trim()) {
      return res.status(400).json({ success: false, error: 'Comment text required' });
    }
    
    // Create new comment
    const comment = new Comment({
      postId: postId,
      userId: req.user._id,
      text: text.trim()
    });
    
    await comment.save();
    
    // Increment post comment count
    const db = dbo.getDb();
    await db.collection('posts').updateOne(
      { _id: new ObjectId(postId) },
      { $inc: { commentCount: 1 } }
    );
    
    // Get updated comment count
    const post = await db.collection('posts').findOne({ _id: new ObjectId(postId) });
    
    // Get user data for the response
    const user = await User.findById(req.user._id);
    
    res.json({ 
      success: true, 
      commentCount: post.commentCount || 1,
      comment: {
        _id: comment._id,
        text: comment.text,
        timestamp_formatted: comment.timestamp_formatted,
        user: {
          username: user.username,
          firstName: user.firstName,
          major: user.major,
          icon: user.icon,                          // ← Add this
          colorPreference: user.colorPreference     // ← Add this
        }
      }
    });
    
  } catch (error) {
    console.error('Error posting comment:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

/* GET comments for a post */
router.get('/post/:postId/comments', async (req, res, next) => {
  try {
    const Comment = require('../models/comment');
    const db = dbo.getDb();
    
    const comments = await Comment.findByPostId(req.params.postId);
    
    const commentsWithUsers = await Promise.all(
      comments.map(async (comment) => {
        const user = await db.collection("users").findOne({ 
          _id: comment.userId 
        });
        
        return {
          _id: comment._id,
          text: comment.text,
          timestamp_formatted: comment.timestamp_formatted,
          user: {
            username: user.username,
            firstName: user.firstName,
            major: user.major,
            icon: user.icon,                          // ← Add this
            colorPreference: user.colorPreference     // ← Add this
          }
        };
      })
    );
    
    res.json(commentsWithUsers);
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({ error: 'Failed to load comments' });
  }
});

/* GET user profile */
router.get('/profile/:username', async (req, res, next) => {
  try {
    const User = require('../models/user');
    const Post = require('../models/post');
    
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
router.get('/profile', (req, res, next) => {
  if (!req.isAuthenticated()) {
    return res.redirect('/');
  }
  res.redirect(`/profile/${req.user.username}`);
});

/* GET forgot password page. */
router.get('/forgot-password', (req, res) => res.render("forgotPassword", { message: "Bummer, dude." }));

module.exports = router;
