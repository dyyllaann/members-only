var createError = require("http-errors");
var express = require("express");
var path = require("path");
const cors = require("cors");

// Unused dependencies
var cookieParser = require("cookie-parser");
var logger = require("morgan");

// Models
const User = require("./models/user");

// Auth & encryption dependencies
const session = require("express-session");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const bcrypt = require("bcryptjs");

// DB dependencies
var mongoose = require("mongoose");

// const port = process.env.PORT || 5000;

// mongo obfuscation
// require("dotenv").config({ path: "./config.env" });
// const dbo = require("./db/conn");
const mongoDB = "mongodb+srv://admin:pass@cluster0.ie1fhym.mongodb.net/members_only?retryWrites=true&w=majority";
mongoose.connect(mongoDB, { useNewUrlParser: true, useUnifiedTopology: true });
var db = mongoose.connection;
db.on("error", console.error.bind(console, "MongoDB connection error:"));

var loginRouter = require("./routes/login");
var indexRouter = require("./routes/index");
var usersRouter = require("./routes/users");
var createAccountRouter = require("./routes/createAccount");

passport.use(
	new LocalStrategy((username, password, done) => {
		User.findOne({ username: username }, (err, user) => {
			if (err) {
				return done(err);
			}
			if (!user) {
				return done(null, false, { message: "Incorrect Username" });
			}
			bcrypt.compare(password, user.password, (err, res) => {
				if (res) {
					return done(null, user);
				} else {
					return done(null, false, { message: "Incorrect password" });
				}
			});
		});
	})
);

passport.serializeUser(function (user, done) {
	done(null, user.id);
});

passport.deserializeUser(function (id, done) {
	User.findById(id, function (err, user) {
		done(err, user);
	});
});

var app = express();

app.use(session({ secret: "cats", resave: false, saveUninitialized: true }));
app.use(passport.initialize());
app.use(passport.session());
app.use(express.urlencoded({ extended: false }));

app.use(function (req, res, next) {
	res.locals.currentUser = req.user;
	next();
});

// // connect to db
// app.listen(port, () => {
// 	// perform a database connection when server starts
// 	dbo.connectToServer(function (err) {
// 		if (err) console.error(err);
// 	});
// 	console.log(`Server is running on port: ${port}`);
// });

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "jade");

app.use(cors());
app.use(logger("dev"));
app.use(express.json());
// app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

// Routes
app.use("/", indexRouter);
app.use("/users", usersRouter);
app.use("/create-account", createAccountRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
	next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
	// set locals, only providing error in development
	res.locals.message = err.message;
	res.locals.error = req.app.get("env") === "development" ? err : {};

	// render the error page
	res.status(err.status || 500);
	res.render("error");
});

module.exports = app;
