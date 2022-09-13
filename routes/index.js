// Dependencies
var express = require('express');
var router = express.Router();
const passport = require("passport");
var Message = require("../models/message");

/* GET home page. */
router.get('/', (req, res, next) => {
  res.render('index', { user: req.user, title: 'Members Only' });
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
    const message = new Message({
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
