const userRepo = require('./user.repository');
const authRepo = require('../auth/auth.repository');
const { query } = require('../../lib/db');
const { generateId } = require('../../lib/id');

// Subscriptions
const getSubscriptions = async (userId) => {
  return userRepo.findSubscriptions(userId);
};

const toggleSubscription = async (subscriberId, channelId) => {
  if (subscriberId === channelId) throw { status: 400, message: 'Cannot subscribe to yourself' };

  const existing = await userRepo.findSubscription(subscriberId, channelId);
  if (existing) {
    await userRepo.deleteSubscription(existing.id);
    return { subscribed: false };
  } else {
    await userRepo.createSubscription(subscriberId, channelId);
    // Notify channel owner
    const followerResult = await query('SELECT username FROM users WHERE id = $1', [subscriberId]);
    const follower = followerResult.rows[0];
    const notifId = generateId();
    await query(
      'INSERT INTO notifications (id, user_id, title, content, type, from_user_id) VALUES ($1, $2, $3, $4, $5, $6)',
      [notifId, channelId, 'New Subscriber', `${follower?.username} subscribed to your channel!`, 'NEW_SUBSCRIBER', subscriberId]
    );
    return { subscribed: true };
  }
};

const toggleNotifications = async (userId, channelId) => {
  const sub = await userRepo.findSubscription(userId, channelId);
  if (!sub) throw { status: 404, message: 'Subscription not found' };
  const updated = await userRepo.updateSubscription(sub.id, { notifications_on: !sub.notifications_on });
  return { notifications_on: updated.notifications_on };
};

// Watch Later
const getWatchLater = async (userId) => {
  const items = await userRepo.findWatchLater(userId);
  return items.map(item => item.video);
};

const toggleWatchLater = async (userId, videoId) => {
  const existing = await userRepo.findWatchLaterItem(userId, videoId);
  if (existing) {
    await userRepo.deleteWatchLater(existing.id);
    return { watchLater: false };
  } else {
    await userRepo.createWatchLater(userId, videoId);
    return { watchLater: true };
  }
};

// History
const getHistory = async (userId) => {
  const items = await userRepo.findHistory(userId);
  return items.map(item => ({ ...item.video, viewed_at: item.viewed_at }));
};

const addToHistory = async (userId, videoId) => {
  await userRepo.upsertHistory(userId, videoId);
  return { success: true };
};

// Liked Videos
const getLikedVideos = async (userId) => {
  const likes = await userRepo.findLikedVideos(userId);
  return likes.map(l => ({ ...l.video, created_at: l.created_at }));
};

// Channel
const getMyChannel = async (userId) => {
  return userRepo.findUserVideos(userId);
};

const getPublicChannel = async (channelId) => {
  const user = await authRepo.findWithCounts(channelId);
  if (!user) throw { status: 404, message: 'User not found' };

  const videos = await userRepo.findUserVideos(channelId);
  const totalViews = videos.reduce((acc, v) => acc + v.views, 0);

  return { user, videos, totalViews };
};

module.exports = {
  getSubscriptions, toggleSubscription, toggleNotifications,
  getWatchLater, toggleWatchLater,
  getHistory, addToHistory,
  getLikedVideos, getMyChannel, getPublicChannel
};
