var express = require("express");
var router = express.Router();

// /* GET users listing. */
// router.get("/", function (req, res, next) {
// 	res.send("Create new account.");
// });

/* GET create account page. */
router.get('/', function(req, res, next) {
  res.render('createAccount', { title: 'Hushbook - Create Account' });
});

module.exports = router;
