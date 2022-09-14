const mongoose = require("mongoose");
const { DateTime } = require("luxon");
var Schema = mongoose.Schema;

var PostSchema = new Schema({
	user: { type: Schema.Types.ObjectId, ref: "User", required: true },
	message: { type: String, required: true, maxLength: 120 },
	postImage: { type: String, required: false },
	timestamp: { type: Date, default: Date.now },
	private: { type: Boolean, default: true },
	allowedUsers: [],
});

PostSchema.virtual("timestamp_formatted").get(function () {
	return DateTime.fromJSDate(this.timestamp).toLocaleString(DateTime.DATETIME_MED_WITH_SECONDS);
});

//Export model
module.exports = mongoose.model("Post", PostSchema);
