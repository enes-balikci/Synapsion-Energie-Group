const express = require("express");
const { Pool } = require("pg");
const Redis = require("ioredis");
const axios = require("axios");
const cookieParser = require("cookie-parser");
const { v4: uuidv4 } = require("uuid");
const fs = require("fs");
const app = express();

const pgPool = new Pool({ connectionString: process.env.DATABASE_URL || "postgres://postgres:postgres@localhost:5432/analytics" });
const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379");

app.use(express.static("public"));
app.use(express.json());
app.use(cookieParser());

// Middleware: Rate limiting (100 req/ip/15min)
app.use(async (req, res, next) => {
  const ip = req.headers["x-forwarded-for"]?.split(",")[0] || req.connection.remoteAddress;
  const key = `ratelimit:${ip}`;
  const count = await redis.incr(key);
  if (count === 1) await redis.expire(key, 900);
  if (count > 100) return res.status(429).send("Rate limit exceeded");
  next();
});

// GDPR Logging
function gdprLog(msg) {
  fs.appendFileSync("gdpr.log", `[${new Date().toISOString()}] ${msg}\n`);
}

// Visitor tracking endpoint
app.post("/api/track", async (req, res) => {
  try {
    const ip = req.headers["x-forwarded-for"]?.split(",")[0] || req.connection.remoteAddress;
    const userAgent = req.body.userAgent || "";
    const page = req.body.page || "";
    const referrer = req.body.referrer || "";
    const language = req.body.language || "";
    const timezone = req.body.timezone || "";
    const screenResolution = req.body.screenResolution || "";
    const fingerprint = req.body.fingerprint || "";
    const consent = !!req.body.consent;
    let sessionId = req.cookies.session_id || uuidv4();

    // GeoIP Lookup (ipapi.co)
    let country = "", city = "", geoTimezone = "";
    try {
      const geo = await axios.get(`https://ipapi.co/${ip}/json/`);
      country = geo.data.country_name || "";
      city = geo.data.city || "";
      geoTimezone = geo.data.timezone || "";
    } catch (e) {}

    // Is returning visitor?
    const { rows: returningRows } = await pgPool.query(
      "SELECT id FROM visitors WHERE fingerprint = $1 OR session_id = $2 LIMIT 1",
      [fingerprint, sessionId]
    );
    const isReturning = returningRows.length > 0;

    // Insert visitor
    const { rows } = await pgPool.query(
      `INSERT INTO visitors
      (session_id, fingerprint, ip, user_agent, page, referrer, country, city, timezone, language, screen_resolution, is_returning, consent)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING id`,
      [sessionId, fingerprint, ip, userAgent, page, referrer, country, city, geoTimezone, language, screenResolution, isReturning, consent]
    );
    res.cookie("session_id", sessionId, { maxAge: 1000 * 60 * 60 * 24 * 180 });

    // GDPR log
    gdprLog(`VISIT: ip=${ip} session_id=${sessionId} consent=${consent}`);

    res.json({ status: "ok", visitorId: rows[0].id });
  } catch (e) {
    res.status(500).json({ status: "error" });
  }
});

// Event logging endpoint (async queue simulation)
app.post("/api/event", async (req, res) => {
  try {
    const { visitorId, eventType, eventData } = req.body;
    await pgPool.query(
      "INSERT INTO visitor_events (visitor_id, event_type, event_data) VALUES ($1, $2, $3)",
      [visitorId, eventType, eventData]
    );
    res.json({ status: "ok" });
  } catch (e) {
    res.status(500).json({ status: "error" });
  }
});

// GDPR: data deletion endpoint
app.post("/api/delete", async (req, res) => {
  const { fingerprint, sessionId } = req.body;
  await pgPool.query("DELETE FROM visitor_events WHERE visitor_id IN (SELECT id FROM visitors WHERE fingerprint=$1 OR session_id=$2)", [fingerprint, sessionId]);
  await pgPool.query("DELETE FROM visitors WHERE fingerprint=$1 OR session_id=$2", [fingerprint, sessionId]);
  gdprLog(`DELETE REQUEST: fingerprint=${fingerprint} session_id=${sessionId}`);
  res.json({ status: "deleted" });
});

app.listen(3000, () => {
  console.log("Server running at http://localhost:3000");
});
