const reportRepo = require('./report.repository');
const { query } = require('../../lib/db');
const { generateId } = require('../../lib/id');
const videoService = require('../videos/video.service');

const submitReport = async (userId, videoId, reason) => {
  // Log audit
  await query(
    'INSERT INTO audit_logs (action, entity_type, entity_id, user_id, details) VALUES ($1, $2, $3, $4, $5)',
    ['REPORT_SUBMITTED', 'video', videoId, null, JSON.stringify({ reason, reporter_id: userId })]
  );
  return reportRepo.create({ video_id: videoId, reporter_id: userId, reason });
};

const getAllReports = async (filters) => {
  return reportRepo.findAll(filters);
};

const reviewReport = async (reportId, { action, feedback }) => {
  const report = await reportRepo.findById(reportId);
  if (!report) throw { status: 404, message: 'Report not found' };

  if (action === 'delete') {
    // Delete the video and notify uploader
    await videoService.adminDeleteVideo(report.video_id);
    await reportRepo.updateStatus(reportId, { status: 'deleted', admin_feedback: feedback || 'Video removed for policy violation' });

    await query(
      'INSERT INTO audit_logs (action, entity_type, entity_id, details) VALUES ($1, $2, $3, $4)',
      ['ADMIN_VIDEO_DELETED', 'video', report.video_id, JSON.stringify({ report_id: reportId, feedback })]
    );

  } else if (action === 'reject') {
    await reportRepo.updateStatus(reportId, { status: 'rejected', admin_feedback: feedback || 'Report reviewed - no action needed' });

    // Notify the reporter that their report was rejected
    const notifId = generateId();
    await query(
      'INSERT INTO notifications (id, user_id, title, content, type, video_id) VALUES ($1, $2, $3, $4, $5, $6)',
      [notifId, report.reporter_id, 'Report Update', `Your report on "${report.video_title}" was reviewed. No action was taken.`, 'REPORT_REJECTED', report.video_id]
    );

    await query(
      'INSERT INTO audit_logs (action, entity_type, entity_id, details) VALUES ($1, $2, $3, $4)',
      ['ADMIN_REPORT_REJECTED', 'report', reportId, JSON.stringify({ feedback })]
    );

  } else if (action === 'feedback') {
    await reportRepo.updateStatus(reportId, { status: 'reviewed', admin_feedback: feedback });

    // Notify uploader with feedback
    const notifId = generateId();
    await query(
      'INSERT INTO notifications (id, user_id, title, content, type, video_id) VALUES ($1, $2, $3, $4, $5, $6)',
      [notifId, report.uploader_id, 'Admin Feedback', `Admin feedback on your video "${report.video_title}": ${feedback}`, 'ADMIN_FEEDBACK', report.video_id]
    );

    await query(
      'INSERT INTO audit_logs (action, entity_type, entity_id, details) VALUES ($1, $2, $3, $4)',
      ['ADMIN_FEEDBACK_SENT', 'video', report.video_id, JSON.stringify({ report_id: reportId, feedback })]
    );
  }

  return { success: true };
};

module.exports = { submitReport, getAllReports, reviewReport };
