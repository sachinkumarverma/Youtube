-- Add comment_id to reports for comment-level reporting
ALTER TABLE reports ADD COLUMN IF NOT EXISTS comment_id TEXT;
CREATE INDEX IF NOT EXISTS idx_reports_comment ON reports(comment_id);
