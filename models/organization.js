const { ObjectId } = require("mongodb");
const dbo = require("../db/conn");

class Organization {
	constructor(orgData) {
		this._id = orgData._id || new ObjectId();
		this.name = orgData.name;
		this.orgType = orgData.orgType;
		this.allowedDomains = Array.isArray(orgData.allowedDomains) ? orgData.allowedDomains : [];
		this.location = orgData.location || {};
		this.departments = Array.isArray(orgData.departments) ? orgData.departments : [];
		this.themeColor = orgData.themeColor;
	}

	// Save organization to database
	async save() {
		const db = dbo.getDb();
		const collection = db.collection("organizations");

		if (this._id && await collection.findOne({ _id: this._id })) {
			const { _id, ...updateData } = this;
			return await collection.updateOne({ _id: this._id }, { $set: updateData });
		} else {
			return await collection.insertOne(this);
		}
	}

	// Find organization by ID
	static async findById(id) {
		const db = dbo.getDb();
		const collection = db.collection("organizations");
		const orgData = await collection.findOne({ _id: new ObjectId(id) });
		return orgData ? new Organization(orgData) : null;
	}

	// Find organizations by criteria
	static async find(criteria = {}) {
		const db = dbo.getDb();
		const collection = db.collection("organizations");
		const orgsData = await collection.find(criteria).toArray();
		return orgsData.map(orgData => new Organization(orgData));
	}
}

module.exports = Organization;
