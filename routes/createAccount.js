var express = require("express");
var router = express.Router();
const { check, body, validationResult } = require("express-validator");

const User = require("../models/user");

// /* GET users listing. */
// router.get("/", function (req, res, next) {
// 	res.send("Create new account.");
// });

// /* GET create account page. */
// router.get('/', function(req, res, next) {
//   res.render('createAccount', { title: 'Hushbook - Create Account' });
// });

/* GET create account page. */
router.get('/', function(req, res, next) {
  res.render('createAccount', { title: 'Hushbook - Create Account' });
});

// app.post(
// 	"/create-user",
// 	check("password").exists(),
// 	check(
// 		"passwordConfirmation",
// 		"passwordConfirmation field must have the same value as the password field"
// 	)
// 		.exists()
// 		.custom((value, { req }) => value === req.body.password),
// 	loginHandler
// );

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
		// Else, return new user
		const user = new User({
			firstName: req.body.firstName,
			lastName: req.body.lastName,
			username: req.body.username,
			password: req.body.password,
		}).save((err) => {
			if (err) {
				return next(err);
			}
			res.redirect("/");
		});
	}
);

module.exports = router;
