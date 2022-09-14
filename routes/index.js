// Dependencies
var express = require('express');
var router = express.Router();
const passport = require("passport");
var Post = require("../models/post");

/* GET home page. */
router.get('/', (req, res, next) => {
  Post.find()
    .sort({ timestamp: -1 })
    .populate("user")
    .exec(function (err, list_posts) {
      if (err) {
        return next(err);
      }
      res.render("index", { user: req.user, title: "Members Only", post_list: list_posts });
    });
});

/* GET guest page. */
router.get('/guest', (req, res, next) => {
  Post.find()
    .sort({ timestamp: -1 })
    .exec(function (err, list_posts) {
      if (err) {
        return next(err);
      }
      res.render("guest", { user: 'Guest', title: "Members Only", post_list: list_posts });
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

/* GET forgot password page. */
router.get('/forgot-password', (req, res) => res.render("forgotPassword", { message: "Bummer, dude." }));

module.exports = router;
