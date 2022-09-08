var mongoose = require("mongoose");

var Schema = mongoose.Schema;

var PostSchema = new Schema({
	author: String,
	message: { type: String, required: true, maxLength: 120 },
  postImage: { type: String, required: false },
	timestamp: { type: Date, default: Date.now },
  private: { type: Boolean, default: true },
  allowedUsers: [],
});

//Export model
module.exports = mongoose.model("Post", PostSchema);
