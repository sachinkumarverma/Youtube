const analyticsService = require('./analytics.service');

const getOverview = async (req, res, next) => {
  try {
    const result = await analyticsService.getOverview(req.user.id);
    res.json(result);
  } catch (error) { next(error); }
};

const getSubscriberGrowth = async (req, res, next) => {
  try {
    const result = await analyticsService.getSubscriberGrowth(req.user.id, req.query.period);
    res.json(result);
  } catch (error) { next(error); }
};

const getViewsOverTime = async (req, res, next) => {
  try {
    const result = await analyticsService.getViewsOverTime(req.user.id, req.query.period);
    res.json(result);
  } catch (error) { next(error); }
};

const getLikesOverTime = async (req, res, next) => {
  try {
    const result = await analyticsService.getLikesOverTime(req.user.id, req.query.period);
    res.json(result);
  } catch (error) { next(error); }
};

const getCommentsOverTime = async (req, res, next) => {
  try {
    const result = await analyticsService.getCommentsOverTime(req.user.id, req.query.period);
    res.json(result);
  } catch (error) { next(error); }
};

const getTopVideos = async (req, res, next) => {
  try {
    const result = await analyticsService.getTopVideos(req.user.id);
    res.json(result);
  } catch (error) { next(error); }
};

module.exports = { getOverview, getSubscriberGrowth, getViewsOverTime, getLikesOverTime, getCommentsOverTime, getTopVideos };
