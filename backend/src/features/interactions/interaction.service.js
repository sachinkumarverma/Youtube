const interactionRepo = require('./interaction.repository');
const { query } = require('../../lib/db');
const { generateId } = require('../../lib/id');

const addComment = async (userId, videoId, content) => {
  const videoResult = await query('SELECT * FROM videos WHERE id = $1', [videoId]);
  const video = videoResult.rows[0];
  if (!video) throw { status: 404, message: 'Video not found' };

  const comment = await interactionRepo.createComment({
    content, video_id: videoId, user_id: userId
  });

  // Notify video owner
  if (video.user_id !== userId) {
    const notifId = generateId();
    await query(
      'INSERT INTO notifications (id, user_id, title, content, type, video_id, from_user_id) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [notifId, video.user_id, 'New Comment', `${comment.user.username} commented on your video: ${video.title}`, 'NEW_COMMENT', video.id, userId]
    );
  }

  return comment;
};

const toggleLike = async (userId, videoId, type) => {
  const existing = await interactionRepo.findLike(userId, videoId);

  if (existing) {
    if (existing.type === type) {
      await interactionRepo.deleteLike(existing.id);
      return { removed: true };
    } else {
      const updated = await interactionRepo.updateLike(existing.id, { type });
      return updated;
    }
  } else {
    const newLike = await interactionRepo.createLike({ user_id: userId, video_id: videoId, type });

    // Notify video owner for new likes
    if (type === 'LIKE') {
      const videoResult = await query('SELECT user_id, title, id FROM videos WHERE id = $1', [videoId]);
      const video = videoResult.rows[0];
      const userResult = await query('SELECT username FROM users WHERE id = $1', [userId]);
      const currentUser = userResult.rows[0];
      if (video && video.user_id !== userId) {
        const notifId = generateId();
        await query(
          'INSERT INTO notifications (id, user_id, title, content, type, video_id, from_user_id) VALUES ($1, $2, $3, $4, $5, $6, $7)',
          [notifId, video.user_id, 'New Like', `${currentUser?.username} liked your video: ${video.title}`, 'NEW_LIKE', video.id, userId]
        );
      }
    }

    return newLike;
  }
};

module.exports = { addComment, toggleLike };
