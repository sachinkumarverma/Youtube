const { query } = require('../../lib/db');
const { generateId } = require('../../lib/id');

const findAll = async (filters = {}) => {
  let sql = `SELECT v.*, u.username, u.avatar_url 
             FROM videos v 
             JOIN users u ON v.user_id = u.id`;
  const params = [];
  const whereClauses = [];

  if (filters.category) {
    params.push(filters.category);
    whereClauses.push(`LOWER(v.category) = LOWER($${params.length})`);
  }
  if (filters.q) {
    params.push(`%${filters.q}%`);
    whereClauses.push(`(v.title ILIKE $${params.length} OR v.description ILIKE $${params.length})`);
  }

  if (whereClauses.length > 0) sql += ` WHERE ` + whereClauses.join(' AND ');
  sql += ` ORDER BY v.created_at DESC`;

  const result = await query(sql, params);
  return result.rows.map(row => ({
    ...row,
    user: { id: row.user_id, username: row.username, avatar_url: row.avatar_url }
  }));
};

const findTrending = async () => {
  const result = await query(
    `SELECT v.*, u.username, u.avatar_url 
     FROM videos v 
     JOIN users u ON v.user_id = u.id 
     ORDER BY v.views DESC LIMIT 50`
  );
  return result.rows.map(row => ({
    ...row,
    user: { id: row.user_id, username: row.username, avatar_url: row.avatar_url }
  }));
};

const findExplore = async () => {
  const result = await query(
    `SELECT v.*, u.username, u.avatar_url 
     FROM videos v 
     JOIN users u ON v.user_id = u.id 
     ORDER BY RANDOM() LIMIT 50`
  );
  return result.rows.map(row => ({
    ...row,
    user: { id: row.user_id, username: row.username, avatar_url: row.avatar_url }
  }));
};

const findByChannelIds = async (channelIds) => {
  if (channelIds.length === 0) return [];
  const placeholders = channelIds.map((_, i) => `$${i + 1}`).join(',');
  const result = await query(
    `SELECT v.*, u.username, u.avatar_url 
     FROM videos v 
     JOIN users u ON v.user_id = u.id 
     WHERE v.user_id IN (${placeholders}) 
     ORDER BY v.created_at DESC`,
    channelIds
  );
  return result.rows.map(row => ({
    ...row,
    user: { id: row.user_id, username: row.username, avatar_url: row.avatar_url }
  }));
};

const findById = async (id) => {
  const videoResult = await query(
    `SELECT v.*, u.username, u.avatar_url 
     FROM videos v 
     JOIN users u ON v.user_id = u.id 
     WHERE v.id = $1`,
    [id]
  );
  const video = videoResult.rows[0];
  if (!video) return null;

  const commentsResult = await query(
    `SELECT c.*, cu.username, cu.avatar_url 
     FROM comments c
     JOIN users cu ON c.user_id = cu.id
     WHERE c.video_id = $1 
     ORDER BY c.created_at DESC`,
    [id]
  );

  const likesResult = await query('SELECT * FROM likes WHERE video_id = $1', [id]);

  return {
    ...video,
    user: { id: video.user_id, username: video.username, avatar_url: video.avatar_url },
    comments: commentsResult.rows.map(c => ({
      ...c,
      user: { username: c.username, avatar_url: c.avatar_url }
    })),
    likes: likesResult.rows
  };
};

const findByIdSimple = async (id) => {
  const result = await query('SELECT * FROM videos WHERE id = $1', [id]);
  return result.rows[0];
};

const create = async ({ title, description, video_url, thumbnail_url, category, duration, user_id }) => {
  const id = generateId();
  const result = await query(
    `INSERT INTO videos (id, title, description, video_url, thumbnail_url, category, duration, user_id) 
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
    [id, title, description, video_url, thumbnail_url, category, duration, user_id]
  );
  
  const user = await query('SELECT username FROM users WHERE id = $1', [user_id]);
  return { ...result.rows[0], user: user.rows[0] };
};

const update = async (id, data) => {
  const fields = Object.keys(data);
  const values = Object.values(data);
  const setString = fields.map((f, i) => `"${f}" = $${i + 2}`).join(', ');
  const result = await query(`UPDATE videos SET ${setString} WHERE id = $1 RETURNING *`, [id, ...values]);
  return result.rows[0];
};

const remove = async (id) => {
  // Delete related data first to avoid FK constraint issues
  await query('DELETE FROM comments WHERE video_id = $1', [id]);
  await query('DELETE FROM likes WHERE video_id = $1', [id]);
  await query('DELETE FROM history WHERE video_id = $1', [id]);
  await query('DELETE FROM watch_later WHERE video_id = $1', [id]);
  await query('DELETE FROM reports WHERE video_id = $1', [id]);
  await query('DELETE FROM videos WHERE id = $1', [id]);
  return { success: true };
};

const incrementViews = async (id) => {
  await query('UPDATE videos SET views = views + 1 WHERE id = $1', [id]);
  return { success: true };
};

const findByUserId = async (userId) => {
  const result = await query(
    `SELECT v.*, u.username, u.avatar_url 
     FROM videos v 
     JOIN users u ON v.user_id = u.id 
     WHERE v.user_id = $1 
     ORDER BY v.created_at DESC`,
    [userId]
  );
  return result.rows.map(row => ({
    ...row,
    user: { id: row.user_id, username: row.username, avatar_url: row.avatar_url }
  }));
};

module.exports = {
  findAll, findTrending, findExplore, findByChannelIds,
  findById, findByIdSimple, create, update, remove,
  incrementViews, findByUserId
};
