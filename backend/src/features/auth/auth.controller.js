const authService = require('./auth.service');

const register = async (req, res, next) => {
  try {
    const result = await authService.register(req.body);
    res.json(result);
  } catch (error) { next(error); }
};

const login = async (req, res, next) => {
  try {
    const result = await authService.login(req.body);
    res.json(result);
  } catch (error) { next(error); }
};

const googleAuth = async (req, res, next) => {
  try {
    const result = await authService.googleAuth(req.body);
    res.json(result);
  } catch (error) { next(error); }
};

const updateProfile = async (req, res, next) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const result = await authService.updateProfile(req.user.id, req.body);
    res.json(result);
  } catch (error) { next(error); }
};

module.exports = { register, login, googleAuth, updateProfile };
