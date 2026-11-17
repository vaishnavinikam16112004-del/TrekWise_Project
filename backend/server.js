require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const authRoutes = require("./routes/auth");
const trekRoutes = require("./routes/treks");
const reportRoutes = require("./routes/reports");
const weatherRoutes = require("./routes/weather");

const app = express();
const allowedOrigins = ["http://localhost:5173", "http://127.0.0.1:5173"];
if (process.env.FRONTEND_URL) {
  allowedOrigins.push(process.env.FRONTEND_URL.replace(/\/$/, ""));
}
app.use(cors({ origin: allowedOrigins }));
app.use(express.json({ limit: "1mb" }));

app.get("/", (_req, res) => res.json({ name: "TrekWise API", status: "running", mode: process.env.MONGODB_URI ? "MongoDB" : "demo memory" }));
app.get("/api/health", (_req, res) => res.json({ status: "ok" }));
app.use("/api/auth", authRoutes);
app.use("/api/treks", trekRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/weather", weatherRoutes);

const port = Number(process.env.PORT || 5000);
async function start() {
  if (process.env.MONGODB_URI) {
    try {
      await mongoose.connect(process.env.MONGODB_URI);
      console.log("Connected to MongoDB.");
    } catch (err) {
      console.error("MongoDB connection failed:", err.message);
      process.exit(1);
    }
  } else {
    console.log("Starting in demo memory mode. Data is not saved after restart.");
  }
  app.listen(port, () => console.log(`TrekWise API running at http://localhost:${port}`));
}
start();
