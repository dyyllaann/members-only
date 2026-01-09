// models/comment.js
const { ObjectId } = require("mongodb");
const { DateTime } = require("luxon");
const dbo = require("../db/conn");

class Comment {
  constructor(commentData) {
    this._id = commentData._id || new ObjectId();
    this.postId = commentData.postId instanceof ObjectId 
      ? commentData.postId 
      : new ObjectId(commentData.postId);
    this.userId = commentData.userId instanceof ObjectId
      ? commentData.userId
      : new ObjectId(commentData.userId);
    this.text = commentData.text;
    this.timestamp = commentData.timestamp || new Date();
    this.likes = Array.isArray(commentData.likes)
      ? commentData.likes.map(id => id instanceof ObjectId ? id : new ObjectId(id))
      : [];
    this.likeCount = commentData.likeCount || 0;
    this.parentCommentId = commentData.parentCommentId || null; // For nested replies
  }

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

  async save() {
    const db = dbo.getDb();
    const result = await db.collection("comments").insertOne(this);
    this._id = result.insertedId;
    return this;
  }

  static async findByPostId(postId, limit = 10, skip = 0) {
    const db = dbo.getDb();
    const postObjectId = postId instanceof ObjectId ? postId : new ObjectId(postId);
    
    const comments = await db.collection("comments")
      .find({ postId: postObjectId })
      .sort({ timestamp: 1 })
      .skip(skip)
      .limit(limit)
      .toArray();
    
    return comments.map(comment => new Comment(comment));
  }

  async toggleLike(userId) {
    const db = dbo.getDb();
    const userObjectId = userId instanceof ObjectId ? userId : new ObjectId(userId);
    
    const userIndex = this.likes.findIndex(id => id.equals(userObjectId));
    
    if (userIndex > -1) {
      this.likes.splice(userIndex, 1);
      this.likeCount = Math.max(0, this.likeCount - 1);
    } else {
      this.likes.push(userObjectId);
      this.likeCount = (this.likeCount || 0) + 1;
    }
    
    await db.collection("comments").updateOne(
      { _id: this._id },
      { $set: { likes: this.likes, likeCount: this.likeCount } }
    );
    
    return this.likeCount;
  }
}

module.exports = Comment;