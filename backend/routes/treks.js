const express = require("express");
const baseRoutes = require("../data/routes");
const Report = require("../models/Report");
const router = express.Router();
const memoryReports = [];
const usesMongo = () => Boolean(process.env.MONGODB_URI);

function fitnessLevel(value) {
  return ({ Beginner: 1, Moderate: 2, Advanced: 3 })[value] || 1;
}
function difficultyLevel(value) {
  return ({ Easy: 1, Moderate: 2, Hard: 3 })[value] || 2;
}
function ageDifficultyMatch(age, routeDifficulty) {
  if (age < 18 || age >= 60) return ({ 1: 100, 2: 90, 3: 70 })[routeDifficulty];
  return ({ 1: 95, 2: 100, 3: 95 })[routeDifficulty];
}
function scoreRoute(route, profile, reports, weather) {
  const userFitness = fitnessLevel(profile.fitness);
  const userExperience = fitnessLevel(profile.experience);
  const routeDifficulty = difficultyLevel(route.difficulty);
  const age = Number(profile.age);
  const hasAge = Number.isInteger(age) && age >= 13 && age <= 100;
  const availableHours = Number(profile.availableHours || 3);
  const fitnessMatch = Math.max(0, 100 - Math.abs(userFitness - routeDifficulty) * 35);
  const experienceMatch = Math.max(0, 100 - Math.abs(userExperience - routeDifficulty) * 30);
  const timeMatch = availableHours >= route.durationHours ? 100 : Math.max(0, (availableHours / route.durationHours) * 100);
  const preferredMatch = profile.preferredDifficulty === "Any" || !profile.preferredDifficulty
    ? 100 : (profile.preferredDifficulty === route.difficulty ? 100 : 55);
  const baseCompatibility = Math.round(fitnessMatch * 0.30 + experienceMatch * 0.25 + timeMatch * 0.25 + preferredMatch * 0.20);
  // Age is a small ranking signal; it never filters a route or replaces fitness and experience.
  const compatibility = hasAge
    ? Math.round(baseCompatibility * 0.95 + ageDifficultyMatch(age, routeDifficulty) * 0.05)
    : baseCompatibility;

  let safety = 100;
  const activeReports = reports.filter(r => r.routeId === route.id && r.status !== "Rejected");
  const verified = activeReports.filter(r => r.status === "Verified");
  const reportSet = (verified.length ? verified : activeReports);
  reportSet.forEach(r => {
    if (r.type === "Landslide" || r.type === "Blocked path") safety -= 45;
    else if (r.type === "Slippery trail") safety -= 25;
    else if (r.type === "Low water") safety -= 10;
    else safety -= 5;
  });
  if (weather && weather.rainRisk === "high") safety -= 35;
  if (weather && weather.rainRisk === "medium") safety -= 15;
  if (route.trailCondition === "Slippery") safety -= 20;
  if (route.trailCondition === "Blocked") safety -= 60;
  safety = Math.max(0, Math.min(100, safety));
  const reasons = [];
  reasons.push(timeMatch >= 100 ? "Fits your available time." : "May take longer than your available time.");
  reasons.push(fitnessMatch >= 70 ? "Difficulty is reasonably matched to your fitness." : "Difficulty may be challenging for your fitness level.");
  if (hasAge) reasons.push("Age only lightly adjusts ranking; it does not restrict route access.");
  if (activeReports.length) reasons.push(`${activeReports.length} community report(s) need attention.`);
  if (weather && weather.rainRisk !== "low") reasons.push("Weather may increase risk; check current local conditions.");
  if (safety < 50) reasons.push("High caution: do not rely on this score; verify with local authorities before considering this route.");
  return { ...route, compatibilityScore: compatibility, safetyScore: safety, reportCount: activeReports.length, recommendationReasons: reasons };
}

router.get("/", async (req, res) => {
  try {
    const reports = usesMongo() ? await Report.find().lean() : memoryReports;
    const { fitness = "Beginner", experience = "Beginner", availableHours = 3, preferredDifficulty = "Any", search = "" } = req.query;
    const rawAge = req.query.age == null ? "" : String(req.query.age).trim();
    const age = rawAge === "" ? undefined : Number(rawAge);
    if (age !== undefined && (!Number.isInteger(age) || age < 13 || age > 100)) {
      return res.status(400).json({ message: "Age must be a whole number between 13 and 100." });
    }
    const profile = { age, fitness, experience, availableHours, preferredDifficulty };
    const filtered = baseRoutes.filter(r => `${r.fort} ${r.routeName} ${r.region}`.toLowerCase().includes(String(search).toLowerCase()));
    const results = filtered.map(r => scoreRoute(r, profile, reports, null))
      .sort((a, b) => b.compatibilityScore - a.compatibilityScore);
    res.json(results);
  } catch (err) {
    res.status(500).json({ message: "Could not load routes.", detail: err.message });
  }
});

router.get("/:id", async (req, res) => {
  const route = baseRoutes.find(r => r.id === req.params.id);
  if (!route) return res.status(404).json({ message: "Route not found." });
  const reports = usesMongo() ? await Report.find({ routeId: route.id }).lean() : memoryReports.filter(r => r.routeId === route.id);
  res.json(scoreRoute(route, { fitness: "Beginner", experience: "Beginner", availableHours: 3 }, reports, null));
});

module.exports = router;
module.exports.memoryReports = memoryReports;
module.exports.scoreRoute = scoreRoute;
