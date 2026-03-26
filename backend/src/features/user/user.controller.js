const userService = require('./user.service');

const getSubscriptions = async (req, res, next) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const subs = await userService.getSubscriptions(req.user.id);
    res.json(subs);
  } catch (error) { next(error); }
};

const toggleSubscription = async (req, res, next) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const result = await userService.toggleSubscription(req.user.id, req.params.channel_id);
    res.json(result);
  } catch (error) { next(error); }
};

const toggleNotifications = async (req, res, next) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const result = await userService.toggleNotifications(req.user.id, req.params.channel_id);
    res.json(result);
  } catch (error) { next(error); }
};

const getWatchLater = async (req, res, next) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const videos = await userService.getWatchLater(req.user.id);
    res.json(videos);
  } catch (error) { next(error); }
};

const toggleWatchLater = async (req, res, next) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const result = await userService.toggleWatchLater(req.user.id, req.params.video_id);
    res.json(result);
  } catch (error) { next(error); }
};

const getHistory = async (req, res, next) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const history = await userService.getHistory(req.user.id);
    res.json(history);
  } catch (error) { next(error); }
};

const addToHistory = async (req, res, next) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const result = await userService.addToHistory(req.user.id, req.params.video_id);
    res.json(result);
  } catch (error) { next(error); }
};

const getLikedVideos = async (req, res, next) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const videos = await userService.getLikedVideos(req.user.id);
    res.json(videos);
  } catch (error) { next(error); }
};

const getMyChannel = async (req, res, next) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const videos = await userService.getMyChannel(req.user.id);
    res.json(videos);
  } catch (error) { next(error); }
};

const getPublicChannel = async (req, res, next) => {
  try {
    const result = await userService.getPublicChannel(req.params.id);
    res.json(result);
  } catch (error) { next(error); }
};

module.exports = {
  getSubscriptions, toggleSubscription, toggleNotifications,
  getWatchLater, toggleWatchLater,
  getHistory, addToHistory,
  getLikedVideos, getMyChannel, getPublicChannel
};
