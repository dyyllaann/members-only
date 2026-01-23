var createError = require("http-errors");
var express = require("express");
var path = require("path");
const cors = require("cors");
const compression = require("compression");
const helmet = require("helmet");

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
const dotenv = require("dotenv").config();

// DB dependencies
const dbo = require("./db/conn");

// var loginRouter = require("./routes/login");
var indexRouter = require("./routes/index");
var guestRouter = require("./routes/guest");
var createAccountRouter = require("./routes/createAccount");

passport.use(
	new LocalStrategy(async (username, password, done) => {
		try {
			const user = await User.findByUsername(username);
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
		} catch (err) {
			return done(err);
		}
	})
);

passport.serializeUser(function (user, done) {
	done(null, user._id);
});

passport.deserializeUser(async function (id, done) {
	try {
		const user = await User.findById(id);
		done(null, user);
	} catch (err) {
		done(err);
	}
});

var app = express();

// Initialize MongoDB connection
dbo.connectToServer(function (err) {
	if (err) {
		console.error("Failed to connect to MongoDB:", err);
		process.exit(1);
	}
	console.log("Successfully connected to MongoDB");
});

app.use(compression());

// Security headers
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https://i.imgur.com"],
        connectSrc: ["'self'"],
        fontSrc: ["'self'", "data:"],
        objectSrc: ["'none'"]
      }
    },
    // disable COEP (prevents the NotSameOriginAfterDefaultedToSameOrigin… error)
    crossOriginEmbedderPolicy: false,
    // optional: disable COOP if also set and not needed
    crossOriginOpenerPolicy: false
  })
);

app.use(session({ secret: "cats", resave: false, saveUninitialized: true }));
app.use(passport.initialize());
app.use(passport.session());
app.use(express.urlencoded({ extended: false }));

app.use(function (req, res, next) {
	res.locals.currentUser = req.user;
	next();
});

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "pug");

app.use(cors());
app.use(logger("dev"));
app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

// Routes
app.use("/", indexRouter);
app.use("/guest", guestRouter);
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
