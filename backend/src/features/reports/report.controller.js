const reportService = require('./report.service');

const submit = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const { reason } = req.body;
    if (!reason) return res.status(400).json({ error: 'Reason is required' });
    const report = await reportService.submitReport(req.user.id, req.params.videoId, reason);
    res.status(201).json(report);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

const getAll = async (req, res) => {
  try {
    const { status } = req.query;
    const reports = await reportService.getAllReports({ status });
    res.json(reports);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

const review = async (req, res) => {
  try {
    const { action, feedback } = req.body;
    if (!['delete', 'reject', 'feedback'].includes(action)) {
      return res.status(400).json({ error: 'Invalid action. Use: delete, reject, feedback' });
    }
    const result = await reportService.reviewReport(req.params.id, { action, feedback });
    res.json(result);
  } catch (error) {
    console.error(error);
    const status = error.status || 500;
    res.status(status).json({ error: error.message || 'Server error' });
  }
};

module.exports = { submit, getAll, review };
