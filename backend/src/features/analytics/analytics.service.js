const analyticsRepo = require('./analytics.repository');

const getOverview = async (userId) => {
  return analyticsRepo.getOverviewExtended(userId);
};

const getSubscriberGrowth = async (userId, period = '28d') => {
  return analyticsRepo.getSubscriberGrowth(userId, period);
};

const getViewsOverTime = async (userId, period = '28d') => {
  return analyticsRepo.getViewsOverTime(userId, period);
};

const getLikesOverTime = async (userId, period = '28d') => {
  return analyticsRepo.getLikesOverTime(userId, period);
};

const getCommentsOverTime = async (userId, period = '28d') => {
  return analyticsRepo.getCommentsOverTime(userId, period);
};

const getTopVideos = async (userId) => {
  return analyticsRepo.getTopVideos(userId);
};

module.exports = { getOverview, getSubscriberGrowth, getViewsOverTime, getLikesOverTime, getCommentsOverTime, getTopVideos };
