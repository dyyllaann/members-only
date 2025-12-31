const { ObjectId } = require("mongodb");
const dbo = require("../db/conn");

class User {
	constructor(userData) {
		this._id = userData._id || new ObjectId();
		this.firstName = userData.firstName;
		this.lastName = userData.lastName;
		this.username = userData.username;
		this.password = userData.password;
		this.member = userData.member || false;
	}

	// Virtual property for initials
	get initials() {
		return this.firstName[0] + this.lastName[0];
	}

	// Save user to database
	async save() {
		const db = dbo.getDb();
		const collection = db.collection("users");
		
		if (this._id && await collection.findOne({_id: this._id})) {
			// Update existing user
			const { _id, ...updateData } = this;
			return await collection.updateOne({_id: this._id}, {$set: updateData});
		} else {
			// Insert new user
			return await collection.insertOne(this);
		}
	}

	// Find user by ID
	static async findById(id) {
		const db = dbo.getDb();
		const collection = db.collection("users");
		const userData = await collection.findOne({_id: new ObjectId(id)});
		return userData ? new User(userData) : null;
	}

	// Find user by username
	static async findByUsername(username) {
		const db = dbo.getDb();
		const collection = db.collection("users");
		const userData = await collection.findOne({username: username});
		return userData ? new User(userData) : null;
	}

	// Find one user by criteria
	static async findOne(criteria) {
		const db = dbo.getDb();
		const collection = db.collection("users");
		const userData = await collection.findOne(criteria);
		return userData ? new User(userData) : null;
	}
}

module.exports = User;
