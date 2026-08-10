const express = require("express");
const router = express.Router();
const { ObjectId } = require("mongodb");
const Course = require("../models/course");
const Post = require("../models/post");
const User = require("../models/user");
const dbo = require("../db/conn");

function ensureAuth(req, res, next) {
	if (req.isAuthenticated && req.isAuthenticated()) {
		return next();
	}
	return res.redirect("/");
}

/* GET /courses - course discovery index */
router.get("/", ensureAuth, async (req, res, next) => {
	try {
		const user = req.user;
		const organizationId = user.organizationId
			? (user.organizationId instanceof ObjectId ? user.organizationId : new ObjectId(user.organizationId))
			: new ObjectId("6a7a4917be8261a1baef009e");

		const criteria = { organizationId };
		if (user.major) {
			criteria.department = user.major;
		}

		const courses = await Course.find(criteria);
		courses.sort((a, b) => a.courseCode.localeCompare(b.courseCode));

		res.render("courses", {
			user,
			title: "IvyLink - Courses",
			courses,
			filterDepartment: user.major || "",
			organizationId: organizationId.toString()
		});
	} catch (err) {
		return next(err);
	}
});

/* GET /courses/:courseId - course hub */
router.get("/:courseId", ensureAuth, async (req, res, next) => {
	try {
		const user = req.user;
		const course = await Course.findById(req.params.courseId);

		if (!course) {
			return res.status(404).render("error", {
				message: "Course not found",
				error: { status: 404 }
			});
		}

		const isSubscribed = user.subscribedCourses && user.subscribedCourses.some(
			id => id.equals(course._id)
		);

		const list_posts = await Post.findWithUser({ courseId: course._id });
		list_posts.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

		res.render("courseHub", {
			user,
			title: `IvyLink - ${course.courseCode}`,
			course,
			isSubscribed,
			post_list: list_posts
		});
	} catch (err) {
		return next(err);
	}
});

/* POST /courses/:courseId/follow - subscribe user to course */
router.post("/:courseId/follow", ensureAuth, async (req, res, next) => {
	try {
		const courseId = new ObjectId(req.params.courseId);
		const course = await Course.findById(courseId);

		if (!course) {
			return res.status(404).json({ success: false, error: "Course not found" });
		}

		await dbo.getDb().collection("users").updateOne(
			{ _id: new ObjectId(req.user._id) },
			{ $addToSet: { subscribedCourses: courseId } }
		);

		res.json({ success: true });
	} catch (err) {
		return next(err);
	}
});

/* POST /courses/:courseId/unfollow - unsubscribe user from course */
router.post("/:courseId/unfollow", ensureAuth, async (req, res, next) => {
	try {
		const courseId = new ObjectId(req.params.courseId);

		await dbo.getDb().collection("users").updateOne(
			{ _id: new ObjectId(req.user._id) },
			{ $pull: { subscribedCourses: courseId } }
		);

		res.json({ success: true });
	} catch (err) {
		return next(err);
	}
});

module.exports = router;
