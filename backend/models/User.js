const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  age: { type: Number, min: 13, max: 100 },
  fitness: { type: String, default: "Beginner" },
  experience: { type: String, default: "Beginner" },
  availableHours: { type: Number, default: 3 },
  preferredDifficulty: { type: String, default: "Any" }
}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);
