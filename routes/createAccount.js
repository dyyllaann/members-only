var express = require("express");
var router = express.Router();
const { check, validationResult } = require("express-validator");

// Auth & encryption dependencies
const bcrypt = require("bcryptjs");

// Models
const User = require("../models/user");

/* GET create account page. */
router.get('/', function(req, res) {
  res.render('createAccount', { title: 'Hushbook - Create Account' });
});

// POST create account.
router.post(
	"/",
	check("password").exists(),
	check(
		"passwordConfirm",
		"passwordConfirm field must have the same value as the password field"
	)
		.exists()
		.custom((value, { req }) => value === req.body.password),
	(req, res, next) => {
		// Check for validation errors
		const errors = validationResult(req);
		// Return 404 if error
		if (!errors.isEmpty()) {
			return res.status(400).json({ errors: errors.array() });
		}
		// Encrypt password
		bcrypt.hash(req.body.password, 10, (err, hashedPassword) => {
			// if err, do something
			if (err) {
				console.log("Error!");
			} else {
				// Else, return new user
				const user = new User({
					firstName: req.body.firstName,
					lastName: req.body.lastName,
					username: req.body.username,
					password: hashedPassword,
				}).save((err) => {
					if (err) {
						return next(err);
					}
					res.redirect("/");
				});
			}
		});
	}
);

module.exports = router;
