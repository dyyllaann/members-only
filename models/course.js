const { ObjectId } = require("mongodb");
const dbo = require("../db/conn");

class Course {
	constructor(courseData) {
		this._id = courseData._id || new ObjectId();
		this.organizationId = courseData.organizationId
			? (courseData.organizationId instanceof ObjectId ? courseData.organizationId : new ObjectId(courseData.organizationId))
			: null;
		this.department = courseData.department;
		this.courseCode = courseData.courseCode;
		this.title = courseData.title;
	}

	// Save course to database
	async save() {
		const db = dbo.getDb();
		const collection = db.collection("courses");

		if (this._id && await collection.findOne({ _id: this._id })) {
			const { _id, ...updateData } = this;
			return await collection.updateOne({ _id: this._id }, { $set: updateData });
		} else {
			return await collection.insertOne(this);
		}
	}

	// Find course by ID
	static async findById(id) {
		if (!ObjectId.isValid(id)) {
			return null;
		}

		const db = dbo.getDb();
		const collection = db.collection("courses");
		const courseData = await collection.findOne({ _id: new ObjectId(id) });
		return courseData ? new Course(courseData) : null;
	}

	// Find courses by criteria
	static async find(criteria = {}) {
		const db = dbo.getDb();
		const collection = db.collection("courses");
		const coursesData = await collection.find(criteria).toArray();
		return coursesData.map(courseData => new Course(courseData));
	}
}

module.exports = Course;
