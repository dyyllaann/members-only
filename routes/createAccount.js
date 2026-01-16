const express = require("express");
const router = express.Router();
const { body, check, validationResult } = require("express-validator");
const { ObjectId } = require("mongodb");

// Auth & encryption dependencies
const bcrypt = require("bcryptjs");

// Models
const User = require("../models/user");

/* GET create account page. */
router.get('/', function(req, res) {
  res.render('createAccount', { title: 'IvyLink - Create Account' });
});

// POST create account.
router.post("/", [
	// Validate and sanitize fields.
	body("username", "Username must not be empty.")
		.trim()
		.isLength({ min: 1 })
		.escape(),
	body("firstName", "First name must not be empty.")
		.trim()
		.isLength({ min: 1 })
		.escape(),
	body("lastName", "Last name must not be empty.")
		.trim()
		.isLength({ min: 1 })
		.escape(),
	// body("college", "College must not be empty.")
	// 	.trim()
	// 	.isLength({ min: 1 })
	// 	.escape(),
	body("major", "Major must not be empty.")
		.trim()
		.isLength({ min: 1 })
		.escape(),
	body("graduation", "Graduation year must not be empty.")
		.trim()
		.isLength({ min: 1 })
		.escape(),
	body("password", "Password must not be empty")
		.trim()
		.isLength({ min: 1 })
		.escape(),
	check("password").exists(),
	check(
		"passwordConfirm",
		"passwordConfirm field must have the same value as the password field"
	)
		.exists()
		.custom((value, { req }) => value === req.body.password),


	async (req, res, next) => {
		try {
			// Check for validation errors
			const errors = validationResult(req);
			// Return 400 if error
			if (!errors.isEmpty()) {
				return res.status(400).json({ errors: errors.array() });
			}
			
			// Encrypt password
			const hashedPassword = await bcrypt.hash(req.body.password, 10);
			
			// Create new user
			const user = new User({
				_id: new ObjectId(),
				firstName: req.body.firstName,
				lastName: req.body.lastName,
				username: req.body.username,
				password: hashedPassword,
			});
			
			await user.save();
			res.redirect("/");
		} catch (err) {
			return next(err);
		}
	},
]);

module.exports = router;
