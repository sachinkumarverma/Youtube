const notificationRepo = require('./notification.repository');

const getAll = async (userId) => {
  return notificationRepo.findByUserId(userId);
};

const markAsRead = async (id, userId) => {
  await notificationRepo.markAsRead(id, userId);
  return { message: 'Marked as read' };
};

const markAllAsRead = async (userId) => {
  await notificationRepo.markAllAsRead(userId);
  return { message: 'All marked as read' };
};

const remove = async (id, userId) => {
  await notificationRepo.remove(id, userId);
  return { message: 'Deleted' };
};

module.exports = { getAll, markAsRead, markAllAsRead, remove };
