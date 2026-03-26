const { query } = require('../../lib/db');
const { generateId } = require('../../lib/id');

const findComment = async (id) => {
  const result = await query('SELECT * FROM comments WHERE id = $1', [id]);
  return result.rows[0];
};

const createComment = async ({ content, video_id, user_id }) => {
  const id = generateId();
  const result = await query(
    'INSERT INTO comments (id, content, video_id, user_id) VALUES ($1, $2, $3, $4) RETURNING *',
    [id, content, video_id, user_id]
  );
  const user = await query('SELECT username, avatar_url FROM users WHERE id = $1', [user_id]);
  return { ...result.rows[0], user: user.rows[0] };
};

const findLike = async (userId, videoId) => {
  const result = await query(
    'SELECT * FROM likes WHERE user_id = $1 AND video_id = $2',
    [userId, videoId]
  );
  return result.rows[0];
};

const createLike = async ({ user_id, video_id, type }) => {
  const id = generateId();
  const result = await query(
    'INSERT INTO likes (id, user_id, video_id, type) VALUES ($1, $2, $3, $4) RETURNING *',
    [id, user_id, video_id, type]
  );
  return result.rows[0];
};

const updateLike = async (id, { type }) => {
  const result = await query(
    'UPDATE likes SET type = $1 WHERE id = $2 RETURNING *',
    [type, id]
  );
  return result.rows[0];
};

const deleteLike = async (id) => {
  await query('DELETE FROM likes WHERE id = $1', [id]);
  return { success: true };
};

module.exports = { findComment, createComment, findLike, createLike, updateLike, deleteLike };
