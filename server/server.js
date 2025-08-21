// require("dotenv").config();
const express = require("express");
const { MongoClient } = require("mongodb");
const cors = require("cors");

const app = express();
const port = 3001;

app.use(cors());

const uri =
  "mongodb+srv://vineet:vineetbs@cluster0.t0w7x.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
if (!uri) {
  throw new Error("MONGO_URI not found in .env file");
}
const client = new MongoClient(uri);

async function run() {
  try {
    await client.connect();
    console.log("Connected successfully to MongoDB Atlas! 🍃");

    const database = client.db("bookstoreDB");
    const booksCollection = database.collection("books");

    app.get("/api/books", async (req, res) => {
      try {
        const books = await booksCollection.find({}).toArray();
        res.json(books);
      } catch (err) {
        res.status(500).json({ message: "Failed to fetch books." });
      }
    });

    const seedDatabase = async () => {
      const bookCount = await booksCollection.countDocuments();
      if (bookCount === 0) {
        console.log("No books found. Seeding database...");
        await booksCollection.insertMany([
          { name: "The Midnight Library", author: "Matt Haig", price: 299.99 },
          { name: "Project Hail Mary", author: "Andy Weir", price: 450.5 },
          { name: "Atomic Habits", author: "James Clear", price: 380.0 },
        ]);
        console.log("Database seeded successfully!");
      }
    };
    await seedDatabase();
  } catch (err) {
    console.error("Failed to connect to MongoDB", err);
  }
}

run().catch(console.dir);

app.listen(port, () => {
  console.log(`API server listening at http://localhost:${port}`);
});
