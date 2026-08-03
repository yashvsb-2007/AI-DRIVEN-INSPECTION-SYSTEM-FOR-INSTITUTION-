const { ActionItem, Finding, Institution, Inspection } = require('../db');

const getActionItems = async (req, res) => {
  try {
    const { institutionId } = req.query;
    const filter = {};
    if (institutionId) {
      filter.institutionId = institutionId;
    }

    const list = await ActionItem.findAll({
      where: filter,
      include: [
        { model: Institution, attributes: ['id', 'name'] },
        { model: Finding, attributes: ['id', 'category', 'description', 'severity'] }
      ]
    });

    res.json(list);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateActionStatus = async (req, res) => {
  try {
    const item = await ActionItem.findByPk(req.params.id);
    if (!item) {
      return res.status(404).json({ error: 'Action item not found' });
    }

    const { status, comments } = req.body;
    
    if (status) item.status = status;
    if (comments) item.comments = comments;

    await item.save();

    // If resolved, mark the associated finding as resolved as well
    if (status === 'resolved' && item.findingId) {
      const f = await Finding.findByPk(item.findingId);
      if (f) {
        f.resolved = true;
        await f.save();
      }
    }

    res.json({ message: 'Action item status updated', actionItem: item });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const submitEvidence = async (req, res) => {
  try {
    const item = await ActionItem.findByPk(req.params.id);
    if (!item) {
      return res.status(404).json({ error: 'Action item not found' });
    }

    const { comments, evidencePath } = req.body;

    item.status = 'under_review';
    item.comments = comments || 'Correction evidence uploaded by Representative.';
    if (evidencePath) {
      item.evidencePath = evidencePath;
    } else if (req.file) {
      item.evidencePath = `/uploads/${req.file.filename}`;
    }

    await item.save();
    res.json({ message: 'Evidence submitted, item sent under review', actionItem: item });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getActionItems,
  updateActionStatus,
  submitEvidence
};
