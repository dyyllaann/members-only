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

    // -- NEW: Geospatial Construction & Security --
    // If creating a new post, convert raw lat/lng into fuzzed GeoJSON
    if (postData.lat && postData.lng && !postData.location) {
      this.location = NearbyPost.formatSecureLocation(postData.lat, postData.lng);
    } 
    // If fetching from DB, map the existing location
    else if (postData.location) {
      this.location = postData.location;
    }

    // Attach the fuzzy distance label for the UI (only exists on read)
    if (postData.distanceLabel) {
      this.distanceLabel = postData.distanceLabel;
    }

    this.private = postData.private !== undefined ? postData.private : true;
    this.allowedUsers = postData.allowedUsers || [];
    this.likes = Array.isArray(postData.likes)
      ? postData.likes.map(id => id instanceof ObjectId ? id : new ObjectId(id))
      : [];
    this.likeCount = postData.likeCount || 0;
    this.commentCount = postData.commentCount || 0;
    this.tags = Array.isArray(postData.tags) ? postData.tags : [];
    this.courseId = postData.courseId
      ? (postData.courseId instanceof ObjectId ? postData.courseId : new ObjectId(postData.courseId))
      : null;
  }

  // Virtual property for formatted timestamp
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

  // --- NEW: Security & Fuzzing Methods ---

  static getDistanceInMeters(lat1, lon1, lat2, lon2) {
    const R = 6371e3; 
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  static formatSecureLocation(lat, lng) {
    const parsedLat = parseFloat(lat);
    const parsedLng = parseFloat(lng);
    
    // Drumheller Fountain coordinates
    const distanceToCampus = this.getDistanceInMeters(parsedLat, parsedLng, 47.6538, -122.3078);
    
    // On-campus = 3 decimals. Off-campus = 2 decimals.
    const precision = distanceToCampus <= 1500 ? 1000 : 100;
    
    return {
      type: "Point",
      coordinates: [
        Math.round(parsedLng * precision) / precision, // MongoDB requires Lng first
        Math.round(parsedLat * precision) / precision
      ]
    };
  }

  // --- NEW: Proximity Query ---

  static async findNearby(lat, lng) {
    const db = dbo.getDb();
    const collection = db.collection("nearby_posts");
    
    const pipeline = [
      // 1. Geospatial sort & filter (MUST be first stage)
      {
        $geoNear: {
          near: { type: "Point", coordinates: [ parseFloat(lng), parseFloat(lat) ] },
          distanceField: "distanceInMeters",
          maxDistance: 8046, // ~5 miles
          spherical: true
        }
      },
      // 2. Populate User Data
      {
        $lookup: {
          from: "users",
          localField: "user",
          foreignField: "_id",
          as: "user"
        }
      },
      { $unwind: "$user" },
      // 3. Output Sanitization Shield
      {
        $project: {
          location: 0 // Annihilate raw coordinates before sending to Node memory
        }
      }
    ];

    const postsData = await collection.aggregate(pipeline).toArray();

    // 4. Map to Model and apply Fuzzy Distance text
    return postsData.map(postData => {
      let fuzzy = "Under 1 mile away";
      if (postData.distanceInMeters > 4828) fuzzy = "3-5 miles away";
      else if (postData.distanceInMeters > 1609) fuzzy = "1-3 miles away";

      postData.distanceLabel = fuzzy;
      
      const post = new NearbyPost(postData);
      post.user = postData.user; // Ensure populated user persists
      return post;
    });
  }

  // Save post to database
  async save() {
    const db = dbo.getDb();
    const collection = db.collection('nearby_posts');
    
    // Prevent the fuzzy UI label from ever saving to the database
    const { distanceLabel, ...dataToSave } = this;
    
    if (this._id && await collection.findOne({_id: this._id})) {
      const { _id, ...updateData } = dataToSave;
      return await collection.updateOne({_id: this._id}, {$set: updateData});
    } else {
      return await collection.insertOne(dataToSave);
    }
  }

  // Find post by ID
  static async findById(id) {
    const db = dbo.getDb();
    const collection = db.collection('nearby_posts');
    return await collection.findOne({_id: new ObjectId(id)});
  }

  // Find all posts
  static async findAll() {
    const db = dbo.getDb();
    const collection = db.collection('nearby_posts');
    return await collection.find({}).toArray();
  }

  // Populate user data for this post instance
  async populate(field = 'user') {
    if (field === 'user' && this.user) {
      const db = dbo.getDb();
      const usersCollection = db.collection('users');

      // If user is an ObjectId, fetch the user data
      const userData = await usersCollection.findOne({_id: new ObjectId(this.user)});
      if (userData) {
        this.user = userData;  // Replace ObjectId with user data
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

  // Find posts with populated user data, optionally filtering by author fields
  static async findWithUser(criteria = {}, userCriteria = {}) {
    const db = dbo.getDb();
    const collection = db.collection("nearby_posts");
    const pipeline = [
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
    ];

    if (Object.keys(userCriteria).length > 0) {
      pipeline.push({ $match: userCriteria });
    }

    const posts = await collection.aggregate(pipeline).toArray();
    
    return posts.map(postData => {
      const post = new NearbyPost(postData);
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
    const userObjectId = userId instanceof ObjectId ? userId : new ObjectId(userId);
    return this.likes.some(id => id.equals(userObjectId));
  }

  // Update comment count
  static async incrementCommentCount(postId) {
    const db = dbo.getDb();
    await db.collection("nearby_posts").updateOne(
      { _id: postId },
      { $inc: { commentCount: 1 } }
    )
  }
}

module.exports = NearbyPost;