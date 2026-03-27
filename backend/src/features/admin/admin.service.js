const { query } = require('../../lib/db');
const reportService = require('../reports/report.service');
const videoService = require('../videos/video.service');

// Get dashboard stats
const getStats = async () => {
  const [usersR, videosR, commentsR, reportsR, subsR] = await Promise.all([
    query('SELECT COUNT(*) as count FROM users'),
    query('SELECT COUNT(*) as count FROM videos'),
    query('SELECT COUNT(*) as count FROM comments'),
    query("SELECT COUNT(*) as count FROM reports WHERE status = 'pending'"),
    query('SELECT COUNT(*) as count FROM subscriptions')
  ]);
  return {
    totalUsers: parseInt(usersR.rows[0].count),
    totalVideos: parseInt(videosR.rows[0].count),
    totalComments: parseInt(commentsR.rows[0].count),
    pendingReports: parseInt(reportsR.rows[0].count),
    totalSubscriptions: parseInt(subsR.rows[0].count)
  };
};

// Get audit logs with pagination and filtering
const getLogs = async ({ page = 1, limit = 50, action, entity_type, from, to }) => {
  let sql = 'SELECT al.*, u.username FROM audit_logs al LEFT JOIN users u ON al.user_id::text = u.id';
  const params = [];
  const clauses = [];

  if (action) { params.push(action); clauses.push(`al.action = $${params.length}`); }
  if (entity_type) { params.push(entity_type); clauses.push(`al.entity_type = $${params.length}`); }
  if (from) { params.push(from); clauses.push(`al.created_at >= $${params.length}`); }
  if (to) { params.push(to); clauses.push(`al.created_at <= $${params.length}`); }

  if (clauses.length) sql += ' WHERE ' + clauses.join(' AND ');

  // Count total using a cleaner approach
  const countBase = 'SELECT COUNT(*) as count FROM audit_logs al';
  const countSql = clauses.length ? `${countBase} WHERE ${clauses.join(' AND ')}` : countBase;
  const countResult = await query(countSql, params);
  const total = parseInt(countResult.rows[0].count);

  sql += ' ORDER BY al.created_at DESC';

  // Paginate
  const offset = (page - 1) * limit;
  params.push(limit); sql += ` LIMIT $${params.length}`;
  params.push(offset); sql += ` OFFSET $${params.length}`;

  const result = await query(sql, params);
  return { logs: result.rows, total, page, totalPages: Math.ceil(total / limit) };
};

// Get all videos for admin
const getAllVideos = async () => {
  const result = await query(
    `SELECT v.*, u.username, u.email,
            (SELECT COUNT(*) FROM likes WHERE video_id = v.id) as likes_count,
            (SELECT COUNT(*) FROM comments WHERE video_id = v.id) as comments_count,
            (SELECT COUNT(*) FROM reports WHERE video_id = v.id AND status = 'pending') as reports_count
     FROM videos v
     JOIN users u ON v.user_id = u.id
     ORDER BY v.created_at DESC`
  );
  return result.rows;
};

// Admin delete video
const deleteVideo = async (videoId) => {
  // Log it
  await query(
    'INSERT INTO audit_logs (action, entity_type, entity_id, details) VALUES ($1, $2, $3, $4)',
    ['ADMIN_VIDEO_DELETED', 'video', videoId, JSON.stringify({ reason: 'Admin removal' })]
  );
  return videoService.adminDeleteVideo(videoId);
};

// Get all reports
const getReports = async (filters) => {
  return reportService.getAllReports(filters);
};

// Review report
const reviewReport = async (reportId, data) => {
  return reportService.reviewReport(reportId, data);
};

// Get all users
const getUsers = async () => {
  const result = await query(
    `SELECT u.*, 
            (SELECT COUNT(*) FROM videos WHERE user_id = u.id) as videos_count,
            (SELECT COUNT(*) FROM subscriptions WHERE channel_id = u.id) as subscribers_count
     FROM users u
     ORDER BY u.created_at DESC`
  );
  return result.rows;
};

// Get all comments
const getComments = async () => {
  const result = await query(
    `SELECT c.*, u.username, v.title as video_title
     FROM comments c
     JOIN users u ON c.user_id = u.id
     JOIN videos v ON c.video_id = v.id
     ORDER BY c.created_at DESC`
  );
  return result.rows;
};

module.exports = { getStats, getLogs, getAllVideos, deleteVideo, getReports, reviewReport, getUsers, getComments };
