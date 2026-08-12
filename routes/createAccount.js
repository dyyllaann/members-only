const express = require("express");
const rateLimit = require("express-rate-limit");
const router = express.Router();
const { body, check, validationResult } = require("express-validator");
const { ObjectId } = require("mongodb");

// Auth & encryption dependencies
const bcrypt = require("bcryptjs");

// Models
const User = require("../models/user");

// Rate limiting middleware for account creation
const checkLimiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutes
	max: 30,
	message: { available: false, message: "Too many attempts. Please try again later." }
});

/* GET create account page. */
router.get('/', function(req, res) {
  res.render('createAccount', { title: 'IvyLink - Create Account' });
});

/* GET check username availability. */
router.get('/check-username', checkLimiter, async (req, res) => {
  try {
    const { username } = req.query;

    if (!username || username.length < 3) {
      return res.json({ available: false, message: 'Username too short' });
    }

    // Using projection { _id: 1 } means we only fetch the ID, saving memory
    // const existingUser = await db.collection('users').findOne(
    //   { username: username.toLowerCase() },
    //   { projection: { _id: 1 } }
    // );

		const existingUser = await User.findOne(
      { username: username.toLowerCase() },
      { _id: 1 }
    );

    if (existingUser) {
      return res.json({ available: false, message: `${username} is not available` });
    } else {
      return res.json({ available: true, message: `${username} is available!` });
    }

  } catch (error) {
    res.status(500).json({ error: 'Server error checking username' });
  }
});

/* GET check email availability. */
router.get('/check-email', checkLimiter, async (req, res) => {
  try {
    const { email } = req.query;

		const normalizedEmail = email?.trim().toLowerCase();

		if (!normalizedEmail || !/^[^\s@]+@[^\s@]+\.edu$/.test(normalizedEmail)) {
			return res.json({ available: false, message: 'Enter a valid .edu email address' });
    }

    // Using projection { _id: 1 } means we only fetch the ID, saving memory
    // const existingUser = await db.collection('users').findOne(
    //   { email: email.toLowerCase() },
    //   { projection: { _id: 1 } }
    // );

		const existingUser = await User.findOne(
      { email: normalizedEmail },
      { _id: 1 }
    );

    if (existingUser) {
			return res.json({ available: false, message: `${normalizedEmail} is not available` });
    } else {
			return res.json({ available: true, message: `${normalizedEmail} is available!` });
    }

  } catch (error) {
    res.status(500).json({ error: 'Server error checking email' });
  }
});

/* POST create account. */
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
	body("email", "A valid .edu email address is required.")
		.trim()
		.isEmail()
		.withMessage("A valid email address is required.")
		.custom((value) => value.toLowerCase().endsWith(".edu"))
		.withMessage("Email must end with .edu"),
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
				email: req.body.email,
				password: hashedPassword,
				major: "Computer Science & Engineering", //req.body.major,
				graduation: req.body.graduation,
				icon: "icon_computer-science.svg", // Default icon
				organizationId: process.env.DEFAULT_ORGANIZATION_ID || "6a7a4917be8261a1baef009e",
				subscribedCourses: [],
			});
			
			await user.save();
			res.redirect("/");
		} catch (err) {
			return next(err);
		}
	},
]);

module.exports = router;
