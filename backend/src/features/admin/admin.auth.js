const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../../lib/db');
const { generateId } = require('../../lib/id');

// Admin credentials stored as env or hardcoded for simplicity 
// In production, use a separate admin_users table with role-based access
const ADMIN_SECRET = process.env.ADMIN_SECRET || 'viewtube-admin-2024';

const registerAdmin = async ({ username, email, password, secretKey }) => {
  if (secretKey !== ADMIN_SECRET) {
    throw { status: 403, message: 'Invalid admin secret key' };
  }

  const existing = await query('SELECT * FROM users WHERE email = $1', [email]);
  if (existing.rows[0]) throw { status: 400, message: 'Email already registered' };

  const salt = await bcrypt.genSalt(10);
  const password_hash = await bcrypt.hash(password, salt);
  const id = generateId();

  const result = await query(
    'INSERT INTO users (id, username, email, password_hash) VALUES ($1, $2, $3, $4) RETURNING id, username, email',
    [id, username, email, password_hash]
  );

  const token = jwt.sign({ id: result.rows[0].id, role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '24h' });
  return { token, user: result.rows[0] };
};

const loginAdmin = async ({ email, password }) => {
  const result = await query('SELECT * FROM users WHERE email = $1', [email]);
  const user = result.rows[0];
  if (!user) throw { status: 400, message: 'Invalid credentials' };

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) throw { status: 400, message: 'Invalid credentials' };

  const token = jwt.sign({ id: user.id, role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '24h' });
  return { token, user: { id: user.id, username: user.username, email: user.email } };
};

module.exports = { registerAdmin, loginAdmin };
