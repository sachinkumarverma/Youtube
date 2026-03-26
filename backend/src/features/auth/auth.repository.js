const { query } = require('../../lib/db');
const { generateId } = require('../../lib/id');

const findByEmail = async (email) => {
  const result = await query('SELECT * FROM users WHERE email = $1', [email]);
  return result.rows[0];
};

const findById = async (id) => {
  const result = await query('SELECT * FROM users WHERE id = $1', [id]);
  return result.rows[0];
};

const findByIdSelect = async (id) => {
  const result = await query(
    'SELECT id, username, email, avatar_url, banner_url, about, created_at, username_updated_at FROM users WHERE id = $1',
    [id]
  );
  return result.rows[0];
};

const findByEmailOrUsername = async (email, username) => {
  const result = await query(
    'SELECT * FROM users WHERE email = $1 OR username = $2',
    [email, username]
  );
  return result.rows[0];
};

const create = async ({ username, email, password_hash, avatar_url }) => {
  const id = generateId();
  const result = await query(
    'INSERT INTO users (id, username, email, password_hash, avatar_url) VALUES ($1, $2, $3, $4, $5) RETURNING id, username, email, avatar_url, banner_url, about, created_at, username_updated_at',
    [id, username, email, password_hash, avatar_url]
  );
  return result.rows[0];
};

const update = async (id, data) => {
  const fields = Object.keys(data);
  const values = Object.values(data);
  const setString = fields.map((f, i) => `"${f}" = $${i + 2}`).join(', ');
  const result = await query(
    `UPDATE users SET ${setString} WHERE id = $1 RETURNING id, username, email, avatar_url, banner_url, about, created_at, username_updated_at`,
    [id, ...values]
  );
  return result.rows[0];
};

const findWithCounts = async (id) => {
  const result = await query(
    `SELECT u.*, 
            (SELECT COUNT(*) FROM subscriptions s WHERE s.channel_id = u.id) as subscribers_count,
            (SELECT COUNT(*) FROM videos v WHERE v.user_id = u.id) as videos_count
     FROM users u WHERE u.id = $1`,
    [id]
  );
  const user = result.rows[0];
  if (user) {
    user._count = { 
      subscribers: parseInt(user.subscribers_count), 
      videos: parseInt(user.videos_count) 
    };
  }
  return user;
};

module.exports = {
  findByEmail,
  findById,
  findByIdSelect,
  findByEmailOrUsername,
  create,
  update,
  findWithCounts
};
