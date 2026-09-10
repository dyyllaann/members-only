const { MongoClient } = require("mongodb");
require("dotenv").config();

const Db = process.env.ATLAS_URI;
const client = new MongoClient(Db, {
	useNewUrlParser: true,
	useUnifiedTopology: true,
});

var _db;

// Creates indexes if they don't already exist -- createIndex is a no-op
// when an identical index is already present, so this is safe to run on
// every startup rather than only once against a fresh database.
async function ensureIndexes(db) {
	// Multikey index: MongoDB indexes each array element separately, so this
	// turns `find({ tags: "..." })` into a normal index seek instead of a
	// full collection scan of every post's tags array.
	await db.collection("posts").createIndex({ tags: 1 });
	await db.collection("nearby_posts").createIndex({ tags: 1 });

	// Required for the $geoNear aggregation in NearbyPost.findNearby --
	// $geoNear errors outright without a geospatial index on the field it
	// queries.
	await db.collection("nearby_posts").createIndex({ location: "2dsphere" });
}

module.exports = {
	connectToServer: function (callback) {
		console.log("Attempting to connect to MongoDB...");
		console.log("Connection string (without password):", process.env.ATLAS_URI.replace(/:[^:/@]*@/, ':***@'));

		client.connect(async function (err, db) {
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

				try {
					await ensureIndexes(_db);
					console.log("Indexes verified (posts.tags, nearby_posts.tags, nearby_posts.location).");
				} catch (indexErr) {
					console.error("Failed to create one or more indexes:", indexErr.message);
				}
			}
			return callback(err);
		});
	},

	getDb: function () {
		return _db;
	},
};
