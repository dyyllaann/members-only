const { MongoClient } = require("mongodb");
require("dotenv").config();

const Db = process.env.ATLAS_URI;
const client = new MongoClient(Db, {
	useNewUrlParser: true,
	useUnifiedTopology: true,
});

var _db;

module.exports = {
	connectToServer: function (callback) {
		console.log("Attempting to connect to MongoDB...");
		console.log("Connection string (without password):", process.env.ATLAS_URI.replace(/:[^:/@]*@/, ':***@'));
		
		client.connect(function (err, db) {
			if (err) {
				console.error("MongoDB connection failed:");
				console.error("Error code:", err.code);
				console.error("Error name:", err.name);
				console.error("Error message:", err.message);
				return callback(err);
			}
			if (db) {
				// Connect to a specific database for our app
				_db = db.db("members_only");
				console.log(`Successfully connected to MongoDB cluster`);
				console.log(`Using database: ${_db.databaseName}`);
			}
			return callback(err);
		});
	},

	getDb: function () {
		return _db;
	},
};
