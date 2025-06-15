CREATE TABLE IF NOT EXISTS visitors (
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
);
