-- Visitors table
CREATE TABLE IF NOT EXISTS visitors (
  id SERIAL PRIMARY KEY,
  session_id VARCHAR(64),
  fingerprint VARCHAR(128),
  ip VARCHAR(64),
  user_agent TEXT,
  page VARCHAR(512),
  referrer VARCHAR(512),
  visit_time TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  country VARCHAR(64),
  city VARCHAR(128),
  timezone VARCHAR(64),
  language VARCHAR(32),
  screen_resolution VARCHAR(32),
  is_returning BOOLEAN DEFAULT FALSE,
  consent BOOLEAN DEFAULT FALSE
);

-- Events table
CREATE TABLE IF NOT EXISTS visitor_events (
  id SERIAL PRIMARY KEY,
  visitor_id INTEGER REFERENCES visitors(id),
  event_type VARCHAR(64),
  event_data JSONB,
  event_time TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
