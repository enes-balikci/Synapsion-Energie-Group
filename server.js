const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const axios = require("axios");
const cookieParser = require("cookie-parser");
const app = express();
const db = new sqlite3.Database("./visitors.db");

db.run(`CREATE TABLE IF NOT EXISTS visitors (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ip TEXT,
  user_agent TEXT,
  page TEXT,
  referrer TEXT,
  visit_time DATETIME DEFAULT CURRENT_TIMESTAMP,
  country TEXT,
  city TEXT,
  timezone TEXT,
  language TEXT,
  screen_resolution TEXT,
  is_returning INTEGER DEFAULT 0
)`);

app.use(express.static("public"));
app.use(express.json());
app.use(cookieParser());

app.post("/api/track", async (req, res) => {
  const ip = req.headers["x-forwarded-for"]?.split(",")[0] || req.connection.remoteAddress;
  const userAgent = req.body.userAgent || "";
  const page = req.body.page || "";
  const referrer = req.body.referrer || "";
  const language = req.body.language || "";
  const timezone = req.body.timezone || "";
  const screenResolution = req.body.screenResolution || "";
  let isReturning = req.cookies.visitor_id ? 1 : 0;

  let country = "", city = "", geoTimezone = "";
  try {
    // IP-to-location (free plan, rate limits, demo: ipapi.co)
    const geo = await axios.get(`https://ipapi.co/${ip}/json/`);
    country = geo.data.country_name || "";
    city = geo.data.city || "";
    geoTimezone = geo.data.timezone || "";
  } catch (e) {}

  db.run(
    `INSERT INTO visitors
    (ip, user_agent, page, referrer, country, city, timezone, language, screen_resolution, is_returning)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [ip, userAgent, page, referrer, country, city, geoTimezone, language, screenResolution, isReturning],
    (err) => {
      if (err) return res.status(500).json({ status: "error" });
      // Set returning visitor cookie for 6 months
      if (!req.cookies.visitor_id) {
        res.cookie("visitor_id", Math.random().toString(36).substring(2,15), { maxAge: 15768000000, httpOnly: false });
      }
      res.json({ status: "ok" });
    }
  );
});

// Ziyaretçi verilerine erişmek için:
app.get("/api/visitors", (req, res) => {
  db.all("SELECT * FROM visitors ORDER BY visit_time DESC LIMIT 100", [], (err, rows) => {
    if (err) return res.status(500).json({ status: "error" });
    res.json(rows);
  });
});

app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});
