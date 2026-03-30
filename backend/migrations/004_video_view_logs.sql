CREATE TABLE IF NOT EXISTS video_view_logs (
  id TEXT PRIMARY KEY,
  video_id TEXT NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  viewed_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_view_logs_video_date ON video_view_logs(video_id, viewed_at);
