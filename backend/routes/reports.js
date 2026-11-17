const express = require("express");
const Report = require("../models/Report");
const treks = require("./treks");
const router = express.Router();
const usesMongo = () => Boolean(process.env.MONGODB_URI);
const validTypes = ["Slippery trail", "Blocked path", "Landslide", "Low water", "Other"];

router.get("/", async (req, res) => {
  try {
    const reports = usesMongo() ? await Report.find().sort({ createdAt: -1 }).lean() : [...treks.memoryReports].sort((a,b) => new Date(b.createdAt)-new Date(a.createdAt));
    res.json(reports);
  } catch (err) { res.status(500).json({ message: "Could not load reports." }); }
});

router.post("/", async (req, res) => {
  try {
    const { routeId, type, description } = req.body;
    if (!routeId || !type || !description || !String(description).trim()) {
      return res.status(400).json({ message: "Route, report type and description are required." });
    }
    if (!validTypes.includes(type)) return res.status(400).json({ message: "Choose a valid report type." });
    const reportData = { routeId, type, description: String(description).trim().slice(0, 500), status: "Pending review", submittedBy: "Community member", createdAt: new Date() };
    const report = usesMongo() ? await Report.create(reportData) : { ...reportData, _id: `report-${Date.now()}` };
    if (!usesMongo()) treks.memoryReports.push(report);
    res.status(201).json({ message: "Report submitted for review.", report });
  } catch (err) { res.status(500).json({ message: "Could not submit report.", detail: err.message }); }
});

module.exports = router;
