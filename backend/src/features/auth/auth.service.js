const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const authRepo = require('./auth.repository');

const COOLDOWN_DAYS = 15;

const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

const register = async ({ username, email, password, avatar_url }) => {
  const existing = await authRepo.findByEmailOrUsername(email, username);
  if (existing) {
    throw { status: 400, message: 'Username or email already in use' };
  }

  const salt = await bcrypt.genSalt(10);
  const password_hash = await bcrypt.hash(password, salt);

  const user = await authRepo.create({ username, email, password_hash, avatar_url });
  const token = generateToken(user.id);
  return { token, user };
};

const login = async ({ email, password }) => {
  const user = await authRepo.findByEmail(email);
  if (!user) throw { status: 400, message: 'Invalid credentials' };

  const validPassword = await bcrypt.compare(password, user.password_hash);
  if (!validPassword) throw { status: 400, message: 'Invalid credentials' };

  const token = generateToken(user.id);
  const userForRes = await authRepo.findByIdSelect(user.id);
  return { token, user: userForRes };
};

const googleAuth = async ({ email, username, avatar_url }) => {
  let user = await authRepo.findByEmail(email);
  if (!user) {
    const password_hash = await bcrypt.hash(Math.random().toString(36), 10);
    user = await authRepo.create({ username, email, password_hash, avatar_url });
  } else if (avatar_url && !user.avatar_url) {
    user = await authRepo.update(user.id, { avatar_url });
  }
  const token = generateToken(user.id);
  const userForRes = await authRepo.findByIdSelect(user.id);
  return { token, user: userForRes };
};

const updateProfile = async (userId, { avatar_url, banner_url, about, username }) => {
  const oldUser = await authRepo.findById(userId);
  if (!oldUser) throw { status: 404, message: 'User not found' };

  if (username && username !== oldUser.username) {
    const lastUpdated = oldUser.username_updated_at;
    const diff = Date.now() - (lastUpdated ? new Date(lastUpdated).getTime() : 0);
    const days = diff / (1000 * 60 * 60 * 24);
    if (days < COOLDOWN_DAYS) {
      throw {
        status: 400,
        message: `Username can only be changed once every ${COOLDOWN_DAYS} days. Please wait ${Math.ceil(COOLDOWN_DAYS - days)} more days.`
      };
    }
  }

  const data = {};
  if (avatar_url) data.avatar_url = avatar_url;
  if (banner_url) data.banner_url = banner_url;
  if (about !== undefined) data.about = about;
  if (username) {
    data.username = username;
    data.username_updated_at = new Date();
  }

  return authRepo.update(userId, data);
};

module.exports = { register, login, googleAuth, updateProfile };
