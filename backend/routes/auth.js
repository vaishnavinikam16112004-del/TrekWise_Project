const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const router = express.Router();

const memoryUsers = [];
const usesMongo = () => Boolean(process.env.MONGODB_URI);

router.post("/register", async (req, res) => {
  try {
    const { name, email, password, age, fitness, experience, availableHours, preferredDifficulty } = req.body;
    if (!name || !email || !password) return res.status(400).json({ message: "Name, email and password are required." });
    if (String(password).length < 6) return res.status(400).json({ message: "Password must have at least 6 characters." });
    const parsedAge = age === undefined || age === null || String(age).trim() === "" ? undefined : Number(age);
    if (parsedAge !== undefined && (!Number.isInteger(parsedAge) || parsedAge < 13 || parsedAge > 100)) {
      return res.status(400).json({ message: "Age must be a whole number between 13 and 100." });
    }
    const normalizedEmail = String(email).trim().toLowerCase();
    const existing = usesMongo()
      ? await User.findOne({ email: normalizedEmail })
      : memoryUsers.find(u => u.email === normalizedEmail);
    if (existing) return res.status(409).json({ message: "This email is already registered." });
    const passwordHash = await bcrypt.hash(password, 10);
    const userData = {
      name: String(name).trim(), email: normalizedEmail, passwordHash,
      age: parsedAge,
      fitness: fitness || "Beginner", experience: experience || "Beginner",
      availableHours: Number(availableHours) || 3, preferredDifficulty: preferredDifficulty || "Any"
    };
    const user = usesMongo() ? await User.create(userData) : { ...userData, _id: `demo-${Date.now()}` };
    if (!usesMongo()) memoryUsers.push(user);
    const token = jwt.sign({ id: String(user._id), name: user.name, email: user.email }, process.env.JWT_SECRET || "dev_only_secret_change_me", { expiresIn: "2h" });
    res.status(201).json({ message: "Account created.", token, user: { name: user.name, email: user.email, age: user.age, fitness: user.fitness, experience: user.experience, availableHours: user.availableHours, preferredDifficulty: user.preferredDifficulty } });
  } catch (err) {
    res.status(500).json({ message: "Could not create account.", detail: err.message });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = String(email || "").trim().toLowerCase();
    const user = usesMongo()
      ? await User.findOne({ email: normalizedEmail })
      : memoryUsers.find(u => u.email === normalizedEmail);
    if (!user || !(await bcrypt.compare(password || "", user.passwordHash))) {
      return res.status(401).json({ message: "Incorrect email or password." });
    }
    const token = jwt.sign({ id: String(user._id), name: user.name, email: user.email }, process.env.JWT_SECRET || "dev_only_secret_change_me", { expiresIn: "2h" });
    res.json({ message: "Login successful.", token, user: { name: user.name, email: user.email, age: user.age, fitness: user.fitness, experience: user.experience, availableHours: user.availableHours, preferredDifficulty: user.preferredDifficulty } });
  } catch (err) {
    res.status(500).json({ message: "Could not log in.", detail: err.message });
  }
});

module.exports = router;
