// Dependencies
const express = require('express');
const router = express.Router();
const Post = require("../models/post");
const Comment = require("../models/comment");
const User = require("../models/user");
const dbo = require("../db/conn");
const { ObjectId } = require("mongodb");

function ensureAuth(req, res, next) {
	if (req.isAuthenticated && req.isAuthenticated()) {
		return next();
	}
	return res.redirect("/");
}

/* POST post (message) */
router.post('/post', ensureAuth, async (req, res, next) => {
  try {
    const { message, tags, imageSource, courseId } = req.body;

    if (!message?.trim() && !imageSource) {
      return res.status(400).send('A post needs text or an image.');
    }

    /* Not necessary. */
    if (courseId && !ObjectId.isValid(courseId)) {
      return res.status(400).send('Invalid course ID.');
    }

    /* Handle tags as an array */
    let tagArray = [];
    if (Array.isArray(tags)) {
      tagArray = tags;
    } else if (tags) {
      tagArray = [tags];
    } else {
      tagArray = ['General'];  // Default tag if none provided. I'd rather get rid of this.
    }

    const post = new Post({
      user: req.user._id,
      message: message?.trim() || '',
      tags: tagArray,
      courseId: courseId || null,
      imageSource: imageSource || null,
      contentType: imageSource ? 'image' : 'text'
    });

    await post.save();
    res.redirect('back');
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

/* DELETE a post */
router.delete('/post/:id', async (req, res, next) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ success: false, error: 'Not authenticated' });
  }

  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ success: false, error: 'Post not found' });
    }

    if (!post.user.equals(req.user._id)) {
      return res.status(403).json({ success: false, error: 'Not authorized to delete this post' });
    }

    await post.delete();
    res.json({ success: true });
  } catch (err) {
    return next(err);
  }
});

/* POST comment on a post */
router.post('/post/:postId/comment', async (req, res, next) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ success: false, error: 'Not authenticated' });
  }

  try {
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

/* GET comments for a post */
router.get('/post/:postId/comments', async (req, res, next) => {
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

module.exports = router;
