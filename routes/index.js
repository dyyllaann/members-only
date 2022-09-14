// Dependencies
var express = require('express');
var router = express.Router();
const passport = require("passport");
var Post = require("../models/post");

/* GET home page. */
router.get('/', (req, res, next) => {
  Post.find()
    .sort({ timestamp: -1 })
    .exec(function (err, list_posts) {
      if (err) {
        return next(err);
      }
      res.render("index", { user: req.user, title: "Members Only", post_list: list_posts });
    });
});

/* POST login */
router.post(
	"/login",
	passport.authenticate("local", {
		successRedirect: "/",
		failureRedirect: "/",
	})
);

/* POST post (message) */
router.post(
	"/post",
	(req, res, next) => {
    const message = new Post({
      user: req.user,
      message: req.body.message,
    }).save((err) => {
      if (err) {
        return next(err);
      }
      res.redirect("/");
    });
	}
);

module.exports = router;
