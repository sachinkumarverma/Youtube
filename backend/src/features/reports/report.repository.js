const { query } = require('../../lib/db');

const create = async ({ video_id, reporter_id, reason, comment_id = null }) => {
  const result = await query(
    'INSERT INTO reports (video_id, reporter_id, reason, comment_id) VALUES ($1, $2, $3, $4) RETURNING *',
    [video_id, reporter_id, reason, comment_id]
  );
  return result.rows[0];
};

const findAll = async (filters = {}) => {
  let sql = `SELECT r.*, v.title as video_title, v.thumbnail_url,
                    reporter.username as reporter_username,
                    uploader.username as uploader_username, v.user_id as uploader_id,
                    c.content as comment_content, comment_user.username as comment_username
             FROM reports r
             JOIN videos v ON r.video_id = v.id
             JOIN users reporter ON r.reporter_id = reporter.id
             JOIN users uploader ON v.user_id = uploader.id
             LEFT JOIN comments c ON r.comment_id = c.id
             LEFT JOIN users comment_user ON c.user_id = comment_user.id`;
  const params = [];
  const clauses = [];

  if (filters.status) {
    params.push(filters.status);
    clauses.push(`r.status = $${params.length}`);
  }
  if (clauses.length) sql += ' WHERE ' + clauses.join(' AND ');
  sql += ' ORDER BY r.created_at DESC';

  const result = await query(sql, params);
  return result.rows;
};

const findById = async (id) => {
  const result = await query(
    `SELECT r.*, v.title as video_title, v.user_id as uploader_id,
            reporter.username as reporter_username
     FROM reports r
     LEFT JOIN videos v ON r.video_id = v.id
     JOIN users reporter ON r.reporter_id = reporter.id
     WHERE r.id = $1`,
    [id]
  );
  return result.rows[0];
};

const updateStatus = async (id, { status, admin_feedback }) => {
  const result = await query(
    'UPDATE reports SET status = $1, admin_feedback = $2, resolved_at = NOW() WHERE id = $3 RETURNING *',
    [status, admin_feedback, id]
  );
  return result.rows[0];
};

module.exports = { create, findAll, findById, updateStatus };
