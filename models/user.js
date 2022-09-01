var mongoose = require("mongoose");

var Schema = mongoose.Schema;

var UserSchema = new Schema({
  firstName: { type: String, required: true, maxLength: 50 },
  lastName: { type: String, required: true, maxLength: 50 },
	username: { type: String, required: true, maxLength: 50 },
	password: { type: String, required: true, maxLength: 50 },
  member: { type: Boolean, required: true }
});

//Export model
module.exports = mongoose.model("User", UserSchema);
