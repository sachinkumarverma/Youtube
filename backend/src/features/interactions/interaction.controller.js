const interactionService = require('./interaction.service');

const addComment = async (req, res, next) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const comment = await interactionService.addComment(req.user.id, req.params.id, req.body.content);
    res.status(201).json(comment);
  } catch (error) { next(error); }
};

const toggleLike = async (req, res, next) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const result = await interactionService.toggleLike(req.user.id, req.params.id, req.body.type || 'LIKE');
    res.json(result);
  } catch (error) { next(error); }
};

module.exports = { addComment, toggleLike };
