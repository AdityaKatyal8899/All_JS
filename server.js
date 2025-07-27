require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log("✅ Connected to MongoDB"))
.catch((err) => console.error("❌ MongoDB connection error:", err));

// Mongoose Schema
const studentSchema = new mongoose.Schema({
  name: String,
  phone: String,
  slot: String
});
const Student = mongoose.model("Student", studentSchema);

// API route to handle submission
app.post("/submit", async (req, res) => {
  try {
    const { name, phone, slot } = req.body;
    const newStudent = new Student({ name, phone, slot });
    await newStudent.save();
    res.status(200).json({ message: "Registered successfully!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Something went wrong." });
  }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
