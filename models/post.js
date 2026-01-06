const { ObjectId } = require("mongodb");
const { DateTime } = require("luxon");
const dbo = require("../db/conn");

class Post {
	constructor(postData) {
		this._id = postData._id || new ObjectId();
		this.user = postData.user;
		this.message = postData.message;
		this.contentType = postData.contentType || 'text';
		this.postImage = postData.postImage || null;
		this.timestamp = postData.timestamp || new Date();
		this.private = postData.private !== undefined ? postData.private : true;
		this.allowedUsers = postData.allowedUsers || [];
		this.likes = Array.isArray(postData.likes)
			? postData.likes.map(id => id instanceof ObjectId ? id : new ObjectId(id))
			: [];
		this.likeCount = postData.likeCount || 0;
	}

	// Virtual property for formatted timestamp
	get timestamp_formatted() {
		const time = DateTime.fromJSDate(this.timestamp);
		const diff = DateTime.now().diff(time, ['days', 'hours', 'minutes']).toObject();
		
		if (diff.days >= 1) {
			return time.toLocaleString(DateTime.DATE_MED);  // "Jan 5, 2026"
		} else if (diff.hours >= 1) {
			return `${Math.floor(diff.hours)}h ago`;         // "3h ago"
		} else if (diff.minutes >= 1) {
			return `${Math.floor(diff.minutes)}m ago`;       // "45m ago"
		} else {
			return 'Just now';
		}
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
			post.user = postData.user;
			return post;
		});
	}
	
	// Toggle like
	async toggleLike(userId) {
		const db = dbo.getDb();
		const userObjectId = userId instanceof ObjectId ? userId : new ObjectId(userId);

		const userIndex = this.likes.findIndex(id => id.equals(userObjectId));
  
		if (userIndex > -1) {
			// Unlike
			this.likes.splice(userIndex, 1);
			this.likeCount = Math.max(0, this.likeCount - 1);
		} else {
			// Like
			this.likes.push(userObjectId);
			this.likeCount = (this.likeCount || 0) + 1;
		}
		
		await db.collection("posts").updateOne(
			{ _id: this._id },
			{ 
			$set: { 
				likes: this.likes,
				likeCount: this.likeCount 
			}
			}
		);
		
		// Update user's likedPosts
		if (userIndex > -1) {
			await db.collection("users").updateOne(
			{ _id: userObjectId },
			{ $pull: { likedPosts: this._id } }
			);
		} else {
			await db.collection("users").updateOne(
			{ _id: userObjectId },
			{ $addToSet: { likedPosts: this._id } }
			);
		}
		
		return this.likeCount;
	}

	// Check if user has liked this post
	hasUserLiked(userId) {
		const userObjectId = userId instanceof ObjectId ? userId : new ObjectId(userId);
		return this.likes.some(id => id.equals(userObjectId));
	}
}

module.exports = Post;
