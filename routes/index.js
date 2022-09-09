// Dependencies
var express = require('express');
var router = express.Router();
const passport = require("passport");

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

module.exports = router;
