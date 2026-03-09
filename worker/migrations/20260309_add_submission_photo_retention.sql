ALTER TABLE submissions ADD COLUMN photo_available_until INTEGER;

CREATE INDEX IF NOT EXISTS idx_submissions_photo_retention
ON submissions(photo_available_until, photo_cleared_at);
