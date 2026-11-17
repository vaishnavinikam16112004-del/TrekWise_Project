const express = require("express");
const router = express.Router();

router.get("/", async (req, res) => {
  const { lat, lon } = req.query;
  const key = process.env.OPENWEATHER_API_KEY;
  if (!key) return res.status(503).json({ message: "Weather API is not configured. Add OPENWEATHER_API_KEY to backend/.env." });
  if (!lat || !lon) return res.status(400).json({ message: "Latitude and longitude are required." });
  try {
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}&appid=${encodeURIComponent(key)}&units=metric`;
    const response = await fetch(url);
    const data = await response.json();
    if (!response.ok) return res.status(response.status).json({ message: data.message || "Weather service error." });
    const main = String(data.weather?.[0]?.main || "Unknown");
    const rainRisk = /thunderstorm|squall|tornado/i.test(main) ? "high" :
      (/rain|drizzle|snow/i.test(main) ? "medium" : "low");
    res.json({ city: data.name, temperatureC: data.main?.temp, description: data.weather?.[0]?.description, humidity: data.main?.humidity, rainRisk, updatedAt: new Date().toISOString() });
  } catch {
    res.status(502).json({ message: "Could not reach the weather service." });
  }
});

module.exports = router;
