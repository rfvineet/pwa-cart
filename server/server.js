import express, { json } from "express";
import { Schema, model, connect } from "mongoose";
import cors from "cors";
const app = express();
const port = 3001;

app.use(cors());
app.use(json());

const uri =
  "mongodb+srv://vineet:vineetbs@cluster0.1m4rt5f.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
if (!uri) {
  throw new Error("MONGO_URI not found in .env file");
}

const bookSchema = new Schema({
  name: { type: String, required: true },
  author: String,
  price: { type: Number, required: true },
});

const billSchema = new Schema({
  id: { type: String, required: true, unique: true },
  username: { type: String, required: true },
  items: [Object],
  total: { type: Number, required: true },
  date: { type: Date, default: Date.now },
  synced: { type: Boolean, default: false },
});

const Book = model("Book", bookSchema);
const Bill = model("Bill", billSchema);

const seedDatabase = async () => {
  try {
    const bookCount = await Book.countDocuments();
    if (bookCount === 0) {
      console.log("No books found. Seeding database...");
      await Book.insertMany([
        { name: "The Midnight Library", author: "Matt Haig", price: 299.99 },
        { name: "Project Hail Mary", author: "Andy Weir", price: 450.5 },
        { name: "Klara and the Sun", author: "Kazuo Ishiguro", price: 320.0 },
        { name: "Atomic Habits", author: "James Clear", price: 380.0 },
      ]);
      console.log("Database seeded successfully!");
    }
  } catch (error) {
    console.error("Error seeding database:", error);
  }
};

connect(uri)
  .then(() => {
    console.log("Connected successfully to MongoDB using Mongoose! 🍃");

    seedDatabase();

    app.get("/api/books", async (req, res) => {
      try {
        const books = await Book.find({});
        res.json(books);
      } catch (err) {
        res.status(500).json({ message: "Failed to fetch books." });
      }
    });

    app.get("/api/bills", async (req, res) => {
      try {
        const bills = await Bill.find({});
        res.json(bills);
      } catch (err) {
        res.status(500).json({ message: "Failed to fetch bills." });
      }
    });

    app.post("/api/bills", async (req, res) => {
      try {
        const newBill = new Bill(req.body);
        await newBill.save();
        res.status(201).json({ message: "Bill saved successfully" });
      } catch (err) {
        res.status(500).json({ message: "Failed to save bill." });
      }
    });

    app.listen(port, () => {
      console.log(`API server listening at http://localhost:${port}`);
    });
  })
  .catch((err) => console.error("Mongoose connection error:", err));
