const { ObjectId } = require("mongodb");
const { DateTime } = require("luxon");
const dbo = require("../db/conn");

class Post {
	constructor(postData) {
		this._id = postData._id || new ObjectId();
		this.user = postData.user;
		this.message = postData.message;
		this.postImage = postData.postImage || null;
		this.timestamp = postData.timestamp || new Date();
		this.private = postData.private !== undefined ? postData.private : true;
		this.allowedUsers = postData.allowedUsers || [];
	}

	// Virtual property for formatted timestamp
	get timestamp_formatted() {
		return DateTime.fromJSDate(this.timestamp).toLocaleString(DateTime.DATETIME_MED_WITH_SECONDS);
	}

	// Save post to database
	async save() {
		const db = dbo.getDb();
		const collection = db.collection("posts");
		
		if (this._id && await collection.findOne({_id: this._id})) {
			// Update existing post
			const { _id, ...updateData } = this;
			return await collection.updateOne({_id: this._id}, {$set: updateData});
		} else {
			// Insert new post
			return await collection.insertOne(this);
		}
	}

	// Find post by ID
	static async findById(id) {
		const db = dbo.getDb();
		const collection = db.collection("posts");
		const postData = await collection.findOne({_id: new ObjectId(id)});
		return postData ? new Post(postData) : null;
	}

	// Find all posts
	static async find(criteria = {}) {
		const db = dbo.getDb();
		const collection = db.collection("posts");
		const postsData = await collection.find(criteria).toArray();
		return postsData.map(postData => new Post(postData));
	}

	// Populate user data for this post instance
	async populate(field = 'user') {
		if (field === 'user' && this.user) {
			const db = dbo.getDb();
			const usersCollection = db.collection("users");
			
			// If user is already an object (populated), return this instance
			if (typeof this.user === 'object' && this.user._id) {
				return this;
			}
			
			// If user is an ObjectId, fetch the user data
			const userData = await usersCollection.findOne({_id: new ObjectId(this.user)});
			if (userData) {
				this.user = userData;
			}
		}
		return this;
	}

	// Static method to populate multiple posts
	static async populate(posts, field = 'user') {
		if (!Array.isArray(posts)) {
			posts = [posts];
		}
		
		const populatedPosts = await Promise.all(
			posts.map(post => post.populate(field))
		);
		
		return populatedPosts;
	}

	// Find posts with populated user data
	static async findWithUser(criteria = {}) {
		const db = dbo.getDb();
		const collection = db.collection("posts");
		const posts = await collection.aggregate([
			{ $match: criteria },
			{
				$lookup: {
					from: "users",
					localField: "user",
					foreignField: "_id",
					as: "user"
				}
			},
			{ $unwind: "$user" }
		]).toArray();
		
		return posts.map(postData => {
			const post = new Post(postData);
			post.user = postData.user; // Keep the populated user data
			return post;
		});
	}
}

module.exports = Post;
