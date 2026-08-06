require('dotenv').config();

const { faker } = require('@faker-js/faker');
const dbo = require("../db/conn");
const bcrypt = require("bcryptjs");
// const { ObjectId } = require("mongodb");

async function seedUsers(count = 20) {
  const db = dbo.getDb();
  
  if (!db) {
    console.error("Database not connected!");
    process.exit(1);
  }
  
  console.log(`Connected to database: ${db.databaseName}`);
  
  const hashedPassword = await bcrypt.hash(process.env.MONGO_PASS, 10);
  
  const majors = ["Computer Science", "Economics", "Law", "Environmental Studies", "Architectural Design", "Mathematics", "Physics", "Biology", "Engineering", "Chemistry"];
  
  for (let i = 0; i < count; i++) {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    
    await db.collection("users").insertOne({
        firstName,
        lastName,
        username: faker.internet.username({ firstName, lastName }).toLowerCase(),
        password: hashedPassword,
        graduation: "2028",
        major: faker.helpers.arrayElement(majors),
        likedPosts: []
    });
    
    console.log(`Created user ${i + 1}/${count}`);
  }
  
  console.log("Seed complete.");
  process.exit(0);
}

// Connect to database and run
dbo.connectToServer((err) => {
  if (err) {
    console.error("Connection error:", err);
    process.exit(1);
  }
  seedUsers(50).catch(err => {
    console.error("Seed error:", err);
    process.exit(1);
  });
});