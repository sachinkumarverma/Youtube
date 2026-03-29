const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const authRepo = require('./auth.repository');

const COOLDOWN_DAYS = 15;

// In-memory OTP store: { email: { otp, expiresAt } }
const otpStore = new Map();

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

  if (user.is_active === false) throw { status: 403, message: 'Your account has been deactivated. Please contact admin.' };

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

const sendOtp = async (email) => {
  const user = await authRepo.findByEmail(email);
  if (!user) throw { status: 404, message: 'No account found with this email' };

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  otpStore.set(email, { otp, expiresAt: Date.now() + 10 * 60 * 1000 }); // 10 min expiry

  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'accept': 'application/json',
      'content-type': 'application/json',
      'api-key': process.env.BREVO_API_KEY
    },
    body: JSON.stringify({
      sender: { name: 'ViewTube', email: process.env.BREVO_SENDER_EMAIL },
      to: [{ email }],
      subject: 'ViewTube - Password Reset OTP',
      htmlContent: `
        <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#0f0f0f;border-radius:12px;color:#fff">
          <h2 style="text-align:center;color:#ff0000">ViewTube Password Reset</h2>
          <p style="text-align:center;color:#aaa">Use the OTP below to reset your password</p>
          <div style="text-align:center;margin:24px 0">
            <span style="font-size:32px;font-weight:bold;letter-spacing:8px;background:#1a1a1a;padding:16px 32px;border-radius:8px;border:1px solid #333;display:inline-block">${otp}</span>
          </div>
          <p style="text-align:center;color:#888;font-size:13px">This OTP is valid for 10 minutes. Do not share it with anyone.</p>
        </div>
      `
    })
  });

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw { status: 500, message: errBody.message || 'Failed to send OTP email' };
  }

  return { message: 'OTP sent to your email' };
};

const verifyOtp = (email, otp) => {
  const stored = otpStore.get(email);
  if (!stored) throw { status: 400, message: 'No OTP requested for this email' };
  if (Date.now() > stored.expiresAt) {
    otpStore.delete(email);
    throw { status: 400, message: 'OTP has expired. Please request a new one' };
  }
  if (stored.otp !== otp) throw { status: 400, message: 'Invalid OTP' };
  return { message: 'OTP verified' };
};

const resetPassword = async (email, otp, newPassword) => {
  verifyOtp(email, otp);
  otpStore.delete(email);

  const user = await authRepo.findByEmail(email);
  if (!user) throw { status: 404, message: 'User not found' };

  const salt = await bcrypt.genSalt(10);
  const password_hash = await bcrypt.hash(newPassword, salt);
  await authRepo.update(user.id, { password_hash });

  return { message: 'Password reset successfully' };
};

module.exports = { register, login, googleAuth, updateProfile, sendOtp, verifyOtp, resetPassword };
