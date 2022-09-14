// Dependencies
var express = require("express");
var router = express.Router();
const passport = require("passport");
var Post = require("../models/post");

/* GET guest page. */
router.get('/guest', (req, res, next) => {
  Post.find()
    .sort({ timestamp: -1 })
    .exec(function (err, list_posts) {
      if (err) {
        return next(err);
      }
      res.render("guest", { post_list: list_posts });
    });
});

module.exports = router;