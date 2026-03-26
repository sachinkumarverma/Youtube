const videoRepo = require('./video.repository');
const { query } = require('../../lib/db');
const { generateId } = require('../../lib/id');
const { supabase } = require('../../lib/supabase');

const getAllVideos = async (filters) => {
  return videoRepo.findAll(filters);
};

const getTrending = async () => {
  return videoRepo.findTrending();
};

const getExplore = async () => {
  return videoRepo.findExplore();
};

const getSubscriptionVideos = async (userId) => {
  const subsResult = await query('SELECT channel_id FROM subscriptions WHERE subscriber_id = $1', [userId]);
  const channelIds = subsResult.rows.map(s => s.channel_id);
  return videoRepo.findByChannelIds(channelIds);
};

const getVideoById = async (id) => {
  const video = await videoRepo.findById(id);
  if (!video) throw { status: 404, message: 'Not found' };
  return video;
};

const createVideo = async (userId, { title, description, video_url, thumbnail_url, category, duration }) => {
  const video = await videoRepo.create({
    title, description, video_url, thumbnail_url,
    category, duration: duration || '0', user_id: userId
  });

  // Notify subscribers
  const subscribersResult = await query(
    'SELECT subscriber_id FROM subscriptions WHERE channel_id = $1 AND notifications_on = true',
    [userId]
  );
  const subscribers = subscribersResult.rows;

  if (subscribers.length > 0) {
    for (const sub of subscribers) {
      const notifId = generateId();
      await query(
        'INSERT INTO notifications (id, user_id, title, content, type, video_id, from_user_id) VALUES ($1, $2, $3, $4, $5, $6, $7)',
        [notifId, sub.subscriber_id, 'New Video', `${video.user?.username || 'A channel'} uploaded: ${video.title}`, 'NEW_VIDEO', video.id, userId]
      );
    }
  }

  return video;
};

const incrementViews = async (id) => {
  await videoRepo.incrementViews(id);
  return { success: true };
};

const updateVideo = async (userId, videoId, { title, description, category }, file) => {
  const video = await videoRepo.findByIdSimple(videoId);
  if (!video || video.user_id !== userId) throw { status: 403, message: 'Forbidden' };

  let thumbnail_url = null;
  if (file) {
    const fileName = `thumb_${videoId}_${Date.now()}.jpg`;
    const { error: uploadError } = await supabase.storage
      .from('thumbnails')
      .upload(fileName, file.buffer, { contentType: file.mimetype });
    if (uploadError) {
      console.error('Supabase Upload Error:', uploadError);
      throw { status: 500, message: `Storage Error: ${uploadError.message || 'Failed to upload to Supabase'}` };
    }
    const { data } = supabase.storage.from('thumbnails').getPublicUrl(fileName);
    thumbnail_url = data.publicUrl;
  }

  const data = { title, description, category };
  if (thumbnail_url) data.thumbnail_url = thumbnail_url;

  return videoRepo.update(videoId, data);
};

const deleteVideo = async (userId, videoId) => {
  const video = await videoRepo.findByIdSimple(videoId);
  if (!video || video.user_id !== userId) throw { status: 403, message: 'Forbidden' };
  await videoRepo.remove(videoId);
  return { success: true };
};

// Admin delete (no ownership check)
const adminDeleteVideo = async (videoId) => {
  const video = await videoRepo.findByIdSimple(videoId);
  if (!video) throw { status: 404, message: 'Video not found' };
  
  // Notify the uploader
  const notifId = generateId();
  await query(
    'INSERT INTO notifications (id, user_id, title, content, type) VALUES ($1, $2, $3, $4, $5)',
    [notifId, video.user_id, 'Video Removed', `Your video "${video.title}" has been removed by an admin for policy violations.`, 'ADMIN_DELETE']
  );
  
  await videoRepo.remove(videoId);
  return { success: true };
};

module.exports = {
  getAllVideos, getTrending, getExplore, getSubscriptionVideos,
  getVideoById, createVideo, incrementViews, updateVideo, deleteVideo, adminDeleteVideo
};
