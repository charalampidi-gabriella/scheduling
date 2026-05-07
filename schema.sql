CREATE TABLE IF NOT EXISTS kv (
  key        TEXT PRIMARY KEY,
  value      TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

INSERT OR IGNORE INTO kv (key, value, updated_at) VALUES
  ('current_schedule', '{}', datetime('now')),
  ('drafts',           '[]', datetime('now')),
  ('locks',            '{"coaches":[],"shifts":[]}', datetime('now')),
  ('requests',         '[]', datetime('now')),
  ('coaches',          '[]', datetime('now')),
  ('locations',        '{}', datetime('now'));
