const { Inspection, Institution, User, Finding, ActionItem } = require('../db');

const getAllInspections = async (req, res) => {
  try {
    const list = await Inspection.findAll({
      include: [
        { model: Institution, attributes: ['id', 'name', 'type', 'region', 'complianceScore'] },
        { model: User, as: 'Inspector', attributes: ['id', 'name', 'email'] }
      ]
    });

    const formatted = list.map(insp => {
      const data = insp.toJSON();
      try { data.checklistData = JSON.parse(data.checklistData || '{}'); } catch(e) {}
      try { data.reportSummary = JSON.parse(data.reportSummary || '{}'); } catch(e) {}
      try { data.gpsLocation = JSON.parse(data.gpsLocation || '{}'); } catch(e) {}
      return data;
    });

    res.json(formatted);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getInspectionById = async (req, res) => {
  try {
    const insp = await Inspection.findByPk(req.params.id, {
      include: [
        { model: Institution },
        { model: User, as: 'Inspector', attributes: ['id', 'name', 'email'] },
        { model: Finding }
      ]
    });

    if (!insp) {
      return res.status(404).json({ error: 'Inspection report not found' });
    }

    const data = insp.toJSON();
    try { data.checklistData = JSON.parse(data.checklistData || '{}'); } catch(e) {}
    try { data.reportSummary = JSON.parse(data.reportSummary || '{}'); } catch(e) {}
    try { data.gpsLocation = JSON.parse(data.gpsLocation || '{}'); } catch(e) {}
    
    // Parse institution details too
    try { data.Institution.accreditationDetails = JSON.parse(data.Institution.accreditationDetails || '{}'); } catch(e) {}
    try { data.Institution.infrastructureDetails = JSON.parse(data.Institution.infrastructureDetails || '{}'); } catch(e) {}
    try { data.Institution.departments = JSON.parse(data.Institution.departments || '[]'); } catch(e) {}

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const createInspection = async (req, res) => {
  try {
    const { institutionId, inspectorId, scheduledDate } = req.body;
    const newInsp = await Inspection.create({
      institutionId,
      inspectorId,
      scheduledDate,
      status: 'scheduled'
    });
    res.status(201).json(newInsp);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const assignInspector = async (req, res) => {
  try {
    const insp = await Inspection.findByPk(req.params.id);
    if (!insp) {
      return res.status(404).json({ error: 'Inspection not found' });
    }
    insp.inspectorId = req.body.inspectorId;
    await insp.save();
    res.json({ message: 'Inspector assigned successfully', inspection: insp });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateChecklistProgress = async (req, res) => {
  try {
    const insp = await Inspection.findByPk(req.params.id);
    if (!insp) {
      return res.status(404).json({ error: 'Inspection not found' });
    }

    const { checklistData, status } = req.body;
    if (checklistData) {
      insp.checklistData = typeof checklistData === 'object' ? JSON.stringify(checklistData) : checklistData;
    }
    if (status) {
      insp.status = status;
    }

    await insp.save();
    res.json({ message: 'Progress saved successfully', inspection: insp });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const submitInspection = async (req, res) => {
  try {
    const insp = await Inspection.findByPk(req.params.id);
    if (!insp) {
      return res.status(404).json({ error: 'Inspection not found' });
    }

    const { checklistData, gpsLocation, inspectorSignature, voiceNotes } = req.body;

    const parsedChecklist = typeof checklistData === 'string' ? JSON.parse(checklistData) : checklistData;
    
    // Calculate compliance score based on scores in checklist
    let totalScore = 0;
    let categoryCount = 0;
    Object.keys(parsedChecklist).forEach(key => {
      if (parsedChecklist[key] && typeof parsedChecklist[key].score === 'number') {
        totalScore += parsedChecklist[key].score;
        categoryCount++;
      }
    });

    const complianceScore = categoryCount > 0 ? Math.round((totalScore / categoryCount) * 10) / 10 : 85.0;

    // Generate AI Summary Findings
    const strengths = [];
    const weaknesses = [];
    const findingsList = [];

    Object.keys(parsedChecklist).forEach(key => {
      const item = parsedChecklist[key];
      if (item.status === 'Excellent' || item.score >= 90) {
        strengths.push(`${key.charAt(0).toUpperCase() + key.slice(1)}: ${item.remarks || 'Excellent setup observed.'}`);
      } else if (item.status === 'Needs Improvement' || item.status === 'Unsatisfactory' || item.score < 75) {
        weaknesses.push(`${key.charAt(0).toUpperCase() + key.slice(1)} shows deficiencies.`);
        findingsList.push({
          category: key.charAt(0).toUpperCase() + key.slice(1),
          description: item.remarks || `Deficiencies detected during visual audit in ${key} section.`,
          severity: item.score < 60 ? 'critical' : (item.score < 75 ? 'high' : 'medium'),
          aiDetected: false
        });
      }
    });

    // Default summaries if none computed
    if (strengths.length === 0) strengths.push('Basic infrastructure matches guidelines.');
    if (weaknesses.length === 0) strengths.push('No major defects flagged.');

    const decision = complianceScore >= 90 ? 'Approved' : (complianceScore >= 75 ? 'Approved with Conditions' : 'Action Required');
    
    const reportSummary = {
      summary: `Inspection conducted. Final score is ${complianceScore}%. Key areas of observation recorded.`,
      strengths,
      weaknesses,
      decision
    };

    // Update inspection record
    insp.status = complianceScore >= 75 ? 'completed' : 'under_review';
    insp.completedDate = new Date();
    insp.complianceScore = complianceScore;
    insp.checklistData = JSON.stringify(parsedChecklist);
    insp.gpsLocation = typeof gpsLocation === 'object' ? JSON.stringify(gpsLocation) : gpsLocation;
    insp.inspectorSignature = inspectorSignature;
    insp.voiceNotes = voiceNotes;
    insp.reportSummary = JSON.stringify(reportSummary);

    await insp.save();

    // Create findings and ActionItems
    for (const f of findingsList) {
      const createdFinding = await Finding.create({
        inspectionId: insp.id,
        category: f.category,
        description: f.description,
        severity: f.severity,
        aiDetected: f.aiDetected,
        resolved: false
      });

      // Map to Kanban Action Items
      await ActionItem.create({
        institutionId: insp.institutionId,
        inspectionId: insp.id,
        findingId: createdFinding.id,
        title: `Resolve ${f.category} Issues`,
        description: f.description,
        priority: f.severity,
        status: 'pending',
        deadline: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000) // 15 days deadline
      });
    }

    // Update institution overall compliance score
    const inst = await Institution.findByPk(insp.institutionId);
    if (inst) {
      inst.complianceScore = complianceScore;
      await inst.save();
    }

    res.json({
      message: 'Inspection submitted successfully and report generated.',
      complianceScore,
      reportSummary,
      status: insp.status
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getAllInspections,
  getInspectionById,
  createInspection,
  assignInspector,
  updateChecklistProgress,
  submitInspection
};
