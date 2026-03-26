const { query } = require('../../lib/db');

const create = async ({ video_id, reporter_id, reason }) => {
  const result = await query(
    'INSERT INTO reports (video_id, reporter_id, reason) VALUES ($1, $2, $3) RETURNING *',
    [video_id, reporter_id, reason]
  );
  return result.rows[0];
};

const findAll = async (filters = {}) => {
  let sql = `SELECT r.*, v.title as video_title, v.thumbnail_url, 
                    reporter.username as reporter_username,
                    uploader.username as uploader_username, v.user_id as uploader_id
             FROM reports r
             JOIN videos v ON r.video_id = v.id
             JOIN users reporter ON r.reporter_id = reporter.id
             JOIN users uploader ON v.user_id = uploader.id`;
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
     JOIN videos v ON r.video_id = v.id
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
