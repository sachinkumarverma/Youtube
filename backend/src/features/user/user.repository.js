const { query } = require('../../lib/db');
const { generateId } = require('../../lib/id');

const findSubscriptions = async (userId) => {
  const result = await query(
    `SELECT s.*, 
            u.username, u.avatar_url,
            (SELECT COUNT(*) FROM subscriptions sc WHERE sc.channel_id = u.id) as subscribers_count
     FROM subscriptions s
     JOIN users u ON s.channel_id = u.id
     WHERE s.subscriber_id = $1`,
    [userId]
  );
  return result.rows.map(row => ({
    ...row,
    channel: {
      id: row.channel_id,
      username: row.username,
      avatar_url: row.avatar_url,
      _count: { subscribers: parseInt(row.subscribers_count) }
    }
  }));
};

const findSubscription = async (subscriberId, channelId) => {
  const result = await query(
    'SELECT * FROM subscriptions WHERE subscriber_id = $1 AND channel_id = $2',
    [subscriberId, channelId]
  );
  return result.rows[0];
};

const createSubscription = async (subscriberId, channelId) => {
  const id = generateId();
  const result = await query(
    'INSERT INTO subscriptions (id, subscriber_id, channel_id) VALUES ($1, $2, $3) RETURNING *',
    [id, subscriberId, channelId]
  );
  return result.rows[0];
};

const deleteSubscription = async (id) => {
  await query('DELETE FROM subscriptions WHERE id = $1', [id]);
  return { success: true };
};

const updateSubscription = async (id, { notifications_on }) => {
  const result = await query(
    'UPDATE subscriptions SET notifications_on = $1 WHERE id = $2 RETURNING *',
    [notifications_on, id]
  );
  return result.rows[0];
};

const findWatchLater = async (userId) => {
  const result = await query(
    `SELECT w.*, v.*, u.username, u.avatar_url, u.id as u_id
     FROM watch_later w
     JOIN videos v ON w.video_id = v.id
     JOIN users u ON v.user_id = u.id
     WHERE w.user_id = $1
     ORDER BY w.created_at DESC`,
    [userId]
  );
  return result.rows.map(row => ({
    ...row,
    video: {
      ...row,
      user: { id: row.u_id, username: row.username, avatar_url: row.avatar_url }
    }
  }));
};

const findWatchLaterItem = async (userId, videoId) => {
  const result = await query('SELECT * FROM watch_later WHERE user_id = $1 AND video_id = $2', [userId, videoId]);
  return result.rows[0];
};

const createWatchLater = async (userId, videoId) => {
  const id = generateId();
  const result = await query('INSERT INTO watch_later (id, user_id, video_id) VALUES ($1, $2, $3) RETURNING *', [id, userId, videoId]);
  return result.rows[0];
};

const deleteWatchLater = async (id) => {
  await query('DELETE FROM watch_later WHERE id = $1', [id]);
  return { success: true };
};

const findHistory = async (userId) => {
  const result = await query(
    `SELECT h.*, v.*, u.username, u.avatar_url, u.id as u_id, h.viewed_at
     FROM history h
     JOIN videos v ON h.video_id = v.id
     JOIN users u ON v.user_id = u.id
     WHERE h.user_id = $1
     ORDER BY h.viewed_at DESC
     LIMIT 50`,
    [userId]
  );
  return result.rows.map(row => ({
    ...row,
    video: {
      ...row,
      user: { id: row.u_id, username: row.username, avatar_url: row.avatar_url }
    }
  }));
};

const upsertHistory = async (userId, videoId) => {
  const existing = await query('SELECT id FROM history WHERE user_id = $1 AND video_id = $2', [userId, videoId]);
  if (existing.rows[0]) {
    return query('UPDATE history SET viewed_at = $1 WHERE id = $2', [new Date(), existing.rows[0].id]);
  } else {
    const id = generateId();
    return query('INSERT INTO history (id, user_id, video_id) VALUES ($1, $2, $3)', [id, userId, videoId]);
  }
};

const findLikedVideos = async (userId) => {
  const result = await query(
    `SELECT l.*, v.*, u.username, u.avatar_url, u.id as u_id 
     FROM likes l
     JOIN videos v ON l.video_id = v.id
     JOIN users u ON v.user_id = u.id
     WHERE l.user_id = $1 AND l.type = 'LIKE'
     ORDER BY l.id DESC`,
    [userId]
  );
  return result.rows.map(row => ({
    ...row,
    video: {
      ...row,
      user: { id: row.u_id, username: row.username, avatar_url: row.avatar_url }
    }
  }));
};

const findUserVideos = async (userId) => {
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
  findSubscriptions, findSubscription, createSubscription, deleteSubscription, updateSubscription,
  findWatchLater, findWatchLaterItem, createWatchLater, deleteWatchLater,
  findHistory, upsertHistory,
  findLikedVideos, findUserVideos
};
