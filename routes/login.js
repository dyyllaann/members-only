var express = require("express");
var login = express.Router();
const session = require("express-session");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const bcrypt = require("bcryptjs");

// router.post(
// 	"/login",
// 	passport.authenticate("local", {
// 		failureRedirect: "/",
// 		failureMessage: true,
// 	}),
// 	function (req, res) {
// 		res.redirect("/");
// 	}
// );

login.post = passport.authenticate("local", {
	successRedirect: "/",
	failureRedirect: "/create-account"
});

module.exports = login;