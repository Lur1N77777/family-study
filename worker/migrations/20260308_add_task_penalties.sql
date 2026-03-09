ALTER TABLE tasks ADD COLUMN penalty_enabled INTEGER NOT NULL DEFAULT 0;
ALTER TABLE tasks ADD COLUMN penalty_points INTEGER NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS task_penalties (
  id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL,
  child_id TEXT NOT NULL,
  family_code TEXT NOT NULL,
  period_key TEXT NOT NULL,
  period_start INTEGER NOT NULL,
  period_end INTEGER NOT NULL,
  points INTEGER NOT NULL,
  applied_at INTEGER NOT NULL,
  FOREIGN KEY (task_id) REFERENCES tasks(id),
  FOREIGN KEY (child_id) REFERENCES users(id)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_task_penalties_unique ON task_penalties(task_id, child_id, period_key);
CREATE INDEX IF NOT EXISTS idx_task_penalties_family ON task_penalties(family_code, applied_at);
