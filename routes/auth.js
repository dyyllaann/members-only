// Dependencies
const express = require('express');
const router = express.Router();
const passport = require("passport");

/* POST login */
router.post(
	"/login",
	passport.authenticate("local", {
		successRedirect: "/",
		failureRedirect: "/",
	})
);

/* GET logout */
router.get("/logout", function (req, res, next) {
	req.logout(function (err) {
		if (err) {
			return next(err);
		}
		res.redirect("/");
	});
});

module.exports = router;
