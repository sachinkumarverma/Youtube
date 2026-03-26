const videoService = require('./video.service');

const getAll = async (req, res, next) => {
  try {
    const { category, q } = req.query;
    const videos = await videoService.getAllVideos({ category, q });
    res.json(videos);
  } catch (error) { next(error); }
};

const getTrending = async (req, res, next) => {
  try {
    const videos = await videoService.getTrending();
    res.json(videos);
  } catch (error) { next(error); }
};

const getExplore = async (req, res, next) => {
  try {
    const videos = await videoService.getExplore();
    res.json(videos);
  } catch (error) { next(error); }
};

const getSubscriptions = async (req, res, next) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const videos = await videoService.getSubscriptionVideos(req.user.id);
    res.json(videos);
  } catch (error) { next(error); }
};

const getById = async (req, res, next) => {
  try {
    const video = await videoService.getVideoById(req.params.id);
    res.json(video);
  } catch (error) { next(error); }
};

const create = async (req, res, next) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const video = await videoService.createVideo(req.user.id, req.body);
    res.status(201).json(video);
  } catch (error) { next(error); }
};

const incrementViews = async (req, res, next) => {
  try {
    const result = await videoService.incrementViews(req.params.id);
    res.json(result);
  } catch (error) { next(error); }
};

const update = async (req, res, next) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const updated = await videoService.updateVideo(req.user.id, req.params.id, req.body, req.file);
    res.json(updated);
  } catch (error) { next(error); }
};

const remove = async (req, res, next) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const result = await videoService.deleteVideo(req.user.id, req.params.id);
    res.json(result);
  } catch (error) { next(error); }
};

module.exports = { getAll, getTrending, getExplore, getSubscriptions, getById, create, incrementViews, update, remove };
