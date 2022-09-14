var mongoose = require("mongoose");

var Schema = mongoose.Schema;

var UserSchema = new Schema({
	_id: Schema.Types.ObjectId,
	firstName: { type: String, required: true },
	lastName: { type: String, required: true },
	username: { type: String, required: true, maxLength: 50 },
	password: { type: String, required: true },
	member: { type: Boolean, required: false },
});

//Export model
module.exports = mongoose.model("User", UserSchema);
