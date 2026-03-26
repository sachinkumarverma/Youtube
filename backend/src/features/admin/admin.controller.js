const adminService = require('./admin.service');

const getStats = async (req, res, next) => {
  try {
    const stats = await adminService.getStats();
    res.json(stats);
  } catch (error) {
    next(error);
  }
};

const getLogs = async (req, res, next) => {
  try {
    const { page, limit, action, entity_type, from, to } = req.query;
    const logs = await adminService.getLogs({
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 50,
      action, entity_type, from, to
    });
    res.json(logs);
  } catch (error) {
    next(error);
  }
};

const getVideos = async (req, res, next) => {
  try {
    const videos = await adminService.getAllVideos();
    res.json(videos);
  } catch (error) {
    next(error);
  }
};

const deleteVideo = async (req, res, next) => {
  try {
    const result = await adminService.deleteVideo(req.params.id);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

const getReports = async (req, res, next) => {
  try {
    const { status } = req.query;
    const reports = await adminService.getReports({ status });
    res.json(reports);
  } catch (error) {
    next(error);
  }
};

const reviewReport = async (req, res, next) => {
  try {
    const { action, feedback } = req.body;
    const result = await adminService.reviewReport(req.params.id, { action, feedback });
    res.json(result);
  } catch (error) {
    next(error);
  }
};

module.exports = { getStats, getLogs, getVideos, deleteVideo, getReports, reviewReport };
