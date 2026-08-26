const { ObjectId } = require('mongodb');
const { DateTime } = require('luxon');
const dbo = require('../db/conn');

class NearbyPost {
  constructor(postData) {
    this._id = postData._id || new ObjectId();
    this.user = postData.user;
    this.message = postData.message;
    this.imageSource = postData.imageSource || postData.postImage || null;
    this.postImage = this.imageSource;
    this.timestamp = postData.timestamp || new Date();
    this.tags = Array.isArray(postData.tags) ? postData.tags : [];
    this.likes = Array.isArray(postData.likes)
      ? postData.likes.map(id => id instanceof ObjectId ? id : new ObjectId(id))
      : [];
    this.likeCount = postData.likeCount || 0;
    this.commentCount = postData.commentCount || 0;

    // New post: convert raw lat/lng into GeoJSON.
    // Existing post: carry the stored location through.
    if (postData.lat && postData.lng && !postData.location) {
      this.location = NearbyPost.formatLocation(postData.lat, postData.lng);
    } else if (postData.location) {
      this.location = postData.location;
    }

    // Computed at query time by findNearby; not stored in the database.
    if (postData.distanceLabel) {
      this.distanceLabel = postData.distanceLabel;
    }
  }

  // Virtual property for formatted timestamp. If we're switching to 24 hour
  // expiration, then this will need to be updated.
  get timestamp_formatted() {
    const time = DateTime.fromJSDate(this.timestamp);
    const diff = DateTime.now().diff(time, ['days', 'hours', 'minutes']).toObject();

    if (diff.days >= 1) {
      return time.toLocaleString(DateTime.DATE_MED);
    } else if (diff.hours >= 1) {
      return `${Math.floor(diff.hours)}h ago`;
    } else if (diff.minutes >= 1) {
      return `${Math.floor(diff.minutes)}m ago`;
    } else {
      return 'Just now';
    }
  }

  /* LOCATION FORMATTING */

  static formatLocation(lat, lng) {
    const parsedLat = parseFloat(lat);
    const parsedLng = parseFloat(lng);

    return {
      type: "Point",
      coordinates: [parsedLng, parsedLat] // MongoDB requires Lng first
    };
  }

  /* PROXIMITY QUERY */

  static async findNearby(lat, lng) {
    const parsedLat = parseFloat(lat);
    const parsedLng = parseFloat(lng);

    if (Number.isNaN(parsedLat) || Number.isNaN(parsedLng)) {
      throw new Error(`findNearby requires numeric coordinates. Received lat=${lat}, lng=${lng}`);
    }

    const db = dbo.getDb();
    const collection = db.collection("nearby_posts");

    const pipeline = [
      // Geospatial sort & filter. Must be the first stage, and requires a
      // 2dsphere index on `location`.
      {
        $geoNear: {
          near: { type: "Point", coordinates: [parseFloat(lng), parseFloat(lat)] },
          distanceField: "distanceInMeters",
          maxDistance: 10000, // 10 km
          spherical: true
        }
      },
      // Populate user data
      {
        $lookup: {
          from: "users",
          localField: "user",
          foreignField: "_id",
          as: "user"
        }
      },
      { $unwind: "$user" }
    ];

    const postsData = await collection.aggregate(pipeline).toArray();

    return postsData.map(postData => {
      const meters = Math.round(postData.distanceInMeters);
      if (meters < 50) {
        postData.distanceLabel = "Nearby";
      } else if (meters < 1000) {
        postData.distanceLabel = `${meters}m`;
      } else {
        postData.distanceLabel = `${(meters / 1000).toFixed(1)}km`;
      }

      const post = new NearbyPost(postData);
      post.user = postData.user;
      return post;
    });
  }

  /* PERSISTENCE */

  // Save post to database
  async save() {
    const db = dbo.getDb();
    const collection = db.collection('nearby_posts');

    // Keep the query-time label out of the stored document
    const { distanceLabel, ...dataToSave } = this;

    if (this._id && await collection.findOne({ _id: this._id })) {
      const { _id, ...updateData } = dataToSave;
      return await collection.updateOne({ _id: this._id }, { $set: updateData });
    } else {
      return await collection.insertOne(dataToSave);
    }
  }

  // Find all posts
  static async findAll() {
    const db = dbo.getDb();
    const collection = db.collection('nearby_posts');
    return await collection.find({}).toArray();
  }

  // Find a single nearby post by ID and return a NearbyPost instance
  static async findById(id) {
    const db = dbo.getDb();
    const collection = db.collection('nearby_posts');
    const _id = id instanceof ObjectId ? id : new ObjectId(id);
    const postData = await collection.findOne({ _id });
    return postData ? new NearbyPost(postData) : null;
  }

  // Increment the commentCount for a given post id
  static async incrementCommentCount(postId) {
    const db = dbo.getDb();
    const collection = db.collection('nearby_posts');
    const _id = postId instanceof ObjectId ? postId : new ObjectId(postId);
    await collection.updateOne({ _id }, { $inc: { commentCount: 1 } });
  }

  // Populate user data for this post instance
  async populate(field = 'user') {
    if (field === 'user' && this.user) {
      const db = dbo.getDb();
      const usersCollection = db.collection('users');

      // If user is an ObjectId, fetch the user data
      const userData = await usersCollection.findOne({ _id: new ObjectId(this.user) });
      if (userData) {
        this.user = userData; // Replace ObjectId with user data
      }
    }
    return this;
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
    
    await db.collection("nearby_posts").updateOne(
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
    if (!Array.isArray(this.likes)) return false;
		const userObjectId = userId instanceof ObjectId ? userId : new ObjectId(userId);
		return this.likes.some(id => id.equals(userObjectId));
	}
}

module.exports = NearbyPost;