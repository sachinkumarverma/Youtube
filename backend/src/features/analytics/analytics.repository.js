const { query } = require('../../lib/db');

const getStartDate = (period) => {
  const days = period === '365d' ? 365 : period === '90d' ? 90 : 28;
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().split('T')[0];
};

const getOverview = async (userId) => {
  const [viewsR, subsR, likesR, videosR] = await Promise.all([
    query('SELECT COALESCE(SUM(views), 0) as total FROM videos WHERE user_id = $1', [userId]),
    query('SELECT COUNT(*) as total FROM subscriptions WHERE channel_id = $1', [userId]),
    query(`SELECT COUNT(*) as total FROM likes l JOIN videos v ON l.video_id = v.id WHERE v.user_id = $1 AND l.type = 'LIKE'`, [userId]),
    query('SELECT COUNT(*) as total FROM videos WHERE user_id = $1', [userId])
  ]);
  return {
    totalViews: parseInt(viewsR.rows[0].total),
    totalSubscribers: parseInt(subsR.rows[0].total),
    totalLikes: parseInt(likesR.rows[0].total),
    totalVideos: parseInt(videosR.rows[0].total)
  };
};

const getSubscriberGrowth = async (userId, period) => {
  const startDate = getStartDate(period);
  const result = await query(`
    WITH base AS (
      SELECT COUNT(*) as cnt FROM subscriptions WHERE channel_id = $1 AND created_at < $2::date
    ),
    daily AS (
      SELECT d::date as date, COALESCE(s.cnt, 0) as new_subs
      FROM generate_series($2::date, CURRENT_DATE, '1 day') d
      LEFT JOIN (
        SELECT DATE(created_at) as dt, COUNT(*) as cnt
        FROM subscriptions WHERE channel_id = $1 AND created_at >= $2::date
        GROUP BY DATE(created_at)
      ) s ON d::date = s.dt
    )
    SELECT daily.date, daily.new_subs,
           (base.cnt + SUM(daily.new_subs) OVER (ORDER BY daily.date))::int as total
    FROM daily, base
    ORDER BY daily.date
  `, [userId, startDate]);
  return result.rows;
};

const getViewsOverTime = async (userId, period) => {
  const startDate = getStartDate(period);
  const result = await query(`
    SELECT d::date as date, COALESCE(sub.cnt, 0)::int as views
    FROM generate_series($2::date, CURRENT_DATE, '1 day') d
    LEFT JOIN (
      SELECT DATE(vl.viewed_at) as dt, COUNT(*) as cnt
      FROM video_view_logs vl
      JOIN videos v ON vl.video_id = v.id
      WHERE v.user_id = $1 AND vl.viewed_at >= $2::date
      GROUP BY DATE(vl.viewed_at)
    ) sub ON d::date = sub.dt
    ORDER BY d::date
  `, [userId, startDate]);
  return result.rows;
};

const getLikesOverTime = async (userId, period) => {
  const startDate = getStartDate(period);
  const result = await query(`
    SELECT d::date as date, COALESCE(sub.cnt, 0)::int as likes
    FROM generate_series($2::date, CURRENT_DATE, '1 day') d
    LEFT JOIN (
      SELECT DATE(l.created_at) as dt, COUNT(*) as cnt
      FROM likes l
      JOIN videos v ON l.video_id = v.id
      WHERE v.user_id = $1 AND l.type = 'LIKE' AND l.created_at >= $2::date
      GROUP BY DATE(l.created_at)
    ) sub ON d::date = sub.dt
    ORDER BY d::date
  `, [userId, startDate]);
  return result.rows;
};

const getTopVideos = async (userId) => {
  const result = await query(`
    SELECT id, title, thumbnail_url, views, duration, created_at,
           (SELECT COUNT(*) FROM likes WHERE video_id = v.id AND type = 'LIKE') as likes_count,
           (SELECT COUNT(*) FROM comments WHERE video_id = v.id) as comments_count
    FROM videos v
    WHERE user_id = $1
    ORDER BY views DESC
    LIMIT 10
  `, [userId]);
  return result.rows;
};

const getCommentsOverTime = async (userId, period) => {
  const startDate = getStartDate(period);
  const result = await query(`
    SELECT d::date as date, COALESCE(sub.cnt, 0)::int as comments
    FROM generate_series($2::date, CURRENT_DATE, '1 day') d
    LEFT JOIN (
      SELECT DATE(c.created_at) as dt, COUNT(*) as cnt
      FROM comments c
      JOIN videos v ON c.video_id = v.id
      WHERE v.user_id = $1 AND c.created_at >= $2::date
      GROUP BY DATE(c.created_at)
    ) sub ON d::date = sub.dt
    ORDER BY d::date
  `, [userId, startDate]);
  return result.rows;
};

const getOverviewExtended = async (userId) => {
  const [viewsR, subsR, likesR, videosR, commentsR, watchTimeR, latestR] = await Promise.all([
    query('SELECT COALESCE(SUM(views), 0) as total FROM videos WHERE user_id = $1', [userId]),
    query('SELECT COUNT(*) as total FROM subscriptions WHERE channel_id = $1', [userId]),
    query(`SELECT COUNT(*) as total FROM likes l JOIN videos v ON l.video_id = v.id WHERE v.user_id = $1 AND l.type = 'LIKE'`, [userId]),
    query('SELECT COUNT(*) as total FROM videos WHERE user_id = $1', [userId]),
    query('SELECT COUNT(*) as total FROM comments c JOIN videos v ON c.video_id = v.id WHERE v.user_id = $1', [userId]),
    query('SELECT COALESCE(SUM(views * duration::numeric), 0) as total_seconds FROM videos WHERE user_id = $1', [userId]),
    query(`
      SELECT v.id, v.title, v.thumbnail_url, v.views, v.duration, v.created_at,
             (SELECT COUNT(*) FROM likes WHERE video_id = v.id AND type = 'LIKE') as likes_count,
             (SELECT COUNT(*) FROM comments WHERE video_id = v.id) as comments_count
      FROM videos v WHERE v.user_id = $1
      ORDER BY v.created_at DESC LIMIT 1
    `, [userId])
  ]);

  const totalViews = parseInt(viewsR.rows[0].total);
  const totalVideos = parseInt(videosR.rows[0].total);
  const totalLikes = parseInt(likesR.rows[0].total);
  const totalWatchSeconds = parseInt(watchTimeR.rows[0].total_seconds);

  return {
    totalViews,
    totalSubscribers: parseInt(subsR.rows[0].total),
    totalLikes,
    totalVideos,
    totalComments: parseInt(commentsR.rows[0].total),
    estimatedWatchHours: Math.round(totalWatchSeconds / 3600),
    avgViewsPerVideo: totalVideos > 0 ? Math.round(totalViews / totalVideos) : 0,
    engagementRate: totalViews > 0 ? parseFloat(((totalLikes / totalViews) * 100).toFixed(1)) : 0,
    latestVideo: latestR.rows[0] || null
  };
};

module.exports = { getOverview, getOverviewExtended, getSubscriberGrowth, getViewsOverTime, getLikesOverTime, getCommentsOverTime, getTopVideos };
