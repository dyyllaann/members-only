const express = require('express');
const router = express.Router();
const { ObjectId } = require('mongodb');
const dbo = require('../db/conn');

// Models
const NearbyPost = require('../models/nearby_post');
const Comment = require('../models/comment');
const User = require('../models/user');

/* =========================================
   PAGE RENDER ROUTE
========================================= */

/* GET Nearby page. */
router.get('/nearby', async (req, res, next) => {
  if (!req.isAuthenticated()) {
    return res.redirect('/');
  }

  const { lat, lng } = req.query;
  console.log(`Received coordinates: lat=${lat}, lng=${lng}`);

  // No coordinates yet — render the page empty so the client script can
  // supply them and reload.
  if (!lat || !lng) {
    return res.render("nearby", {
      user: req.user,
      title: "IvyLink - Nearby",
      post_list: []
    });
    console.log("No coordinates provided. Rendering empty nearby page.");
  }

  try {
    const list_posts = await NearbyPost.findNearby(lat, lng);
    console.log(`findNearby returned ${list_posts.length} posts`);
    list_posts.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    res.render("nearby", {
      user: req.user,
      title: "IvyLink - Nearby",
      post_list: list_posts,
      lat: lat,
      lng: lng
    });
  } catch (err) {
    return next(err);
  }
});

/* =========================================
   API ROUTES
========================================= */

/* POST create a nearby post */
router.post('/nearby', async (req, res, next) => {
  if (!req.isAuthenticated()) {
    return res.redirect('/');
  }

  try {
    const { message, imageSource, lat, lng } = req.body;

    if (!message?.trim() && !imageSource) {
      return res.status(400).json({ error: 'A post needs text or an image.' });
    }

    if (!lat || !lng) {
      return res.status(400).json({ error: 'Location coordinates are required.' });
    }

    // The constructor handles the truncation and GeoJSON mapping
    const nearbyPost = new NearbyPost({
      user: req.user._id,
      message: message?.trim() || '',
      imageSource: imageSource || null,
      lat: lat,
      lng: lng
    });

    await nearbyPost.save();
    // res.status(201).json({ success: true, post: nearbyPost });
    res.redirect('/nearby');
  } catch (err) {
    return next(err);
  }
});

/* POST like/unlike a nearby post */
router.post('/nearby/:id/like', async (req, res, next) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  
  try {
    const postData = await NearbyPost.findById(req.params.id);
    if (!postData) {
      return res.status(404).json({ error: 'Post not found' });
    }
    
    // Instantiate to access class methods
    const post = new NearbyPost(postData);
    const likeCount = await post.toggleLike(req.user._id);
    
    res.json({ likeCount, liked: post.hasUserLiked(req.user._id) });
  } catch (err) {
    return next(err);
  }
});

/* POST comment on a nearby post */
router.post('/nearby/:postId/comment', async (req, res, next) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ success: false, error: 'Not authenticated' });
  }

  try {
    const postId = req.params.postId;
    const { text } = req.body;
    
    if (!text || !text.trim()) {
      return res.status(400).json({ success: false, error: 'Comment text required' });
    }
    
    const comment = new Comment({
      postId: postId,
      userId: req.user._id,
      text: text.trim()
    });
    
    await comment.save();
    
    // Increment post comment count utilizing the static Model method
    await NearbyPost.incrementCommentCount(new ObjectId(postId));
    
    const post = await NearbyPost.findById(postId);
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
          icon: user.icon,
          colorPreference: user.colorPreference
        }
      }
    });
    
  } catch (error) {
    console.error('Error posting comment:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

/* GET comments for a nearby post */
router.get('/nearby/:postId/comments', async (req, res, next) => {
  try {
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
            icon: user.icon,
            colorPreference: user.colorPreference
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

console.log("Nearby router loaded successfully.");
module.exports = router;