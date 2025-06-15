const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const app = express();
const db = new sqlite3.Database("./visitors.db");

// Veritabanı oluştur
db.run(`CREATE TABLE IF NOT EXISTS visitors (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ip TEXT,
  user_agent TEXT,
  page TEXT,
  visit_time DATETIME DEFAULT CURRENT_TIMESTAMP
)`);

app.use(express.static("public"));
app.use(express.json());

// Ziyaretçiden veri alma endpoint'i
app.post("/api/track", (req, res) => {
  const ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress;
  const userAgent = req.body.userAgent || "";
  const page = req.body.page || "";
  db.run(
    "INSERT INTO visitors (ip, user_agent, page) VALUES (?, ?, ?)",
    [ip, userAgent, page],
    (err) => {
      if (err) return res.status(500).json({ status: "error" });
      res.json({ status: "ok" });
    }
  );
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server started on http://localhost:${PORT}`);
});
