const { query } = require('../../lib/db');

const findByUserId = async (userId) => {
  const result = await query(
    'SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50',
    [userId]
  );
  return result.rows;
};

const markAsRead = async (id, userId) => {
  await query(
    'UPDATE notifications SET is_read = true WHERE id = $1 AND user_id = $2',
    [id, userId]
  );
  return { success: true };
};

const markAllAsRead = async (userId) => {
  await query(
    'UPDATE notifications SET is_read = true WHERE user_id = $1 AND is_read = false',
    [userId]
  );
  return { success: true };
};

const remove = async (id, userId) => {
  await query(
    'DELETE FROM notifications WHERE id = $1 AND user_id = $2',
    [id, userId]
  );
  return { success: true };
};

module.exports = { findByUserId, markAsRead, markAllAsRead, remove };
